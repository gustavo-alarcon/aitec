import { Component, Input, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/core/services/database.service';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from 'src/app/core/models/product.model';

@Component({
  selector: 'app-quantity-div',
  templateUrl: './quantity-div.component.html',
  styleUrls: ['./quantity-div.component.scss'],
})
export class QuantityDivComponent implements OnInit {
  @Input() product: Product;
  @Input() chosen: any;
  @Input() color: boolean;
  @Input() size: string;
  @Input() price: number;
  quantity$: Observable<number>;

  quantityForm = new FormControl(null);
  constructor(
    public dbs: DatabaseService,
    private snackBar: MatSnackBar) { }

  ngOnInit(): void {

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

  add(item) {

    let newproduct = {
      product: item,
      quantity: 1,
      chosenProduct: this.chosen,
      color: this.color,
      price: this.price
    };
    this.dbs.order.push(newproduct);
    this.dbs.orderObs.next(this.dbs.order);
    //localStorage.setItem(this.dbs.uidUser, JSON.stringify(this.dbs.order));
  }

  increase(item) {
    let index = this.dbs.order.findIndex(
      (el) => el['chosenProduct']['sku'] == this.chosen['sku']
    );

    this.dbs.order[index]['quantity']++;
    this.dbs.orderObs.next(this.dbs.order);
    //localStorage.setItem(this.dbs.uidUser, JSON.stringify(this.dbs.order));
  }

  decrease(item) {
    let index = this.dbs.order.findIndex(
      (el) => el['chosenProduct']['sku'] == this.chosen['sku']
    );
    this.dbs.order[index]['quantity']--;
    this.dbs.orderObs.next(this.dbs.order);
    //localStorage.setItem(this.dbs.uidUser, JSON.stringify(this.dbs.order));
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
