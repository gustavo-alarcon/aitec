import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, switchMap, take, takeUntil, tap } from 'rxjs/operators';
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
  defaultImage = "../../../assets/images/icono-aitec-01.png";

  //noResult
  noResult$: Observable<string>;
  noResultImage: string = '';

  categorySelected: boolean = false;

  view: string = "products";
  warehouses$: Observable<Warehouse[]>;
  entryProducts$: Observable<WarehouseProduct[]>;

  selectedProduct = new BehaviorSubject<any>(null);
  selectedProduct$ = this.selectedProduct.asObservable();

  seriesList: Array<any> = [];
  entryStock: number = 0;

  closeSubscriptions = new BehaviorSubject<boolean>(false);
  closeSubscriptions$ = this.closeSubscriptions.asObservable();



  constructor(
    private fb: FormBuilder,
    public snackBar: MatSnackBar,
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
    this.entryScanControl = this.fb.control('', customValidators.barcodeAlreadyExists(this.dbs, this.entryWarehouseControl.value, this.entryProductControl.value));
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

  // openDialog(row) {
  //   this.dialog.open(ListDialogComponent, {
  //     data: {
  //       name: row.product.description,
  //       id: row.id
  //     }
  //   })
  // }


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

    // First, lets check if the SKU already exist in our skuArray
    if (this.checkSKU(scan)) {
      // If exist, then check if the barcode already exists in the product serial numbers
      this.seriesList.unshift(scan);
      this.entryStock = this.seriesList.length;
      this.entryScanControl.setValue('');

    } else {
      // If not exists, we have to add the SKU to the current product
      this.addNewSKUToProduct(this.entryProductControl.value);
    }
  }

  removeSerie(i) {
    this.seriesList.splice(i, 1)
    this.entryStock = this.seriesList.length;
  }

  checkSKU(code: string): boolean {
    let product = this.entryProductControl.value;
    let exist = false;

    product.skuArray.every(sku => {
      exist = code.startsWith(sku);
      return !exist;
    });

    return exist;
  }

  addNewSKUToProduct(product: WarehouseProduct): void {
    console.log('new sku');

  }

  save(): void {
    //
  }

}

export class customValidators {
  static barcodeAlreadyExists(dbs: DatabaseService, warehouse: Warehouse, product: WarehouseProduct) {
    return (control: AbstractControl) => {
      const barcode = control.value;
      console.log(barcode);
      console.log(warehouse);
      console.log(product);
      return dbs.getProductSerialNumbers(warehouse.id, product.id).pipe(
        debounceTime(500),
        tap(res => {
          console.log(res);
        }),
        map(serials => !!serials.find(serial => serial.barcode === barcode) ? { barcodeAlreadyExists: true } : null),
        take(1)
      )
    }
  }
}
