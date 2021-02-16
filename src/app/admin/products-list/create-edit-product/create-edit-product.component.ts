import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
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
import { Category } from 'src/app/core/models/category.model';

@Component({
  selector: 'app-create-edit-product',
  templateUrl: './create-edit-product.component.html',
  styleUrls: ['./create-edit-product.component.scss']
})
export class CreateEditProductComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  loadSave: boolean = false

  init$: Observable<any>

  edit: boolean = false
  data: Product = null

  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  thirdFormGroup: FormGroup;
  zoneForm: FormGroup;

  existDistrict: Array<any> = []

  photosList: Array<any> = [];
  photos: Array<{
    resizing$: Observable<boolean>;
    data: File[];
  }> = []
  deletePhotos: Array<any> = []

  choosePicture: number = 0

  category$: Observable<Category[]>
  brand$: Observable<any>
  guarantee$: Observable<any>

  categories: Array<Category> = []

  separatorKeysCodes: number[] = [ENTER, COMMA];
  @ViewChild('colorInput', { static: false }) colorInput: ElementRef<HTMLInputElement>;
  @ViewChild('autoColor', { static: false }) matAutocomplete: MatAutocomplete;

  colorSelect: Array<any> = []

  colorCount = new BehaviorSubject<number>(0);
  colorCount$: Observable<number> = this.colorCount.asObservable();

  filteredColor$: Observable<any>
  itemsFormArray: FormArray;
  totalItems$: Observable<number>;

  warehouses: Array<any> = []

  warehouseList: Array<any> = []
  seriesList: Array<any> = []

  dataSource = new MatTableDataSource();
  displayedColumns: string[] = ['warehouse', 'stock', 'serie', 'actions'];

  skuArray: Observable<any>
  skuList: Array<string> = []

  config = {
    editable: true,
    placeholder: 'Descripción o contenido del módulo',
    tabsize: 2,
    height: '350px',
    lang: 'es-ES',
    toolbar: [
      ['fontsize', ['fontsize', 'color']],
      ['style', ['bold', 'italic', 'underline', 'clear']],
      ['para', ['style', 'ul', 'ol', 'paragraph', 'height']],
    ]
  };

  noColor$: Observable<any>

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

    this.itemsFormArray = this.fb.array([])

    this.firstFormGroup = this.fb.group({
      description: [null, Validators.required],
      code: [null, [Validators.required], [this.nameRepeatedValidator()]],
      category: [null, [Validators.required, this.autocompleteObjectValidator()]],
      priceMax: [null, [Validators.required, Validators.min(0)]],
      cost: [null, [Validators.required, Validators.min(0)]],
      priceMin: [null, [Validators.required, Validators.min(0)]]
    })

    this.secondFormGroup = this.fb.group({
      brand: [null, Validators.required],
      model: [null, Validators.required],
      weight: [null, [Validators.required, Validators.min(0)]],
      additionalDescription: [null, Validators.required],
      colors: [null],
      noColors: [false],
      guarantee: [null, Validators.required],
      timeguarantee: [null]
    })

    this.thirdFormGroup = this.fb.group({
      sku: [null],
      warehouse: [null, Validators.required],
      stock: [null],
      series: [null]
    })

    this.init$ = combineLatest(
      this.route.params,
      this.dbs.getAllCategories(),
      this.dbs.getWarehouses()
    ).pipe(
      switchMap(([id, categories, warehouses]) => {
        this.warehouses = warehouses
        this.categories = categories

        if (id.id) {
          this.edit = true
          return this.dbs.getProduct(id.id).pipe(
            map(prod => {
              this.data = prod
              this.edit = true
              this.firstFormGroup.setValue({
                description: prod.description,
                category: prod.idCategory ? categories.find(ct => ct.id === prod.idCategory) : null,
                priceMax: prod.priceMay,
                cost: prod.cost,
                code: prod.sku,
                priceMin: prod.priceMin
              })

              this.secondFormGroup.setValue({
                brand: prod.brand,
                model: prod.model ? prod.model : null,
                additionalDescription: prod.additionalDescription,
                colors: null,
                weight: prod.weight,
                guarantee: prod.guarantee,
                timeguarantee: prod.guarantee ? prod.timeguarantee : null,
                noColors: prod.noColor
              })

              this.secondFormGroup.get('guarantee').setValue(prod.guarantee)
              this.colorSelect = prod.colors
              this.colorCount.next(prod.colors.length)

              this.photosList = prod.gallery.map((gal, g) => {
                return {
                  img: gal.photoURL,
                  sku: prod.skuArray.indexOf(gal.sku),
                  ind: g
                }
              })

              this.choosePicture = prod.indCover
              this.skuList = prod.skuArray
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


    this.category$ = combineLatest(
      this.firstFormGroup.get('category').valueChanges.pipe(
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
      this.secondFormGroup.get('brand').valueChanges.pipe(
        startWith<any>(''),
        map(el => typeof el == 'string' ? el : el['name'])
      ),
      this.dbs.getBrands()
    ).pipe(
      map(([value, brands]) => {

        return brands.filter(el => value ? el['name'].toLowerCase().includes(value.toLowerCase()) : true)
      })
    )

    this.filteredColor$ = this.secondFormGroup.get('colors').valueChanges.pipe(
      startWith<any>(''),
      map(col => {
        let value = col ? typeof col == 'string' ? col : col.name : ''
        return this.pl.color.sort((a, b) => a.name.localeCompare(b.name))
          .filter(el => col ? el.name.toLowerCase().includes(value.toLowerCase()) : true)
      })
    )

    this.totalItems$ = this.colorCount$.pipe(
      tap((total) => {
        let leng = this.itemsFormArray.length

        if (total > leng) {
          let number = total - leng
          for (let i = 0; i < number; i++) {
            this.itemsFormArray.push(new FormControl(this.edit ? this.data.skuArray[i] : '', [Validators.required], [this.skuRepeatedValidator(i)]));

            this.photos.push({
              resizing$: of(false),
              data: []
            })
          }
        } else if (leng > total) {

          for (let i = total; i < leng; i++) {
            this.itemsFormArray.removeAt(i)
          }
        }

      })
    );

    this.guarantee$ = this.secondFormGroup.get('guarantee').valueChanges.pipe(
      map(bol => {
        if (bol) {
          this.secondFormGroup.get('timeguarantee').setValidators(Validators.required)
          return true
        } else {
          this.secondFormGroup.get('timeguarantee').setValidators(null)
          return false
        }
      })
    )

    this.zoneForm = this.fb.group({
      name: ['', [Validators.required], [this.repeatedValidator()]],
      delivery: ['', [Validators.required]]
    })


    this.skuArray = this.itemsFormArray.valueChanges.pipe(
      tap(res => {
        this.skuList = res

        if (res.length == 1) {
          this.thirdFormGroup.get('sku').setValue(res[0])
          this.thirdFormGroup.get('sku').disable()
        } else {
          this.thirdFormGroup.get('sku').setValue(null)
          this.thirdFormGroup.get('sku').enable()
        }
      })
    )

    this.noColor$ = this.secondFormGroup.get('noColors').valueChanges.pipe(
      startWith(false),
      map(res => {
        if (res) {
          this.colorSelect = []
          this.itemsFormArray.clear()
          this.itemsFormArray.push(new FormControl('', [Validators.required], [this.skuRepeatedValidator(0)]));
          this.secondFormGroup.get('colors').disable()
        } else {
          this.secondFormGroup.get('colors').enable()
          this.itemsFormArray.clear()
        }
        return res
      })
    )
  }

  goBack() {
    this.location.back();
  }

  showBrand(staff) {
    return staff ? staff['name'] : undefined;
  }

  showSelected(staff): string | undefined {
    return staff ? staff['completeName'] : undefined;
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
      this.colorCount.next(this.colorSelect.length)
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    let val = event.option.value

    if (this.colorSelect.findIndex(el => el.name == val.name) > -1) {
      this.snackBar.open("Color repetido", "Cerrar", {
        duration: 6000
      })

    } else {
      this.colorSelect.push(val);
      this.colorCount.next(this.colorSelect.length)
    }
    this.colorInput.nativeElement.value = '';
  }

  //zonas

  addDistrict() {
    let district = this.zoneForm.value
    let min = [district]
    let before = [...this.existDistrict]
    this.existDistrict = min.concat(before)

    this.zoneForm = this.fb.group({
      name: ['', [Validators.required], [this.repeatedValidator()]],
      delivery: ['', [Validators.required]]
    })

  }

  removeDelivery(ind) {
    this.existDistrict.splice(ind, 1)
  }

  //fotos
  addNewPhoto(formControlName: string, image: File[], ind) {
    if (image.length === 0) return;
    let reader = new FileReader();
    this.photos[ind].resizing$ = of(true);

    this.ng2ImgMax
      .resizeImage(image[0], 10000, 426)
      .pipe(take(1))
      .subscribe(
        (result) => {
          let d = new Date();
          let n = d.getTime();

          let name = formControlName + n +
            result.name.match(/\..*$/)
          this.photos[ind].data.push(
            new File(
              [result],
              name
            )
          );
          reader.readAsDataURL(image[0]);
          reader.onload = (_event) => {
            this.photosList.push({
              img: reader.result,
              sku: ind,
              name: name
            });
            this.photos[ind].resizing$ = of(false);
          };
        },
        (error) => {
          this.photos[ind].resizing$ = of(false);
          this.snackBar.open('Por favor, elija una imagen en formato JPG, o PNG', 'Aceptar');
        }
      );
  }

  filterPhotos(i) {
    return this.photosList.filter(el => el.sku == i)
  }

  eliminatedphoto(id, f, imag) {

    if (!this.edit) {
      this.photos[id].data.splice(f, 1);
    } else {
      let inx = this.filterPhotos(id).filter(el => el.img.includes('data')).findIndex(el => el.img == imag.img)
      if (inx >= 0) {
        this.photos[id].data.splice(inx, 1);
      }
      this.deletePhotos.push(imag.img)
    }

    if (this.choosePicture >= this.photosList.length) {
      this.choosePicture = this.photosList.length - 1
    }

    let indx = this.photosList.findIndex(el => el.img == imag.img)
    this.photosList.splice(indx, 1);
  }

  selectPhoto(img) {
    let inx = this.photosList.findIndex(el => el.img == img.img)
    this.choosePicture = inx
  }

  isSelected(img) {
    let inx = this.photosList.findIndex(el => el.img == img.img)
    return inx == this.choosePicture
  }

  //validadores
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

  skuRepeatedValidator(ind) {
    return (control: AbstractControl): Observable<{ 'skuRepeatedValidator': boolean }> => {
      const value = control.value.toUpperCase().trim();
      if (this.edit) {
        if (this.data.products[ind].sku.toUpperCase() == value) {
          return of(null)
        }
        else {
          return this.dbs.getProductsList().pipe(
            map(res => {
              let skus = res.map(prod => prod.skuArray).reduce((a, b) => a.concat(b), [])
              return skus.find(el => el == value) ? { skuRepeatedValidator: true } : null
            }))
        }
      }
      else {
        return this.dbs.getProductsList().pipe(
          map(res => {
            let skus = res.map(prod => prod.skuArray).reduce((a, b) => a.concat(b), [])
            return skus.find(el => el == value) ? { skuRepeatedValidator: true } : null
          }))
      }
    }
  }

  autocompleteObjectValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (typeof control.value === 'string') {
        return { 'validateName': { value: control.value } }
      }
      return null
    }
  }

  repeatedValidator() {
    return (control: AbstractControl) => {
      const value = control.value.toLowerCase();
      return of(this.existDistrict).pipe(
        map(res => {
          return res.findIndex(el => el['name'].toLowerCase() == value) >= 0 ? { repeatedValidator: true } : null
        }))
    }
  }

  //guardar en almacenes

  addSerie() {
    let sku = this.thirdFormGroup.get('sku').value
    let ind = this.skuList.indexOf(sku)
    if (sku) {
      let newSerie = {
        sku: this.thirdFormGroup.get('sku').value,
        serie: '',
        color: this.colorSelect[ind]
      }

      let value = this.thirdFormGroup.get('series').value
      if (value.toLowerCase().includes(sku.toLowerCase())) {
        newSerie.serie = value
        let exist = this.seriesList.findIndex(sr => sr.serie == value)
        if (exist == -1) {
          this.seriesList.push(newSerie)
        }

      } else {
        let real = sku + value
        newSerie.serie = real
        let exist = this.seriesList.findIndex(sr => sr.serie == real)
        if (exist == -1) {
          this.seriesList.push(newSerie)
        }
      }

      this.thirdFormGroup.get('stock').setValue(this.seriesList.length)
      this.thirdFormGroup.get('series').setValue('')
    } else {
      this.snackBar.open('Por favor, elija SKU', 'Aceptar');
    }
  }

  removeSerie(i) {
    this.seriesList.splice(i, 1)
    this.thirdFormGroup.get('stock').setValue(this.seriesList.length)
  }

  addWarehouse() {
    this.thirdFormGroup.markAsPristine();
    this.thirdFormGroup.markAsUntouched();

    let ind = this.warehouseList.findIndex(el => el.warehouse.id == this.thirdFormGroup.get('warehouse').value)
    if (ind >= 0) {

      this.warehouseList[ind]['stock'] += this.thirdFormGroup.get('stock').value
      this.warehouseList[ind]['series'] = this.warehouseList[ind]['series'].concat(this.seriesList)
    } else {
      this.warehouseList.push({
        warehouse: this.warehouses.find(wr => wr.id == this.thirdFormGroup.get('warehouse').value),
        stock: this.thirdFormGroup.get('stock').value,
        series: this.seriesList
      })
    }

    this.dataSource.data = this.warehouseList

    this.seriesList = []
    this.thirdFormGroup.reset()
    this.thirdFormGroup.get('sku').enable()
  }

  removeWarehouse(i) {
    this.warehouseList.splice(i, 1)
  }

  editWarehouse(i) {
    let data = this.warehouseList[i]
    this.thirdFormGroup.get('warehouse').setValue(data['warehouse']['id'])
    this.thirdFormGroup.get('stock').setValue(data['stock'])
    this.seriesList = data.series
    this.warehouseList.splice(i, 1)
  }

  saveProduct() {
    let phots = this.photos.map(el => el.data).reduce((a, b) => a.concat(b), [])

    if (!phots.length) {
      this.snackBar.open('Agregue una imagen', 'Aceptar', { duration: 5000 });
      return;
    }
    this.loading.next(true)
    this.loadSave = true
    let cat = this.firstFormGroup.get('category').value.completeName.split(' >> ')
    let stock = this.warehouseList.map(el => el.stock).reduce((a, b) => a + b, 0)

    let newProduct: Product = {
      additionalDescription: this.secondFormGroup.get('additionalDescription').value,
      colors: this.colorSelect,
      category: cat[0],
      subcategory: cat.length > 1 ? cat[1] : null,
      subsubcategory: cat.length > 2 ? cat[2] : null,
      idCategory: this.firstFormGroup.get('category').value.id,
      brand: this.secondFormGroup.get('brand').value,
      createdAt: new Date(),
      createdBy: null,
      editedAt: new Date(),
      editedBy: null,
      description: this.firstFormGroup.get('description').value,
      id: '',
      gallery: [],
      indCover: this.choosePicture,
      products: [],
      priceMin: this.firstFormGroup.get('priceMin').value,
      priceMay: this.firstFormGroup.get('priceMax').value,
      cost: this.firstFormGroup.get('cost').value,
      priority: 1,
      promo: false,
      promoData: null,
      published: true,
      sku: this.firstFormGroup.get('code').value,
      weight: this.secondFormGroup.get('weight').value,
      model: this.secondFormGroup.get('model').value,
      guarantee: this.secondFormGroup.get('guarantee').value,
      timeguarantee: this.secondFormGroup.get('timeguarantee').value,
      noColor: this.secondFormGroup.get('noColors').value,
      realStock: stock,
      skuArray: this.skuList,
      warehouse: [],
      zones: this.existDistrict
    }

    this.createProduct(newProduct)

  }

  createProduct(newProduct: Product) {
    let phots = this.photos.map(el => el.data).reduce((a, b) => a.concat(b), [])

    let skuPhotos = this.photosList.filter(p => p.img.includes('data:')).map(pho => {
      return {
        sku: this.skuList[pho.sku],
        name: pho['name']
      }
    })

    let serList = this.warehouseList.map(el => el.series).reduce((a, b) => a.concat(b), [])

    this.auth.user$.pipe(take(1)).subscribe(user => {
      const batch = this.afs.firestore.batch()
      const productRef = this.afs.firestore.collection(`/db/aitec/productsList`).doc();
      let photos = [...phots.map(el => this.dbs.uploadPhotoProduct(newProduct.sku, el))]


      forkJoin(photos).pipe(
        takeLast(1),
      ).subscribe((res: string[]) => {
        newProduct.gallery = [...skuPhotos.map((el, i) => {
          return {
            photoURL: res[i],
            photoPath: `/productsList/${newProduct.sku}/${el.name}`,
            sku: el.sku
          }
        })]

        newProduct.products = [...this.colorSelect.map((col, ind) => {
          return {
            sku: this.skuList[ind],
            color: col,
            gallery: newProduct.gallery.filter(sk => sk.sku == this.skuList[ind]),
            stock: serList.filter(ser => ser.sku == this.skuList[ind]).length
          }
        })]

        newProduct.id = productRef.id
        newProduct.editedBy = user
        newProduct.createdBy = user

        this.warehouseList.forEach(el => {
          const warehouseRef = this.afs.firestore.collection(`/db/aitec/warehouses/${el.warehouse.id}/products`).doc(newProduct.id);
          batch.set(warehouseRef, {
            id: newProduct.id,
            description: newProduct.description,
            createdAt: new Date(),
            createdBy: user,
            editedAt: new Date(),
            editedBy: user,
            sku: newProduct.sku,
            weight: newProduct.weight,
            skuArray: newProduct.skuArray
          })

          el.series.forEach(lo => {
            const serieRef = this.afs.firestore.collection(`/db/aitec/warehouses/${el.warehouse.id}/products/${newProduct.id}/series`).doc();
            batch.set(serieRef, {
              id: serieRef.id,
              createdAt: new Date(),
              createdBy: user,
              editedAt: new Date(),
              editedBy: user,
              sku: lo.sku,
              barcode: lo.serie,
              color: lo.color,
              status: 'stored'
            })
          })
        })

        batch.set(productRef, newProduct)

        batch.commit().then(() => {
          this.loading.next(false)
          this.loadSave = false
          this.snackBar.open('El nuevo producto fue creado satisfactoriamente', 'Aceptar', { duration: 5000 });
          this.router.navigate(['/admin/products'])

        })

      })
    })
  }

  editProduct() {


    let phots = this.photos.map(el => el.data).reduce((a, b) => a.concat(b), [])

    let skuPhotos = this.photosList.filter(p => p.img.includes('data:')).map(pho => {
      return {
        sku: this.skuList[pho.sku],
        name: pho['name']
      }
    })

    let deleteP = this.data.gallery.filter(gal => this.deletePhotos.includes(gal.photoURL))
    let originP = this.data.gallery.filter(gal => !this.deletePhotos.includes(gal.photoURL))

    let newProduct = {
      additionalDescription: this.secondFormGroup.get('additionalDescription').value,
      colors: this.colorSelect,
      idCategory: this.firstFormGroup.get('category').value.id,
      brand: this.secondFormGroup.get('brand').value,
      description: this.firstFormGroup.get('description').value,
      cost: this.firstFormGroup.get('cost').value,
      priceMin: this.firstFormGroup.get('priceMin').value,
      priceMay: this.firstFormGroup.get('priceMax').value,
      sku: this.firstFormGroup.get('code').value,
      weight: this.secondFormGroup.get('weight').value,
      model: this.secondFormGroup.get('model').value,
      guarantee: this.secondFormGroup.get('guarantee').value,
      timeguarantee: this.secondFormGroup.get('timeguarantee').value,
      gallery: originP,
      indCover: this.choosePicture
    }

    let oldP = {
      additionalDescription: this.data.additionalDescription,
      colors: this.data.colors,
      idCategory: this.data.idCategory ? this.data.idCategory : null,
      brand: this.data.brand,
      description: this.data.description,
      cost: this.data.cost,
      priceMin: this.data.priceMin,
      priceMay: this.data.priceMay,
      sku: this.data.sku,
      weight: this.data.weight,
      model: this.data.model,
      guarantee: this.data.guarantee,
      timeguarantee: this.data.timeguarantee,
      gallery: this.data.gallery,
      indCover: this.data.indCover
    }

    let change = JSON.stringify(newProduct) === JSON.stringify(oldP)

    if (!change) {
      this.loadSave = true
      const batch = this.afs.firestore.batch()
      const productRef = this.afs.firestore.collection(`/db/aitec/productsList`).doc(this.data.id);
      this.auth.user$.pipe(take(1)).subscribe(user => {
        newProduct['editedBy'] = user
        newProduct['editedAt'] = new Date()
        if (phots.length) {
          let photos = [...phots.map(el => this.dbs.uploadPhotoProduct(newProduct.sku, el))]
          forkJoin(photos).pipe(
            takeLast(1),
          ).subscribe((res: string[]) => {
            let newPhotos = [...skuPhotos.map((el, i) => {
              return {
                photoURL: res[i],
                photoPath: `/productsList/${newProduct.sku}/${el.name}`,
                sku: el.sku
              }
            })]

            newProduct.gallery = newProduct.gallery.concat(newPhotos)

            if (deleteP.length > 0) {
              let phot$ = deleteP.map(el => this.dbs.deletePhoto(el.photoPath))
              forkJoin(phot$).subscribe(res => {
                batch.update(productRef, newProduct)

                batch.commit().then(() => {
                  this.loading.next(false)
                  this.snackBar.open('Se editó el producto satisfactoriamente', 'Aceptar', { duration: 5000 });
                  this.router.navigate(['/admin/products'])
                  this.loadSave = false
                })
              })
            } else {
              batch.update(productRef, newProduct)

              batch.commit().then(() => {
                this.loading.next(false)
                this.snackBar.open('Se editó el producto satisfactoriamente', 'Aceptar', { duration: 5000 });
                this.router.navigate(['/admin/products'])
                this.loadSave = false
              })
            }
          })
        } else {
          if (deleteP.length > 0) {
            let phot$ = deleteP.map(el => this.dbs.deletePhoto(el.photoPath))
            forkJoin(phot$).subscribe(res => {
              batch.update(productRef, newProduct)

              batch.commit().then(() => {
                this.loading.next(false)
                this.snackBar.open('Se editó el producto satisfactoriamente', 'Aceptar', { duration: 5000 });
                this.router.navigate(['/admin/products'])
                this.loadSave = false
              })
            })
          } else {
            batch.update(productRef, newProduct)

            batch.commit().then(() => {
              this.loading.next(false)
              this.snackBar.open('Se editó el producto satisfactoriamente', 'Aceptar', { duration: 5000 });
              this.router.navigate(['/admin/products'])
              this.loadSave = false
            })
          }
        }
      })
    }

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
