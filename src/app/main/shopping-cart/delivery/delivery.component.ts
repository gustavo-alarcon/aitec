import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-delivery',
  templateUrl: './delivery.component.html',
  styleUrls: ['./delivery.component.scss'],
})
export class DeliveryComponent implements OnInit {
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

  constructor(private fb: FormBuilder, private dbs: DatabaseService) {}

  ngOnInit(): void {
    let guardado = localStorage.getItem('aitec-delivery');
    this.formGroup = this.fb.group({
      departamento: [null],
      provincia: [null],
      distrito: [null],
      direccion: [null],
      referencia: [null],
      coordenadas: [null],
    });
    if (guardado) {
      let option = JSON.parse(guardado);
      this.delivery = option.option;
      this.formGroup.setValue(option.info);
    }

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
  }

  ngOnDestroy() {
    console.log('delivery');
    let option = {
      option: this.delivery,
      info: this.formGroup.value,
    };
    localStorage.setItem('aitec-delivery', JSON.stringify(option));
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
}
