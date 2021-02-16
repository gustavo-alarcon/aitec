import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, forkJoin, Observable, of } from 'rxjs';
import { tap, startWith, switchMap, debounceTime, distinctUntilChanged, map, filter, take } from 'rxjs/operators';
import { Warehouse } from 'src/app/core/models/warehouse.model';
import { WarehouseProduct } from 'src/app/core/models/warehouseProduct.model';
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

  warehouseForm: FormControl;
  entryInvoiceControl: FormControl;
  entryWaybillControl: FormControl;
  entryWarehouseControl: FormControl;
  entryProductControl: FormControl;
  entrySKUControl: FormControl;
  entryScanControl: FormControl;

  entryProducts$: Observable<WarehouseProduct[]>;
  warehouses$: Observable<Warehouse[]>;

  selectedProduct = new BehaviorSubject<any>(null);
  selectedProduct$ = this.selectedProduct.asObservable();

  serialList: Array<any> = [];
  entryStock: number = 0;

  closeSubscriptions = new BehaviorSubject<boolean>(false);
  closeSubscriptions$ = this.closeSubscriptions.asObservable();

  scanValidation = new BehaviorSubject<boolean>(false);
  scanValidation$ = this.scanValidation.asObservable();

  validatingScan = new BehaviorSubject<boolean>(false);
  validatingScan$ = this.validatingScan.asObservable();

  actionAddSerie = new BehaviorSubject<boolean>(false);
  actionAddSerie$ = this.actionAddSerie.asObservable();

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
    this.warehouseForm = this.fb.control('');
    this.entryWarehouseControl = this.fb.control('', Validators.required);
    this.entryProductControl = this.fb.control('', Validators.required);
    this.entryScanControl = this.fb.control('');
  }

  initObservables() {
    this.warehouses$ =
      this.dbs.getWarehouses()
        // .pipe(
        //   tap(warehouses => {
        //     if (warehouses.length) {
        //       this.warehouseForm.setValue(warehouses[0])
        //     }
        //   })
        // )

    this.entryProducts$ = combineLatest(
      this.entryWarehouseControl.valueChanges
        .pipe(
          startWith(''),
          switchMap(warehouse => { return this.dbs.getWarehouseProducts(warehouse) })
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
        return products.filter(product => { return product.description.toLowerCase().includes(entryProduct.toLowerCase()) })
      })
    )

    this.scanValidation$ = combineLatest(
      this.entryWarehouseControl.valueChanges,
      this.entryProductControl.valueChanges,
      this.entryScanControl.valueChanges.pipe(distinctUntilChanged(), filter(scan => !(scan === ''))),
      this.actionAddSerie$.pipe(distinctUntilChanged())
    ).pipe(
      switchMap(([warehouse, product, scan, add]) => {

        this.validatingScan.next(true);
        if (warehouse && product) {
          return this.dbs.getProductSerialNumbers(warehouse.id, product.id).pipe(
            map(serials => { return !!serials.find(serial => serial.barcode === scan) ? true : false }),
            tap(res => {

              if (res) {
                this.entryScanControl.markAsTouched()
                this.entryScanControl.setErrors({
                  repeated: true
                });
                this.snackbar.open(`🚨 El código escaneado ya existe en este almacén!`, 'Aceptar', {
                  duration: 6000
                });
              } else {
                if (add) {
                  this.addSerie();
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

  showEntryProduct(product: WarehouseProduct): string | null {
    return product.description ? product.description : null;
  }

  selectedEntryProduct(event: any): void {
    this.selectedProduct.next(event.option.value);
  }

  showEntrySKU(product: any): string | null {
    return product ? product.sku + ' | ' + product.color.name : null
  }

  selectedEntrySKU(event: any): void {
    this.entryStock = event.option.value.stock;
    console.log(event.option.value);
    console.log(this.entryProductControl.value);
  }

  addSerie() {
    let scan = this.entryScanControl.value.trim();

    // First, lets check if the scanned code is part of our inventory
    let validation = this.checkSKU(scan);

    if (validation.exists) {
      // If exist in our inventory, then check if the barcode already exists in the product serial numbers
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
          barcode: scan,
          color: validation.product.color,
          sku: validation.product.sku
        }

        this.serialList.unshift(data);
        this.entryStock = this.serialList.length;
        this.entryScanControl.setValue('');
      }
    } else {
      // If not exists, we have to add the SKU to the current product
      this.addNewSKUToProduct(this.entryProductControl.value);
    }
  }

  dispatchAddSerie(): void {
    this.actionAddSerie.next(true);
  }

  removeSerie(i) {
    this.serialList.splice(i, 1)
    this.entryStock = this.serialList.length;
  }

  checkSKU(code: string): { exists: boolean, product: {color: {color: string, name: string}, sku: string} } {
    let product = this.entryProductControl.value;
    let exist = false;
    let skuData;

    product.skuArray.every(product => {
      exist = code.startsWith(product.sku);
      skuData = product
      return !exist;
    });

    return { exists: exist, product: skuData };
  }

  checkSerialList(barcode: string): boolean {
    let exist = false;

    this.serialList.every(serie => {
      exist = serie === barcode;
      return !exist
    })

    return exist;
  }

  addNewSKUToProduct(product: WarehouseProduct): void {
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
              this.entryProductControl.value,
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
