import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-asesores-dialog',
  templateUrl: './asesores-dialog.component.html',
  styleUrls: ['./asesores-dialog.component.scss']
})
export class AsesoresDialogComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false)
  loading$ = this.loading.asObservable()

  createForm: FormGroup

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { edit: boolean, data?: any },
    private dialogRef: MatDialogRef<AsesoresDialogComponent>,
    private afs: AngularFirestore,
    private dbs: DatabaseService
  ) { }

  ngOnInit() {
    console.log(this.data);

    this.createForm = this.fb.group({
      lastname: [this.data.edit ? this.data.data.lastname : null, Validators.required],
      name: [this.data.edit ? this.data.data.name : null, Validators.required],
      phone: [this.data.edit ? this.data.data.phone : null, Validators.required],
      email: [this.data.edit ? this.data.data.email : null, [Validators.required, Validators.email]],
      code: [this.data.edit ? this.data.data.code : null, [Validators.required], [this.nameRepeatedValidator(this.data)]]
    })


  }

  onSubmitForm() {
    this.createForm.markAsPending();
    this.createForm.disable()
    this.loading.next(true)

    if (this.data.edit) {
      this.edit()
    } else {
      this.create()
    }

  }

  create() {
    let productRef = this.afs.firestore
      .collection(`/db/aitec/config/generalConfig/adviser`)
      .doc();

    let batch = this.afs.firestore.batch();

    let newDoc = {
      id: productRef.id,
      name: this.createForm.get('name').value,
      lastname: this.createForm.get('lastname').value,
      email: this.createForm.get('email').value,
      code: this.createForm.get('code').value,
      phone: this.createForm.get('phone').value,
      createdAt: new Date(),
      displayName: this.createForm.get('name').value + ' ' + this.createForm.get('lastname').value
    }

    batch.set(productRef, newDoc);

    batch.commit().then(() => {
      this.dialogRef.close(true);
      this.loading.next(false);
      this.snackBar.open('Asesor creado', 'Cerrar', {
        duration: 6000,
      });
    });
  }

  edit() {
    let productRef = this.afs.firestore
      .collection(`/db/aitec/config/generalConfig/adviser`)
      .doc(this.data.data.id);

    let newDoc = {
      name: this.createForm.get('name').value,
      lastname: this.createForm.get('lastname').value,
      email: this.createForm.get('email').value,
      code: this.createForm.get('code').value,
      phone: this.createForm.get('phone').value,
      displayName: this.createForm.get('name').value + ' ' + this.createForm.get('lastname').value
    }

    let batch = this.afs.firestore.batch();

    batch.update(productRef, newDoc);

    batch.commit().then(() => {
      this.dialogRef.close(true);
      this.loading.next(false);
      this.snackBar.open('Cambios Guardados', 'Cerrar', {
        duration: 6000,
      });
    });
  }

  nameRepeatedValidator(data) {
    return (control: AbstractControl): Observable<{ 'nameRepeatedValidator': boolean }> => {
      const value = control.value.toUpperCase();
      if (data.edit) {
        if (data.data.code.toUpperCase() == value) {
          return of(null)
        }
        else {
          return this.dbs.getAdvisersDoc().pipe(
            map(res => !!res.find(el => el.code.toUpperCase() == value) ? { nameRepeatedValidator: true } : null))
        }
      }
      else {
        return this.dbs.getAdvisersDoc().pipe(
          map(res => !!res.find(el => el.code.toUpperCase() == value) ? { nameRepeatedValidator: true } : null))
      }
    }
  }
}
