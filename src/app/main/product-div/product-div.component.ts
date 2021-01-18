import { Component, Input, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, map, switchMap } from 'rxjs/operators';
import { Product } from 'src/app/core/models/product.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-product-div',
  templateUrl: './product-div.component.html',
  styleUrls: ['./product-div.component.scss']
})
export class ProductDivComponent implements OnInit {

  @Input() product: Product

  price: number = 0
  promo: boolean = false
  init$: Observable<any>

  defaultImage = "../../../assets/images/icono-aitec-01.png";
  constructor(
    private router: Router,
    private dbs: DatabaseService,
    private auth: AuthService
  ) { }


  ngOnInit(): void {
    this.init$ = combineLatest(
      this.dbs.getProductObs(this.product.id),
      this.dbs.isMayUser$
    ).pipe(
      map(([product, user]) => {
        this.price = product.priceMin
        this.promo = product.promo
        if (user) {
          this.price = product.priceMay
          this.promo = false
        }

        return product
      })
    );

  }

  navigateProduct(product) {
    this.router.navigate(["/main/producto", product]);
  }

  getDiscount(promo) {
    let price = this.price
    let moneyDisccount: number = 0
    let percentageDisccount: number = 0
    moneyDisccount = (price * promo.quantity - promo.promoPrice);
    percentageDisccount = (moneyDisccount / (price * promo.quantity)) * 100.0;
    return Math.round(percentageDisccount)
  }
}
