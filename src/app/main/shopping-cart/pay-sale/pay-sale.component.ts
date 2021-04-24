import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { BehaviorSubject, combineLatest, interval, Observable, of, timer } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, startWith, switchMap, take, takeWhile, tap } from 'rxjs/operators';
import { Payments } from 'src/app/core/models/payments.model';
import { Sale } from 'src/app/core/models/sale.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { ShoppingCarService } from 'src/app/core/services/shopping-car.service';
import { SaleDialogComponent } from '../sale-dialog/sale-dialog.component';

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

  updatePhoto$: BehaviorSubject<boolean> = new BehaviorSubject(false) //Only used to emit an event whenever change in Photo

  uploadingSale$: BehaviorSubject<boolean> = new BehaviorSubject(true);   //contrary: false when it is uploading

  //Timer used to show remaining time
  timer$: Observable<number>
  disFinishButton$: Observable<boolean>;
  user$: Observable<import("c:/Users/Junjiro/Documents/Meraki/aitec/src/app/core/models/user.model").User>;


  constructor(
    public dbs: DatabaseService,
    private auth: AuthService,
    private ng2ImgMax: Ng2ImgMaxService,
    private snackbar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
    private shopCar: ShoppingCarService
  ) { }
  

  ngOnInit(): void {
    this.shopCar.clearCar()
    this.paymentMethod = new FormControl(null, Validators.required)
    this.paymentMethodList$ = this.dbs.getPaymentsChanges()
    this.paymentMethod$ = this.paymentMethod.valueChanges

    this.user$ = this.auth.user$.pipe(shareReplay(1))

    this.sale$ = this.user$.pipe(
      switchMap(user => {
        return this.dbs.getPayingSales(user.uid)
      }),
      shareReplay(1)
    )

    this.timer$ = this.sale$.pipe(
      switchMap(sale => {

        return interval(1000).pipe(
          map(actualSecondLapsed => {
            let lapsedTime = Math.round((new Date()).valueOf()/1000) - sale.createdAt['seconds']
            let leftTime = 3600 - lapsedTime
            return leftTime
          }),
          takeWhile(leftTime => {
            //console.log(leftTime)
            if(leftTime > -900){        //It will be cancelled only after 1:15 h
              return true
            } else {
              this.cancelSale(sale)
              return false
            }
          }, true),
          map(leftTime => {
            //console.log(leftTime)
            if(leftTime >0){
              return leftTime*1000
            } else {
              return 0
            }
          })
        )
        
      })
    )


    this.sum$ = this.sale$.pipe(
      map(sale => {
        let sum = this.dbs.giveProductPriceOfSale(sale.requestedProducts, sale.user.mayoristUser)
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

    this.disFinishButton$ = combineLatest(
      [this.paymentMethod$, this.updatePhoto$.asObservable()])
    .pipe(
      map(([paymentMethod, updatePhoto])=> {
        //If no option 
        if(!paymentMethod){
          return true
        }

        //If method is voucher and photosList is empty
        if(!this.photosList.length && (paymentMethod.type == 3)){
          return true
        }
        return false
      }),
      startWith(true)
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
            this.updatePhoto$.next(true)
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
    this.updatePhoto$.next(true)
  }

  finish(newSale: Sale){
    let sale = {...newSale}
    sale.payType = this.paymentMethod.value
    this.uploadingSale$.next(false)
    this.dbs.saveSalePayment(sale, this.photos)
      .pipe(
        map(res => {
          res.then(
            succ => {
              if(succ.success){
                sale = succ.sale
                this.dialog.open(SaleDialogComponent, 
                  {
                    closeOnNavigation: false,
                    disableClose: true,
                    maxWidth: '260px',
                    data: { 
                      name: !!sale.user.name ? sale.user.name : sale.user.personData.name, 
                      email: sale.user.email, 
                      number: sale.id, 
                      asesor: sale.adviser }
                    }
                  )
                this.router.navigate(["main"])
                //this.snackbar.open("Compra exitosa!")
              } else {
                this.snackbar.open("Error. Por favor, intente de nuevo.")
                this.uploadingSale$.next(true)
              }
            }
          )
          return false
        })
      ).subscribe()
  }

  cancelSale(sale: Sale){
    this.uploadingSale$.next(false)
    this.dbs.cancelSalePayment(sale).commit().then(
      res => {
        this.router.navigate(["main"])
        this.snackbar.open("Compra cancelada.", "Aceptar")
      }
    ).catch(err => {
        this.snackbar.open("Ocurrió un error. Por favor, actualice la página")
    })
  }

}
