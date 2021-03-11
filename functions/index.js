const functions = require('firebase-functions');
const admin = require('firebase-admin');

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

    let saleColl = db.collection(`db/aitec/sales`).doc(sale.id)

    let salesCorrelative = db.collection(`db/aitec/config`).doc('salesCorrelative') //Used to update and get correlative

    let couponColl = db.collection(`db/aitec/coupons`)

    let productsListColl = db.collection(`/db/aitec/productsList`)
    let productArray = Array.from(new Set(sale.requestedProducts.map(prod => (
      //Should be updated if we consider packages
      //We use set to get unique ids
      prod.product.id
    )))).map((prodId)=> productsListColl.doc(prodId))

    console.log("Initiating transaction");

    return db.runTransaction(trans => {
      console.log('Executing transaction');      
      return trans.getAll(salesCorrelative, ...productArray).then(res => {
        
        let productsTrans = [...res.slice(1)]
        let salesCorr = res[0]
        let correlative = null;

        //If one product does not exist at DB, we send error
        if(productsTrans.some((doc) => !doc.exists)){
          console.log("One product document does not exist.")
          throw 'Product does not exist'
        }

        //We first set correlative
        if(!salesCorr.exists){
          correlative = 1;
        } else {
          correlative = (!!salesCorr.data().rCorrelative) ? (salesCorr.data().rCorrelative + 1) : 1
        }

        trans.set(salesCorrelative, {rCorrelative: correlative}, {merge: true})
        //WE update correlative of sale at the end

        //We now update coupon
        if(!!sale.coupon){
          let ocupId = sale.coupon.id
          if(ocupId){
            trans.update(couponColl.doc(ocupId), {users: admin.firestore.FieldValue.arrayUnion(sale.user.uid)})
          }
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

        trans.update(saleColl, {status: 'Solicitado', correlative})

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
