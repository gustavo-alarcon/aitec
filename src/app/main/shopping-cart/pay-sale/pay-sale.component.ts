import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, shareReplay, switchMap, take } from 'rxjs/operators';
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
  subtotal$: Observable<number>;
  igv$: Observable<number>;
  discount$: Observable<Number>;
  delivery$: Observable<number>;
  totalAll$: Observable<number>;

  photosList: Array<any> = [];
  photos: {
    resizing$: {
      photoURL: Observable<boolean>;
    };
    data: File[];
  } = {
      resizing$: {
        photoURL: new BehaviorSubject<boolean>(false),
      },
      data: [],
    };


  constructor(
    public dbs: DatabaseService,
    private auth: AuthService,
    private ng2ImgMax: Ng2ImgMaxService,
    private snackbar: MatSnackBar,
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

    this.subtotal$ = this.sum$.pipe(
      map(sum => {
        return (Number(sum) * 0.82)
      })
    )

    this.igv$ = this.sum$.pipe(
      map(sum => {
        return Number(sum) * 0.18
      })
    )
    this.discount$ = this.sale$.pipe(
      map(sale => {
        return sale.couponDiscount
      })
    )
    this.delivery$ = this.sale$.pipe(
      map(sale => {
        return sale.deliveryPrice
      })
    )

    this.totalAll$ = combineLatest([
      this.sum$,
      this.discount$
    ]).pipe(
      map(([sum, dis]) => {
        return Number(sum) - Number(dis)
      })
    )
  }

  addNewPhoto(formControlName: string, image: File[]) {
    if (image.length === 0) return;
    let reader = new FileReader();
    this.photos.resizing$[formControlName].next(true);

    this.ng2ImgMax
      .resizeImage(image[0], 1000, 426)
      .pipe(take(1))
      .subscribe(
        (result) => {
          this.photos.data.push(
            new File(
              [result],
              formControlName +
              this.photosList.length +
              result.name.match(/\..*$/)
            )
          );
          reader.readAsDataURL(image[0]);
          reader.onload = (_event) => {
            this.photosList.push({
              img: reader.result,
              show: false,
            });
            this.photos.resizing$[formControlName].next(false);
          };
        },
        (error) => {
          this.photos.resizing$[formControlName].next(false);
          this.snackbar.open('Por favor, elija una imagen en formato JPG, o PNG', 'Aceptar');
        }
      );
  }

  eliminatedphoto(ind) {
    this.photosList.splice(ind, 1);
    this.photos.data.splice(ind, 1);
  }

}
