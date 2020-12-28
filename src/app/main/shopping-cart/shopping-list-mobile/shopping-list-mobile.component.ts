import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaginationInstance } from 'ngx-pagination';
import { DatabaseService } from 'src/app/core/services/database.service';

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

  constructor(
    private snackBar: MatSnackBar,
    public dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.order = this.dbs.order

  }


  delete(item) {
    let index = this.dbs.order.findIndex(el => el['chosenProduct']['sku'] == item['sku'])
    this.dbs.order.splice(index, 1)

    this.dbs.orderObs.next(this.dbs.order)
    this.snackBar.open('Ha eliminado un producto de su carrito', 'Aceptar', {
      duration: 6000
    })
    //localStorage.setItem(this.dbs.uidUser, JSON.stringify(this.dbs.order));
  }


  givePrice(item) {
    if (item.product.promo) {
      return item.product.promoData.promoPrice
    } else {
      return item.product.priceMin
    }
  }


}
