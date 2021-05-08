import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SerialNumber, SerialNumberWithPrice } from 'src/app/core/models/SerialNumber.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-movements-detail-dialog',
  templateUrl: './movements-detail-dialog.component.html',
  styleUrls: ['./movements-detail-dialog.component.scss']
})
export class MovementsDetailDialogComponent implements OnInit {

  loadingHistory = new BehaviorSubject<boolean>(false);
  loadingHistory$ = this.loadingHistory.asObservable();

  columns: string[] = [
    'index', 'warehouseName', 'productSku', 'productDetail', 'quantity', 'series'
  ]

  dataSource = new MatTableDataSource<{
    warehouseName: string,
    productSku: string,
    productDetail: string,
    quantity: number,
    series: string
  }>();

  
  @ViewChild("movementPaginator", { static: false }) set content(paginator1: MatPaginator) {
    this.dataSource.paginator = paginator1;
  }


  init$: Observable<any>;

  constructor(
    private dialogRef: MatDialogRef<MovementsDetailDialogComponent>,
    private dbs: DatabaseService,
    private fb: FormBuilder,
    private auth: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: SerialNumberWithPrice[]
  ) { }

  ngOnInit(): void {
    console.log(this.data)
    this.dataSource.data = this.data.map(el => {
      let series = (<SerialNumber[]>el.list).map(el2 => el2.barcode).join("; ").slice(0, -2)

      let aux = {
        warehouseName: el.warehouse.name,
        productSku: el.product.sku,
        productDetail: el.product.description,
        quantity: el.list.length,
        series: series
      }

      return aux
    })
    console.log(this.dataSource.data)
  }

}

