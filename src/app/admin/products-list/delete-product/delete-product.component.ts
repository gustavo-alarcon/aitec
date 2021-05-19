import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, forkJoin, Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { Product } from 'src/app/core/models/product.model';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-delete-product',
  templateUrl: './delete-product.component.html',
  styleUrls: ['./delete-product.component.scss']
})
export class DeleteProductComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  warehouseList: Array<any> = []
  seriesList: Array<any> = []

  init$: Observable<any>

  constructor(
    private dialogref: MatDialogRef<DeleteProductComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Product,
    private af: AngularFirestore,
    private dbs: DatabaseService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    //console.log('here');
    
    //console.log(this.data);
    
    this.init$ = combineLatest(
      this.dbs.getWarehouseByProduct(this.data.id),
      this.dbs.getSeriesByProduct(this.data.id)
    ).pipe(
      map(([warehouses, series]) => {
        this.warehouseList = warehouses.map(el => el.id)
        this.seriesList = series
        // console.log(warehouses);
        // console.log(series);
        
        
      }),
      tap(() => {
        this.loading.next(false)
      })
    )

  }

  save() {
    this.loading.next(true)
    let ref = this.af.firestore.collection(`/db/aitec/productsList`).doc(this.data.id);

    const batch = this.af.firestore.batch();

    let phot$ = this.data.gallery.map(el => this.dbs.deletePhoto(el.photoPath))
    forkJoin(phot$).subscribe(res => {
     
      /*
      this.seriesList.forEach(ser => {
        const sref = this.af.firestore.collection(`/db/aitec/warehouse/${ser['idWarehouse']}/series`).doc(ser['id']);
        batch.delete(sref)
      })*/

      this.warehouseList.forEach(wh => {
        const whref = this.af.firestore.collection(`/db/aitec/warehouse`).doc(wh);
        batch.delete(whref)
      })
      
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
