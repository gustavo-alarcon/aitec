import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-create-edit-categories',
  templateUrl: './create-edit-categories.component.html',
  styleUrls: ['./create-edit-categories.component.scss'],
})
export class CreateEditCategoriesComponent implements OnInit {
  //Variables
  packageForm: FormGroup;
  itemsFormArray: FormArray;

  totalItems$: Observable<number>;

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  brandForm:FormControl = new FormControl('')
  brand$:Observable<any>
  selectBrand:Array<any> = []

  constructor(
    private dialogRef: MatDialogRef<CreateEditCategoriesComponent>,
    private fb: FormBuilder,
    private dbs: DatabaseService,
    private snackBar: MatSnackBar,
    private afs: AngularFirestore,
    @Inject(MAT_DIALOG_DATA) public data: { data: any; edit: boolean }
  ) {}

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
      map(([value,brands])=>{
        
        return brands.filter(el=>value?el['name'].toLowerCase().includes(value.toLowerCase()):true)
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
          //asyncValidators: this.descriptionRepeatedValidator(this.dbs, this.data),
          updateOn: 'blur',
        }),

        totalItems: [this.data.data.totalItems],
      });
    } else {
      this.packageForm = this.fb.group({
        category: this.fb.control(null, {
          validators: [Validators.required],
          //asyncValidators: this.descriptionRepeatedValidator(this.dbs, this.data),
          updateOn: 'blur',
        }),

        totalItems: [0],
      });
    }
  }

  initObservables() {
    this.totalItems$ = this.packageForm.get('totalItems').valueChanges.pipe(
      //startWith<number>(this.packageForm.get('totalItems').value),
      tap((total) => {
        this.itemsFormArray.clear();
        for (let i = 0; i < total; i++) {
          this.itemsFormArray.push(
            this.fb.group({
              name: [''],
              sub: [null],
              categories: [[]],
            })
          );
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


  addProduct() {
    if (this.brandForm.value['id']) {
      this.selectBrand.push(this.brandForm.value);
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

  onSubmitForm() {
    this.loading.next(true);

    let subs = this.itemsFormArray.controls.map((el) => ({
      name: el.get('name').value,
      categories: el.get('categories').value,
    }));
    console.log(subs);

    let newCategory = {
      id: this.data.edit?this.data.data.id:'',
      category: this.packageForm.get('category').value,
      subcategories: subs,
      brands: this.selectBrand,
      createdAt: this.data.edit?this.data.data.createdAt:new Date(),
    };

    if (this.data.edit) {
      this.edit(newCategory);
    } else {
      this.create(newCategory);
    }
  }

  create(newCategory) {
    let productRef = this.afs.firestore
      .collection(`/db/aitec/config/generalConfig/categories`)
      .doc();

    let batch = this.afs.firestore.batch();

    newCategory.id = productRef.id;

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

  descriptionRepeatedValidator(dbs, data) {
    /*return (control: AbstractControl): Observable<{'descriptionRepeatedValidator': boolean}> => {
      const value = control.value.toUpperCase();
      if(data.edit){
        if(data.data.description.toUpperCase() == value){
          return of(null)
        }
        else{
          return dbs.getPackagesList().pipe(
            map(res => !!res.find(el => el.description.toUpperCase() == value)  ? {descriptionRepeatedValidator: true} : null),)
          }
        }
      else{
        return dbs.getPackagesList().pipe(
          map(res => !!res.find(el => el.description.toUpperCase() == value)  ? {descriptionRepeatedValidator: true} : null),)
        }
    }*/
  }
}
