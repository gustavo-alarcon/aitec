import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { BehaviorSubject, combineLatest, forkJoin, Observable } from 'rxjs';
import { map, startWith, take, takeLast, tap } from 'rxjs/operators';
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

  list$: Observable<any>;
  sum$: Observable<number>;
  discount$: Observable<number>;
  subtotal$: Observable<number>;
  igv$: Observable<number>;
  delivery$: Observable<number>;

  products: Array<any>;
  total: number = 0

  adviserForm: FormControl = new FormControl('')
  advisers$: Observable<any>;

  user: User

  /*delivery*/
  initDelivery$: Observable<any>
  formGroup: FormGroup;
  delivery: number = 1;
  selectedDelivery: number;
  latitud: number = -12.046301;
  longitud: number = -77.031027;

  center = { lat: -12.046301, lng: -77.031027 };
  zoom = 15;

  places: Array<any> = [];
  stores: any[] = []
  provincias: Array<any> = [];
  distritos: Array<any> = [];

  filteredDepartamento$: Observable<any>;
  filteredProvincia$: Observable<any>;
  filteredDistrito$: Observable<any>;

  provincias$: Observable<any>
  distritos$: Observable<any>

  chooseDelivery$: Observable<any>

  viewBol: boolean = true

  selectedLocation: any = 0
  selectedStore: any = 0

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

  payments: Array<any> = [
    { name: 'Pago contraentrega', value: 1 },
    { name: 'Tarjetas credito/debito', value: 2 },
    { name: 'Trasferencias BCP', value: 3, account: '215-020-221122456' },
    { name: 'Trasferencias interbank', value: 3, account: '215-020-221122456' },
    { name: 'Yape', value: 4, account: 'Número: 987784562' },
  ];

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
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.delivery$ = this.dbs.delivery$
    this.products = this.dbs.order;
    this.sum$ = combineLatest(this.dbs.orderObs$, this.dbs.delivery$).pipe(
      map(([ord, del]) => {
        if (ord.length) {
          let suma = [...ord]
            .map((el) => this.getPrice(el))
            .reduce((a, b) => a + b, 0);
          this.total = suma + del;
          return suma + del;
        } else {
          return 0 + del;
        }
      })
    );

    this.subtotal$ = this.dbs.orderObs$.pipe(
      map((ord) => {
        return [...ord]
          .map((el) => el.quantity * el.product.priceMin * 0.82)
          .reduce((a, b) => a + b, 0);
      })
    );

    this.igv$ = this.dbs.orderObs$.pipe(
      map((ord) => {
        return [...ord]
          .map((el) => el.quantity * el.product.priceMin * 0.18)
          .reduce((a, b) => a + b, 0);
      })
    );

    this.discount$ = this.dbs.orderObs$.pipe(
      map((ord) => {
        return [...ord]
          .map((el) => this.getDiscount(el))
          .reduce((a, b) => a + b, 0);
      })
    );

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

    /*Delivery*/
    this.initDelivery$ = combineLatest(
      this.dbs.getDelivery(),
      this.dbs.getStores()
    ).pipe(
      map(([del, stores]) => {
        this.stores = stores
        return del
      }),
      tap(res => {
        this.places = this.convertPlaces(res)
      })
    )

    this.formGroup = this.fb.group({
      departamento: [null],
      provincia: [null],
      distrito: [null],
      direccion: [null],
      referencia: [null],
      coordenadas: [this.center],
      store: [null]
    });

    this.formGroup.get('provincia').disable();
    this.formGroup.get('distrito').disable();
    this.filteredDepartamento$ = this.formGroup
      .get('departamento')
      .valueChanges.pipe(
        startWith(''),
        map((value) => {
          return this.places.filter((el) =>
            value ? el.departamento.toLowerCase().includes(value) : true
          );
        })
      );

    this.provincias$ = this.formGroup.get('departamento').valueChanges.pipe(
      startWith(''),
      map(dept => {


        if (typeof dept === 'object') {
          this.selectProvincias(dept)

        }
        return true
      })
    )

    this.distritos$ = this.formGroup.get('provincia').valueChanges.pipe(
      startWith(''),
      map(prov => {
        if (prov && typeof prov === 'object') {
          this.selectDistritos(prov)

        }
        return true
      })
    )
    this.filteredProvincia$ = this.formGroup.get('provincia').valueChanges.pipe(
      startWith(''),
      map((value) => {
        return this.provincias.filter((el) =>
          value ? el.provincia.toLowerCase().includes(value) : true
        );
      })
    );

    this.filteredDistrito$ = this.formGroup.get('distrito').valueChanges.pipe(
      startWith(''),
      map((value) => {
        console.log(this.distritos);

        return this.distritos.filter((el) =>
          value ? el.distrito.toLowerCase().includes(value) : true
        );
      })
    );

    /*this.chooseDelivery$ = this.deliveryForm.valueChanges.pipe(
      startWith(1),
      tap(res => {
        console.log(res);

        if (this.formGroup.get('distrito').value) {
          if (res == 1) {
            this.dbs.delivery.next(this.formGroup.get('distrito').value.delivery);
          } else {
            this.dbs.delivery.next(0);
          }
        }
      }))*/

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
      dni: [null],
      name: [null]
    });

    this.facturaForm = this.fb.group({
      ruc: [null],
      name: [null],
      address: [null],
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
    let location = this.user.location ? true : false;
    let delivery = this.delivery != 2
  }

  finish() {
    this.view.next(4);

    let info = {
      location: this.user.location[this.selectedLocation],
      store: this.stores[this.selectedStore]
    }

    let newSale = {
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
      deliveryPrice: this.formGroup.value['distrito']['delivery'],
      observation: this.observation.value,
      voucher: [],
      voucherChecked: false,
      adviser: this.adviserForm.value,
      coupon: null
    }


    console.log(newSale);
    /*
    let phot = this.photos.data.length ? this.photos : null
    this.dbs.reduceStock(user, newSale, phot).then(() => {
      this.view.next(1)
      this.dbs.order = []
      this.dbs.orderObs.next([])
      let name = user.personData ? user.personData.name + ' ' + user.personData['lastName'] : user['name'] + ' ' + user['lastName']
      this.dialog.open(SaleDialogComponent, {
        data: {
          name: name,
          number: newSale.correlative,
          email: user.email
        }
      })
      this.router.navigate(['/main/mispedidos']);
    })*/


  }

  getPrice(item) {
    if (item.product.promo) {
      return item.product.promoData.promoPrice * item.quantity;
    } else {
      return item.price * item.quantity;
    }
  }

  getDiscount(item) {
    let promoPrice = this.getPrice(item);
    let realPrice = item.quantity * item.price;
    return realPrice - promoPrice;
  }

  showAdviser(staff): string | undefined {
    return staff ? staff['displayName'] : undefined;
  }

  /*Delivery*/

  change(id) {
    this.viewBol = !this.viewBol
    this.delivery = id
    if (id == 2) {
      this.dbs.delivery.next(0);
    } else {
      this.dbs.delivery.next(this.selectedDelivery);
    }
  }

  showDepartamento(staff): string | undefined {
    return staff ? staff['departamento'] : undefined;
  }

  showProvincia(staff): string | undefined {
    return staff ? staff['provincia'] : undefined;
  }

  showDistrito(staff): string | undefined {
    return staff ? staff['distrito'] : undefined;
  }

  selectProvincias(option) {
    this.provincias = option.provincias;
    this.formGroup.get('provincia').enable();
  }

  selectDistritos(option) {
    this.distritos = option.distritos;
    this.formGroup.get('distrito').enable();
  }

  selectDelivery(option) {
    this.selectedDelivery = option.delivery
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
          //this.snackbar.open('Por favor, elija una imagen en formato JPG, o PNG', 'Aceptar');
        }
      );
  }

  eliminatedphoto(ind) {
    this.photosList.splice(ind, 1);
    this.photos.data.splice(ind, 1);
  }
}