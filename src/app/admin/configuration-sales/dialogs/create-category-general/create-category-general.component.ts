import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators, } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { Category } from 'src/app/core/models/category.model';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-create-category-general',
  templateUrl: './create-category-general.component.html',
  styleUrls: ['./create-category-general.component.scss']
})
export class CreateCategoryGeneralComponent implements OnInit {

  //Variables
  packageForm: FormGroup;
  itemsFormArray: FormArray;

  totalItems$: Observable<number>;

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  brandForm: FormControl = new FormControl('')
  brand$: Observable<any>
  selectBrand: Array<any> = []

  constructor(
    private dialogRef: MatDialogRef<CreateCategoryGeneralComponent>,
    private fb: FormBuilder,
    private dbs: DatabaseService,
    private snackBar: MatSnackBar,
    private afs: AngularFirestore,
    @Inject(MAT_DIALOG_DATA) public data: { data: any; edit: boolean }
  ) { }

  ngOnInit() {
    this.initForm();
    this.initObservables();
  }

  initForm() {

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

    this.itemsFormArray = this.fb.array([]);

    if (this.data.edit) {
      this.data.data.subcategories.forEach((el) => {
        this.itemsFormArray.push(
          this.fb.group({
            name: [el.name],
            sub: [''],
            categories: [el.categories],
          })
        );
      });

      this.packageForm = this.fb.group({
        category: this.fb.control(this.data.data.category, {
          validators: [Validators.required],
          asyncValidators: this.descriptionRepeatedValidator(this.data),
          updateOn: 'blur',
        }),

        totalItems: [this.data.data.subcategories.length],
      });

      this.selectBrand = this.data.data.brands
    } else {
      this.packageForm = this.fb.group({
        category: this.fb.control(null, {
          validators: [Validators.required],
          asyncValidators: this.descriptionRepeatedValidator(this.data),
          updateOn: 'blur',
        }),

        totalItems: [0],
      });
    }
  }

  initObservables() {
    this.totalItems$ = this.packageForm.get('totalItems').valueChanges.pipe(
      tap((total) => {
        let leng = this.itemsFormArray.length

        if (total > leng) {
          let number = total - leng
          for (let i = 0; i < number; i++) {
            this.itemsFormArray.push(
              this.fb.group({
                name: [''],
                sub: [null],
                categories: [[]],
              })
            );
          }
        } else if (leng > total) {

          for (let i = total; i < leng; i++) {
            this.itemsFormArray.removeAt(i)
          }
        }


      })
    );
  }

  onSelectProduct(formGroup: FormGroup) {

    let product = formGroup.get('sub').value;

    if (product) {
      let initList = formGroup.get('categories').value;
      if (!initList.find((el) => el == product)) {
        initList.unshift(product);
        formGroup.get('categories').setValue(initList);
        formGroup.get('sub').setValue('');
      }
    }
  }

  onRemoveProduct(product, formGroup: FormGroup) {
    let removedList = formGroup
      .get('categories')
      .value.filter((el) => el != product);
    formGroup.get('categories').setValue(removedList);
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

  onSubmitForm() {
    this.loading.next(true);

    let subs = this.itemsFormArray.controls.map((el) => ({
      name: el.get('name').value,
      categories: el.get('categories').value,
    }));

    let newCategory: Category = {
      id: '',
      idCategory: null,
      idSubCategory: null,
      name: this.packageForm.get('category').value,
      completeName: this.packageForm.get('category').value,
      brands: this.selectBrand,
      createdAt: new Date(),
      editedAt: new Date()
    };

    this.create(newCategory, subs);
  }

  create(newCategory, subs) {
    let productRef = this.afs.firestore.collection(`/db/aitec/config/generalConfig/allCategories`).doc();

    const batch = this.afs.firestore.batch();

    newCategory.id = productRef.id;

    subs.forEach(sb => {
      let subRef = this.afs.firestore.collection(`/db/aitec/config/generalConfig/allCategories`).doc();
      let newSub: Category = {
        id: subRef.id,
        idCategory: productRef.id,
        idSubCategory: null,
        name: sb.name,
        completeName: newCategory.name + ' >> ' + sb.name,
        brands: [],
        createdAt: new Date(),
        editedAt: new Date()
      }

      sb.categories.forEach(sbb => {
        let subbRef = this.afs.firestore.collection(`/db/aitec/config/generalConfig/allCategories`).doc();
        let newSubb: Category = {
          id: subbRef.id,
          idCategory: productRef.id,
          idSubCategory: subRef.id,
          name: sbb,
          completeName: newCategory.name + ' >> ' + sb.name + ' >> ' + sbb,
          brands: [],
          createdAt: new Date(),
          editedAt: new Date()
        }
        batch.set(subbRef, newSubb);
      })

      batch.set(subRef, newSub);
    })

    batch.set(productRef, newCategory);

    batch.commit().then(() => {
      this.dialogRef.close(true);
      this.loading.next(false);
      this.snackBar.open('Categoría creada', 'Cerrar', {
        duration: 6000,
      });
    });
  }

  edit(newCategory) {
    let productRef = this.afs.firestore
      .collection(`/db/aitec/config/generalConfig/categories`)
      .doc(newCategory.id);

    let batch = this.afs.firestore.batch();

    batch.update(productRef, newCategory);

    batch.commit().then(() => {
      this.dialogRef.close(true);
      this.loading.next(false);
      this.snackBar.open('Categoría editada', 'Cerrar', {
        duration: 6000,
      });
    });
  }

  descriptionRepeatedValidator(data) {
    return (control: AbstractControl): Observable<{ 'descriptionRepeatedValidator': boolean }> => {
      const value = control.value.toUpperCase();
      if (data.edit) {
        if (data.data.category.toUpperCase() == value) {
          return of(null)
        }
        else {
          return this.dbs.getCategoriesDoc().pipe(
            map(res => !!res.find(el => el.category.toUpperCase() == value) ? { descriptionRepeatedValidator: true } : null))
        }
      }
      else {
        return this.dbs.getCategoriesDoc().pipe(
          map(res => !!res.find(el => el.category.toUpperCase() == value) ? { descriptionRepeatedValidator: true } : null))
      }
    }
  }
}
