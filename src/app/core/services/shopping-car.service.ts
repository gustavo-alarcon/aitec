import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { SaleRequestedProducts } from '../models/sale.model';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ShoppingCarService {

  //References
  private productsListRef: `db/aitec/productsList` = `db/aitec/productsList`;
  private productsListColl = this.afs.collection(this.productsListRef)
  private productsObservables: {id: string, observable: Observable<Product>}[] = []

  //Requeted products
  private reqProdListSubject: BehaviorSubject<SaleRequestedProducts[]>
  public reqProdListObservable: Observable<SaleRequestedProducts[]>
  public validateStock: Observable<boolean>     //Should give true if stock exceeded

  

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
  ) {
      this.reqProdListSubject = new BehaviorSubject([])
      this.reqProdListObservable = this.afAuth.authState.pipe(
        switchMap(authUser => {
          console.log("called complete observable")
          console.log(authUser)
          if(!!authUser){
            return this.afs.collection<User>('users').doc(authUser.uid).get({ source: "server" }).pipe(
              map(res => {
                console.log("after requesting user info")
                if (res.exists) {
                  this.reqProdListSubject.next((<User>res.data()).shoppingCar)
                  return <User>res.data()
                } else {
                  return null
                }
              }), 
              switchMap(res => {
                if(res){
                  return this.reqProdListSubject.asObservable().pipe(
                    tap(reqProdList => {
                      if(reqProdList){
                        if(reqProdList.length){
                          this.afs.collection('users').doc((<User>res).uid).update({shoppingCar: reqProdList})
                            .catch(err => {console.log("error while saving car")})
                        }
                      }
                    })
                  )
                } else {
                  return of(null)
                }
              }))
          } else {
            return of(null)
          }
        }),
        shareReplay(1)
      )
      this.validateStock = this.reqProdListObservable.pipe(
        switchMap(reqProdList => {
          
          let productListDBObservable = Array.from(new Set(reqProdList.map(reqProd => reqProd.product.id)))
                            .map(id => this.getProductDbObservable(id))
  
          if(reqProdList.length){
            return combineLatest(productListDBObservable).pipe(
              map(prodListDB => {
                //We validate stock
                return reqProdList.some(reqProd => {
                  //We first find the right product on prodListDB and then the color
                  let prodColorDbStock = prodListDB.find(prodDb => (prodDb.sku == reqProd.product.sku)).products
                                          .find(prodDbColor => prodDbColor.sku == reqProd.chosenProduct.sku)
                                          .virtualStock
                  return reqProd.quantity > prodColorDbStock
                })
  
              })
            )
  
          } else {
            return of<boolean>(true)
          }
          
        }), shareReplay(1)
      )
    }
  
  private getProdList(): SaleRequestedProducts[]{
    return this.reqProdListSubject.getValue()
  }

  //Varying quantity
  setProdNumber(prodSku: string, prodColSku: string, numb: number){
    let prodList = [...this.getProdList()]
    prodList.find(el => 
      (el.product.sku == prodSku) && (el.chosenProduct.sku == prodColSku)).quantity = numb
    this.reqProdListSubject.next(prodList)
  }

  varyProdNumber(prodSku: string, prodColSku: string, numb: number){
    let prodList = [...this.getProdList()]
    prodList.find(el => 
      (el.product.sku == prodSku) && (el.chosenProduct.sku == prodColSku)).quantity += numb
    this.reqProdListSubject.next(prodList)
  }

  incProdNumber(prodSku: string, prodColSku: string){
    this.varyProdNumber(prodSku, prodColSku, 1)
  }

  decProdNumber(prodSku: string, prodColSku: string){
    this.varyProdNumber(prodSku, prodColSku, -1)
  }

  //Adding or deleting product
  addProd(prod: SaleRequestedProducts){
    let prodList = [...this.getProdList()]
    let product = prodList.find(el => 
      (el.product.sku == prod.product.sku) && (el.chosenProduct.sku == prod.chosenProduct.sku))

    if(!!product){
      //If it already exist, it only increases current number
      this.incProdNumber(product.product.sku, product.chosenProduct.sku)
    } else {
      prodList.push({...prod, quantity: 1})
      this.reqProdListSubject.next(prodList)
    }
  }

  delProd(prodSku: string, colorSku: string){
    let prodList = [...this.getProdList()].filter(el => 
      (el.product.sku != prodSku) || (el.chosenProduct.sku != colorSku))
    this.reqProdListSubject.next(prodList)
  }

  //Verifying online stock. You should change this for a pipe
  getProductDbObservable(prodId: string): Observable<Product>{
    let found = this.productsObservables.find(el => (el.id == prodId))
      
    if(!!found){
      return found.observable
    } else {
      let obs = this.productsListColl.doc<Product>(prodId).valueChanges().pipe(shareReplay(1))
      this.productsObservables.push({id: prodId, observable: obs})
      //We search again for the observable
      return this.getProductDbObservable(prodId)
    }
  }

  //Gets product from car
  getReqProductObservable(prodSku: string, prodColSku: string): Observable<SaleRequestedProducts>{
    return this.reqProdListObservable.pipe(map(reqProdList => {
      // console.log(prodSku +"-"+prodColSku)
      // console.log("Product change")
      // console.log(reqProdList)
      // console.log(this.reqProdListSubject.getValue())
      let found = reqProdList.find(res => 
        (res.product.sku == prodSku) && (res.chosenProduct.sku == prodColSku)
        )
      // console.log("returning")
      // console.log(found)
      return !!found ? found : null

      }))
    
  }
  clearCar(){
    this.reqProdListSubject.next([])
  }

}
