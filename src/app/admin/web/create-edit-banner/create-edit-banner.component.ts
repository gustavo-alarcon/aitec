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

@Component({
  selector: 'app-create-edit-banner',
  templateUrl: './create-edit-banner.component.html',
  styleUrls: ['./create-edit-banner.component.scss']
})
export class CreateEditBannerComponent implements OnInit {

  redirects: Array<string> = ['Ninguno', 'Link externo', 'Categoría/subcategoría', 'Marca', 'Producto']

  category$: Observable<string[]>
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
      photoURL: Observable<boolean>,
      photomovilURL: Observable<boolean>
    },
    data: {
      photoURL: File,
      photomovilURL: File,
    }
  } = {
      resizing$: {
        photoURL: new BehaviorSubject<boolean>(false),
        photomovilURL: new BehaviorSubject<boolean>(false),
      },
      data: {
        photoURL: null,
        photomovilURL: null
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
      photomovilURL: [this.data.edit ? this.data.data.photomovilURL : null, Validators.required],
      product: [null]
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
    /*this.category$ = combineLatest(
        this.createForm.get('category').valueChanges
          .pipe(startWith('')),
        this.dbs.getCategories()).pipe(
          map(([formValue, categories]) => {
            this.listCategories = categories
            if (this.data.edit) {
              if (this.subcategories.length == 0) {
                this.subcategories = categories.filter(el => this.data.data.subCategories.includes(el))
              }

            }
            let filter = categories.filter(el => el.includes(formValue));
            if (!(filter.length == 1 && filter[0] === formValue) && formValue.length) {
              this.createForm.get('category').setErrors({ invalid: true });
            }
            return filter;
          }))*/
    /*this.products$ = combineLatest(
  this.dbs.getProducts(),
  this.createForm.get('product').valueChanges.pipe(
    filter(input => input !== null),
    startWith<any>(''))
  //map(value => typeof value === 'string' ? value.toLowerCase() : value.description.toLowerCase()))
).pipe(
  map(([products, name]) => {
    if (this.data.edit) {
      if (this.products.length == 0) {
        this.products = products.filter(el => this.data.data.products.includes(el.id))
      }

    }
    return name ? products.filter(option => option.description.toLowerCase().includes(name)) : products;
  })
);*/


  }

  showSelected(staff): string | undefined {
    return staff ? staff['description'] : undefined;
  }

  showEmail(user): string | null {
    return user ? user.displayname : null;
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

    this.ng2ImgMax.resizeImage(image[0], 10000, 426)
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

  createBanner(producto, photo?: File, photomovil?: File) {
    let productRef: DocumentReference = this.afs.firestore.collection(`/db/aitec/config/generalConfig/banners`).doc();
    let productData = producto;
    let batch = this.afs.firestore.batch();

    productData.id = productRef.id;
    productData.photoURL = null;

    forkJoin(
      this.uploadPhoto(productRef.id, photo),
      this.uploadPhoto(productRef.id, photomovil),
    ).pipe(
      takeLast(1),
    ).subscribe(([photoUrl, movilUrl]) => {
      productData.photoURL = <string>photoUrl
      productData.photoPath = `/banners/pictures/${productRef.id}-${photo.name}`;
      productData.photomovilURL = <string>movilUrl
      productData.photomovilPath = `/banners/pictures/${productRef.id}-${photomovil.name}`;
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

  editBanner(product: any, type: string, photo?: File, photomovil?: File) {
    let productRef: DocumentReference = this.afs.firestore.collection(`/db/aitec/config/generalConfig/banners`).doc(product.id);
    let productData = product;
    let batch = this.afs.firestore.batch();

    if (photomovil && photo) {
      forkJoin(
        this.uploadPhoto(productRef.id, photo),
        this.uploadPhoto(productRef.id, photomovil),
      ).pipe(
        takeLast(1),
      ).subscribe(([photoUrl, movilUrl]) => {
        productData.photoURL = <string>photoUrl
        productData.photoPath = `/banners/pictures/${productRef.id}-${photo.name}`;
        productData.photomovilURL = <string>movilUrl
        productData.photomovilPath = `/banners/pictures/${productRef.id}-${photomovil.name}`;
        batch.update(productRef, productData);

        batch.commit().then(() => {
          this.dialogRef.close(true);
          this.loading.next(false)
          this.snackBar.open("Cambios Guardados", "Cerrar", {
            duration: 6000
          })
        })
      })

    } else if (photo) {

      this.uploadPhoto(productRef.id, photo).pipe(
        takeLast(1),
      ).subscribe((res: string) => {
        if (type == 'photo') {
          productData.photoURL = res;
          productData.photoPath = `/banners/pictures/${productRef.id}-${photo.name}`;
        } else {
          productData.photomovilURL = res;
          productData.photomovilPath = `/banners/pictures/${productRef.id}-${photo.name}`;
        }
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
      category: this.createForm.get('category').value,
      brand: this.createForm.get('brand').value,
      type: this.data.type,
      photoURL: '',
      photoPath: '',
      photomovilURL: '',
      photomovilPath: '',
      published: true,
      products: this.products.map(el => { return { id: el['sku'], description: el['description'] } }),
      position: this.data.index
    }
    this.createBanner(newBanner, this.photos.data.photoURL, this.photos.data.photomovilURL)
  }

  editSubmit() {
    this.createForm.markAsPending();
    this.createForm.disable()
    this.loading.next(true)

    let update: object = {}
    update['id'] = this.data.data.id
    let movil: boolean = false
    let photo: boolean = false

    if (this.createForm.get('photoURL').value != this.data.data.photoURL) {
      update['photoURL'] = ''
      update['photoPath'] = ''
      photo = true
    }
    if (this.createForm.get('redirectTo').value != this.data.data.redirectTo) {
      update['redirectTo'] = this.createForm.get('redirectTo').value
    }

    if (this.createForm.get('category').value != this.data.data.category) {
      update['category'] = this.createForm.get('category').value
    }

    if (this.createForm.get('brand').value != this.data.data.brand) {
      update['brand'] = this.createForm.get('brand').value
    }

    if (this.createForm.get('link').value != this.data.data.link) {
      update['link'] = this.createForm.get('link').value
    }

    if (this.createForm.get('photomovilURL').value != this.data.data.photomovilURL) {
      update['photomovilURL'] = ''
      update['photomovilPath'] = ''
      movil = true
    }

    let preData = [...this.data.data.products]

    let change = false

    let newP = this.products.filter(che => preData.findIndex(pre => pre == che['id']) < 0).map(el => el['id'])
    let old = preData.filter(che => this.products.findIndex(pre => pre['id'] == che) < 0).map(el => el['id'])

    change = newP.length > 0 || old.length > 0

    if (change) {
      update['products'] = this.products.map(el => { return { id: el['id'], description: el['description'] } })
    }

    if (photo && movil) {
      this.editBanner(update, 'edit', this.photos.data.photoURL, this.photos.data.photomovilURL)
    } else if (photo || movil) {
      if (photo) {
        this.editBanner(update, 'photo', this.photos.data.photoURL)
      }

      if (movil) {
        this.editBanner(update, 'movil', this.photos.data.photomovilURL)
      }
    } else {
      this.editBanner(update, 'any')
    }


  }

}
