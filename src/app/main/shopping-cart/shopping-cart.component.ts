import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { BehaviorSubject, combineLatest, empty, Observable, of } from 'rxjs';
import { finalize, map, shareReplay, startWith, switchMap, take, takeUntil, takeWhile, tap } from 'rxjs/operators';
import { Sale, SaleRequestedProducts, saleStatusOptions } from 'src/app/core/models/sale.model';
import { User } from 'src/app/core/models/user.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { LocationDialogComponent } from './location-dialog/location-dialog.component';
import { SaleDialogComponent } from './sale-dialog/sale-dialog.component';
import { LandingService } from 'src/app/core/services/landing.service';
import { ShoppingCarService } from 'src/app/core/services/shopping-car.service';
import { Product } from 'src/app/core/models/product.model';
import { Stores } from 'src/app/core/models/stores.model';
import { AngularFirestore } from '@angular/fire/firestore';
import { Coupon } from 'src/app/core/models/coupon.model';


@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.scss'],
})
export class ShoppingCartComponent implements OnInit {
  view = new BehaviorSubject<number>(1);
  view$ = this.view.asObservable();

  discount = new BehaviorSubject<number>(0);
  discount$ = this.discount.asObservable();

  list$: Observable<any>;
  subtotal$: Observable<string>;
  igv$: Observable<string>;
  totalAll$: Observable<string>;

  uploadingSale$: BehaviorSubject<boolean> | Observable<Sale> = null;

  total: number = 0

  adviserForm: FormControl = new FormControl('')
  advisers$: Observable<any>;

  initCoupon$: Observable<any>
  couponList: Array<any> = []
  couponVerified: boolean = false

  user: User

  /*delivery*/
  initDelivery$: Observable<any>
  delivery: number = 1;
  selectedDelivery: number = 0;
  zones: Array<any> = [];

  //deliveryForm: FormControl = new FormControl(null)

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

  //NEW
  deliveryForm: FormGroup     //Subtype deliveryType designates 0 (delivery) or 1 (pickup)
  couponForm: FormGroup

  reqProdListObservable$: Observable<SaleRequestedProducts[]>
  delivery$: Observable<number>;
  sum$: Observable<number>;


  deliveryList$: Observable<Product["zones"] | Stores>;
  locationList$: Observable<User["location"]>;

  constructor(
    private dbs: DatabaseService,
    public auth: AuthService,
    private fb: FormBuilder,
    private ng2ImgMax: Ng2ImgMaxService,
    private router: Router,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private ld: LandingService,
    public shopCar: ShoppingCarService,
    public afs: AngularFirestore
  ) { }

  ngOnInit(): void {
    this.deliveryForm = this.fb.group({
      deliveryPickUp: new FormControl(false), //Designates type 0 (delivery) or 1 (pickup)
      delivery: new FormControl(null, Validators.required),
      observation: new FormControl(''),
      location: new FormControl(null, Validators.required)    //Personal location of user. Only used when pickUp 0 and valid delivery
    })

    this.couponForm = this.fb.group({
      coupon: new FormControl('', {
        updateOn: 'submit', asyncValidators:[this.couponValidator(this.dbs)], validators: [Validators.required]}),
      couponData: new FormControl(null)
    })
    
    this.couponForm.valueChanges.pipe(tap(console.log)).subscribe()
    this.couponForm.statusChanges.pipe(tap(console.log)).subscribe()

    this.reqProdListObservable$ = this.shopCar.reqProdListObservable

    //List of zones or stores in delivery
    this.deliveryList$ = this.deliveryForm.get("deliveryPickUp").valueChanges.pipe(
      startWith(this.deliveryForm.get("deliveryPickUp").value),
      switchMap(pickUp => {

        this.deliveryForm.get("delivery").setValue(null)
        this.deliveryForm.get("delivery").markAsUntouched()

        if(!pickUp){
          //If not pickup, we return requested Products (shop car) and then get products DB
          //to get available zones
          return this.reqProdListObservable$.pipe(
            switchMap(reqProdList => {
              //If we have single product, we return complete list
              if(reqProdList){
                if(reqProdList.length == 1){
                  if(reqProdList[0].quantity == 1){
                  return this.shopCar.getProductDbObservable(reqProdList[0].product.id).pipe(
                    take(1),
                    map(prodDB => {
                      if(prodDB.zones){
                        this.deliveryForm.get("delivery").enable()
                        
                        let other: Product["zones"][0] = {
                          name: "Coordinar el delivery con la tienda",
                          delivery: 0
                        }

                        return [other, ...prodDB.zones]
                      } else {
                        this.deliveryForm.get("delivery").disable()
                        return []
                      }
                      
                    })
                  )}
                }
              }
              this.deliveryForm.get("delivery").disable()
              return of([])
            })
          )
        } else {
          //If pickup, we return available stores
          this.deliveryForm.get("delivery").enable()
          return this.dbs.getStores()
        }
      }),
      shareReplay(1),
    )

    //Refers to delivery price
    this.delivery$ = this.deliveryForm.get("delivery").statusChanges.pipe(
      startWith(this.deliveryForm.get("delivery").status),
      switchMap(status => {
        this.deliveryForm.get("location").setValue(null)
        this.deliveryForm.get("location").disable()
        if(status == "VALID"){
          //IF it is valid, it could be a product zone or a store (in this case, 0)
          return this.deliveryForm.get("delivery").valueChanges.pipe(
            startWith(this.deliveryForm.get("delivery").value),
            map((res: Product["zones"][0]) => {
              if(res){
                //In the case we select a valid location and delivery is not 0
                if(!!res.delivery){
                  this.deliveryForm.get("location").enable()
                  return res.delivery
                }
              }
              return 0
            })
          )
        } else {
          return of(0)
        }
      }),
      shareReplay(1)
    )

    //User old locations
    this.locationList$ = this.auth.user$.pipe(
      map(user => {
        if(user){
          if(user.location){
            return user.location
          }
        }
        return []
      })
    )
    

    this.sum$ = combineLatest([
      this.auth.user$,
      this.reqProdListObservable$,
      this.delivery$
    ]).pipe(
      map(([user, ord, delivery]) => {
        if (ord.length) {
          let sum = [...ord]
            .map((el) => this.giveProductPrice(el, user.customerType))
            .reduce((a, b) => a + b, 0);
          return sum + delivery;
        } else {
          return 0;
        }
      })
    );

    //Refers to delivery price. Here we validate coupon and apply disccount
    this.discount$ = combineLatest([<Observable<Coupon>>this.couponForm.get('couponData').valueChanges,
                                    this.reqProdListObservable$])
      .pipe(
        switchMap(([coup, reqProdList]) => {
          //We first get matching elements from reqProdList (where coupon could be applied)
          let matched: SaleRequestedProducts[] = []
          if(coup){
            //Matching brand
            if(coup.brand){
              matched = reqProdList.filter(reqProd => reqProd.product.brand.name == coup.brand)
              return of([coup, matched])
            }
            //Matching category
            if(coup.category){
              //We get all matching categories
              return this.dbs.getCategoryListFromCoupon(coup).pipe(map(catList => {
                matched = reqProdList.filter(reqProd => 
                          !!catList.find(cat => cat.id == reqProd.product.idCategory))
                return ([coup, matched])
              }))
            }
            //Matching all
            return ([coup, reqProdList])
          } else {
            return of([])
          }
        }),
        switchMap((res: [Coupon, SaleRequestedProducts[]])=> {
          if(res.length){
            let coup = res[0]
            let reqProdList = res[1]
            return this.auth.user$.pipe(map(user => {
              let sum = [...reqProdList]
                .map((el) => this.giveProductPrice(el, user.customerType))
                .reduce((a, b) => a + b, 0);
              //We finally calculate discount:
              if(sum > coup.from){
                switch(coup.type){
                  //Money case
                  case 1:
                    return coup.discount
                  //Percentage case
                  case 2:
                    //Calculate discount
                    let disc = Math.round(sum * coup.discount)/100.0
                    //If it exceeds limit, we return limit, if not, disc
                    return disc > coup.limit ? coup.limit : disc
                }
              } else {
                return 0
              }
            }))
          } else {
            return of(0)
          }
        }),
        startWith(0),
        shareReplay(1)
    )

    this.totalAll$ = combineLatest([
      this.sum$,
      this.discount$
    ]).pipe(
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
      [this.adviserForm.valueChanges.pipe(
        startWith(''),
      ),
      this.dbs.getAdvisers()]
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
    this.initDelivery$ = combineLatest([
      this.dbs.getStores(),
      this.ld.getConfig()
    ]).pipe(
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

  finish(reqProdList: SaleRequestedProducts[]) {
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
        requestedProducts: reqProdList,
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
    this.couponForm.get('coupon').setValue('')
    this.couponForm.get('couponData').setValue(null)
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


  openMap(user: User, index: number, edit: boolean) {
    this.dialog.open(LocationDialogComponent, {
      data: {
        user: user,
        edit: edit,
        ind: index
      }
    })
  }

  selectStore(value) {
    console.log(this.stores[value])
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

  //Async Validators
  couponValidator(dbs: DatabaseService) {
    return (ctrl: AbstractControl): Observable<ValidationErrors|null> => {
      let coupon = <string>ctrl.value
      ctrl.parent.get('couponData').setValue(null)
      return this.dbs.getCoupon(coupon).pipe(
        switchMap(couponDB => {
          console.log(couponDB)
          //There exists no coupon
          if(!couponDB){
            this.snackbar.open('Cupón inválido.')
            return of({noCoupon: true})
          } else {
            //If coupon exist, we continue with validations.
            //Date validation
            if(couponDB.limitDate){
              let startDate = new Date(1970)
              let endDate = new Date(1970)
              let actualDate = new Date()

              startDate.setSeconds(<number>couponDB.startDate["seconds"])
              endDate.setSeconds(<number>couponDB.endDate["seconds"] + 86340) //Fix to include endDate
              if(actualDate < startDate || actualDate > endDate){
                this.snackbar.open('Cupón expirado.')
                return of({expiredCoupon: true})
              } 
            } 
            //User validation
            return this.auth.user$.pipe(
              take(1),
              map(user => {
                if(!!couponDB.users.find(uid => user.uid == uid)){
                  this.snackbar.open('Cupón agotado.')
                  return {usedCoupon: true}
                } else {
                  ctrl.parent.get('couponData').setValue(couponDB)
                  return null
                }
              })
            )
          }
        })
      )
    }
  }
}