import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { BehaviorSubject, combineLatest, empty, Observable } from 'rxjs';
import { finalize, map, startWith, switchMap, take, takeUntil, takeWhile, tap } from 'rxjs/operators';
import { Sale, saleStatusOptions } from 'src/app/core/models/sale.model';
import { User } from 'src/app/core/models/user.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { LocationDialogComponent } from './location-dialog/location-dialog.component';
import { SaleDialogComponent } from './sale-dialog/sale-dialog.component';
import { LandingService } from 'src/app/core/services/landing.service';


@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.scss'],
})
export class ShoppingCartComponent implements OnInit {
  view = new BehaviorSubject<number>(1);
  view$ = this.view.asObservable();

  discount = new BehaviorSubject<string>('0.00');
  discount$ = this.discount.asObservable();

  list$: Observable<any>;
  sum$: Observable<string>;
  subtotal$: Observable<string>;
  igv$: Observable<string>;
  delivery$: Observable<any>;
  totalAll$: Observable<string>;

  uploadingSale$: BehaviorSubject<boolean> | Observable<Sale> = null;

  products: Array<any>;
  total: number = 0

  adviserForm: FormControl = new FormControl('')
  advisers$: Observable<any>;

  initCoupon$: Observable<any>
  couponList: Array<any> = []
  couponForm: FormControl = new FormControl('')
  couponVerified: boolean = false

  user: User

  /*delivery*/
  initDelivery$: Observable<any>
  delivery: number = 1;
  selectedDelivery: number = 0;
  zones: Array<any> = [];

  deliveryForm: FormControl = new FormControl(null)

  stores: any[] = []
  locations: any[] = []
  contactNumbers: Array<string> = []
  contactEmails: Array<string> = []

  viewDelivery: number = 1;
  validatedSecondButton: boolean = true

  selectedLocation: number = 0;
  selectedStore: number = 0;

  deliveryNumber: number = 0

  /*Payments*/
  cardForm: FormGroup;
  boletaForm: FormGroup;
  facturaForm: FormGroup;

  document: number = 1;
  method: {
    name: string;
    value: number;
    account?: string;
  } = { name: '', value: 0 };

  payments: Array<any> = [];

  observation: FormControl = new FormControl('')

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

  initPayment$: Observable<any>
  firstTime: number = 1



  constructor(
    private dbs: DatabaseService,
    public auth: AuthService,
    private fb: FormBuilder,
    private ng2ImgMax: Ng2ImgMaxService,
    private router: Router,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private ld: LandingService
  ) { }

  ngOnInit(): void {
    this.delivery$ = this.dbs.delivery$.pipe(
      tap(del => {
        this.deliveryNumber = del
      })
    )

    this.products = this.dbs.order;
    this.sum$ = combineLatest(
      this.dbs.isMayUser$,
      this.dbs.orderObs$,
      this.dbs.delivery$
    ).pipe(
      map(([may, ord, del]) => {

        if (ord.length == 1) {
          if (ord[0].quantity == 1) {
            this.zones = ord[0].product.zones ? ord[0].product.zones : []
            if (this.deliveryForm.disabled) {
              this.deliveryForm.setValue(null)
              this.deliveryForm.enable()
            }
          } else {
            this.deliveryForm.setValue(-2)
            this.deliveryForm.disable()
          }
        } else {
          this.deliveryForm.setValue(-2)
          this.deliveryForm.disable()
        }
        if (ord.length) {
          let suma = [...ord]
            .map((el) => this.giveProductPrice(el, may))
            .reduce((a, b) => a + b, 0);
          this.total = suma + del;
          return (suma + del).toFixed(2);
        } else {
          return (0 + del).toFixed(2);
        }
      })
    );

    this.totalAll$ = combineLatest(
      this.sum$,
      this.discount$
    ).pipe(
      map(([sum, dis]) => {
        return (Number(sum) - Number(dis)).toFixed(2)
      }),
      tap(res => {
        this.total = Number(res)
      })
    )

    this.subtotal$ = this.sum$.pipe(
      map(sum => {
        return (Number(sum) * 0.82).toFixed(2)
      })
    )

    this.igv$ = this.sum$.pipe(
      map(sum => {
        return (Number(sum) * 0.18).toFixed(2)
      })
    )


    this.advisers$ = combineLatest(
      this.adviserForm.valueChanges.pipe(
        startWith(''),
      ),
      this.dbs.getAdvisers()
    ).pipe(

      map(([value, advisers]) => {

        let filt = typeof value == 'object' ? value.displayName : value
        return advisers.filter((el) =>
          value ? el['displayName'].toLowerCase().includes(filt.toLowerCase()) : true
        );
      })
    );

    this.initCoupon$ = this.dbs.getCoupons().pipe(
      tap(res => {
        this.couponList = res
      })
    )

    /*Delivery*/
    this.initDelivery$ = combineLatest(
      this.dbs.getStores(),
      this.ld.getConfig()
    ).pipe(
      map(([stores, confi]) => {
        if (confi['contactSale']) {
          this.contactNumbers = confi['contactSale']['numbers']
          this.contactEmails = confi['contactSale']['emails']
        }
        this.stores = stores
        return stores
      })
    )

    /*Payments*/

    this.cardForm = this.fb.group({
      type: [null],
      numero: [null],
      month: [null],
      year: [null],
      cvv: [null],
      titular: [null],
    });

    this.boletaForm = this.fb.group({
      dni: [null, Validators.required],
      name: [null, Validators.required]
    });

    this.facturaForm = this.fb.group({
      ruc: [null, Validators.required],
      name: [null, Validators.required],
      address: [null, Validators.required],
    });

    this.initPayment$ = combineLatest([
      this.auth.user$,
      this.dbs.getPaymentsChanges()
    ]).pipe(
      map(([user, payments]) => {
        this.payments = payments.map(pay => {
          return {
            name: pay['name'],
            account: pay['account'],
            value: pay['voucher'] ? 3 : pay['name'].includes('arjeta') ? 2 : 1
          }
        })

        this.user = user
        console.log(this.user)
        this.locations = user.location

        if (user.personData.type == 'natural') {
          this.boletaForm.get('dni').setValue(user.personData['dni'])
          this.boletaForm.get('name').setValue(user.personData['name'] + ' ' + user.personData['lastName'])
        } else {
          this.facturaForm.setValue({
            ruc: user.personData.ruc,
            name: user.personData.name,
            address: user.personData.address
          })
        }
        return user
      })
    )



  }


  firstView() {
    this.view.next(1);
  }

  secondView() {
    this.view.next(2);
    this.validatedSecondButton = false
  }

  thirdView() {
    console.log(this.deliveryForm.value)
    let valid = false
    if (this.delivery == 1) {
      if (this.deliveryForm.value) {
        if (this.deliveryForm.value == -2) {
          valid = true
        } else {
          valid = this.locations.length != 0
        }
      } else {
        this.snackbar.open('Por favor, escoga una zona de envio', 'Aceptar');

      }
    } else {
      valid = true
    }
    if (valid) {
      this.view.next(3);
    } else {
      this.snackbar.open('Por favor, agregue una dirección', 'Aceptar');
    }
  }

  validatedThirdButton() {
    let location = this.user ? this.user.location ? true : false : false;
    let delivery = this.selectedDelivery ? true : false;
    if (this.delivery == 1) {
      return !location && !delivery
    } else {
      return !delivery
    }
  }

  validatedFinishButton() {
    let doc;
    if (this.document == 1) {

      doc = this.boletaForm.valid
    } else {
      doc = this.facturaForm.valid
    }

    if (!doc) {
      this.snackbar.open('Por favor, complete la información del comprobante de pago', 'Aceptar');
    }

    if (!this.method.value) {
      this.snackbar.open('Por favor, indique el método de pago', 'Aceptar');
    }
    let meth = true;
    let del = this.viewDelivery == 1 && this.deliveryForm.value != -2
    if (this.method.value == 3 && del) {
      meth = this.photosList.length > 0
    }

    if (!meth) {
      this.snackbar.open('Por favor, agregué el voucher de pago', 'Aceptar');
    }
    return doc && meth
  }

  finish() {
    if (this.validatedFinishButton()) {
      this.uploadingSale$ = new BehaviorSubject(true)

      console.log(this.selectedLocation)
      let info = {
        location: !!this.user.location ? this.user.location[this.selectedLocation] : null,
        store: this.delivery == 2 ? this.stores[this.selectedStore] : null
      }

      let newSale: Sale = {
        id: '',
        correlative: 0,
        correlativeType: 'R',
        idDocument: this.document,
        document: this.document == 1 ? 'Boleta' : 'Factura',
        documentInfo: this.document == 1 ? this.boletaForm.value : this.facturaForm.value,
        payType: this.method,
        payInfo: this.cardForm.value,
        idDelivery: this.delivery,
        deliveryType: this.delivery == 1 ? 'Entrega en domicilio' : 'Recojo en tienda',
        deliveryInfo: info,
        payDelivery: this.delivery == 1 ? this.deliveryForm.value != -2 : true,
        requestDate: null,
        createdAt: new Date(),
        createdBy: null,
        user: this.user,
        requestedProducts: this.dbs.order,
        status: 'Solicitando',
        total: this.total,
        deliveryPrice: this.delivery == 1 ? this.selectedDelivery : 0,
        observation: this.observation.value,
        voucher: [],
        voucherChecked: false,
        adviser: this.adviserForm.value,
        coupon: null
      }


      console.log(newSale);

      let phot = this.photos.data.length ? this.photos : null;

      let [batch, saleRef] = this.dbs.finishPurshase(newSale);

      batch.commit()
        .then(res => {
          console.log('Writing Sale successfull')
          this.snackbar.open("Validando Stock")
          this.uploadingSale$ = saleRef.valueChanges().pipe(
            takeWhile(sale => {
              let statuses = new saleStatusOptions()
              console.log(sale.status)
              switch(sale.status){
                case statuses.failed:
                  this.snackbar.open("Error. Falta de Stock.", "Aceptar")
                  return false;
                case statuses.requested:
                  this.snackbar.open("Compra registrada!", "Aceptar")
                  return false;
                default:
                  return true;
              }
            })
          )
        }).catch(err => {
          console.log('Writing Sale unsuccessfull')
          this.snackbar.open("Error en conexión. Vuelva a intentarlo.")
        });


      //this.dbs.sendEmail(newSale)
      /*this.dbs.reduceStock(this.user, newSale, phot).then(() => {
        this.view.next(1)
        this.dbs.order = []
        this.dbs.orderObs.next([])
        let name = this.user.personData ? this.user.personData.name + ' ' + this.user.personData['lastName'] : this.user['name'] + ' ' + this.user['lastName']
        this.dialog.open(SaleDialogComponent, {
          data: {
            name: name,
            number: newSale.correlative,
            email: this.user.email
          }
        })
        this.router.navigate(['/main/mispedidos']);
      })*/
    }



  }



  giveProductPrice(item, mayorista): number {
    if (!mayorista && item.product.promo) {
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

  getDiscount(coupon) {
    switch (coupon.redirectTo) {
      case 'Toda la compra':
        return coupon.type == 2 ? this.total * (coupon.discount / 100) : coupon.discount
        break;
      case 'Categoría/subcategoría':
        let ord = [...this.dbs.order].filter(orde => orde.product.idCategory == coupon.category).reduce((a, b) => a + b.price, 0)
        return coupon.type == 2 ? ord * (coupon.discount / 100) : ord > coupon.discount ? coupon.discount : ord
        break;
      case 'Marca':
        let des = [...this.dbs.order].filter(or => or.product.brand.name ? or.product.brand.name == coupon.brand : or.product.brand == coupon.brand)
          .reduce((a, b) => a + b.price, 0)
        return coupon.type == 2 ? des * (coupon.discount / 100) : des > coupon.discount ? coupon.discount : des
        break;
    }
  }

  clearCoupon() {
    this.couponForm.setValue('')
    this.discount.next('0.00')
    this.couponForm.enable()
    this.couponVerified = false
  }

  getDiscountCoupon() {
    let value = this.couponForm.value

    if (value) {
      this.couponForm.disable()
      let ind = this.couponList.findIndex(el => el.name == value)
      if (ind >= 0) {
        let coupon = this.couponList[ind]
        if (coupon.users.includes(this.dbs.uidUser)) {
          this.snackbar.open('Cupón ya utilizado', 'Aceptar');
          this.couponForm.enable()
        } else {
          let from = coupon.from ? this.total >= coupon.from : true
          if (from) {
            let today = new Date()
            let validDate = coupon.limitDate ? today.getTime() >= coupon.startDate.toMillis() && today.getTime() <= coupon.endDate.toMillis() : true
            if (validDate) {
              let disc = this.getDiscount(coupon)
              if (coupon.type == 1) {
                this.discount.next(disc.toFixed(2))
              } else {
                if (coupon.limit > 0) {
                  if (disc > coupon.limit) {
                    this.discount.next(coupon.limit.toFixed(2))

                  } else {
                    this.discount.next(disc.toFixed(2))
                  }
                } else {
                  this.discount.next(disc.toFixed(2))
                }
              }
              this.couponVerified = true
            } else {
              this.snackbar.open('Código expirado', 'Aceptar');
              this.couponForm.enable()
            }
          } else {
            this.snackbar.open('El código no se puede utilizar para este monto de compra', 'Aceptar');
            this.couponForm.enable()
          }
        }

      } else {
        this.snackbar.open('Código de descuento incorrecto', 'Aceptar');
        this.couponForm.enable()

      }


    }

  }

  showAdviser(staff): string | undefined {
    return staff ? staff['displayName'] : undefined;
  }

  /*Delivery*/

  change(id) {
    this.viewDelivery = id
    this.delivery = id
    if (id == 1) {
      this.dbs.delivery.next(this.selectedDelivery);
    } else {
      this.dbs.delivery.next(0);
    }
  }


  selectDelivery(option) {
    if (option) {
      this.selectedDelivery = option.delivery

      if (this.delivery == 1) {
        this.dbs.delivery.next(this.selectedDelivery);
      }
    } else {
      this.selectedDelivery = 0
      this.dbs.delivery.next(this.selectedDelivery);
    }

  }


  openMap(user, index, edit) {
    this.dialog.open(LocationDialogComponent, {
      data: {
        user: user,
        edit: edit,
        ind: index
      }
    })
  }

  selectStore(value) {
    this.selectedStore = value
  }

  selectLocal(value) {
    this.selectedLocation = value
  }

  /*Payments*/
  chooseType(type) {
    this.cardForm.get('type').setValue(type);
  }

  addNewPhoto(formControlName: string, image: File[]) {
    if (image.length === 0) return;
    let reader = new FileReader();
    this.photos.resizing$[formControlName].next(true);

    this.ng2ImgMax
      .resizeImage(image[0], 10000, 426)
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