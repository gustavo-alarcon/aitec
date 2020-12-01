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
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-create-edit-product',
  templateUrl: './create-edit-product.component.html',
  styleUrls: ['./create-edit-product.component.scss']
})
export class CreateEditProductComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  init$:Observable<any>

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

  category$: Observable<string[]>
  brand$: Observable<any>

  separatorKeysCodes: number[] = [ENTER, COMMA];
  @ViewChild('colorInput', { static: false }) colorInput: ElementRef<HTMLInputElement>;
  @ViewChild('autoColor', { static: false }) matAutocomplete: MatAutocomplete;

  colorSelect: Array<any> = []

  filteredColor$: Observable<any>


  warehouseList: Array<any> = []
  seriesList: Array<string> = []

  dataSource = new MatTableDataSource();
  displayedColumns: string[] = ['warehouse', 'stock', 'serie', 'actions'];

  constructor(
    private dbs: DatabaseService,
    private fb: FormBuilder,
    private ng2ImgMax: Ng2ImgMaxService,
    private snackBar: MatSnackBar,
    private pl: PlacesService,
    private afs: AngularFirestore,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {

    this.init$ = this.route.params.pipe(
      switchMap(id=>{
        if(id.id){
          console.log('here');
          return this.dbs.getProduct(id.id).pipe(
            map(prod=>{
              console.log(prod);
              this.data = prod
              this.edit = true
              this.firstFormGroup.setValue({
                description: prod.description,
                sku: prod.sku,
                category: prod.category,
                priceMax: prod['priceMay']?prod['priceMay']:0,
                weight:  prod['weight']?prod['weight']:0,
                code: prod['code']?prod['code']:null,
                priceMin: prod['priceMin']
              })

              this.secondFormGroup.setValue({
                brand: prod.brand,
                model: prod['model']?prod['model']:null,
                additionalDescription: prod.additionalDescription,
                colors: null,
                guarantee: prod['guarantee'],
                timeguarantee: prod['timeguarantee']?prod['timeguarantee']:null
              })
              
              this.colorSelect=prod['colors']
              this.photosList = prod['gallery']

              if(prod['series']){
                
                this.warehouseList=prod['series']
                this.dataSource.data = this.warehouseList
              }

              return 2
            })
          )
        }else{
          return of(1)
        }
      }),
      tap(()=>{
        this.loading.next(false)
      })
    )

    this.firstFormGroup = this.fb.group({
      description: [null, Validators.required],
      sku: [null, [Validators.required], [this.nameRepeatedValidator()]],
      category: [null, Validators.required],
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

        return fil.filter(el => value ? el.toLowerCase().includes(value.toLowerCase()) : true)
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
        return this.pl.color.sort((a, b) => a.name.localeCompare(b.name))
          .filter(el => col ? el.name.toLowerCase().includes(col) : true)
      })
    )
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
          this.photos.data.push(
            new File(
              [result],
              formControlName +
              this.photosList.length +
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
          //this.snackbar.open('Por favor, elija una imagen en formato JPG, o PNG', 'Aceptar');
        }
      );
  }

  eliminatedphoto(ind) {
    this.photosList.splice(ind, 1);
    this.photos.data.splice(ind, 1);
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

  addSerie() {
    let value = this.thirdFormGroup.get('series').value.split('-').map(el => Number(el))
    for (let index = value[0]; index < value[1] + 1; index++) {
      this.seriesList.push(index)

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

    this.warehouseList.push({
      warehouse: this.thirdFormGroup.get('warehouse').value,
      stock: this.thirdFormGroup.get('stock').value,
      series: this.seriesList
    })
    this.dataSource.data = this.warehouseList

    this.seriesList = []
    this.thirdFormGroup.reset()
  }

  saveProduct(){
    this.loading.next(true)
    let cat = this.firstFormGroup.get('category').value.split(' >> ')
    let stock = this.warehouseList.map(el=>el.stock).reduce((a,b)=>a+b,0)
    let newProduct = {
      additionalDescription: this.secondFormGroup.get('additionalDescription').value,
      category: cat[0],
      colors:this.colorSelect,
      subcategory: cat.length>1?cat[1]:null,
      subsubcategory: cat.length>2?cat[2]:null,
      brand: this.secondFormGroup.get('brand').value,
      createdAt: new Date(),
      createdBy: null,
      description: this.firstFormGroup.get('description').value,
      id: this.firstFormGroup.get('sku').value,
      photoURL:'',
      gallery: [],
      price:this.firstFormGroup.get('priceMin').value,
      priceMin:this.firstFormGroup.get('priceMin').value,
      priceMay:this.firstFormGroup.get('priceMax').value,
      priority: 1,
      promo: false,
      promoData: null,
      published: true,
      realStock: stock,
      virtualStock: stock,
      warehouse:this.warehouseList.map(el=>el.warehouse),
      sku: this.firstFormGroup.get('sku').value,
      series:this.warehouseList,
      weight:this.firstFormGroup.get('weight').value,
      code:this.firstFormGroup.get('code').value,
      model:this.secondFormGroup.get('model').value,
      guarantee: this.secondFormGroup.get('guarantee').value,
      timeguarantee: this.secondFormGroup.get('timeguarantee').value
    }
    console.log(newProduct);
    this.createProduct(newProduct)
    
  }

  createProduct(newProduct){
    const batch = this.afs.firestore.batch()
    const productRef = this.afs.firestore.collection(`/db/aitec/productsList`).doc(newProduct.sku);

    let photos = [...this.photos.data.map(el => this.dbs.uploadPhotoProduct(newProduct.sku, el))]

    forkJoin(photos).pipe(
      takeLast(1),
    ).subscribe((res: string[]) => {
      newProduct.gallery = [...this.photos.data.map((el, i) => res[i])]
      newProduct.photoURL=res[0]

      batch.set(productRef,newProduct)
      batch.commit().then(()=>{
        console.log('here');
        this.loading.next(false)
      })
      
    })

    
  }

  onKeydown(event) {
    
    let permit =
      event.keyCode === 8 ||
      event.keyCode === 46 ||
      event.keyCode === 37 ||
      event.keyCode === 39||
      event.keyCode === 189;
    return permit ? true : !isNaN(Number(event.key));
  }
}
