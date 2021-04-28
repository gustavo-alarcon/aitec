import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MapBaseLayer } from '@angular/google-maps';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, forkJoin, Observable, of } from 'rxjs';
import { tap, startWith, switchMap, debounceTime, distinctUntilChanged, map, filter, take, shareReplay } from 'rxjs/operators';
import { Product, unitProduct } from 'src/app/core/models/product.model';
import { SerialNumber } from 'src/app/core/models/SerialNumber.model';
import { Warehouse } from 'src/app/core/models/warehouse.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { ProductCategoryComponent } from 'src/app/main/product-detail/product-category/product-category.component';

@Component({
  selector: 'app-warehouse-products-entry',
  templateUrl: './warehouse-products-entry.component.html',
  styleUrls: ['./warehouse-products-entry.component.scss']
})
export class WarehouseProductsEntryComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  entryInvoiceControl: FormControl;
  entryWaybillControl: FormControl;
  entryWarehouseControl: FormControl;
  entryProductControl: FormControl;
  entrySKUControl: FormControl;
  entryScanControl: FormControl;

  entryProducts$: Observable<Product[]>;
  warehouses$: Observable<Warehouse[]>;

  selectedProduct = new BehaviorSubject<any>(null);
  selectedProduct$ = this.selectedProduct.asObservable();

  serialList: Array<{
    barcode: string,
    color: {name: string, color: string},
    sku: string,
    product: Product
  }> = [];
  entryStock: number = 0;

  scanValidation = new BehaviorSubject<boolean>(false);
  scanValidation$ = this.scanValidation.asObservable();

  validatingScan = new BehaviorSubject<boolean>(false);
  validatingScan$ = this.validatingScan.asObservable();

  actionAddSerie = new BehaviorSubject<boolean>(false);
  actionAddSerie$ = this.actionAddSerie.asObservable();
  products$: Observable<Product[]>;
  warehouseproduct$: Observable<{ warehouse: Warehouse; product: Product; }>;
  costControl: FormControl;

  constructor(
    private fb: FormBuilder,
    public snackbar: MatSnackBar,
    private dbs: DatabaseService,
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.initObservables();
  }

  initForms() {
    this.entryInvoiceControl = this.fb.control('');
    this.entryWaybillControl = this.fb.control('');
    this.entryWarehouseControl = this.fb.control('', Validators.required);
    this.entryProductControl = this.fb.control('', Validators.required);
    this.entryScanControl = this.fb.control('');
  }

  initObservables() {
    this.warehouses$ = this.dbs.getWarehouses();

    this.products$ = this.dbs.getProductsOrdered().pipe(shareReplay(1))

    this.entryProducts$ = combineLatest(
      this.entryWarehouseControl.valueChanges
        .pipe(
          startWith(''),
          switchMap(warehouse => { return this.products$ })
        ),
      this.entryProductControl.valueChanges
        .pipe(
          startWith(''),
          debounceTime(300),
          distinctUntilChanged(),
          map(product => product.description ? product.description : product)
        )
    ).pipe(
      map(([products, entryProduct]) => {
        return products.filter(product => { return product.description.toLowerCase().includes(entryProduct.toLowerCase()) }).slice(0,25)
      })
    )

    this.warehouseproduct$ = combineLatest([
      this.entryWarehouseControl.valueChanges,
      this.entryProductControl.valueChanges
    ]).pipe(
      map(([warehouse, product]) => {
        if(warehouse && product){
          if(warehouse.id && product.id){
            return ({
              warehouse: warehouse,
              product: product
            })
          }
        }
        return null
        
      })
    )

    this.scanValidation$ = combineLatest([
      this.warehouseproduct$,
      this.entryScanControl.valueChanges.pipe(distinctUntilChanged(), filter(scan => !(scan === ''))),
      this.actionAddSerie$.pipe(distinctUntilChanged())
    ]).pipe(
      switchMap(([warehouseproduct, scan, add]) => {

        this.validatingScan.next(true);
        if (warehouseproduct && add) {
          return this.dbs.getSeriesOfProduct(scan, warehouseproduct.product.id).pipe(
            map(serials => { return !!serials.find(serial => serial.barcode === scan) ? true : false }),
            tap(res => {

              if (res) {
                this.entryScanControl.markAsTouched()
                this.entryScanControl.setErrors({
                  repeated: true
                });
                this.snackbar.open(`🚨 El código escaneado ya existe!`, 'Aceptar', {
                  duration: 6000
                });
              } else {
                if (add) {
                  this.addSerie(scan, warehouseproduct.product);
                }
                this.entryScanControl.setErrors(null)
              }

              this.validatingScan.next(false);
              this.actionAddSerie.next(false);

              return res;
            })
          )
        } else {
          this.entryScanControl.setErrors(null)
          this.validatingScan.next(false);
          this.actionAddSerie.next(false);
          return of(null)
        }
      })
    )

  }

  addSerie(barcode: string, product: Product) {
    let scan = barcode.trim();

    // First, lets check if the scanned code's color is part of our inventory (the sku, as barcode should start with sku)
    let validation = this.checkSKU(scan, product);

    if (validation.exists) {
      // If exist in our inventory (the cholor), then check if the barcode already exists in the product serial numbers
      if (this.checkSerialList(scan)) {
        this.entryScanControl.markAsTouched()
        this.entryScanControl.setErrors({
          repeated: true
        });
        this.snackbar.open(`🚨 El código escaneado ya se encuentra en la lista!`, 'Aceptar', {
          duration: 6000
        });
      } else {
        
        let data = {
          barcode: scan.trim(),
          color: validation.product.color,
          sku: validation.product.sku,
          product: product,
        }

        this.serialList.unshift(data);
        this.entryStock = this.serialList.length;
        this.entryScanControl.setValue('');
      }
    } else {
      // If not exists, we don't add anything
      this.snackbar.open(`🚨 Este color no existe!`, 'Aceptar', {
        duration: 6000
      });
    }
  }

  checkSKU(code: string, product: Product): { exists: boolean, product: unitProduct } {
    let exist = false;
    let skuData;

    product.products.every(product => {
      exist = code.startsWith(product.sku);
      skuData = product
      return !exist;
    });

    return { exists: exist, product: skuData };
  }


  showEntryProduct(product: Product): string | null {
    return product.description ? product.description : null;
  }

  selectedEntryProduct(event: any): void {
    this.selectedProduct.next(event.option.value);
  }

  selectedEntrySKU(event: any): void {
    this.entryStock = event.option.value.stock;
  }

  dispatchAddSerie(): void {
    console.log("emitting")
    this.actionAddSerie.next(true);
  }

  removeSerie(i) {
    this.serialList.splice(i, 1)
    this.entryStock = this.serialList.length;
  }

  checkSerialList(barcode: string): boolean {
    let exist = false;

    this.serialList.every(serie => {
      exist = serie.barcode === barcode;
      return !exist
    })

    return exist;
  }

  addNewSKUToProduct(product: Product): void {
    console.log('new sku');
  }

  save(): void {
    this.loading.next(true);
    if (this.serialList.length > 0) {

      this.auth.user$
        .pipe(
          take(1),
          switchMap(user => {
            // Save serial numbers in series collection
            // Add quantity to virtual stock and real stock
            // Add entry to kardex
            return this.dbs.saveSerialNumbers(this.entryInvoiceControl.value,
              this.entryWaybillControl.value,
              this.serialList,
              this.entryWarehouseControl.value,
              user)
          })
        )
        .subscribe(batch => {
          batch.commit()
            .then(() => {
              this.loading.next(false);
              this.serialList =[];
              this.snackbar.open('✅ Números de serie almacenados con éxito!', 'Aceptar', {
                duration: 6000
              });
            })
            .catch(err => {
              console.log(err);
              this.loading.next(false);
              this.snackbar.open('🚨 Hubo un error almacenando los números de serie!', 'Aceptar', {
                duration: 6000
              });
            })
        })

    } else {
      this.snackbar.open('🚨 No hay números de serie!', 'Aceptar', {
        duration: 6000
      });
    }
  }

}
