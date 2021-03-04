import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
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
  private reqProdSubject: BehaviorSubject<SaleRequestedProducts[]>
  public reqProdObservable: Observable<SaleRequestedProducts[]>

  

  constructor(
    private afs: AngularFirestore,
  ) {
      this.reqProdSubject = new BehaviorSubject([])
      this.reqProdObservable = this.reqProdSubject.asObservable()
    }
  
  private getProdList(): SaleRequestedProducts[]{
    return this.reqProdSubject.getValue()
  }

  //Varying quantity
  setProdNumber(prodSku: string, prodColSku: string, numb: number){
    let prodList = [...this.getProdList()]
    prodList.find(el => 
      (el.product.sku == prodSku) && (el.chosenProduct.sku == prodColSku)).quantity += numb
    this.reqProdSubject.next(prodList)
  }

  incProdNumber(prodSku: string, prodColSku: string){
    this.setProdNumber(prodSku, prodColSku, 1)
  }

  decProdNumber(prodSku: string, prodColSku: string){
    this.setProdNumber(prodSku, prodColSku, -1)
  }

  //Adding or deleting product
  addProd(prod: SaleRequestedProducts){
    let prodList = [...this.getProdList()]
    let product = prodList.find(el => 
      (el.product.sku == prod.product.sku) && (el.chosenProduct.sku == prod.chosenProduct.sku))

    if(!!product){
      this.incProdNumber(product.product.sku, product.chosenProduct.sku)
    } else {
      prodList.push({...prod})
      this.reqProdSubject.next(prodList)
    }
  }

  delProd(prod: SaleRequestedProducts){
    let prodList = [...this.getProdList()].filter(el => 
      (el.product.sku != prod.product.sku) || (el.chosenProduct.sku != prod.chosenProduct.sku))
    this.reqProdSubject.next(prodList)
  }

  //Verifying online stock. You should change this for a pipe
  getDbProduct(prod: SaleRequestedProducts){
    let found = this.productsObservables.find(el => (el.id == prod.product.id))
      
    if(!!found){
      return found.observable
    } else {
      let obs = this.productsListColl.doc<Product>(prod.product.id).valueChanges().pipe(shareReplay())
      this.productsObservables.push({id: prod.product.id, observable: obs})
      //We search again for the observable
      return this.getDbProduct(prod)
    }
  }
  
}
