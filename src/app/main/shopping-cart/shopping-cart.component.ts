import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, startWith, take, tap } from 'rxjs/operators';
import { Sale } from 'src/app/core/models/sale.model';
import { User } from 'src/app/core/models/user.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { LocationDialogComponent } from './location-dialog/location-dialog.component';
import { SaleDialogComponent } from './sale-dialog/sale-dialog.component';


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

  products: Array<any>;
  total: number = 0

  adviserForm: FormControl = new FormControl('')
  advisers$: Observable<any>;

  initCoupon$: Observable<any>
  couponList: Array<any> = []
  couponForm: FormControl = new FormControl('')

  user: User

  /*delivery*/
  initDelivery$: Observable<any>
  formGroup: FormGroup;
  delivery: number = 1;
  selectedDelivery: number;
  idDelivery = new BehaviorSubject<number>(1);
  idDelivery$ = this.idDelivery.asObservable();

  places: Array<any> = [];
  provincias: Array<any> = [];
  distritos: Array<any> = [];

  stores: any[] = []
  locations: any[] = []

  filteredDepartamento$: Observable<any>;
  filteredProvincia$: Observable<any>;
  filteredDistrito$: Observable<any>;

  provincias$: Observable<any>
  distritos$: Observable<any>

  chooseDelivery$: Observable<any>

  viewBol: boolean = true

  selectedLocation: any
  selectedStore: number = 0

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

  months: Array<number> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  years: Array<number> = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028];

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
    private snackbar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.delivery$ = this.dbs.delivery$.pipe(
      tap(del => {
        this.deliveryNumber = del
      })
    )
    this.products = this.dbs.order;
    this.sum$ = combineLatest(
      this.dbs.orderObs$,
      this.dbs.delivery$
    ).pipe(
      map(([ord, del]) => {
        if (ord.length) {
          let suma = [...ord]
            .map((el) => this.giveProductPrice(el))
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
      this.dbs.getDelivery(),
      this.dbs.getStores(),
      this.dbs.getPaymentsChanges()
    ).pipe(
      map(([del, stores, payments]) => {
        this.stores = stores
        this.payments = payments.map(pay => {
          return {
            name: pay['name'],
            account: pay['account'],
            value: pay['voucher'] ? 3 : pay['name'].includes('arjeta') ? 2 : 1
          }
        })
        return del
      }),
      tap(res => {
        this.places = this.convertPlaces(res)
      })
    )

    this.formGroup = this.fb.group({
      departamento: [null],
      provincia: [null],
      distrito: [null]
    });

    this.formGroup.get('provincia').disable();
    this.formGroup.get('distrito').disable();

    this.chooseDelivery$ = combineLatest(
      this.idDelivery$,
      this.dbs.delivery$,
      this.formGroup.get('distrito').valueChanges.pipe(
        startWith('')
      )
    ).pipe(
      map(([id, del, dis]) => {

        if (dis) {
          if (dis.distrito) {
            this.locations = [...this.user.location].filter(loc => {
              //let ubigeo = this.formGroup.value
              return loc.distrito == dis.distrito
            })
          }
        }
        if (id == 1) {
          return del == 0 || this.locations.length == 0
        } else {
          return !dis
        }
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

    this.initPayment$ = this.auth.user$.pipe(
      map(user => {
        this.user = user
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
  }
  thirdView() {
    this.view.next(3);
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
    let meth = true;
    if (this.method.value == 3) {
      meth = this.photosList.length > 0
    }

    if (!meth) {
      this.snackbar.open('Por favor, agregué el voucher de pago', 'Aceptar');
    }
    return doc && meth
  }

  finish() {
    if (this.validatedFinishButton()) {
      this.view.next(4);

      let info = {
        location: this.user.location[this.selectedLocation],
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
        requestDate: null,
        createdAt: new Date(),
        createdBy: null,
        user: this.user,
        requestedProducts: this.dbs.order,
        status: 'Solicitado',
        total: this.total,
        deliveryPrice: this.delivery == 1 ? this.selectedDelivery : 0,
        observation: this.observation.value,
        voucher: [],
        voucherChecked: false,
        adviser: this.adviserForm.value,
        coupon: null
      }


      console.log(newSale);

      let phot = this.photos.data.length ? this.photos : null
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



  giveProductPrice(item): number {
    if (item.product.promo) {
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

  getDiscount(item) {
    return 0;
  }

  getDiscountCoupon() {
    let value = this.couponForm.value
    if (value) {
      this.couponForm.disable()
      let ind = this.couponList.findIndex(el => el.name == value)
      if (ind >= 0) {
        let coupon = this.couponList[ind]
        let today = new Date()
        let validDate = today.getTime() >= coupon.startDate.toMillis() && today.getTime() <= coupon.endDate.toMillis()
        if (validDate) {
          if (coupon.type == 1) {
            this.discount.next(coupon.discount.toFixed(2))
          } else {
            let disc = this.total * (coupon.discount / 100)
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
        } else {
          this.snackbar.open('Código expirado', 'Aceptar');
        }
        this.couponForm.setValue('')
      } else {
        this.snackbar.open('Código de descuento incorrecto', 'Aceptar');

      }

      this.couponForm.enable()
    }

  }

  showAdviser(staff): string | undefined {
    return staff ? staff['displayName'] : undefined;
  }

  /*Delivery*/

  change(id) {
    this.viewBol = !this.viewBol
    this.delivery = id
    this.idDelivery.next(id)
    if (id == 2) {
      this.dbs.delivery.next(0);
    } else {
      this.dbs.delivery.next(this.selectedDelivery);
    }
  }

  selectProvincias(option) {
    this.provincias = option.provincias;
    this.formGroup.get('provincia').setValue(null);
    this.formGroup.get('provincia').enable();
    this.formGroup.get('distrito').setValue(null);
    this.formGroup.get('distrito').disable();
    this.selectedDelivery = 0
    this.dbs.delivery.next(0);
  }

  selectDistritos(option) {
    this.distritos = option.distritos;
    this.formGroup.get('distrito').setValue(null);
    this.formGroup.get('distrito').enable();
    this.selectedDelivery = 0
    this.dbs.delivery.next(0);

  }

  selectDelivery(option) {
    this.selectedDelivery = option.delivery
    if (this.user.location) {
      this.selectedLocation = 0
    }
    if (this.delivery == 1) {
      this.dbs.delivery.next(this.selectedDelivery);
    }


  }

  convertPlaces(array: Array<any>) {

    let convert = array.map(el => {
      el.distritos = el.distritos.map(dis => {
        return {
          distrito: dis.name,
          province_id: dis.province_id,
          delivery: el.delivery
        }
      })
      return el
    })

    return convert.map((lo, ind, arr) => {
      return {
        departamento: lo.departamento.name,
        provincias: arr.filter(li => li.provincia.department_id == lo.departamento.id).map((lu, i, dist) => {
          return {
            provincia: lu.provincia.name,
            distritos: dist.map(d => {
              return d.distritos
            }).reduce((a, b) => a.concat(b), []).filter(la => la.province_id == lu.provincia.id)
          }
        }).filter((item, index, data) => {
          return data.findIndex(i => i.provincia === item.provincia) === index;
        })
      }
    }).filter((item, index, data) => {
      return data.findIndex(i => i.departamento === item.departamento) === index;
    })
  }

  openMap(user, index, edit) {
    this.dialog.open(LocationDialogComponent, {
      data: {
        user: user,
        edit: edit,
        ind: index,
        departamento: this.formGroup.value['departamento']['departamento'],
        provincia: this.formGroup.value['provincia']['provincia'],
        distrito: this.formGroup.value['distrito']['distrito']
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