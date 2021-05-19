import { AngularFirestore } from '@angular/fire/firestore';
import { startWith, map, take, takeLast, switchMap, filter, debounceTime } from 'rxjs/operators';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { Component, OnInit, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatabaseService } from 'src/app/core/services/database.service';
import { Coupon } from 'src/app/core/models/coupon.model';

@Component({
  selector: 'app-cupon-dialog',
  templateUrl: './cupon-dialog.component.html',
  styleUrls: ['./cupon-dialog.component.scss']
})
export class CuponDialogComponent implements OnInit {

  types: Array<any> = [{ id: 1, name: 'En soles' }, { id: 2, name: 'Porcentaje' }]
  redirects: Array<string> = ['Toda la compra', 'Categoría/subcategoría', 'Marca']
  category$: Observable<any[]>
  brand$: Observable<any>
  name$: Observable<any>
  date$: Observable<any>

  loading = new BehaviorSubject<boolean>(false)
  loading$ = this.loading.asObservable()

  subcategories: Array<any> = []

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
    //console.log(this.data.data);

    this.createForm = this.fb.group({
      discount: [this.data.edit ? this.data.data.discount : null, [Validators.required, Validators.min(0)]],
      name: [this.data.edit ? this.data.data.name : null, [Validators.required], [this.nameRepeatedValidator(this.data)]],
      brand: [this.data.edit ? this.data.data.brand : null],
      category: [this.data.edit ? this.data.data.category : null],
      type: [this.data.edit ? this.data.data.type : null, Validators.required],
      limit: [this.data.edit ? this.data.data.limit : null],
      start: [null],
      end: [null],
      limitDate: [this.data.edit ? this.data.data.limitDate : false],
      redirectTo: [this.data.edit ? this.data.data.redirectTo : null, Validators.required],
      from: [this.data.edit ? this.data.data.from : null]
    })

    this.name$ = this.createForm.get('name').valueChanges.pipe(
      debounceTime(500),
      map(el => el.trim())
    )

    this.date$ = this.createForm.get('limitDate').valueChanges.pipe(
      startWith(this.data.edit ? this.data.data.limitDate : false),
      map(res => {
        if (res) {
          this.createForm.get('start').enable()
          this.createForm.get('end').enable()
          if (this.data.edit) {
            this.createForm.get('start').setValue(this.getDate(this.data.data.startDate))
            this.createForm.get('end').setValue(this.getDate(this.data.data.endDate))
          }
        } else {
          this.createForm.get('start').disable()
          this.createForm.get('start').setValue(null)
          this.createForm.get('end').disable()
          this.createForm.get('end').setValue(null)
        }
      })
    )

    this.category$ = combineLatest(
      this.createForm.get('category').valueChanges.pipe(
        map(el => typeof el == 'string' ? el : el ? el['completeName'] : null),
        startWith<any>('')
      ),
      this.dbs.getAllCategories()
    ).pipe(

      map(([value, categories]) => {

        return categories.filter(el => value ? el.completeName.toLowerCase().includes(value.toLowerCase()) : true)
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

  getDate(date) {
    return new Date(date.seconds * 1000)
  }

  showSelected(staff): string | undefined {
    return staff ? staff['description'] : undefined;
  }

  showCategory(staff): string | undefined {
    return staff ? staff['completeName'] : undefined;
  }
  
  onSubmitForm() {
    if (this.createForm.get('limitDate').value) {
      let startDate = this.createForm.get('start').value
      let endDate = this.createForm.get('end').value
      if (!startDate || !endDate) {
        this.snackBar.open('Agregue Fechas', 'Cerrar', {
          duration: 6000,
        });
        return;
      }
    }

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

    let newCoupon: Coupon = {
      id: this.createForm.get('name').value,
      name: this.createForm.get('name').value,
      redirectTo: this.createForm.get('redirectTo').value,
      discount: this.createForm.get('discount').value,
      category: this.createForm.get('category').value,
      brand: this.createForm.get('brand').value,
      startDate: this.createForm.get('limitDate').value ? this.createForm.get('start').value : null,
      endDate: this.createForm.get('limitDate').value ? this.createForm.get('end').value : null,
      limitDate: this.createForm.get('limitDate').value,
      limit: this.createForm.get('limit').value,
      type: this.createForm.get('type').value,
      createdAt: new Date(),
      users: [],
      count: 0,
      from: this.createForm.get('from').value
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
      startDate: this.createForm.get('limitDate').value ? this.createForm.get('start').value : null,
      endDate: this.createForm.get('limitDate').value ? this.createForm.get('end').value : null,
      limit: this.createForm.get('limit').value,
      limitDate: this.createForm.get('limitDate').value,
      type: this.createForm.get('type').value,
      from: this.createForm.get('from').value
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

  onKeydown(event) {
    return event.keyCode != 32;
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
