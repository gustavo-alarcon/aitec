import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/core/services/database.service';
import { combineLatest, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product, unitProduct } from 'src/app/core/models/product.model';
import { ShoppingCarService } from 'src/app/core/services/shopping-car.service';
import { SaleRequestedProducts } from 'src/app/core/models/sale.model';

@Component({
  selector: 'app-quantity-div-improved',
  templateUrl: './quantity-div-improved.component.html',
  styleUrls: ['./quantity-div-improved.component.scss'],
})
export class QuantityDivImprovedComponent implements OnInit {
  @Input() product: Product;
  @Input() chosen: unitProduct;
  @Input() color: boolean;
  @Input() size: string;
  @Input() price: number;
  quantity$: Observable<number>;

  quantityForm: FormControl = new FormControl();
  quantityForm$: Observable<number>;
  reqProductObservable$: Observable<SaleRequestedProducts> = null;
  prodStock$: Observable<number>

  

  constructor(
    public dbs: DatabaseService,
    public shopCar: ShoppingCarService,
    private snackBar: MatSnackBar
    ) { }

  ngOnInit(): void {
    console.log("initiating quantity div")

    this.quantityForm$ = this.quantityForm.valueChanges.pipe(
      distinctUntilChanged(),
      // debounceTime(100),
      tap(quant => {
        // console.log("quantity form: ",quant)
        this.shopCar.setProdNumber(this.product.sku, this.chosen.sku, quant)
      })
    )
    
    //The following is the requested product inside shopp car
    this.reqProductObservable$ = this.shopCar.getReqProductObservable(this.product.sku, this.chosen.sku)
      .pipe(
        tap(reqProd => {
          //If was used to solve bug when products are deleted
          if(reqProd){
            this.quantityForm.setValue(reqProd.quantity)
          }
        }, shareReplay(1)))

    // The following checks the stock on DB
    this.prodStock$ = this.reqProductObservable$.pipe(
      switchMap(reqProd => {
        //If was used to solve bug when products are deleted
        if(reqProd){
          return this.shopCar.getProductDbObservable(reqProd.product.id).pipe(
            map(prodDB => {
              let prodDbStock = prodDB.products.find(prod => prod.sku == reqProd.chosenProduct.sku).virtualStock
              if(reqProd.quantity > prodDbStock){
                console.log("setting error")
                this.quantityForm.markAsTouched()
                this.quantityForm.setErrors({stock: true})
              }
              return prodDbStock
            })
          )
        } else {
          return of(null)
        }
        
      }), shareReplay(1)
    )
  }

  incProdNumber(){
    //Change to change in form
    this.quantityForm.setValue(this.quantityForm.value+1)
  }

  decProdNumber() {
    this.quantityForm.setValue(this.quantityForm.value-1)
  }

}
