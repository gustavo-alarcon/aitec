import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Category } from 'src/app/core/models/category.model';
import { map, startWith, tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
@Component({
  selector: 'app-category-dialog',
  templateUrl: './category-dialog.component.html',
  styleUrls: ['./category-dialog.component.scss']
})
export class CategoryDialogComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  formGroup: FormGroup;

  allcategories: Array<Category> = [];
  categories: Array<Category> = [];
  subcategories: Array<Category> = [];

  init$: Observable<any>;

  deliveryDistritos: Array<any> = [];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { edit: boolean; type: string; data?: Category },
    private dialogRef: MatDialogRef<CategoryDialogComponent>,
    private afs: AngularFirestore,
    private dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    //console.log(this.data)
    this.init$ = this.dbs.getAllCategories().pipe(
      tap(res => {
        this.allcategories = res
        this.categories = res.filter(cat => !cat.idCategory)
        if (this.data.type == 'subsubcategory') {
          this.selectCategory(this.data.data.idCategory)
          if (this.data.edit) {
            this.formGroup.get('subcategory').setValue(this.data.data.idSubCategory);
          } else {
            this.formGroup.get('subcategory').setValue(this.data.data.id);
          }

        }
      })
    )
    switch (this.data.type) {
      case 'category':
        this.formGroup = this.fb.group({
          name: this.fb.control(this.data.edit ? this.data.data.name : null, {
            validators: [Validators.required],
            asyncValidators: this.descriptionRepeatedValidator(this.data),
            updateOn: 'blur',
          })
        });
        break;
      case 'subcategory':
        this.formGroup = this.fb.group({
          category: [this.data.edit ? this.data.data.idCategory : this.data.data.id, Validators.required],
          name: this.fb.control(this.data.edit ? this.data.data.name : null, {
            validators: [Validators.required],
            updateOn: 'blur',
          })
        });
        if (!this.data.edit) {
          this.formGroup.get('category').disable();
        }
        break;
      case 'subsubcategory':
        this.formGroup = this.fb.group({
          category: [this.data.data.idCategory, Validators.required],
          subcategory: [null, Validators.required],
          name: this.fb.control(this.data.edit ? this.data.data.name : null, {
            validators: [Validators.required],
            updateOn: 'blur',
          })
        });
        if (!this.data.edit) {
          this.formGroup.get('category').disable();
          this.formGroup.get('subcategory').disable();
        }

        break;
    }
  }

  selectCategory(option) {
    this.subcategories = this.allcategories.filter(el => el.idCategory == option)
  }


  onSubmitForm() {
    this.formGroup.markAsPending();
    this.formGroup.disable()
    this.loading.next(true)
    let newCategory: Category = {
      id: this.data.edit ? this.data.data.id : '',
      idCategory: null,
      idSubCategory: null,
      name: this.formGroup.get('name').value,
      brands: [],
      createdAt: this.data.edit ? this.data.data.createdAt : new Date(),
      editedAt: new Date()
    };

    if (this.data.edit) {
      this.edit(newCategory)
    } else {
      this.create(newCategory)
    }

  }

  create(newStore: Category) {
    let productRef = this.afs.firestore
      .collection(`/db/aitec/config/generalConfig/allCategories`)
      .doc();

    let batch = this.afs.firestore.batch();

    newStore.id = productRef.id;

    switch (this.data.type) {
      case 'subcategory':
        newStore.idCategory = this.data.data.id
        newStore.completeName = this.data.data.name + ' >> ' + newStore.name
        break;
      case 'subsubcategory':
        newStore.idCategory = this.data.data.idCategory
        newStore.idSubCategory = this.data.data.id
        newStore.completeName = this.data.data.completeName + ' >> ' + newStore.name
        break;
    }


    batch.set(productRef, newStore);

    batch.commit().then(() => {
      this.dialogRef.close(true);
      this.loading.next(false);
      this.snackBar.open('Tienda creada', 'Cerrar', {
        duration: 6000,
      });
    });
  }

  edit(newStore) {
    let productRef = this.afs.firestore
      .collection(`/db/aitec/config/generalConfig/allCategories`)
      .doc(newStore.id);

    switch (this.data.type) {
      case 'category':
        newStore.completeName = this.formGroup.get('name').value
        break;
      case 'subcategory':
        newStore.idCategory = this.formGroup.get('category').value
        let catN = this.allcategories.find(ct => ct.id == this.formGroup.get('category').value)
        newStore.completeName = catN.completeName + ' >> ' + newStore.name
        break;
      case 'subsubcategory':
        newStore.idCategory = this.formGroup.get('category').value
        newStore.idSubCategory = this.formGroup.get('subcategory').value

        let cat = this.allcategories.find(ct => ct.id == this.formGroup.get('subcategory').value)
        newStore.completeName = cat.completeName + ' >> ' + newStore.name
        break;
    }

    let batch = this.afs.firestore.batch();
    let change = JSON.stringify(newStore) === JSON.stringify(this.data.data)
    if (!change) {

      switch (this.data.type) {
        case 'category':
          let allsubs = this.allcategories.filter(ct => ct.idCategory == this.data.data.id)
          allsubs.forEach(sb => {
            let subRef = this.afs.firestore
              .collection(`/db/aitec/config/generalConfig/allCategories`)
              .doc(sb.id);
            let nm = sb.completeName.split(' >> ')
            if (nm.length == 3) {
              sb.completeName = newStore.name + ' >> ' + nm[1] + ' >> ' + nm[2]
            } else {
              sb.completeName = newStore.name + ' >> ' + nm[1]
            }
            sb.editedAt = new Date()
            batch.update(subRef, sb);
          })
          //cambiar completename a todos sus subcategories
          break;
        case 'subcategory':
          //cambiar completename a todos sus subcategories
          //si cambia de idCategory, cambiar a todos sus subs
          let allsubsubs = this.allcategories.filter(ct => ct.idSubCategory == this.data.data.id)
          //console.log(allsubsubs)
          allsubsubs.forEach(sb => {
            let subsubRef = this.afs.firestore
              .collection(`/db/aitec/config/generalConfig/allCategories`)
              .doc(sb.id);
            let nm = sb.completeName.split(' >> ')
            sb.completeName = nm[0] + ' >> ' + newStore.name + ' >> ' + nm[2]
            sb.idCategory = newStore.idCategory
            sb.editedAt = new Date()
            batch.update(subsubRef, sb);
          })
          break;
      }

      batch.update(productRef, newStore);

      batch.commit().then(() => {
        this.dialogRef.close(true);
        this.loading.next(false);
        this.snackBar.open('Cambios guardados', 'Cerrar', {
          duration: 6000,
        });
      });
    } else {
      this.dialogRef.close(true);
      this.loading.next(false);
    }
  }

  descriptionRepeatedValidator(data) {
    return (control: AbstractControl): Observable<{ 'descriptionRepeatedValidator': boolean }> => {
      const value = control.value.toUpperCase();
      if (data.edit) {
        if (data.data.name.toUpperCase() == value) {
          return of(null)
        }
        else {
          return this.dbs.getAllCategoriesDoc().pipe(
            map(res => !!res.find(el => el.name.toUpperCase() == value) ? { descriptionRepeatedValidator: true } : null))
        }
      }
      else {
        return this.dbs.getAllCategoriesDoc().pipe(
          map(res => !!res.find(el => el.name.toUpperCase() == value) ? { descriptionRepeatedValidator: true } : null))
      }
    }
  }

}
