import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';

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
  ) { }

  ngOnInit() {
    console.log(this.data);
    
    this.createForm = this.fb.group({
      lastname:[this.data.edit ? this.data.data.lastname : null, Validators.required],
      name: [this.data.edit ? this.data.data.name : null, Validators.required],
      email:[this.data.edit ? this.data.data.email : null, [Validators.required,Validators.email]]
    })


  }

  onSubmitForm() {
    console.log(this.createForm.value);
    
    this.createForm.markAsPending();
    this.createForm.disable()
    this.loading.next(true)

    let newDoc;
    newDoc = {
      id: '',
      name: this.createForm.get('name').value,
      lastname:this.createForm.get('lastname').value,
      email:this.createForm.get('email').value,
      createdAt: new Date()
    }
    
    if(this.data.edit){
      this.edit(newDoc)
    }else{
      this.create(newDoc)
    }
    
  }

  create(newCategory) {
    let productRef = this.afs.firestore
      .collection(`/db/aitec/config/generalConfig/adviser`)
      .doc();

    let batch = this.afs.firestore.batch();

    newCategory.id = productRef.id;

    batch.set(productRef, newCategory);

    batch.commit().then(() => {
      this.dialogRef.close(true);
      this.loading.next(false);
      this.snackBar.open('Asesor creado', 'Cerrar', {
        duration: 6000,
      });
    });
  }

  edit(newCategory) {
    let productRef = this.afs.firestore
      .collection(`/db/aitec/config/generalConfig/adviser`)
      .doc(this.data.data.id);

    let batch = this.afs.firestore.batch();

    batch.update(productRef, newCategory);

    batch.commit().then(() => {
      this.dialogRef.close(true);
      this.loading.next(false);
      this.snackBar.open('Cambios Guardados', 'Cerrar', {
        duration: 6000,
      });
    });
  }

}
