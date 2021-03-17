const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const crypto = require('crypto');
const cardPass = require('./card-pass.json')

let app = admin.initializeApp();
const db = admin.firestore();

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

    let userRef = db.collection('users').doc(userId)

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

exports.registerPurchase = functions.firestore.document(`db/aitec/sales/{saleId}`)
  .onCreate(event => {

    let sale = event.data();
    console.log("Sale created: "+ sale.id)

    const saleColl = db.collection(`db/aitec/sales`).doc(sale.id)

    const productsListColl = db.collection(`/db/aitec/productsList`)
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

              if(productColor.virtualStock - el2.quantity < 0){
                throw 'Stock is not enough'
              } else {
                console.log("ProductDB editted")
                productColor.virtualStock -= el2.quantity
              }

            })
          console.log("ProductDB result: ")
          console.log(productDB.products)

          trans.update(productsListColl.doc(productDB.id), productDB)
        })

        trans.update(saleColl, {status: 'Pagando'})
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
exports.reStockPurshase = functions.firestore.document(`db/aitec/reStock/{saleId}`)
  .onCreate(event => {

    let sale = event.data();
    console.log("Sale created: "+ sale.id)

    const saleColl = db.collection(`db/aitec/sales`).doc(sale.id)

    const productsListColl = db.collection(`/db/aitec/productsList`)
    
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

              console.log("ProductDB editted")
              productColor.virtualStock += el2.quantity

            })
          console.log("ProductDB result: ")
          console.log(productDB.products)

          trans.update(productsListColl.doc(productDB.id), productDB)
        })

        trans.delete(saleColl)
        trans.update(userColl, {shoppingCar: [], pendingPayment: false})

       }).then(
        success => {
          console.log('Successfull stock change!')
        },
        err => {
          console.log("Unsuccessfull reStocking sale")
          //return saleColl.update({status: 'Error'})
        }
       )
       
    })

})

exports.scheduleReStockPurshase = functions.pubsub.schedule('every 15 minutes')
  .timeZone('America/Lima')
  .onRun((context) => {
    const payingSalesColl = db.collection(`db/aitec/sales`).where("status", "==", 'Pagando')
    const reStockSalesColl = db.collection(`db/aitec/reStock`)
    const salesColl = db.collection(`db/aitec/sales`)

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

      return batch.commit()

    })


});

exports.cardPayment = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const answer = req['body']

    //We first verify authenticity
    const krAnswer = answer['kr-answer']
    const krHash = answer['kr-hash']

    const data = JSON.parse(krAnswer)
    const key = data.orderDetails.mode == "TEST" ? cardPass.TEST : cardPass.PROD

    let krHashCalculated = crypto.createHmac("sha256", key).update(krAnswer).digest('hex');

    if(krHashCalculated != krHash){
      res.status(404).send("Fraud attempt.")
    } else {
      //In case it is fine, we validate it is paid or not
      if(data.orderStatus != "PAID"){
        res.status(200).send("Not fully paid.")
      } else {
        //We now extract actual sale data
        let newSale = {...data.transactions[0].metadata}

        //And save it to DB
        const saleRef = db.collection(`db/aitec/sales`).doc(newSale.id);
        const genConfigRef = db.collection(`db/aitec/config`).doc('salesCorrelative')
        const couponColl = db.collection(`db/aitec/coupons`)
        const userColl = db.collection(`users`)

        
        db.runTransaction((transaction)=> {
          return transaction.get(genConfigRef).then((sfDoc)=> {
            
            let correlative = 0

            if(!sfDoc.exists){
              correlative = 1
            } else {
              correlative = (!!sfDoc.data().rCorrelative) ? (sfDoc.data().rCorrelative + 1) : 1
            }

            //We set current correlative in config
            transaction.set(genConfigRef, {rCorrelative: correlative})

            //We update sale with new correlative
            newSale.correlative = correlative
            transaction.set(saleRef, newSale)

            //We now fill cupoun
            if(!!newSale.coupon){
              let ocupId = sale.coupon.id
              if(ocupId){
                transaction.update(couponColl.doc(ocupId), {users: admin.firestore.FieldValue.arrayUnion(newSale.user.uid)})
              }
            }
            //We update user pendingPayment
            transaction.update(userColl.doc(newSale.user.uid), {pendingPayment: false})

          }).then(
            success => {
              res.status(200).send("Successful sale.")
            },
            err => {
              res.status(404).send("Error writing sale.")
            }
          )

        })
      }


    }
    
  })
})

