import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { SaleRequestedProducts } from '../models/sale.model';

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

  

  constructor(
    private afs: AngularFirestore,
  ) {
      this.reqProdListSubject = new BehaviorSubject([])
      this.reqProdListObservable = this.reqProdListSubject.asObservable().pipe(shareReplay(1))
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

  delProd(prod: SaleRequestedProducts){
    let prodList = [...this.getProdList()].filter(el => 
      (el.product.sku != prod.product.sku) || (el.chosenProduct.sku != prod.chosenProduct.sku))
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
  
}
