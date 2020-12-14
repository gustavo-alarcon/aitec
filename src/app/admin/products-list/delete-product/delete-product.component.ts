import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { Product } from 'src/app/core/models/product.model';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-delete-product',
  templateUrl: './delete-product.component.html',
  styleUrls: ['./delete-product.component.scss']
})
export class DeleteProductComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  constructor(
    private dialogref: MatDialogRef<DeleteProductComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Product,
    private af: AngularFirestore,
    private dbs: DatabaseService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {

  }

  save() {
    this.loading.next(true)
    let ref = this.af.firestore.collection(`/db/aitec/productsList`).doc(this.data.id);

    const batch = this.af.firestore.batch();

    let phot$ = this.data.gallery.map(el => this.dbs.deletePhoto(el.photoPath))
    forkJoin(phot$).subscribe(res => {
      batch.delete(ref)

      batch.commit().then(() => {
        this.dialogref.close(true);
        this.loading.next(false)
        this.snackBar.open('El producto ha sido eliminado', "Cerrar", {
          duration: 4000
        })
      })
    })

  }
}
