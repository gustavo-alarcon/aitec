const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const crypto = require('crypto');
const cardPass = require('./card-pass.json')
const formKeys = require('./form-keys.json')

const gaxios = require('gaxios')


let app = admin.initializeApp();
const db = admin.firestore();

//Locations definitions
const reservedSalesRef = 'db/aitec/reservedSales'     //To reserve sales
const reStockSalesRef = 'db/aitec/reStockSales'          //When deleting reserving sales, we should re stock
const salesRef = 'db/aitec/sales'                     //NormalSales
const productsListRef = 'db/aitec/productsList'
const usersRef = 'users'
const genConfigRef = `db/aitec/config`
const couponsRef = `db/aitec/coupons`
const salesCorrelativeDoc = db.collection(genConfigRef).doc(`salesCorrelative`)

//const emailLoc = `/mail`

exports.notifyUser = functions.firestore.document('messages/{messageId}')
  .onCreate(event => {
    let message = event.data();
    let userId = message.recipientUser.uid;
    console.log("checking data");
    console.log(message);
    let data = {
      notification: {
        title: message.title,
        body: message.message,
        icon: 'https://firebasestorage.googleapis.com/v0/b/aitec-ecommerce.appspot.com/o/logo_push.png?alt=media&token=0cf44667-c864-4671-bf1e-b0664f1ee57c'
      }
    }

    let userRef = db.collection(usersRef).doc(userId)

    return userRef.get()
      .then(snap => snap.data())
      .then(user => {
        let tokens = user.fcmTokens ? Object.keys(user.fcmTokens): []

        if(!tokens.length){
          console.log("Error: user with no tokens! :"+userId)
        } else {
          return app.messaging().sendToDevice(tokens, data)
        }
      })
      .catch(err => console.log(err))
  })

exports.registerPurchase = functions.firestore.document(`${reservedSalesRef}/{saleId}`)
  .onCreate(event => {

    let sale = event.data();
    console.log("Sale created: "+ sale.id)

    const reservedSaleColl = db.collection(reservedSalesRef).doc(sale.id)

    const productsListColl = db.collection(productsListRef)
    let productArray = Array.from(new Set(sale.requestedProducts.map(prod => (
      //Should be updated if we consider packages
      //We use set to get unique ids
      prod.product.id
    )))).map((prodId)=> productsListColl.doc(prodId))

    console.log("Initiating transaction");

    return db.runTransaction(trans => {
      console.log('Executing transaction');      
      return trans.getAll(...productArray).then(res => {
        
        const userColl = db.collection(usersRef).doc(sale.user.uid)
        let productsTrans = [...res]

        //If one product does not exist at DB, we send error
        if(productsTrans.some((doc) => !doc.exists)){
          console.log("One product document does not exist.")
          throw 'Product does not exist'
        }

        console.log("Validating Stock")

        productsTrans.forEach(el => {
          let productDB = el.data();
          console.log("In productDB evaluating stock of: "+ productDB.id)
          console.log(productDB.products)

          sale.requestedProducts.filter(el2 => 
              //We get the requested products (in sale) that match
              //the current product from DB
              el2.product.id == productDB.id
            ).forEach(el2 =>{
              //We now check if there is at least one requested product
              //whose color does not have enough stock
              console.log("In sale evaluating stock of: "+ el2.chosenProduct.sku)
              //console.log(el2)

              let productColor = productDB.products.find(prodColor => 
                //We find the product corresponding to the color
                prodColor.sku == el2.chosenProduct.sku
                )
              console.log("Product Color found in productDB: "+ productColor.sku)
              console.log(productColor);

              console.log("DB stock: ", productColor.virtualStock)
              console.log("Quantity: ", el2.quantity)

              let reservedStock = productColor.reservedStock ? productColor.reservedStock : 0

              if(productColor.virtualStock - reservedStock  < el2.quantity){
                throw 'Stock is not enough'
              } else {
                console.log("ProductDB editted")
                if(!!productColor.reservedStock){
                  productColor.reservedStock += el2.quantity
                } else {
                  productColor.reservedStock = el2.quantity
                }
              }

            })
          console.log("ProductDB result: ")
          console.log(productDB.products)

          trans.update(productsListColl.doc(productDB.id), productDB)
        })

        trans.update(reservedSaleColl, {status: 'Pagando'})
        trans.update(userColl, {shoppingCar: [], pendingPayment: true})

       }).then(
        success => {
          console.log('Successfull stock change!')
        },
        err => {
          console.log("Unsuccessfull sale")
          return saleColl.update({status: 'Error'})
        }
       )
       
    })

})

//This collection will be used when cancelling not yet payed Sales
exports.reStockPurshase = functions.firestore.document(`${reStockSalesRef}/{saleId}`)
  .onCreate(event => {

    let sale = event.data();
    console.log("Sale created: "+ sale.id)

    const reservedSalesDoc = db.collection(reservedSalesRef).doc(sale.id)
    const reStockSalesDoc = db.collection(reStockSalesRef).doc(sale.id)

    const productsListColl = db.collection(productsListRef)
    
    let productArray = Array.from(new Set(sale.requestedProducts.map(prod => (
      //Should be updated if we consider packages
      //We use set to get unique ids
      prod.product.id
    )))).map((prodId)=> productsListColl.doc(prodId))

    console.log("Initiating transaction");

    return db.runTransaction(trans => {
      console.log('Executing transaction');      
      return trans.getAll(...productArray).then(res => {
        
        const userColl = db.collection(`users`).doc(sale.user.uid)
        let productsTrans = [...res]

        //If one product does not exist at DB, we send error
        if(productsTrans.some((doc) => !doc.exists)){
          console.log("One product document does not exist.")
          //throw 'Product does not exist'
        }

        console.log("Validating Stock")

        productsTrans.forEach(el => {
          let productDB = el.data();
          console.log("In productDB evaluating stock of: "+ productDB.id)
          //console.log(productDB.products)

          sale.requestedProducts.filter(el2 => 
              //We get the requested products (in sale) that match
              //the current product from DB
              el2.product.id == productDB.id
            ).forEach(el2 =>{
              //We now check if there is at least one requested product
              //whose color does not have enough stock
              console.log("In sale evaluating stock of: "+ el2.chosenProduct.sku)
              //console.log(el2)

              let productColor = productDB.products.find(prodColor => 
                //We find the product corresponding to the color
                prodColor.sku == el2.chosenProduct.sku
                )
              console.log("Product Color found in productDB: "+ productColor.sku)
              console.log(productColor);

              console.log("ProductDB editted")
              productColor.reservedStock -= el2.quantity

            })
          //console.log("ProductDB result: ")
          //console.log(productDB.products)

          trans.update(productsListColl.doc(productDB.id), productDB)
        })

        trans.delete(reservedSalesDoc)
        trans.delete(reStockSalesDoc)
        trans.update(userColl, {shoppingCar: [], pendingPayment: false})

       }).then(
        success => {
          console.log('Successfull stock change!')
        },
        err => {
          console.log("Unsuccessfull reStocking sale")
          return reStockSalesDoc.update({status: 'Error'})
        }
       )
       
    })

})



exports.scheduleReStockPurshase = functions.pubsub.schedule('every 15 minutes')
  .timeZone('America/Lima')
  .onRun((context) => {
    const payingSalesColl = db.collection(reservedSalesRef).where("status", "==", 'Pagando')
    const reStockSalesColl = db.collection(reStockSalesRef)
    const salesColl = db.collection(salesRef)

    const batch = db.batch()

    return payingSalesColl.get().then(salesColl => {
      
      [...salesColl.docs].filter(sale => {
        if(!sale.exists){
          return false
        } else {
          let lapsedTime = Math.round((new Date()).valueOf()/1000) - sale.data().createdAt['seconds']
          let leftTime = 3600 - lapsedTime
          //If it is more than 1:15, it should be re stocked
          return leftTime < -900
        }
      }).map(sale => sale.data()).forEach(sale => {
        batch.set(reStockSalesColl.doc(sale.id), sale)
      })

      return batch.commit().then(
        res => { console.log("Successfull move to reStockSales")},
        err => {
          console.log("Error: ")
          console.log(err)
        }
      )

    })


});


//cardPayment changes status inside reservedSalesRef to requested (only for payment with tarjeta).
//If this fails, we will write the sale in reservedSale collection with status Error
// exports.cardPayment = functions.https.onRequest((req, res) => {
//   cors(req, res, () => {
//     const answer = req['body']

//     //We first verify authenticity
//     const krAnswer = answer['kr-answer']
//     const krHash = answer['kr-hash']

//     const data = JSON.parse(krAnswer)
//     const key = data.orderDetails.mode == "TEST" ? cardPass.TEST : cardPass.PROD

//     let krHashCalculated = crypto.createHmac("sha256", key).update(krAnswer).digest('hex');

//     if(krHashCalculated != krHash){
//       res.status(404).send("Fraud attempt.")
//     } else {
//       //In case it is fine, we validate it is paid or not
//       if(data.orderStatus != "PAID"){
//         res.status(200).send("Not fully paid.")
//       } else {
//         //We now extract actual sale data
//         const metadata = {...data.transactions[0].metadata}
        
//         let newSale = {
//           user: {
//             uid: metadata.user_uid,
//           },
//           coupon: !metadata.coupon_id ? null : {
//             id: metadata.coupon_id,
//           },
//           id: metadata.sale_id,
//           payType: {
//             account: !!metadata.payType_account ? metadata.payType_account:null,
//             id: metadata.payType_id,
//             name: metadata.payType_name,
//             voucher: Boolean(metadata.payType_voucher),
//             type: Number(metadata.payType_type),
//           },
//           status:metadata.status
//         }

//         //And save it to DB
//         const saleDoc = db.collection(salesRef).doc(newSale.id);
//         const genConfigDoc = db.collection(genConfigRef).doc('salesCorrelative')
//         const couponColl = db.collection(couponsRef)
//         const userColl = db.collection(usersRef)

        
//         db.runTransaction((transaction)=> {
//           return transaction.get(genConfigDoc).then((sfDoc)=> {
            
//             let correlative = 0

//             if(!sfDoc.exists){
//               correlative = 1
//             } else {
//               correlative = (!!sfDoc.data().rCorrelative) ? (sfDoc.data().rCorrelative + 1) : 1
//             }

//             //We set current correlative in config
//             transaction.update(genConfigRef, {rCorrelative: correlative}, {merge: true})

//             //We update sale with new correlative
//             transaction.update(saleRef, {
//               correlative: correlative,
//               payType: {
//                 ...newSale.payType,
//                 transactionId: data.transactions[0].transactionDetails.cardDetails.legacyTransId
//               },
//               status: newSale.status,   //Aca lo marcamos como solicitado
//             })

//             //We now fill cupoun
//             if(!!newSale.coupon){
//               let ocupId = sale.coupon.id
//               if(ocupId){
//                 transaction.update(couponColl.doc(ocupId), {users: admin.firestore.FieldValue.arrayUnion(newSale.user.uid)})
//               }
//             }
//             //We update user pendingPayment
//             transaction.update(userColl.doc(newSale.user.uid), {pendingPayment: false})

//           }).then(
//             success => {
//               res.status(200).send("Successful sale.")
//             },
//             err => {
//               res.status(404).send("Error writing sale.")
//             }
//           )

//         })
//       }


//     }
    
//   })
// })

//Following Function is same as cardPayment, but for form interface (not javascript library form)
//cardPayment changes status inside reservedSalesLoc to requested (only for payment with tarjeta).
//Ifthis fails, we will write the sale in reservedSale collection with status Error
exports.cardPaymentVads = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    const answer = req['body']

    const keys = Object.keys(answer)
    console.log("keys:"+ keys)

    const vadsKeys = keys.filter(el => !!el.startsWith("vads_")).sort()

    const vadsValues = vadsKeys
      .reduce((str, key) => {
        return str+answer[key]+"+";
      }, "");

    //We first verify authenticity
    const vadsHash = answer["signature"]

    const key = answer.vads_ctx_mode == "TEST" ? formKeys.TEST : formKeys.PROD

    console.log("vadsValues: "+vadsValues+key)

    const vadsHashCalculated = crypto.createHmac("sha256", key).update(vadsValues+key).digest('base64');

    console.log("hashCalculated: "+vadsHashCalculated)
    console.log("vadsHash: "+vadsHash)

    if(vadsHashCalculated != vadsHash){
      res.status(404).send("Fraud attempt.")
    } else {
      console.log(answer.vads_trans_status)
      //In case it is fine, we validate it is paid or not
      let paid = (["ACCEPTED", "AUTHORISED", "CAPTURED"].includes(answer.vads_trans_status))
      if(!paid){
        res.status(200).send("Not fully paid.")
      } else {
        let newSale = {
          user: {
            uid: answer.vads_cust_id,
          },
          id: answer.vads_order_id,
          payType: {
            account: answer.vads_ext_info_payType_account,
            id: answer.vads_ext_info_payType_id,
            name: answer.vads_ext_info_payType_name,
            type: answer.vads_ext_info_payType_type,
            transactionId: answer.vads_trans_id,
            voucher: answer.vads_ext_info_payType_type == 3
          },
          status: answer.vads_ext_info_status //Should be Solicitado
        }

        //And save it to DB
        const reservedSaleRef = db.collection(reservedSalesRef).doc(newSale.id);

        const batch = db.batch()

        batch.update(reservedSaleRef, {
          payType: newSale.payType,
          status: newSale.status,
        })

        return batch.commit().then(
          success => {
            res.status(200).send("Successful sale.")
          },
          err => {
            res.status(404).send("Error writing sale.")
            console.log(err)
            return reservedSaleRef.update({status: "Error"})
          }
        )
        }
    }
  })
})

//We use this only to consider requested status in collection reservedSalesLoc. 
//Used to register actual sale in sales collection with status requested
//If this fails, we will write the sale in sale collection with status Error
exports.reserveSaleChanged = functions.firestore.document(`${reservedSalesRef}/{saleId}`)
  .onUpdate(event => {
    let sale = event.after.data()
    let newSale = {...sale}

    if(sale.status != "Solicitado"){
      console.log("error status: "+ sale.status)
      return
    }

    console.log("Sale payed: "+ sale.id)

    const saleDoc = db.collection(salesRef).doc(sale.id)
    const reservedSalesDoc = db.collection(reservedSalesRef).doc(sale.id)
    const userDoc = db.collection(usersRef).doc(sale.user.uid)
    //const emailRef = db.collection(emailRef).doc()
    const productsListColl = db.collection(productsListRef)

    console.log("Initiating transaction");

    let productDocArray = Array.from(new Set(sale.requestedProducts.map(prod => (
      //Should be updated if we consider packages
      //We use set to get unique ids
      prod.product.id
    )))).map((prodId)=> productsListColl.doc(prodId))

    console.log("Initiating transaction");

    return db.runTransaction((transaction)=> {
      return transaction.getAll(salesCorrelativeDoc, ...productDocArray).then((sf)=> {
        
        let sfDoc = sf[0]     //Contains general config
        let productsList = sf.slice(1).filter(el => el.exists).map(el => el.data())   //This contains each Product object
        
        if(sf.slice(1).length != productsList.length){
          console.log("One product document does not exist.")
        }

        let correlative = 0

        if(!sfDoc.exists){
          correlative = 1
        } else {
          correlative = (!!sfDoc.data().rCorrelative) ? (sfDoc.data().rCorrelative + 1) : 1
        }

        let productsTrans = [...productsList]

        //Changing stock
        console.log("Validating Stock")
        productsTrans.forEach(el => {
          let productDB = el;
          console.log("In productDB evaluating stock of: "+ productDB.id)
          //console.log(productDB.products)

          let filteredReqProducts = sale.requestedProducts.filter(el2 => 
              //We get the requested products (in sale) that match
              //the current product from DB
              el2.product.id == productDB.id
            )
          
          filteredReqProducts.forEach(el2 =>{
              //We now check if there is at least one requested product
              //whose color does not have enough stock
              console.log("In sale evaluating stock of: "+ el2.chosenProduct.sku)
              //console.log(el2)

              let productColor = productDB.products.find(prodColor => 
                //We find the product corresponding to the color
                prodColor.sku == el2.chosenProduct.sku
                )
              console.log("Product Color found in productDB: "+ productColor.sku)
              console.log(productColor);

              console.log("DB stock virtual stock: ", productColor.virtualStock)
              console.log("DB stock real stock: ", productColor.realStock)
              console.log("Quantity: ", el2.quantity)

              console.log("ProductDB editted")
              productColor.virtualStock -= el2.quantity
              productColor.reservedStock -= el2.quantity

            })
          //console.log("ProductDB result: ")
          //console.log(productDB.products)

          
          //Update product quantity
          transaction.update(productsListColl.doc(productDB.id), productDB)
        })

        //We set current correlative in config
        transaction.set(salesCorrelativeDoc, {rCorrelative: correlative}, {merge: true})

        //We update sale with new correlative and status
        newSale.correlative = correlative
        newSale.status = 'Solicitado'

        transaction.set(saleDoc, newSale)

        //We delete reserved stock
        transaction.delete(reservedSalesDoc)

        //We update user pendingPayment and increase user correlative
        transaction.update(userDoc, {
          pendingPayment: false,
          salesCount: admin.firestore.FieldValue.increment(1),
          shoppingCar: []
        })

        //We send confirmation email
        // const email = {
        //   to: sale.user.email,
        //   template: {
        //     name: 'saleEmail'
        //   }
        // }
        // transaction.set(emailRef, email)

      })
    }).then(
      success => {
        console.log("Successful sale.")
      },
      err => {
        console.log("Error writing sale.")
        console.log(err)
        newSale.status = "Error"
        return reservedSalesDoc.set(newSale)
      }
    )
  })

//Used  to request form for usage on javascript library
// exports.reqForm = functions.https.onRequest((req, res) => {
//   return cors(req, res, ()=>{
//     const mode = req.query.mode
//     const data = req['body']
    
//     const username = cardPass.USER;
//     const password = mode == "TEST" ? cardPass.TEST : (mode=="PROD" ? cardPass.PROD : "ERROR");

//     console.log("mode: "+mode)
//     var auth = 'Basic '+ Buffer.from(username+":"+password).toString('base64')

//     const options = {
//       url: '/api-payment/V4/Charge/CreatePayment',
//       method: 'POST',
//       baseURL: 'https://api.micuentaweb.pe',
//       headers: {
//          'Content-Type': 'application/json',
//          'Authorization': auth       
//         },
//       data: data
//     }

//     return gaxios.request(options)
//       .then(res2 => {
//         console.log(`status: ${res2.data.status}`)
//         //console.log(res2.data.answer.formToken)
//         res.status(200).send(res2.data.answer.formToken)
//       })
//       .catch(error => {
//         console.error(error)
//         res.status(400).send(error)
//       })
//   })
// })

//reqVadsForm handles http request to encode vads fields needed to get html form for payment
exports.reqVadsForm = functions.https.onRequest((req, res) => {
  console.log("receiving request")
  cors(req, res, ()=>{
    
    const mode = req.query.mode
    const data = req['body']
    
    const key = mode == "TEST" ? formKeys.TEST : (mode=="PROD" ? formKeys.PROD : "ERROR");

    console.log("mode: "+mode)

    let signature = crypto.createHmac("sha256", key).update(data+"+"+key).digest('base64');

    res.status(200).send(signature)
  })
})
