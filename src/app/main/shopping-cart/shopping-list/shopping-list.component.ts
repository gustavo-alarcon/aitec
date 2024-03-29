import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SaleRequestedProducts } from 'src/app/core/models/sale.model';
import { DatabaseService } from 'src/app/core/services/database.service';
import { ShoppingCarService } from 'src/app/core/services/shopping-car.service';

//Not USED?
@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss']
})
export class ShoppingListComponent implements OnInit {
  dataSource = new MatTableDataSource<SaleRequestedProducts>();
  displayedColumns: string[] = ['index', 'image', 'product','sku', 'quantity', 'unit','subtotal', 'delete'];

  @ViewChild('productsPaginator', { static: false }) set content(paginator1: MatPaginator) {
    this.dataSource.paginator = paginator1;
  }

  defaultImage = "../../../../assets/images/icono-aitec-01.png";

  reqProdListObservable$: Observable<SaleRequestedProducts[]>

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private dbs: DatabaseService,
    public shopCar: ShoppingCarService,
  ) { }

  ngOnInit(): void {
    this.reqProdListObservable$ = this.shopCar.reqProdListObservable.pipe(
      tap(res => {
        //console.log("requesting table")
        //console.log(res)
        this.dataSource.data = res
      })
    )
  }
/////////////////////////////////////////////////////////////////////
///////////FALTA FUNCIONES DE EDICION DE CARRITO
  getPrice(item){
    if(item.product.promo){
      return item.product.promoData.promoPrice 
    }else{
      return item.product.priceMin
    }
  }

  navigateProduct(product) {
    this.router.navigate(["/main/producto", product]);
  }

  delete(ind) {
    this.dbs.order.splice(ind, 1)

    this.dbs.orderObs.next(this.dbs.order)
    this.snackBar.open('Ha eliminado un producto de su carrito', 'Aceptar', {
      duration: 6000
    })
    //localStorage.setItem(this.dbs.uidUser, JSON.stringify(this.dbs.order));
  }
}
