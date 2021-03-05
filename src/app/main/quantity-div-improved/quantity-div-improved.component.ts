import { Component, Input, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/core/services/database.service';
import { Observable } from 'rxjs';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';
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
  quantityForm$: Observable;
  reqProductObservable$: Observable<SaleRequestedProducts> = null;
  prodStock$: Observable<number>

  constructor(
    public dbs: DatabaseService,
    public shopCar: ShoppingCarService,
    private snackBar: MatSnackBar
    ) { }

  ngOnInit(): void {
    console.log("initiating quantity div")


    

    this.reqProductObservable$ = this.shopCar.getReqProductObservable(this.product.sku, this.chosen.sku)
      .pipe(
        tap(reqProd => {
          this.quantityForm.setValue(reqProd.quantity)
        }, shareReplay(1)))

    this.prodStock$ = this.reqProductObservable$.pipe(
      switchMap(reqProd => {
        return this.shopCar.getProductDbObservable(reqProd).pipe(
          map(prodDB => {
            return prodDB.products.find(prod => prod.sku == reqProd.chosenProduct.sku).virtualStock
          })
        )
      }), shareReplay(1)
    )

  }

  ngOnChanges() {
    this.quantity$ = this.dbs.orderObs$.pipe(
      map((order) => {
        let index = order.length ? order.findIndex(el => el['chosenProduct']['sku'] == this.chosen['sku']) : -1
        if (index >= 0) {
          let orderProduct = order[index];
          return orderProduct['quantity'];
        } else {
          return null
        }
      }),
      tap((res) => {
        if (res) {
          this.quantityForm.setValue(res);
        }
      })
    );
  }

  addProd() {
    console.log("Adding more")
    let newProduct: SaleRequestedProducts = {
      product: this.product,
      quantity: 0,                  //Does not really matter
      chosenProduct: this.chosen,
      color: this.color,
      price: this.price
    };

    console.log(newProduct)
    this.shopCar.addProd(newProduct)
    
  }

  incProdNumber(){
    //this.shopCar.incProdNumber(this.product.sku, this.chosen.sku)
  }

  decProdNumber() {
    this.shopCar.decProdNumber(this.product.sku, this.chosen.sku)
  }

  change(event: KeyboardEvent){
    event.preventDefault()
    console.log(event)
    if(event.key in "0123456789".split("")){
      console.log("number!")
    }
    alert(this.quantityForm.value)
  }

  view(event) {
    //console.log(event);

    let number = event.target.valueAsNumber;
    this.changeQuantity(number);
  }

  changeQuantity(number) {
    let index = this.dbs.order.findIndex(
      (el) => el['chosenProduct']['sku'] == this.chosen['sku']
    );
    if (number == 0 || isNaN(number)) {
      this.dbs.order[index]['quantity'] = 1;
    } else {
      if (number >= this.chosen['virtualStock']) {
        this.dbs.order[index]['quantity'] = this.chosen['virtualStock'];
        this.snackBar.open(
          'Stock disponible del producto:' + this.chosen['virtualStock'],
          'Aceptar',
          {
            duration: 6000,
          }
        );
      } else {
        this.dbs.order[index]['quantity'] = number;
      }
    }

    this.dbs.orderObs.next(this.dbs.order);
  }

  onKeydown(event) {
    if (event.keyCode === 13) {
      this.changeQuantity(event.target.valueAsNumber);
    }
    let permit =
      event.keyCode === 8 ||
      event.keyCode === 46 ||
      event.keyCode === 37 ||
      event.keyCode === 39;
    return permit ? true : !isNaN(Number(event.key));
  }
}
