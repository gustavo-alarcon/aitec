import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaginationInstance } from 'ngx-pagination';
import { Observable } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { SaleRequestedProducts } from 'src/app/core/models/sale.model';
import { DatabaseService } from 'src/app/core/services/database.service';
import { ShoppingCarService } from 'src/app/core/services/shopping-car.service';

@Component({
  selector: 'app-shopping-list-mobile',
  templateUrl: './shopping-list-mobile.component.html',
  styleUrls: ['./shopping-list-mobile.component.scss']
})
export class ShoppingListMobileComponent implements OnInit {

  config: PaginationInstance = {
    id: 'custom',
    itemsPerPage: 4,
    currentPage: 1
  };
  order: any = []
  @Input() edit: boolean
  @Input() purchase: boolean

  defaultImage = "../../../../assets/images/icono-aitec-01.png";
  mayorista:boolean = false

  reqProdListObservable$: Observable<SaleRequestedProducts[]>

  constructor(
    private snackBar: MatSnackBar,
    public dbs: DatabaseService,
    public shopCar: ShoppingCarService,

  ) { }

  ngOnInit(): void {
    //this.order = this.dbs.order
    this.dbs.isMayUser$.pipe(take(1)).subscribe(my=>{
      this.mayorista = my
    })

    this.reqProdListObservable$ = this.shopCar.reqProdListObservable
  }


  delete(prodSku: string, colorSku: string) {
    this.shopCar.delProd(prodSku, colorSku)
    
    this.snackBar.open('Ha eliminado un producto de su carrito', 'Aceptar', {
      duration: 6000
    })

    //localStorage.setItem(this.dbs.uidUser, JSON.stringify(this.dbs.order));
  }


  giveProductPrice(item): number {
    if (item.product.promo && !this.mayorista) {
      let promTotalQuantity = Math.floor(item.quantity / item.product.promoData.quantity);
      let promTotalPrice = promTotalQuantity * item.product.promoData.promoPrice;
      let noPromTotalQuantity = item.quantity % item.product.promoData.quantity;
      let noPromTotalPrice = noPromTotalQuantity * item.price;
      return promTotalPrice + noPromTotalPrice;
    }
    else {
      return item.quantity * item.price
    }
  }

}
