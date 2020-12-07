import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { BehaviorSubject, combineLatest, forkJoin, Observable, of } from 'rxjs';
import { map, startWith, switchMap, take, takeLast, tap } from 'rxjs/operators';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { DatabaseService } from 'src/app/core/services/database.service';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlacesService } from 'src/app/core/services/places.service';
import { MatTableDataSource } from '@angular/material/table';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from 'src/app/core/models/product.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { Location } from "@angular/common";

@Component({
  selector: 'app-create-edit-product',
  templateUrl: './create-edit-product.component.html',
  styleUrls: ['./create-edit-product.component.scss']
})
export class CreateEditProductComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  init$: Observable<any>

  edit: boolean = false
  data: any = null

  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  thirdFormGroup: FormGroup;

  photosList: Array<any> = [];
  photos: {
    resizing$: {
      photoURL: Observable<boolean>;
    };
    data: File[];
  } = {
      resizing$: {
        photoURL: new BehaviorSubject<boolean>(false),
      },
      data: [],
    };

  choosePicture: number = 0

  category$: Observable<string[]>
  brand$: Observable<any>
  guarantee$: Observable<any>

  categories: Array<string> = []

  separatorKeysCodes: number[] = [ENTER, COMMA];
  @ViewChild('colorInput', { static: false }) colorInput: ElementRef<HTMLInputElement>;
  @ViewChild('autoColor', { static: false }) matAutocomplete: MatAutocomplete;

  colorSelect: Array<any> = []

  filteredColor$: Observable<any>


  warehouseList: Array<any> = []
  seriesList: Array<string> = []

  dataSource = new MatTableDataSource();
  displayedColumns: string[] = ['warehouse', 'stock', 'serie', 'actions'];

  config = {
    placeholder: 'Descripción o contenido del módulo',
    tabsize: 2,
    height: '350px',
    lang: 'es-ES',
    toolbar: [
      ['fontsize', ['fontname', 'fontsize', 'color']],
      ['style', ['bold', 'italic', 'underline', 'clear']],
      ['para', ['style', 'ul', 'ol', 'paragraph', 'height']],
    ],
    fontNames: ['Helvetica', 'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Roboto', 'Times']
  };

  constructor(
    private dbs: DatabaseService,
    private auth: AuthService,
    private fb: FormBuilder,
    private ng2ImgMax: Ng2ImgMaxService,
    private snackBar: MatSnackBar,
    private pl: PlacesService,
    private afs: AngularFirestore,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) { }

  ngOnInit(): void {

    this.init$ = this.route.params.pipe(
      switchMap(id => {
        if (id.id) {
          console.log('here');
          return this.dbs.getProduct(id.id).pipe(
            map(prod => {
              console.log(prod);
              this.data = prod
              this.edit = true
              this.firstFormGroup.setValue({
                description: prod.description,
                sku: prod.sku,
                category: null,
                priceMax: prod['priceMay'] ? prod['priceMay'] : 0,
                weight: prod['weight'] ? prod['weight'] : 0,
                code: prod['code'] ? prod['code'] : null,
                priceMin: prod['priceMin']
              })

              this.secondFormGroup.setValue({
                brand: prod.brand,
                model: prod['model'] ? prod['model'] : null,
                additionalDescription: prod.additionalDescription,
                colors: null,
                guarantee: prod['guarantee'],
                timeguarantee: prod['timeguarantee'] ? prod['timeguarantee'] : null
              })

              this.colorSelect = prod['colors']
              this.photosList = prod['gallery']
              this.choosePicture = prod['gallery'].indexOf(prod['photoURL'])
              if (prod['series']) {

                this.warehouseList = prod['series']
                this.dataSource.data = this.warehouseList
              }

              return 2
            })
          )
        } else {
          return of(1)
        }
      }),
      tap(() => {
        this.loading.next(false)
        
      })
    )

    this.firstFormGroup = this.fb.group({
      description: [null, Validators.required],
      sku: [null, [Validators.required], [this.nameRepeatedValidator()]],
      category: [null, [Validators.required]],
      priceMax: [null, [Validators.required, Validators.min(0)]],
      weight: [null, [Validators.required, Validators.min(0)]],
      code: [null, Validators.required],
      priceMin: [null, [Validators.required, Validators.min(0)]]
    })

    this.secondFormGroup = this.fb.group({
      brand: [null, Validators.required],
      model: [null, Validators.required],
      additionalDescription: [null, Validators.required],
      colors: [null],
      guarantee: [null, Validators.required],
      timeguarantee: [null]
    })

    this.thirdFormGroup = this.fb.group({
      warehouse: [null, Validators.required],
      stock: [null, [Validators.required, Validators.min(1)]],
      series: [null]
    })


    this.category$ = combineLatest(
      this.firstFormGroup.get('category').valueChanges.pipe(
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
        this.categories = fil
        return fil.filter(el => value ? el.toLowerCase().includes(value.toLowerCase()) : true)
      }),
      tap(()=>{
        if(this.edit){
          this.firstFormGroup.get('category').setValue(this.getCategory(this.data))
        }
        
      })
    )

    this.brand$ = combineLatest(
      this.secondFormGroup.get('brand').valueChanges.pipe(
        startWith<any>(''),
        map(el => typeof el == 'object' ? el['name'] : el)
      ),
      this.dbs.getBrands()
    ).pipe(
      map(([value, brands]) => {

        return brands.map(el => el['name']).filter(el => value ? el.toLowerCase().includes(value.toLowerCase()) : true)
      })
    )

    this.filteredColor$ = this.secondFormGroup.get('colors').valueChanges.pipe(
      startWith<any>(''),
      map(col => {
        let value = typeof col == 'object' ? col.name : col
        return this.pl.color.sort((a, b) => a.name.localeCompare(b.name))
          .filter(el => col ? el.name.toLowerCase().includes(value.toLowerCase()) : true)
      })
    )

    this.guarantee$ = this.secondFormGroup.get('guarantee').valueChanges.pipe(
      map(bol => {
        if (bol) {
          this.secondFormGroup.get('timeguarantee').setValidators(Validators.required)
          return true
        } else {
          return false
        }
      })
    )
  }

  goBack() {
    this.location.back();
  }

  getCategory(data) {
    let cat = data.category
    let sub = data.subcategory
    let subsub = data.subsubcategory
    if (subsub) {
      return cat + ' >> ' + sub + ' >> ' + subsub
    } else if (sub) {
      return cat + ' >> ' + sub
    } else {
      return cat
    }

  }

  add(event: MatChipInputEvent): void {
    if (!this.matAutocomplete.isOpen) {
      const value = event.value;

      if ((value || '').trim()) {
        if (typeof value == 'string') {
          this.snackBar.open("Dato inválido", "Cerrar", {
            duration: 4000
          })
          this.colorInput.nativeElement.value = '';
        }
      }

    }
  }

  remove(index): void {

    if (index >= 0) {
      this.colorSelect.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    let val = event.option.value
    console.log(val);

    if (this.colorSelect.findIndex(el => el.name == val.name) > -1) {
      this.snackBar.open("Categoría Repetida", "Cerrar", {
        duration: 6000
      })

    } else {
      this.colorSelect.push(val);
    }
    this.colorInput.nativeElement.value = '';
  }

  addNewPhoto(formControlName: string, image: File[]) {
    if (image.length === 0) return;
    let reader = new FileReader();
    this.photos.resizing$[formControlName].next(true);

    this.ng2ImgMax
      .resizeImage(image[0], 10000, 426)
      .pipe(take(1))
      .subscribe(
        (result) => {
          let d = new Date();
          let n = d.getTime();
          this.photos.data.push(
            new File(
              [result],
              formControlName +
              this.photosList.length + '-' + n +
              result.name.match(/\..*$/)
            )
          );
          reader.readAsDataURL(image[0]);
          reader.onload = (_event) => {
            this.photosList.push(reader.result);
            this.photos.resizing$[formControlName].next(false);
          };
        },
        (error) => {
          this.photos.resizing$[formControlName].next(false);
          this.snackBar.open('Por favor, elija una imagen en formato JPG, o PNG', 'Aceptar');
        }
      );
  }

  eliminatedphoto(ind) {
    this.photosList.splice(ind, 1);
    if (!this.edit) {
      this.photos.data.splice(ind, 1);
    }else{
      let inx= this.photosList.length - ind - 1
      this.photos.data.splice(inx, 1);
    }

    if (this.choosePicture >= this.photosList.length) {

      this.choosePicture = this.photosList.length - 1
    }
  }

  selectPhoto(ind: number) {
    this.choosePicture = ind
  }

  nameRepeatedValidator() {
    return (control: AbstractControl): Observable<{ 'nameRepeatedValidator': boolean }> => {
      const value = control.value.toUpperCase().trim();
      if (this.edit) {
        if (this.data.sku.toUpperCase() == value) {
          return of(null)
        }
        else {
          return this.dbs.getProductsList().pipe(
            map(res => !!res.find(el => el.sku.toUpperCase() == value) ? { nameRepeatedValidator: true } : null))
        }
      }
      else {
        return this.dbs.getProductsList().pipe(
          map(res => !!res.find(el => el.sku.toUpperCase() == value) ? { nameRepeatedValidator: true } : null))
      }
    }
  }

  validateCategory() {
    return (control: AbstractControl): Observable<{ 'validateCategory': boolean }> => {
      const value = control.value.toUpperCase().trim();
      return of(this.categories).pipe(
        map(res => res.find(el => el.toUpperCase() == value) ? null : { validateCategory: true }))
    }
  }

  addSerie() {
    let sku = this.firstFormGroup.get('sku').value
    let value = this.thirdFormGroup.get('series').value
    if (value.toLowerCase().includes(sku.toLowerCase())) {
      let real = value.slice(sku.length)
      this.seriesList.push(real)
    } else {
      this.seriesList.push(value)
    }


    this.thirdFormGroup.get('stock').setValue(this.seriesList.length)
    this.thirdFormGroup.get('series').setValue('')

  }

  removeSerie(i) {
    this.seriesList.splice(i, 1)
    this.thirdFormGroup.get('stock').setValue(this.seriesList.length)
  }

  addWarehouse() {
    this.thirdFormGroup.markAsPristine();
    this.thirdFormGroup.markAsUntouched();

    let ind = this.warehouseList.findIndex(el => el.warehouse == this.thirdFormGroup.get('warehouse').value)
    if (ind >= 0) {
      this.warehouseList[ind]['stock'] += this.thirdFormGroup.get('stock').value
      this.warehouseList[ind]['series'].concat(this.seriesList)
    } else {
      this.warehouseList.push({
        warehouse: this.thirdFormGroup.get('warehouse').value,
        stock: this.thirdFormGroup.get('stock').value,
        series: this.seriesList
      })
    }

    this.dataSource.data = this.warehouseList

    this.seriesList = []
    this.thirdFormGroup.reset()
  }

  removeWarehouse(i) {
    this.warehouseList.splice(i, 1)
  }

  editWarehouse(i) {
    let data = this.warehouseList[i]
    this.thirdFormGroup.get('warehouse').setValue(data['warehouse'])
    this.thirdFormGroup.get('stock').setValue(data['stock'])
    this.seriesList = data.series
    this.warehouseList.splice(i, 1)
  }

  saveProduct() {
    this.loading.next(true)
    let cat = this.firstFormGroup.get('category').value.split(' >> ')
    let stock = this.warehouseList.map(el => el.stock).reduce((a, b) => a + b, 0)
    let newProduct: Product = {
      additionalDescription: this.secondFormGroup.get('additionalDescription').value,
      category: cat[0],
      colors: this.colorSelect,
      subcategory: cat.length > 1 ? cat[1] : null,
      subsubcategory: cat.length > 2 ? cat[2] : null,
      brand: this.secondFormGroup.get('brand').value,
      createdAt: new Date(),
      createdBy: null,
      editedAt: new Date(),
      editedBy: null,
      description: this.firstFormGroup.get('description').value,
      id: '',
      photoURL: '',
      gallery: [],
      priceMin: this.firstFormGroup.get('priceMin').value,
      priceMay: this.firstFormGroup.get('priceMax').value,
      priority: 1,
      promo: false,
      promoData: null,
      published: true,
      realStock: stock,
      virtualStock: stock,
      warehouse: this.warehouseList.map(el => el.warehouse),
      sku: this.firstFormGroup.get('sku').value,
      weight: this.firstFormGroup.get('weight').value,
      code: this.firstFormGroup.get('code').value,
      model: this.secondFormGroup.get('model').value,
      guarantee: this.secondFormGroup.get('guarantee').value,
      timeguarantee: this.secondFormGroup.get('timeguarantee').value,
      purchaseNumber: 0
    }

    this.createProduct(newProduct)

  }

  createProduct(newProduct: Product) {
    this.auth.user$.pipe(take(1)).subscribe(user => {
      const batch = this.afs.firestore.batch()
      const productRef = this.afs.firestore.collection(`/db/aitec/productsList`).doc();
      let photos = [...this.photos.data.map(el => this.dbs.uploadPhotoProduct(newProduct.sku, newProduct.sku, el))]


      forkJoin(photos).pipe(
        takeLast(1),
      ).subscribe((res: string[]) => {
        newProduct.gallery = [...this.photos.data.map((el, i) => res[i])]

        newProduct.id = productRef.id
        newProduct.photoURL = res[this.choosePicture]
        newProduct.editedBy = user
        newProduct.createdBy = user

        this.warehouseList.forEach(el => {
          const warehouseRef = this.afs.firestore.collection(`/db/aitec/warehouse`).doc();
          batch.set(warehouseRef, {
            id: warehouseRef.id,
            idProduct: newProduct.id,
            skuProduct: newProduct.sku,
            warehouse: el.warehouse,
            realStock: el.stock,
            virtualStock: el.stock,
            series: el.series
          })
        })

        batch.set(productRef, newProduct)

        batch.commit().then(() => {
          this.loading.next(false)
          this.snackBar.open('El nuevo producto fue creado satisfactoriamente', 'Aceptar', { duration: 5000 });
          this.router.navigate(['/admin/products'])

        })

      })
    })

  }

  editProduct() {
    //const batch = this.afs.firestore.batch()
    this.auth.user$.pipe(take(1)).subscribe(user => {
      const batch = this.afs.firestore.batch()
      const productRef = this.afs.firestore.collection(`/db/aitec/productsList`).doc(this.data.id);
      let cat = this.firstFormGroup.get('category').value.split(' >> ')
      let newProduct = {
        additionalDescription: this.secondFormGroup.get('additionalDescription').value,
        category: cat[0],
        colors: this.colorSelect,
        subcategory: cat.length > 1 ? cat[1] : null,
        subsubcategory: cat.length > 2 ? cat[2] : null,
        brand: this.secondFormGroup.get('brand').value,
        description: this.firstFormGroup.get('description').value,
        price: this.firstFormGroup.get('priceMin').value,
        priceMin: this.firstFormGroup.get('priceMin').value,
        priceMay: this.firstFormGroup.get('priceMax').value,
        weight: this.firstFormGroup.get('weight').value,
        code: this.firstFormGroup.get('code').value,
        model: this.secondFormGroup.get('model').value,
        guarantee: this.secondFormGroup.get('guarantee').value,
        timeguarantee: this.secondFormGroup.get('timeguarantee').value,
        gallery: this.photosList.filter(el => !el.includes('data:')),
        photoURL: this.photosList[this.choosePicture],
        editedBy: user,
        editedAt: new Date()
      }

      if (this.photos.data.length) {
        let photos = [...this.photos.data.map(el => this.dbs.uploadPhotoProduct(this.data.sku, this.data.sku, el))]
        forkJoin(photos).pipe(
          takeLast(1),
        ).subscribe((res: string[]) => {
          let newPhotos = [...this.photos.data.map((el, i) => res[i])]
          newProduct.gallery = newProduct.gallery.concat(newPhotos)

          newProduct.photoURL = newProduct.gallery[this.choosePicture]


          batch.update(productRef, newProduct)

          batch.commit().then(() => {
            this.loading.next(false)
            this.snackBar.open('Se editó el producto satisfactoriamente', 'Aceptar', { duration: 5000 });
            this.router.navigate(['/admin/products'])

          })

        })
      }




    })


    /*
    const productRef = this.afs.firestore.collection(`/db/aitec/productsList`).doc(this.data.sku);
    let cat = this.firstFormGroup.get('category').value.split(' >> ')
    let stock = this.warehouseList.map(el => el.stock).reduce((a, b) => a + b, 0)
    let newProduct = {
      additionalDescription: this.secondFormGroup.get('additionalDescription').value,
      category: cat[0],
      colors: this.colorSelect,
      subcategory: cat.length > 1 ? cat[1] : null,
      subsubcategory: cat.length > 2 ? cat[2] : null,
      brand: this.secondFormGroup.get('brand').value,
      description: this.firstFormGroup.get('description').value,
      price: this.firstFormGroup.get('priceMin').value,
      priceMin: this.firstFormGroup.get('priceMin').value,
      priceMay: this.firstFormGroup.get('priceMax').value,
      weight: this.firstFormGroup.get('weight').value,
      code: this.firstFormGroup.get('code').value,
      model: this.secondFormGroup.get('model').value,
      guarantee: this.secondFormGroup.get('guarantee').value,
      timeguarantee: this.secondFormGroup.get('timeguarantee').value
    }

    this.warehouseList.forEach((el, ind) => {
      const warehouseRef = this.afs.firestore.collection(`/db/aitec/warehouse`).doc(this.data.sku + '-' + (ind+1));
      batch.set(warehouseRef, {
        product: this.data.sku,
        warehouse: el.warehouse,
        stock: el.stock,
        series: el.series
      })
    })

    batch.update(productRef, newProduct)

    batch.commit().then(() => {
      this.loading.next(false)
      this.snackBar.open('Se editó el producto satisfactoriamente', 'Aceptar', { duration: 5000 });
      this.router.navigate(['/admin/products'])

    })*/
  }

  onKeydown(event) {

    let permit =
      event.keyCode === 8 ||
      event.keyCode === 46 ||
      event.keyCode === 37 ||
      event.keyCode === 39 ||
      event.keyCode === 189;
    return permit ? true : !isNaN(Number(event.key));
  }
}
