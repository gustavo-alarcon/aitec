import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { truncateSync } from 'fs';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { BehaviorSubject, combineLatest, interval, Observable, of, timer } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, switchMap, take, takeWhile } from 'rxjs/operators';
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

  //Calculation
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

  uploadingSale$: Observable<boolean> = of(true);   //contrary: false when it is uploading

  emitFinish: BehaviorSubject<boolean> = new BehaviorSubject(true); 

  //When true and payment type is tarjeta, finish button will be disabled. In case of error,
  //finish button will be enabled by emitFinish=false
  emitFinish$: Observable<boolean>
  finishSale$: Observable<boolean>;

  //Timer used to show remaining time
  timer$: Observable<number>


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

    this.timer$ = this.sale$.pipe(
      switchMap(sale => {

        let lapsedTime = Math.round((new Date()).valueOf()/1000) - sale.createdAt['seconds']

        return interval(1000).pipe(
          map(actualSecondLapsed => {
            let leftTime = 3600 - lapsedTime - actualSecondLapsed
            return leftTime
          }),
          takeWhile(leftTime => {
            if(leftTime > -900){
              return true
            } else {
              this.cancelSale(sale)
              return false
            }
          }, true),
          map(leftTime => {
            if(leftTime >0){
              return leftTime
            } else {
              return 0
            }
          })
        )
        
      })
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

    this.emitFinish$ = this.emitFinish.asObservable()

    this.finishSale$ = combineLatest([this.sale$, this.emitFinish$])
    .pipe(
      //takeWhile(([sale, emit])=> (!emit), true),
      map(([sale, emit])=> {
        if(!emit){
          return true
        } else {
          this.finish(sale)
          return false
        }
      }),
      distinctUntilChanged()
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

  //WE first emitFinish, and in observable finishSale$ we will execute finish
  emitFinishEvent(){
    this.emitFinish.next(true)
  }

  finish(sale: Sale){
    this.uploadingSale$ = this.dbs.saveSalePayment(sale, this.photos)
    .pipe(
      map(res => {
        res.then(
          succ => {
            if(succ.success){
              this.snackbar.open("Compra exitosa!")
            } else {
              this.snackbar.open("Error! Haga click en registrar compra.")
              this.uploadingSale$ = of(true)
            }
          }
        )
        return false
    }))
  }

  cancelSale(sale: Sale){
    this.dbs.cancelSalePayment(sale).commit().then(
      res => {
        this.snackbar.open("Tiempo excedido.")
      }
    ).catch(err => {
        this.snackbar.open("Ocurrió un error. Por favor, actualice la página")
    })
  }

}
