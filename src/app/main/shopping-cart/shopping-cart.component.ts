import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, startWith, take, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';

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
  total:number = 0
  /*delivery*/
  formGroup: FormGroup;
  delivery: number = 1;
  latitud: number = -12.046301;
  longitud: number = -77.031027;

  center = { lat: -12.046301, lng: -77.031027 };
  zoom = 15;

  places: Array<any> = [
    {
      departamento: 'Arequipa',
      provincias: [
        {
          provincia: 'Arequipa',
          distritos: [
            { distrito: 'Paucarpata', delivery: 6 },
            { distrito: 'Cayma', delivery: 6 },
            { distrito: 'Cercado', delivery: 5 },
            { distrito: 'Yanahuara', delivery: 7 },
          ],
        },
        {
          provincia: 'Cámana',
          distritos: [
            { distrito: 'Ocoña', delivery: 15 },
            { distrito: 'Samuel Pastor', delivery: 16 },
          ],
        },
      ],
    },
    {
      departamento: 'Lima',
      provincias: [
        {
          provincia: 'Lima',
          distritos: [
            { distrito: 'Breña', delivery: 20 },
            { distrito: 'Comas', delivery: 26 },
            { distrito: 'PUENTE PIEDRA', delivery: 25 },
            { distrito: 'LOS OLIVOS', delivery: 27 },
            { distrito: 'SURQUILLO', delivery: 27 },
            { distrito: 'SAN JUAN DE LURIGANCHO', delivery: 27 },
          ],
        },
      ],
    },
  ];

  provincias: Array<any> = [];
  distritos: Array<any> = [];

  filteredDepartamento$: Observable<any>;
  filteredProvincia$: Observable<any>;
  filteredDistrito$: Observable<any>;

  /*Payments*/
  cardForm: FormGroup;
  documentForm: FormGroup;

  document: number = 1;
  method: {
    name: string;
    value: number;
    account?: string;
  } = { name: '', value: 0 };

  payments: Array<any> = [
    { name: 'Efectivo', value: 1 },
    { name: 'Tarjetas credito/debito', value: 2 },
    { name: 'Trasferencias', value: 3, account: 'BCP: 215-020-221122456' },
    { name: 'Yape', value: 4, account: 'Número: 987784562' },
  ];

  months: Array<number> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  years: Array<number> = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028];

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
    private dbs: DatabaseService,
    public auth: AuthService,
    private fb: FormBuilder,
    private ng2ImgMax: Ng2ImgMaxService
  ) {}

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
          .map((el) => el.quantity * el.product.price * 0.82)
          .reduce((a, b) => a + b, 0);
      })
    );

    this.igv$ = this.dbs.orderObs$.pipe(
      map((ord) => {
        return [...ord]
          .map((el) => el.quantity * el.product.price * 0.18)
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

    /*Delivery*/
    this.formGroup = this.fb.group({
      departamento: [null],
      provincia: [null],
      distrito: [null],
      direccion: [null],
      referencia: [null],
      coordenadas: [this.center],
      store:[null]
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
        return this.distritos.filter((el) =>
          value ? el.distrito.toLowerCase().includes(value) : true
        );
      })
    );

    /*Payments*/
    this.cardForm = this.fb.group({
      type: [null],
      numero: [null],
      month: [null],
      year: [null],
      cvv: [null],
      titular: [null],
    });
    this.documentForm = this.fb.group({
      document: [null],
      name: [null],
      address: [null],
    });
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
  finish() {
    this.view.next(4);
    let info= {
      departamento: this.formGroup.value['departamento']['departamento'],
      provincia: this.formGroup.value['provincia']['provincia'],
      distrito: this.formGroup.value['distrito']['distrito'],
      direccion: this.formGroup.value['direccion'],
      referencia: this.formGroup.value['referencia'],
      coordenadas: this.center,
      store:this.formGroup.value['store']
    }
    let newSale = {
      id: '',
      correlative: 0,
      correlativeType: 'R',
      document: this.document==1?'Boleta':'Factura',
      documentInfo:this.documentForm.value,
      payType: this.method,
      payInfo:this.cardForm.value,
      deliveryType: this.delivery==1?'Entrega en domicilio':'Recojo en tienda',
      deliveryInfo: info,
      requestDate: null,
      createdAt: new Date(),
      createdBy: null,
      user: null,
      requestedProducts: this.dbs.order,
      status: 'Solicitado',
      total: this.total,
      deliveryPrice: this.formGroup.value['distrito']['delivery'],
      voucher: [],
      voucherChecked: false
    }

    console.log(newSale);
    
  }

  getPrice(item) {
    if (item.product.promo) {
      return item.product.promoData.price * item.quantity;
    } else {
      return item.product.price * item.quantity;
    }
  }

  getDiscount(item) {
    let promoPrice = this.getPrice(item);
    let realPrice = item.quantity * item.product.price;
    return realPrice - promoPrice;
  }

  /*Delivery*/

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
    this.formGroup.get('provincia').enable();
    this.provincias = option.provincias;
  }

  selectDistritos(option) {
    this.formGroup.get('distrito').enable();
    this.distritos = option.distritos;
  }

  selectDelivery(option) {
    console.log(option);
    if (this.delivery == 1) {
      this.dbs.delivery.next(option.delivery);
    }
  }

  mapClicked(event: google.maps.MouseEvent) {
    this.center = event.latLng.toJSON();
  }

  findMe() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          this.center = {
            lat: posicion.coords.latitude,
            lng: posicion.coords.longitude,
          };
        },
        function (error) {
          alert('Tenemos un problema para encontrar tu ubicación');
        }
      );
    }
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
