import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Payments } from 'src/app/core/models/payments.model';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-payment-method-dialog',
  templateUrl: './payment-method-dialog.component.html',
  styleUrls: ['./payment-method-dialog.component.scss']
})
export class PaymentMethodDialogComponent implements OnInit {
  createForm: FormGroup

  loading = new BehaviorSubject<boolean>(false)
  loading$ = this.loading.asObservable()

  constructor(
    private fb: FormBuilder,
    private dbs: DatabaseService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { edit: boolean, data?: Payments },
    private dialogRef: MatDialogRef<PaymentMethodDialogComponent>,
    private afs: AngularFirestore
  ) { }

  ngOnInit(): void {
    this.createForm = this.fb.group({
      account: [this.data.edit ? this.data.data.account : null],
      name: [this.data.edit ? this.data.data.name : null, [Validators.required], [this.nameRepeatedValidator(this.data)]],
      voucher: [this.data.edit ? this.data.data.voucher : false]
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
    let payRef = this.afs.firestore.collection(`/db/aitec/config/generalConfig/payments`).doc();


    const batch = this.afs.firestore.batch();

    let newCoupon = {
      id: payRef.id,
      name: this.createForm.get('name').value,
      account: this.createForm.get('account').value,
      voucher: this.createForm.get('account').value ? true : false,
      createdAt: new Date()
    }

    batch.set(payRef, newCoupon);

    batch.commit().then(() => {
      this.dialogRef.close(true);
      this.loading.next(false);
      this.snackBar.open('Metodo de pago creado', 'Cerrar', {
        duration: 6000,
      });
    });
  }

  edit() {
    let payRef = this.afs.firestore.collection(`/db/aitec/config/generalConfig/payments`).doc(this.data.data.id);

    let batch = this.afs.firestore.batch();

    let newCoupon = {
      id:this.data.data.id,
      name: this.createForm.get('name').value,
      account: this.createForm.get('account').value,
      voucher: this.createForm.get('account').value ? true : false,
      createdAt: new Date()
    }

    let change = JSON.stringify(newCoupon) === JSON.stringify(this.data.data)

    if (!change){
      batch.update(payRef, newCoupon);

      batch.commit().then(() => {
        this.dialogRef.close(true);
        this.loading.next(false);
        this.snackBar.open('Cambios Guardados', 'Cerrar', {
          duration: 6000,
        });
      });
    }else{
      this.dialogRef.close(true);
    }
    
  }

  nameRepeatedValidator(data) {
    return (control: AbstractControl): Observable<{ 'nameRepeatedValidator': boolean }> => {
      const value = control.value.toUpperCase();
      if (data.edit) {
        if (data.data.name.toUpperCase() == value) {
          return of(null)
        }
        else {
          return this.dbs.getPaymentsDoc().pipe(
            map(res => !!res.find(el => el.name.toUpperCase() == value) ? { nameRepeatedValidator: true } : null))
        }
      }
      else {
        return this.dbs.getPaymentsDoc().pipe(
          map(res => !!res.find(el => el.name.toUpperCase() == value) ? { nameRepeatedValidator: true } : null))
      }
    }
  }
}
