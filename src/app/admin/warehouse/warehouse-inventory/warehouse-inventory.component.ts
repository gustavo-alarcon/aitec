import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, take, takeUntil, tap, timeout } from 'rxjs/operators';
import { Product } from 'src/app/core/models/product.model';
import { Warehouse } from 'src/app/core/models/warehouse.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { KardexDialogComponent } from '../kardex-dialog/kardex-dialog.component';
import { ListDialogComponent } from '../list-dialog/list-dialog.component';
import * as XLSX from 'xlsx';


@Component({
  selector: 'app-warehouse-inventory',
  templateUrl: './warehouse-inventory.component.html',
  styleUrls: ['./warehouse-inventory.component.scss']
})
export class WarehouseInventoryComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  //Forms
  categoryForm: FormControl;
  itemsFilterForm: FormControl;
  promoFilterForm: FormControl;
  warehouseForm: FormControl = new FormControl('');
  actionsForm: FormControl;
  
  

  //Table
  productsTableDataSource = new MatTableDataSource<Product>();
  productsDisplayedColumns: string[] = [
    'index', 'photoURL', 'description', 'sku', 'category', 'warehouseStock', 'realStock', 
    'virtualStock', 'list', 'actions'
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

  view: string = "Existencias";
  warehouses$: Observable<Warehouse[]>;

  actions: Array<string> = [
    'Existencias',
    'Ingresar productos',
    'Generar guía de remisión',
    'Retirar productos',
    'Registro movimientos'
  ]

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

  initForms() {
    this.categoryForm = this.fb.control("");
    this.itemsFilterForm = this.fb.control("");
    this.promoFilterForm = this.fb.control(false);
    this.actionsForm = this.fb.control('Existencias');
  }

  initObservables() {
    this.warehouses$ =
      this.dbs.getWarehouses();

    this.productsObservable$ =
      this.warehouseForm.valueChanges.pipe(
        startWith(''),
        switchMap(warehouseSelected => {
          this.loading.next(true);
          // return of(null);
          return this.dbs.getProductsByWarehouse(warehouseSelected)
        }),
        tap(res => {
          //console.log(res)
          this.productsTableDataSource.data = res;
          this.loading.next(false);
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

  openDialog(product: Product, warehouseId: string) {
    let dialogRef: MatDialogRef<ListDialogComponent>
    dialogRef = this.dialog.open(ListDialogComponent, {
      minWidth: '350px',
      data: {
        product,
        warehouseId
      }
    });
  }

  openKardex(product: Product, warehouseId: string) {
    let dialogRef: MatDialogRef<KardexDialogComponent>
    dialogRef = this.dialog.open(KardexDialogComponent, {
      data: {
        product,
        warehouseId
      }
    });
  }

  downloadXls(): void {
    
    let table_xlsx: any[] = [];
    let headersXlsx = [
      'Descripcion', 'Part Number', 'Categoría',
      'Stock Virtual', 'Stock Real', 'Stock en Almacén'
    ]

    table_xlsx.push(headersXlsx);

    this.productsTableDataSource.filteredData.forEach(product => {
      const temp = [
        product.description,
        product.sku,
        product["category"],
        product.products.reduce((prev,curr)=> (prev+curr.virtualStock), 0),
        product.products.reduce((prev,curr)=> (prev+curr.realStock), 0),
        product.warehouseStock[(<Warehouse>this.warehouseForm.value).id] ? product.warehouseStock[(<Warehouse>this.warehouseForm.value).id] : 0,
      ];

      table_xlsx.push(temp);
    })

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lista_de_productos');

    const name = 'Lista_de_productos_'+ (<Warehouse>this.warehouseForm.value).name + '.xlsx';
    XLSX.writeFile(wb, name);
  }

  changeView(view): void {
    this.view = view;
  }

}
