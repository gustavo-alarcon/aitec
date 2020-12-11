import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { Product } from 'src/app/core/models/product.model';
import { Warehouse } from 'src/app/core/models/warehouse.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { ListDialogComponent } from './list-dialog/list-dialog.component';

@Component({
  selector: 'app-warehouse',
  templateUrl: './warehouse.component.html',
  styleUrls: ['./warehouse.component.scss']
})
export class WarehouseComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  //Forms
  categoryForm: FormControl;
  itemsFilterForm: FormControl;
  promoFilterForm: FormControl;
  warehouseForm: FormControl = new FormControl('');
  entryWarehouseControl: FormControl;
  entryProductControl: FormControl;
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
  warehouses$: Observable<Warehouse>;
  entryProducts$: Observable<Product[]>

  constructor(
    private fb: FormBuilder,
    public snackBar: MatSnackBar,
    private dbs: DatabaseService,
    public auth: AuthService,
    private router: Router,
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
    this.entryWarehouseControl = this.fb.control('');
    this.entryProductControl = this.fb.control('');
    this.entryScanControl = this.fb.control('');
  }

  initObservables() {
    this.productsObservable$ = combineLatest(
      this.dbs.getWarehouseListValueChanges(),
      this.dbs.getProductsListValueChanges(),
      this.warehouseForm.valueChanges.pipe(
        startWith('Todos')
      )).pipe(
        map(([warehouse, products, filt]) => {
          return warehouse.map(el => {
            el['product'] = products.filter(li => li.sku == el['skuProduct'])[0]
            return el
          }).filter(ol => {
            return filt != 'Todos' ? ol.warehouse == filt : true
          })
        }),
        tap(res => {
          this.productsTableDataSource.data = res
          this.loading.next(false)
        })
      )

    this.entryProducts$ = combineLatest(
      this.dbs.getWarehouseListValueChanges(),
      this.dbs.getProductsListValueChanges(),
      this.entryWarehouseControl.valueChanges.pipe(startWith('')),
      this.entryProductControl.valueChanges.pipe(startWith(''), map(product => product.product ? product.product.description : product))
    ).pipe(
      map(([warehouses, products, selection, product]) => {
        return warehouses.map(warehouse => {
          // Adding product object to warehouse object
          warehouse['product'] = products.filter(product => product.sku == warehouse['skuProduct'])[0];
          return warehouse
        }).filter(ol => {
          return selection != 'Todos' ? ol.warehouse == selection : true;
        }).filter(el => {
          if (el['product']) {
            return el['product'].description.toLowerCase().includes(product.toLowerCase());
          } else {
            return false
          }
        })
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

  openDialog(row) {
    this.dialog.open(ListDialogComponent, {
      data: {
        name: row.product.description,
        id: row.id
      }
    })
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

  showEntryProduct(product: any): string | null {
    console.log(product)
    return product.product ? product.product.description : null;
  }

  save(): void {
    // 
  }


}
