import { AngularFirestore } from '@angular/fire/firestore';
import { startWith, map, take, takeLast, switchMap, filter } from 'rxjs/operators';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { Component, OnInit, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-cupon-dialog',
  templateUrl: './cupon-dialog.component.html',
  styleUrls: ['./cupon-dialog.component.scss']
})
export class CuponDialogComponent implements OnInit {

  redirects: Array<string> = ['Toda la compra', 'Categoría/subcategoría', 'Marca', 'Productos']
  category$: Observable<string[]>
  products$: Observable<any>
  brand$: Observable<any>

  loading = new BehaviorSubject<boolean>(false)
  loading$ = this.loading.asObservable()

  subcategories: Array<any> = []
  products: Array<any> = []

  createForm: FormGroup

  constructor(
    private fb: FormBuilder,
    private dbs: DatabaseService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { edit: boolean, data?: any },
    private dialogRef: MatDialogRef<CuponDialogComponent>,
    private afs: AngularFirestore
  ) { }

  ngOnInit() {
    this.createForm = this.fb.group({
      discount: [this.data.edit ? this.data.data.discount : null, [Validators.required,Validators.min(0)]],
      name: [this.data.edit ? this.data.data.name : null, [Validators.required], [this.nameRepeatedValidator(this.data)]],
      brand: [this.data.edit ? this.data.data.brand : null],
      category: [this.data.edit ? this.data.data.category : null],
      start: [null, Validators.required],
      end: [null, Validators.required],
      product: [null],
      redirectTo:[this.data.edit ? this.data.data.redirectTo : null, Validators.required]
    })

    this.products$ = combineLatest(
      this.createForm.get('product').valueChanges.pipe(
        startWith<any>(''),
        filter((input) => input !== null)
      ),
      this.dbs.getProductsList()
    ).pipe(
      
      map(([value,products]) => {
        return value
          ? products.filter(
            (option) =>
              option['description'].toLowerCase().includes(value) ||
              option['sku'].toLowerCase().includes(value)
          )
          : [];
      })
    )

    this.category$ = combineLatest(
      this.createForm.get('category').valueChanges.pipe(
        startWith<any>('')
      ),
      this.dbs.getCategories()
    ).pipe(

      map(([value, categories]) => {
        let fil = categories.map(el => {
          let first = [el['category']]
          let subs = el['subcategories'].map(lo => {
            let sub = [el['category'] + ' >> ' + lo.name]
            if (lo.categories.length) {
              let secs = lo.categories.map(sec => {
                return el['category'] + ' >> ' + lo.name + ' >> ' + sec
              })
              return sub.concat(secs)
            } else {
              return sub
            }

          })
          return first.concat(subs).reduce((a, b) => a.concat(b), [])
        }).reduce((a, b) => a.concat(b), [])

        return fil.filter(el => value ? el.toLowerCase().includes(value.toLowerCase()) : true)
      })
    )

    this.brand$ = combineLatest(
      this.createForm.get('brand').valueChanges.pipe(
        startWith<any>('')
      ),
      this.dbs.getBrands()
    ).pipe(
      map(([value, brands]) => {

        return brands.map(el => el['name']).filter(el => value ? el['name'].toLowerCase().includes(value.toLowerCase()) : true)
      })
    )

  }

  showSelected(staff): string | undefined {
    return staff ? staff['description'] : undefined;
  }

  addProduct() {
    if (this.createForm.value['product']['id']) {
      this.products.push(this.createForm.value['product']);
      this.createForm.get('product').setValue('');
    } else {
      this.snackBar.open("Debe seleccionar un producto", "Cerrar", {
        duration: 6000
      })
    }
  }

  removeProduct(item): void {
    let index = this.products.indexOf(item);
    this.products.splice(index, 1);
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
      .collection(`/db/aitec/coupons`)
      .doc(this.createForm.get('name').value);

    
    const batch = this.afs.firestore.batch();

    let newCoupon = {
      id: this.createForm.get('name').value,
      name: this.createForm.get('name').value,
      redirectTo: this.createForm.get('redirectTo').value,
      discount: this.createForm.get('discount').value,
      category: this.createForm.get('category').value,
      brand: this.createForm.get('brand').value,
      products: this.products.map(el => { return { id: el['id'], description: el['description'] } }),
      startDate: this.createForm.get('start').value,
      endDate: this.createForm.get('end').value,
      createdAt: new Date()
    }

    batch.set(productRef, newCoupon);

    batch.commit().then(() => {
      this.dialogRef.close(true);
      this.loading.next(false);
      this.snackBar.open('Cupón creado', 'Cerrar', {
        duration: 6000,
      });
    });
  }

  edit() {
    let productRef = this.afs.firestore
      .collection(`/db/aitec/coupons`)
      .doc(this.data.data.id);

    let batch = this.afs.firestore.batch();

    let newCoupon = {
      name: this.createForm.get('name').value,
      redirectTo: this.createForm.get('redirectTo').value,
      discount: this.createForm.get('discount').value,
      category: this.createForm.get('category').value,
      brand: this.createForm.get('brand').value,
      products: this.products.map(el => { return { id: el['id'], description: el['description'] } }),
      startDate: this.createForm.get('start').value,
      endDate: this.createForm.get('end').value
    }

    batch.update(productRef, newCoupon);

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
        if (data.data.name.toUpperCase() == value) {
          return of(null)
        }
        else {
          return this.dbs.getCouponsDoc().pipe(
            map(res => !!res.find(el => el.name.toUpperCase() == value) ? { nameRepeatedValidator: true } : null))
        }
      }
      else {
        return this.dbs.getCouponsDoc().pipe(
          map(res => !!res.find(el => el.name.toUpperCase() == value) ? { nameRepeatedValidator: true } : null))
      }
    }
  }

}