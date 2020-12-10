import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { PlacesService } from 'src/app/core/services/places.service';
@Component({
  selector: 'app-store-dialog',
  templateUrl: './store-dialog.component.html',
  styleUrls: ['./store-dialog.component.scss']
})
export class StoreDialogComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  formGroup: FormGroup;

  departamentos: Array<any> = [];
  provincias: Array<any> = [];
  distritos: Array<any> = [];

  filteredDepartamento$: Observable<any> = of([])
  filteredProvincia$: Observable<any> = of([])
  filteredDistrito$: Observable<any> = of([])

  init$: Observable<any>;
  provincias$: Observable<any>;
  distritos$: Observable<any>;

  deliveryDistritos: Array<any> = [];

  constructor(
    private fb: FormBuilder,
    private pl: PlacesService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA)
    public data: { edit: boolean; data?: any },
    private dialogRef: MatDialogRef<StoreDialogComponent>,
    private afs: AngularFirestore
  ) { }

  ngOnInit(): void {
    this.departamentos = this.pl.getDepartamentos()
    this.formGroup = this.fb.group({
      departamento: [this.data.edit ? this.data.data.departamento : null, Validators.required],
      provincia: [this.data.edit ? this.data.data.provincia : null, Validators.required],
      distrito: [null],
      address: [this.data.edit ? this.data.data.address : null, Validators.required],
    });

    this.formGroup.get('provincia').disable();
    this.formGroup.get('distrito').disable();

    this.filteredDepartamento$ = this.formGroup
      .get('departamento')
      .valueChanges.pipe(
        startWith(''),
        map((value) => {
          let val = typeof value == 'object' ? value['name'] : value
          return this.departamentos.filter((el) =>
            value ? el.name.toLowerCase().includes(val.toLowerCase()) : true
          );
        })
      );

    this.provincias$ = this.formGroup.get('departamento').valueChanges.pipe(
      startWith(''),
      map(dept => {
        if (!this.data.edit) {
          /*
          if (this.formGroup.get('provincia').value) {
            this.formGroup.get('provincia').setValue('')
            this.formGroup.get('distrito').disable()
          }*/

          if (typeof dept === 'object') {
            this.selectProvincias(dept)
          }
        }
        return true
      })
    )

    this.distritos$ = this.formGroup.get('provincia').valueChanges.pipe(
      startWith(''),
      map(prov => {
        if (!this.data.edit) {
          if (prov && typeof prov === 'object') {
            this.selectDistritos(prov)

          }
        } else {
          this.selectDistritos(this.data.data.provincia)
        }
        return true
      })
    )
    this.filteredProvincia$ = this.formGroup.get('provincia').valueChanges.pipe(
      startWith(''),
      map((value) => {
        let val = ''
        if (value) {
          val = typeof value == 'object' ? value['name'] : value
        }
        return this.provincias.filter((el) =>
          val ? el.name.toLowerCase().includes(val.toLowerCase()) : true
        );
      })
    );

    this.filteredDistrito$ = this.formGroup.get('distrito').valueChanges.pipe(
      startWith(''),
      map((value) => {
        let val = ''
        if (value) {
          val = typeof value == 'object' ? value['name'] : value
        }
        return this.distritos.filter((el) =>
          value ? el.name.toLowerCase().includes(val.toLowerCase()) : true
        );
      })
    );


  }

  showDepartamento(staff): string | undefined {
    return staff ? staff['name'] : undefined;
  }
  showProvincia(staff): string | undefined {
    return staff ? staff['name'] : undefined;
  }
  showDistrito(staff): string | undefined {
    return staff ? staff['name'] : undefined;
  }

  selectProvincias(option) {
    this.provincias = this.pl.getProvincias(option.id);
    this.formGroup.get('provincia').enable();

  }

  selectDistritos(option) {
    this.distritos = this.pl.getDistritos(option.id);
    this.formGroup.get('distrito').enable();

  }

  onSubmitForm() {
    this.formGroup.markAsPending();
    this.formGroup.disable()
    this.loading.next(true)
    let newDelivery = {
      id: this.data.edit ? this.data.data.id : '',
      departamento: this.formGroup.get('departamento').value,
      provincia: this.formGroup.get('provincia').value,
      distrito: this.formGroup.get('distrito').value,
      address: this.formGroup.get('address').value,
      createdAt: this.data.edit ? this.data.data.createdAt : new Date()
    }

    if (this.data.edit) {
      this.edit(newDelivery)
    } else {
      this.create(newDelivery)
    }

  }

  create(newCategory) {
    let productRef = this.afs.firestore
      .collection(`/db/aitec/config/generalConfig/stores`)
      .doc();

    let batch = this.afs.firestore.batch();

    newCategory.id = productRef.id;

    batch.set(productRef, newCategory);

    batch.commit().then(() => {
      this.dialogRef.close(true);
      this.loading.next(false);
      this.snackBar.open('Tienda creada', 'Cerrar', {
        duration: 6000,
      });
    });
  }

  edit(newCategory) {
    let productRef = this.afs.firestore
      .collection(`/db/aitec/config/generalConfig/stores`)
      .doc(newCategory.id);

    let batch = this.afs.firestore.batch();

    batch.update(productRef, newCategory);

    batch.commit().then(() => {
      this.dialogRef.close(true);
      this.loading.next(false);
      this.snackBar.open('Cambios guardados', 'Cerrar', {
        duration: 6000,
      });
    });
  }
}
