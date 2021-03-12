import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { Payments } from 'src/app/core/models/payments.model';
import { Sale } from 'src/app/core/models/sale.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-pay-sale',
  templateUrl: './pay-sale.component.html',
  styleUrls: ['./pay-sale.component.scss', '../shopping-cart.component.scss']
})
export class PaySaleComponent implements OnInit {
  
  
  paymentMethod: FormControl
  paymentMethod$: Observable<Payments>
  paymentMethodList$: Observable<Payments[]>;
  sale$: Observable<Sale>
  sum$: Observable<number>;


  constructor(
    private dbs: DatabaseService,
    private auth: AuthService
  ) { }
  

  ngOnInit(): void {
    this.paymentMethod = new FormControl(null, Validators.required)
    this.paymentMethodList$ = this.dbs.getPaymentsChanges()
    this.paymentMethod$ = this.paymentMethod.valueChanges
    this.sale$ = this.auth.user$.pipe(
      switchMap(user => {
        return this.dbs.getPayingSales(user.uid)
      }),
      shareReplay(1)
    )
    this.sum$ = this.sale$.pipe(
      map(sale => {
        let sum = {...sale}.requestedProducts
            .map((el) => this.dbs.giveProductPrice(el, sale.user.customerType))
            .reduce((a, b) => a + b, 0);
          return sum + sale.deliveryPrice;
      })
    )
  }

}
