import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable, combineLatest, iif, of, BehaviorSubject } from 'rxjs';
import { startWith, tap, map, share, switchMap, take } from 'rxjs/operators';
import { FormBuilder, FormControl } from '@angular/forms';
import * as XLSX from 'xlsx';


import { DatabaseService } from 'src/app/core/services/database.service';
import { AuthService } from 'src/app/core/services/auth.service';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

import { Product } from 'src/app/core/models/product.model';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { ProductEditPromoComponent } from './product-edit-promo/product-edit-promo.component';
import { DeleteProductComponent } from './delete-product/delete-product.component';

@Component({
  selector: 'app-products-list',
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss']
})
export class ProductsListComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  //Forms
  categoryForm: FormControl;
  itemsFilterForm: FormControl;
  promoFilterForm: FormControl;

  //Table
  productsTableDataSource = new MatTableDataSource<Product>();
  productsDisplayedColumns: string[] = [
    'index', 'photoURL', 'description', 'sku', 'category', 'pricemin', 'pricemay',
    'realStock', 'virtualStock', 'reservedStock', 'published', 'actions'
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

  categoriesList: Array<any> = []
  all: Array<any> = []

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    public snackBar: MatSnackBar,
    private dbs: DatabaseService,
    public auth: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.productsTableDataSource.filterPredicate = (prod, string) => {
      let filter = (prod.description + prod.sku + (prod["category"]) + (prod.published ? "publicado" : "oculto")).toLowerCase()
      return filter.includes(string.toLowerCase())
    }

    this.initForms();
    this.initObservables();
  }

  initForms() {
    this.categoryForm = this.fb.control("");
    this.itemsFilterForm = this.fb.control("");
    this.promoFilterForm = this.fb.control(false);
  }

  saveAll(){
    this.dbs.saveAll(this.all)
  }
  initObservables() {

    this.productsObservable$ = combineLatest(
      this.dbs.getAllCategoriesDoc(),
      this.promoFilterForm.valueChanges.pipe(startWith(false)),
      this.dbs.getProductsListValueChanges()).pipe(
        map(([categories, promoFormValue, products]) => {
          this.all = products
          this.categoriesList = categories
          let prods = products.map(pr => {
            pr['categoryName'] = pr.idCategory ? categories.find(ct => ct.id == pr.idCategory).completeName : ''
            return pr
          })
          return prods.filter(el => promoFormValue ? el.promo : true)
        }),
        tap(res => {
          this.productsTableDataSource.data = res
          this.loading.next(false)
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

  onPublish(product: Product, publish: boolean) {
    let prod = { ...product };
    prod.published = publish;
    this.dbs.publishProduct(publish, prod, null).commit().then(
      res => {
        this.snackBar.open('Producto editado satisfactoriamente.', 'Aceptar');
      },
      err => {
        this.snackBar.open('Ocurrió un error. Vuelva a intentarlo.', 'Aceptar');
      }
    )

  }


  increasePriority(product: Product) {
    let prod = { ...product };
    prod.priority++;
    //console.log(prod.priority);
    this.dbs.increasePriority(prod).commit().then(
      res => {
        this.snackBar.open('Prioridad incrementada', 'Aceptar');
      },
      err => {
        this.snackBar.open('Ocurrió un error. Vuelva a intentarlo.', 'Aceptar');
      }
    )

  }

  decreasePriority(product: Product) {
    let prod = { ...product };
    prod.priority--;
    //console.log(prod.priority);
    this.dbs.decreasePriority(prod).commit().then(
      res => {
        this.snackBar.open('Prioridad reducida', 'Aceptar');
      },
      err => {
        this.snackBar.open('Ocurrió un error. Vuelva a intentarlo.', 'Aceptar');
      }
    )

  }

  onDeleteItem(product: Product) {
    this.dialog.open(DeleteProductComponent, {
      width: '350px',
      data: product
    })

  }

  onPromo(product: Product) {

    let dialogRef: MatDialogRef<ProductEditPromoComponent>;
    dialogRef = this.dialog.open(ProductEditPromoComponent, {
      width: '350px',
      data: {
        data: { ...product },
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      switch (res) {
        case true:
          this.snackBar.open('El producto fue editado satisfactoriamente', 'Aceptar', { duration: 5000 });
          break;
        case false:
          this.snackBar.open('Ocurrió un error. Por favor, vuelva a intentarlo', 'Aceptar', { duration: 5000 });
          break;
        default:
          break;
      }
    })
  }

  onCreateEditItem(edit: boolean, product?: Product) {
    if (edit) {
      if(product.published){
        this.snackBar.open("Por favor, asegurese de ocultar el producto antes de editarlo.", "Aceptar")
      } else {
        if(this.getReservedStock(product)){
          this.snackBar.open("Por favor, asegurese de que el stock reservado se encuentre en 0.", "Aceptar")
        } else {
          this.router.navigate(['/admin/products/edit', product.sku]);
        }
      }
    } else {
      this.router.navigate(['/admin/products/create']);
    }

    /*
    let dialogRef: MatDialogRef<ProductCreateEditComponent>;
    if (edit == true) {
      dialogRef = this.dialog.open(ProductCreateEditComponent, {
        width: '350px',
        data: {
          data: { ...product },
          edit: edit
        }
      });
      dialogRef.afterClosed().subscribe(res => {
        switch (res) {
          case true:
            this.snackBar.open('El producto fue editado satisfactoriamente', 'Aceptar', { duration: 5000 });
            break;
          case false:
            this.snackBar.open('Ocurrió un error. Por favor, vuelva a intentarlo', 'Aceptar', { duration: 5000 });
            break;
          default:
            break;
        }
      })
    }
    else {
      dialogRef = this.dialog.open(ProductCreateEditComponent, {
        width: '350px',
        data: {
          data: null,
          edit: edit
        }
      });
      dialogRef.afterClosed().subscribe(res => {
        switch (res) {
          case true:
            this.snackBar.open('El nuevo producto fue creado satisfactoriamente', 'Aceptar', { duration: 5000 });
            break;
          case false:
            this.snackBar.open('Ocurrió un error. Por favor, vuelva a intentarlo', 'Aceptar', { duration: 5000 });
            break;
          default:
            break;
        }
      })
    }*/
  }

  getReservedStock(product: Product): number{
    return product.products.reduce((prev, curr)=> {
      return prev + (curr.reservedStock ? curr.reservedStock : 0)
    }, 0  )
  }


  downloadXls(): void {
    
    let table_xlsx: any[] = [];
    let headersXlsx = [
      'Descripcion', 'Part Number', 'Categoría', 'Precio Mayorista', 'Precio Minorista',
      'Stock Virtual', 'Stock Real', 'Stock Reservado', 'Publicado'
    ]

    table_xlsx.push(headersXlsx);

    this.productsTableDataSource.filteredData.forEach(product => {
      const temp = [
        product.description,
        product.sku,
        product["category"] ? product["category"] : "---",
        product.priceMay,
        product.priceMin,
        product.products.reduce((prev,curr)=> (prev+(curr.virtualStock ? curr.virtualStock : 0)), 0),
        product.products.reduce((prev,curr)=> (prev+(curr.realStock ? curr.realStock : 0)), 0),
        product.products.reduce((prev,curr)=> (prev+(curr.reservedStock ? curr.reservedStock : 0)), 0),
        product.published ? "Sí" : "No"
      ];

      table_xlsx.push(temp);
    })

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lista_de_productos');

    const name = 'Lista_de_productos' + '.xlsx';
    XLSX.writeFile(wb, name);
  }

}
