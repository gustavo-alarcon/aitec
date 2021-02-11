import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, take, takeUntil, tap, timeout } from 'rxjs/operators';
import { Product } from 'src/app/core/models/product.model';
import { Warehouse } from 'src/app/core/models/warehouse.model';
import { WarehouseProduct } from 'src/app/core/models/warehouseProduct.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-warehouse-inventory',
  templateUrl: './warehouse-inventory.component.html',
  styleUrls: ['./warehouse-inventory.component.scss']
})
export class WarehouseInventoryComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  //Forms
  categoryForm: FormControl;
  itemsFilterForm: FormControl;
  promoFilterForm: FormControl;
  warehouseForm: FormControl = new FormControl('');
  entryWarehouseControl: FormControl;
  entryProductControl: FormControl;
  entrySKUControl: FormControl;
  entryScanControl: FormControl;

  //Table
  productsTableDataSource = new MatTableDataSource<Product>();
  productsDisplayedColumns: string[] = [
    'index', 'photoURL', 'description', 'sku', 'warehouse', 'category', 'virtualStock',
    'realStock', 'list', 'actions'
  ]

  productsObservable$: Observable<Product[]>
  @ViewChild('productsPaginator', { static: false }) set content(paginator1: MatPaginator) {
    this.productsTableDataSource.paginator = paginator1;
  }

  @ViewChild(MatSort, { static: false }) set content2(sort: MatSort) {
    this.productsTableDataSource.sort = sort;
  }

  //Observables
  categoryObservable$: Observable<any>
  categoryList$: Observable<any>
  filter$: Observable<boolean>


  //Variables
  defaultImage = "../../../../assets/icons/aitec-192x192.png";

  //noResult
  noResult$: Observable<string>;
  noResultImage: string = '';

  categorySelected: boolean = false;

  view: string = "products";
  warehouses$: Observable<Warehouse[]>;
  entryProducts$: Observable<WarehouseProduct[]>;

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
    public auth: AuthService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {

    this.initForms();
    this.initObservables();
  }

  ngOnDestroy(): void {
    this.closeSubscriptions.next(true);
  }

  initForms() {
    this.categoryForm = this.fb.control("");
    this.itemsFilterForm = this.fb.control("");
    this.promoFilterForm = this.fb.control(false);
    this.entryWarehouseControl = this.fb.control('', Validators.required);
    this.entryProductControl = this.fb.control('', Validators.required);
    // this.entrySKUControl = this.fb.control('', Validators.required);
    this.entryScanControl = this.fb.control('');
  }

  initObservables() {
    this.warehouses$ = this.dbs.getWarehouseList();

    this.productsObservable$ = combineLatest(
      this.dbs.getWarehouseListValueChanges(),
      this.dbs.getProductsListValueChanges(),
      this.warehouseForm.valueChanges.pipe(
        startWith('Todos')
      )).pipe(
        map(([warehouse, products, filt]) => {
          return warehouse.map(el => {
            el['product'] = products.filter(li => li.id == el['idProduct'])[0]
            return el
          }).filter(wr => wr['product']).filter(ol => {
            return filt != 'Todos' ? ol.warehouse == filt : true
          })
        }),
        tap(res => {
          this.productsTableDataSource.data = res
          this.loading.next(false)
        })
      )

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
      map(([warehouse, product, scan, add]) => {

        this.validatingScan.next(true);
        if (warehouse && product) {
          this.dbs.getProductSerialNumbers(warehouse.id, product.id).pipe(
            take(1),
            map(serials => { return !!serials.find(serial => serial.barcode === scan) ? true : false }),
          ).subscribe(res => {
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
        } else {
          this.entryScanControl.setErrors(null)
          this.validatingScan.next(false);
          this.actionAddSerie.next(false);
          return false
        }
      })
    )

  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.productsTableDataSource.filter = filterValue.trim().toLowerCase();

    if (this.productsTableDataSource.paginator) {
      this.productsTableDataSource.paginator.firstPage();
    }
  }

  showCategory(category: any): string | null {
    return category ? category.name : null
  }


  downloadXls(): void {
    /*
    let table_xlsx: any[] = [];
    let headersXlsx = [
      'Descripcion', 'SKU', 'Categoría', 'Precio',
      'Descripción de Unidad', 'Abreviación', 'Stock Real', 'Mínimio de alerta', 'Publicado'
    ]

    table_xlsx.push(headersXlsx);

    this.productsTableDataSource.filteredData.forEach(product => {
      const temp = [
        product.description,
        product.sku,
        product.category,
        product.price,
        product.unit.description,
        product.unit.abbreviation,
        product.realStock,
        product.alertMinimum,
        product.published ? "Sí" : "No"
      ];

      table_xlsx.push(temp);
    })

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lista_de_productos');

    const name = 'Lista_de_productos' + '.xlsx';
    XLSX.writeFile(wb, name);*/
  }

  changeView(view): void {
    this.view = view;
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
        this.snackbar.open(`🚨 El código escaneado ya se encuentra en la lista!`, 'Aceptar', {
          duration: 6000
        });
      } else {
        this.serialList.unshift(scan);
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

  checkSKU(code: string): {exists: boolean, sku: string} {
    let product = this.entryProductControl.value;
    let exist = false;
    let sku: string;

    product.skuArray.every(sku => {
      exist = code.startsWith(sku);
      sku = sku
      return !exist;
    });

    return {exists: exist, sku: sku};
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
          take(1)
        )
        .subscribe(user => {

        })

    } else {
      this.snackbar.open('🚨 No hay números de serie!', 'Aceptar', {
        duration: 6000
      });
    }
  }

}
