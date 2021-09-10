import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { Category } from 'src/app/core/models/category.model';
import { DatabaseService } from 'src/app/core/services/database.service';
@Component({
  selector: 'app-brands-category',
  templateUrl: './brands-category.component.html',
  styleUrls: ['./brands-category.component.scss']
})
export class BrandsCategoryComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(false)
  loading$ = this.loading.asObservable()

  brandForm: FormControl = new FormControl('')
  brand$: Observable<any>
  selectBrand: Array<any> = []

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: Category,
    private dialogRef: MatDialogRef<BrandsCategoryComponent>,
    private afs: AngularFirestore,
    private dbs: DatabaseService
  ) { }

  ngOnInit() {
    //console.log(this.data);

    this.selectBrand = this.data.brands

    this.brand$ = combineLatest(
      this.brandForm.valueChanges.pipe(
        startWith<any>('')
      ),
      this.dbs.getBrands()
    ).pipe(
      map(([value, brands]) => {
        let val = typeof value == 'object' ? value['name'] : value
        return brands.filter(el => val ? el['name'].toLowerCase().includes(val.toLowerCase()) : true)
      })
    )

  }

  onSubmitForm() {
    this.loading.next(true)
    const batch = this.afs.firestore.batch();
    const productRef = this.afs.firestore.collection(`/db/aitec/config/generalConfig/allCategories`).doc(this.data.id);
    
    batch.update(productRef, {
      brands: this.selectBrand
    });

    batch.commit().then(() => {
      this.dialogRef.close(true);
      this.loading.next(false);
      this.snackBar.open('Asesor creado', 'Cerrar', {
        duration: 6000,
      });
    });

  }

  addBrand(brand) {

    if (brand['id']) {
      let inx = this.selectBrand.findIndex(sel => sel['id'] == brand['id'])
      if (inx == -1) {
        this.selectBrand.push(brand);
      } else {
        this.snackBar.open("La marca ya se encuentra en la lista", "Cerrar", {
          duration: 6000
        })
      }
      this.brandForm.setValue('');
    } else {
      this.snackBar.open("Debe seleccionar un producto", "Cerrar", {
        duration: 6000
      })
    }
  }

  removeProduct(item): void {
    let index = this.selectBrand.indexOf(item);
    this.selectBrand.splice(index, 1);
  }

  showBrand(staff): string | undefined {
    return staff ? staff['name'] : undefined;
  }

}
