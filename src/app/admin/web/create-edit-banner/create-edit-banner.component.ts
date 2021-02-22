import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { startWith, map, take, takeLast, switchMap, filter } from 'rxjs/operators';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest, concat, of, forkJoin } from 'rxjs';
import { Component, OnInit, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatabaseService } from 'src/app/core/services/database.service';
import { Category } from 'src/app/core/models/category.model';

@Component({
  selector: 'app-create-edit-banner',
  templateUrl: './create-edit-banner.component.html',
  styleUrls: ['./create-edit-banner.component.scss']
})
export class CreateEditBannerComponent implements OnInit {

  redirects: Array<string> = ['Ninguno', 'Link externo', 'Categoría/subcategoría', 'Marca', 'Producto']

  category$: Observable<Category[]>
  products$: Observable<any>
  brand$: Observable<any>

  loading = new BehaviorSubject<boolean>(false)
  loading$ = this.loading.asObservable()

  subcategories: Array<any> = []
  products: Array<any> = []

  createForm: FormGroup
  //variables
  noImage = '../../../../assets/images/no-image.png';
  photos: {
    resizing$: {
      photoURL: Observable<boolean>
    },
    data: {
      photoURL: File
    }
  } = {
      resizing$: {
        photoURL: new BehaviorSubject<boolean>(false)
      },
      data: {
        photoURL: null
      }
    }
  constructor(
    private fb: FormBuilder,
    private dbs: DatabaseService,
    private snackBar: MatSnackBar,
    private ng2ImgMax: Ng2ImgMaxService,
    @Inject(MAT_DIALOG_DATA) public data: { edit: boolean, type: string, index?: number, data?: any },
    private dialogRef: MatDialogRef<CreateEditBannerComponent>,
    private afs: AngularFirestore,
    private storage: AngularFireStorage
  ) { }

  ngOnInit() {
    this.createForm = this.fb.group({
      redirectTo: [this.data.edit ? this.data.data.redirectTo : null, Validators.required],
      category: [this.data.edit ? this.data.data.category : null],
      brand: [this.data.edit ? this.data.data.brand : null],
      link: [this.data.edit ? this.data.data.link : null],
      photoURL: [this.data.edit ? this.data.data.photoURL : null, Validators.required],
      product: [null]
    })

    if (this.data.edit) {
      this.products = this.data.data.products
    }

    this.products$ = combineLatest(
      this.createForm.get('product').valueChanges.pipe(
        startWith<any>(''),
        filter((input) => input !== null)
      ),
      this.dbs.getProductsList()
    ).pipe(

      map(([value, products]) => {
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

  showSelected(staff): string | undefined {
    return staff ? staff['description'] : undefined;
  }

  showEmail(user): string | null {
    return user ? user.displayname : null;
  }

  showCategory(staff): string | undefined {
    return staff ? staff['completeName'] : undefined;
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

  addNewPhoto(formControlName: string, image: File[]) {
    this.createForm.get(formControlName).setValue(null);
    if (image.length === 0)
      return;
    let reader = new FileReader();
    this.photos.resizing$[formControlName].next(true);

    this.ng2ImgMax.resizeImage(image[0], 1000, 426)
      .pipe(
        take(1)
      ).subscribe(result => {
        this.photos.data[formControlName] = new File([result], formControlName + result.name.match(/\..*$/));
        reader.readAsDataURL(image[0]);
        reader.onload = (_event) => {
          this.createForm.get(formControlName).setValue(reader.result);
          this.photos.resizing$[formControlName].next(false);
        }
      },
        error => {
          this.photos.resizing$[formControlName].next(false);
          this.snackBar.open('Por favor, elija una imagen en formato JPG, o PNG', 'Aceptar');
          this.createForm.get(formControlName).setValue(null);

        }
      );
  }


  uploadPhoto(id: string, file: File): Observable<string | number> {
    const path = `/banners/pictures/${id}-${file.name}`;

    // Reference to storage bucket
    const ref = this.storage.ref(path);

    // The main task
    let uploadingTask = this.storage.upload(path, file);

    let snapshot$ = uploadingTask.percentageChanges()
    let url$ = of('url!').pipe(
      switchMap((res) => {
        return <Observable<string>>ref.getDownloadURL();
      }))

    let upload$ = concat(
      snapshot$,
      url$)

    return upload$;
  }

  createBanner(producto, photo?: File) {
    let productRef: DocumentReference = this.afs.firestore.collection(`/db/aitec/config/generalConfig/banners`).doc();
    let productData = producto;
    let batch = this.afs.firestore.batch();

    productData.id = productRef.id;
    productData.photoURL = null;

    this.uploadPhoto(productRef.id, photo).pipe(
      takeLast(1),
    ).subscribe((res: string) => {
      productData.photoURL = res;
      productData.photoPath = `/banners/pictures/${productRef.id}-${photo.name}`;
      batch.set(productRef, productData);

      batch.commit().then(() => {
        this.dialogRef.close(true);
        this.loading.next(false)
        this.snackBar.open("Banner creado", "Cerrar", {
          duration: 6000
        })
      })
    })


  }

  editBanner(product: any, photo?: File) {
    let productRef: DocumentReference = this.afs.firestore.collection(`/db/aitec/config/generalConfig/banners`).doc(product.id);
    let productData = product;
    let batch = this.afs.firestore.batch();

    if (photo) {

      this.uploadPhoto(productRef.id, photo).pipe(
        takeLast(1),
      ).subscribe((res: string) => {
        productData.photoURL = res;
        productData.photoPath = `/banners/pictures/${productRef.id}-${photo.name}`;
        batch.update(productRef, productData);

        batch.commit().then(() => {
          this.dialogRef.close(true);
          this.loading.next(false)
          this.snackBar.open("Cambios Guardados", "Cerrar", {
            duration: 6000
          })
        })
      })
    } else {
      batch.update(productRef, productData);

      batch.commit().then(() => {
        this.dialogRef.close(true);
        this.loading.next(false)
        this.snackBar.open("Cambios Guardados", "Cerrar", {
          duration: 6000
        })
      })
    }


  }

  onSubmitForm() {
    this.createForm.markAsPending();
    this.createForm.disable()
    this.loading.next(true)

    let newBanner;
    newBanner = {
      id: '',
      redirectTo: this.createForm.get('redirectTo').value,
      link: this.createForm.get('link').value,
      category: this.createForm.get('category').value.id,
      brand: this.createForm.get('brand').value,
      type: this.data.type,
      photoURL: '',
      photoPath: '',
      photomovilPath: '',
      published: true,
      products: this.products.map(el => { return { id: el['sku'], description: el['description'] } }),
      position: this.data.index
    }
    this.createBanner(newBanner, this.photos.data.photoURL)
  }

  editSubmit() {
    this.createForm.markAsPending();
    this.createForm.disable()
    this.loading.next(true)

    let update: object = {}
    update['id'] = this.data.data.id
    let photo: boolean = false

    if (this.createForm.get('photoURL').value != this.data.data.photoURL) {
      update['photoURL'] = ''
      update['photoPath'] = ''
      photo = true
    }
    if (this.createForm.get('redirectTo').value != this.data.data.redirectTo) {
      update['redirectTo'] = this.createForm.get('redirectTo').value
    }

    if (this.createForm.get('category').value.id != this.data.data.category) {
      update['category'] = this.createForm.get('category').value.id
    }


    if (this.createForm.get('brand').value != this.data.data.brand) {
      update['brand'] = this.createForm.get('brand').value
    }

    if (this.createForm.get('link').value != this.data.data.link) {
      update['link'] = this.createForm.get('link').value
    }


    let preData = [...this.data.data.products]

    let change = false

    let newP = this.products.filter(che => preData.findIndex(pre => pre == che['id']) < 0).map(el => el['id'])
    let old = preData.filter(che => this.products.findIndex(pre => pre['id'] == che) < 0).map(el => el['id'])

    change = newP.length > 0 || old.length > 0

    if (change) {
      update['products'] = this.products.map(el => { return { id: el['id'], description: el['description'] } })
    }

    if (photo) {
      this.editBanner(update, this.photos.data.photoURL)
    } else {
      this.editBanner(update)
    }


  }

}
