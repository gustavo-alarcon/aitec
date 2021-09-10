import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Category } from 'src/app/core/models/category.model';
import { map, startWith, switchMap, tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { Product } from 'src/app/core/models/product.model';
@Component({
  selector: 'app-delete-category',
  templateUrl: './delete-category.component.html',
  styleUrls: ['./delete-category.component.scss']
})
export class DeleteCategoryComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  listProducts: Array<Product> = [];
  subcategories: Array<Category> = [];

  init$: Observable<any>;

  deliveryDistritos: Array<any> = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { type: string; data?: Category },
    private dialogRef: MatDialogRef<DeleteCategoryComponent>,
    private afs: AngularFirestore,
    private dbs: DatabaseService
  ) { }


  ngOnInit(): void {
    //console.log(this.data)

    switch (this.data.type) {
      case 'category':
        this.init$ = this.dbs.getSubCategories(this.data.data.id).pipe(
          switchMap(subs => {
            this.subcategories = subs
            let list = subs.map(sb => sb.id).concat([this.data.data.id])
            return this.dbs.getListProductsByCategory(list)
          }),
          tap(res => {
            this.listProducts = res
            this.loading.next(false)
          })
        )
        break;
      case 'subcategory':
        this.init$ = this.dbs.getSubSubCategories(this.data.data.id).pipe(
          switchMap(subs => {
            this.subcategories = subs
            let list = subs.map(sb => sb.id).concat([this.data.data.id])
            return this.dbs.getListProductsByCategory(list)
          }),
          tap(res => {
            this.listProducts = res
            this.loading.next(false)
          })
        )
        break;
      case 'subsubcategory':
        this.init$ = this.dbs.getListProductsByCategory([this.data.data.id]).pipe(
          tap(res => {
            this.listProducts = res
            this.loading.next(false)
          })
        )

        break;
    }
  }

  save() {
    this.loading.next(true)
    let ref = this.afs.firestore.collection(`/db/aitec/config/generalConfig/allCategories`).doc(this.data.data.id);

    const batch = this.afs.firestore.batch();

    if (this.subcategories.length) {
      this.subcategories.forEach(sb => {
        let sbref = this.afs.firestore.collection(`/db/aitec/config/generalConfig/allCategories`).doc(sb.id);
        batch.delete(sbref)
      })
    }

    if (this.listProducts.length) {
      this.listProducts.forEach(pr => {
        let prref = this.afs.firestore.collection(`db/aitec/productsList`).doc(pr.id);
        batch.update(prref, {
          idCategory: null
        })
      })
    }
    batch.delete(ref)
    batch.commit().then(() => {
      this.dialogRef.close(true);
      this.loading.next(false)

    })

  }
}
