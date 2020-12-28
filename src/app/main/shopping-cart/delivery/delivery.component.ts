import { Component, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { EventEmitter } from 'events';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { LocationDialogComponent } from '../location-dialog/location-dialog.component';

@Component({
  selector: 'app-delivery',
  templateUrl: './delivery.component.html',
  styleUrls: ['./delivery.component.scss'],
})
export class DeliveryComponent implements OnInit {

  @Input() resumen: any
  @Output() submittedForm = new EventEmitter();

  initDelivery$: Observable<any>
  formGroup: FormGroup;
  delivery: number = 1;
  deliveryForm: FormControl = new FormControl(this.delivery)
  latitud: number = -12.046301;
  longitud: number = -77.031027;

  center = { lat: -12.046301, lng: -77.031027 };
  zoom = 15;

  places: Array<any> = [];

  provincias: Array<any> = [];
  distritos: Array<any> = [];

  filteredDepartamento$: Observable<any>;
  filteredProvincia$: Observable<any>;
  filteredDistrito$: Observable<any>;

  provincias$: Observable<any>
  distritos$: Observable<any>

  chooseDelivery$: Observable<any>

  view = new BehaviorSubject<number>(1);
  view$ = this.view.asObservable();
  viewBol:boolean = true

  constructor(
    private fb: FormBuilder, 
    private dialog: MatDialog,
    public dbs: DatabaseService,
    public auth: AuthService
    ) { }

  ngOnInit(): void {
    console.log(this.resumen);
    
    this.initDelivery$ = this.dbs.getDelivery().pipe(
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
        return this.distritos.filter((el) =>
          value ? el.distrito.toLowerCase().includes(value) : true
        );
      })
    );

    this.chooseDelivery$ = this.deliveryForm.valueChanges.pipe(
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
      }))
  }

  change(){
    this.viewBol = !this.viewBol
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

  openMap(user, edit) {
    this.dialog.open(LocationDialogComponent, {
      data: {
        user: user,
        edit: edit
      }
    })
  }

  getPrice(item) {
    if (item.product.promo) {
      return item.product.promoData.promoPrice * item.quantity;
    } else {
      return item.product.priceMin * item.quantity;
    }
  }

  sendInfo(){
    this.submittedForm.emit(this.formGroup.value)
  }

}
