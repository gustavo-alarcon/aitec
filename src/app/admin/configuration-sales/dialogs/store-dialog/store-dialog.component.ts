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

  init$: Observable<any>;

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
      departamento: [null, Validators.required],
      provincia: [null, Validators.required],
      distrito: [null, Validators.required],
      address: [this.data.edit ? this.data.data.address : null, Validators.required],
      schedule: [this.data.edit ? this.data.data.schedule : null, Validators.required]
    });

    this.formGroup.get('provincia').disable();
    this.formGroup.get('distrito').disable();

    if (this.data.edit) {
      this.formGroup.get('departamento').setValue(this.data.data.departamento.id)
      this.selectProvincias(this.data.data.departamento)
      this.formGroup.get('provincia').setValue(this.data.data.provincia.id)
      this.selectDistritos(this.data.data.provincia)
      this.formGroup.get('distrito').setValue(this.data.data.distrito.id)
    }

  }


  selectProvincias(option) {
    this.provincias = this.pl.getProvincias(option.id);
    this.formGroup.get('provincia').setValue(null);
    this.formGroup.get('provincia').enable();
    this.formGroup.get('distrito').setValue(null);
    this.formGroup.get('distrito').disable();
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
      departamento: this.departamentos.find(dep => dep.id == this.formGroup.get('departamento').value),
      provincia: this.provincias.find(prov => prov.id == this.formGroup.get('provincia').value),
      distrito: this.distritos.find(dis => dis.id == this.formGroup.get('distrito').value),
      address: this.formGroup.get('address').value,
      schedule: this.formGroup.get('schedule').value,
      createdAt: this.data.edit ? this.data.data.createdAt : new Date()
    }
    if (this.data.edit) {
      this.edit(newDelivery)
    } else {
      this.create(newDelivery)
    }

  }

  create(newStore) {
    let productRef = this.afs.firestore
      .collection(`/db/aitec/config/generalConfig/stores`)
      .doc();

    let batch = this.afs.firestore.batch();

    newStore.id = productRef.id;

    batch.set(productRef, newStore);

    batch.commit().then(() => {
      this.dialogRef.close(true);
      this.loading.next(false);
      this.snackBar.open('Tienda creada', 'Cerrar', {
        duration: 6000,
      });
    });
  }

  edit(newStore) {
    let productRef = this.afs.firestore
      .collection(`/db/aitec/config/generalConfig/stores`)
      .doc(newStore.id);

    let batch = this.afs.firestore.batch();
    let change = JSON.stringify(newStore) === JSON.stringify(this.data.data)
    if (!change) {
      batch.update(productRef, newStore);

      batch.commit().then(() => {
        this.dialogRef.close(true);
        this.loading.next(false);
        this.snackBar.open('Cambios guardados', 'Cerrar', {
          duration: 6000,
        });
      });
    } else {
      this.dialogRef.close(true);
      this.loading.next(false);
    }
  }
}
