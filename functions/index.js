const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const crypto = require('crypto');
const cardPass = require('./card-pass.json')
const formKeys = require('./form-keys.json')

const gaxios = require('gaxios');


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
const seriesPreprocessingRef = `db/aitec/seriesPreprocessingRef`
const cancelledSaleRef = `db/aitec/cancelledSales`;
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
    const couponColl = db.collection(couponsRef)

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

        //We now fill cupoun
        if(!!newSale.coupon){
          let ocupId = newSale.coupon.id
          if(ocupId){
            transaction.update(couponColl.doc(ocupId), {users: admin.firestore.FieldValue.arrayUnion(newSale.user.uid)})
          }
        }

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

  exports.cancelledSale = functions.firestore.document(`${cancelledSaleRef}/{saleId}`)
  .onCreate(event => {
    let sale = event.data()
    let newSale = {...sale}

    console.log("Sale payed: "+ sale.id)

    const saleDoc = db.collection(salesRef).doc(sale.id)
    const cancelledSalesDoc = db.collection(cancelledSaleRef).doc(sale.id)
    const userDoc = db.collection(usersRef).doc(sale.user.uid)
    //const emailRef = db.collection(emailRef).doc()
    const productsListColl = db.collection(productsListRef)
    const couponColl = db.collection(couponsRef)

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
              productColor.virtualStock += el2.quantity

            })
          //console.log("ProductDB result: ")
          //console.log(productDB.products)

          
          //Update product quantity
          transaction.update(productsListColl.doc(productDB.id), productDB)
        })

      })
    }).then(
      success => {
        console.log("Successful sale deletion.")
      },
      err => {
        console.log("Error writing sale.")
        console.log(err)
        newSale.status = "Error"
        return cancelledSalesDoc.set(newSale)
      }
    )
  })

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

//Function gets new series created, and adds changes respective stock
exports.updateSeries = functions.firestore.document(`${seriesPreprocessingRef}/{seriesPreId}`)
  .onCreate(event => {
    let seriesList = event.after.data()
    /*let seriesList= {
      invoice: "string",        //Comprobante
      waybill: "string",        //GR
      type: "Ingreso de Productos",
      changeVirtualStock: false,
      sale: null,
      kardexType: "type",
      kardexOperationType: "operationType",
      createdBy: {
        uid: string
      },
      createdAt: "sdfasdfas",
      list: [{
        list: [{
          id: "string",
          productId: "string",
          warehouseId: "string",
          barcode: "string",  //SKU+NUM serie
          sku: "string",      //codigo de color
          color: {
            color: "string",
            name: "string"
          },
          status: "stored"|"sold",
        }],
        cost: 25,
        product: {
          id: "asdfasd"
        },
        warehouse: {
          id: "asdfasdf"
        },
      }],
    }*/

    const productsListColl = db.collection(productsListRef)
    const seriesListColl = db.collection(seriesPreprocessingRef)

    console.log("Initiating transaction");

    let productDocArray = Array.from(new Set(seriesList.list.map(serie => serie.product.id)))
                          .map((prodId)=> productsListColl.doc(prodId))

    let incStock = seriesList.type == "Ingreso de Productos" ? 1 : (-1)

    return db.runTransaction((transaction)=> {
      return transaction.getAll(...productDocArray).then((sf)=> {

        let productsList = sf.filter(el => el.exists).map(el => el.data())   //This contains each Product object

        console.log("UpdatingProduct")
        //Updating product data (warehouseStock and colorStock)
        productsList.forEach(prod => {

          //filtProductSeries filtered by product
          let filtProductSeries = seriesList.list.filter(el => el.product.id == prod.id)
          
          //We update virtualStock and realStock for each Color
          prod.products.forEach(unitProduct => {

            let serialNumberfiltColorSeries = []

            filtProductSeries.forEach(SerialNumberWithPrice => {
              SerialNumberWithPrice.list.forEach(SerialNumber => {
                if(SerialNumber.sku == unitProduct.sku){
                  serialNumberfiltColorSeries.push(SerialNumber)
                }
              })
            })

            //We get each color for each product in DB. Then, we change the virtualStock
            let quantity = serialNumberfiltColorSeries.length

            if(seriesList.changeVirtualStock){
              unitProduct.virtualStock = (unitProduct.virtualStock ? unitProduct.virtualStock : 0) + (incStock)*quantity
            }
            unitProduct.realStock = (unitProduct.realStock ? unitProduct.realStock : 0) + (incStock)*quantity
          })

          //We update warehouseStock
          let warehouseIdListProduct = Array.from(new Set(filtProductSeries.map(series => series.warehouse.id)))

          let updateData = warehouseIdListProduct.reduce((prev, currWareId) => {

            //filtProductSeries was already filtered by productId
            let filtPerWareProd = filtProductSeries.find(el => (
              (el.warehouse.id == currWareId)
              ))
            let quantity = filtPerWareProd.list.length

            //Parenthesis - We update Kardex
            //Setting kardex
            let kardexProductRef = db.collection(`${productsListRef}/${prod.id}/kardex`).doc();

            let kardex = {
              id: kardexProductRef.id,
              productId: prod.id,
              warehouseId: currWareId,

              type: seriesList.kardexType,          
              operationType: seriesList.kardexOperationType,

              invoice: seriesList.invoice,
              waybill: seriesList.waybill,

              inflow: incStock === 1 ? true : false,

              quantity: quantity,
              unitPrice: filtProductSeries[0].cost,
              totalPrice: quantity*filtProductSeries[0].cost,

              createdBy: seriesList.createdBy,
              createdAt: new Date(),
            }

            if(seriesList.sale){
              kardex.correlative = seriesList.sale.correlative
            }

            transaction.set(kardexProductRef, kardex)

            /////////////////

            if(quantity){
              return ({
                ...prev,
                ["warehouseStock."+currWareId]: admin.firestore.FieldValue.increment(incStock*quantity)
              })
            } else {
              return {...prev}
            }

          }, {})
          
          //We update complete product
          let prodRef = productsListColl.doc(prod.id)
          transaction.update(prodRef, {products: prod.products, ...updateData})

          //Setting series
          filtProductSeries.forEach(series => {
            series.list.forEach(serialNumber => {
              let seriesRef = db.collection(productsListRef+"/"+prod.id+"/series").doc(serialNumber.id)
              transaction.set(seriesRef, serialNumber)
            })
          })

        })

      })
    })

  })

  //updateKardex is executed everytime a kardex update is created. Used to fill final data and update
  //lastKardex
  exports.updateKardex = functions.firestore.document(`${productsListRef}/{productId}/kardex/{kardexId}`)
  .onCreate(event => {
    let actKardex = {...event.data()}

    let actKardexDoc = db.collection(`${productsListRef}/${actKardex.productId}/kardex`).doc(actKardex.id)
    let lastKardexDoc = db.collection(`${productsListRef}/${actKardex.productId}/lastKardex`).doc(actKardex.warehouseId)

    return db.runTransaction((transaction)=> {
      return transaction.get(lastKardexDoc).then((lastKardexSf)=> {
        let mult = actKardex.inflow ? 1:-1;

        actKardex.finalUpdated = true
        
        if(!lastKardexSf.exists){
          actKardex.finalQuantity = mult*actKardex.quantity
          actKardex.finalTotalPrice = mult*actKardex.totalPrice
          actKardex.finalUnitPrice = actKardex.finalTotalPrice/actKardex.finalQuantity

          transaction.set(actKardexDoc, actKardex)
        } else {
          let lastKardex = {...lastKardexSf.data()}

          actKardex.finalQuantity = lastKardex.finalQuantity + mult*actKardex.quantity
          actKardex.finalTotalPrice = lastKardex.finalTotalPrice + mult*actKardex.totalPrice
          actKardex.finalUnitPrice = actKardex.finalTotalPrice/actKardex.finalQuantity

          transaction.set(actKardexDoc, actKardex)
        }

        transaction.set(lastKardexDoc, actKardex)
      })})
  })