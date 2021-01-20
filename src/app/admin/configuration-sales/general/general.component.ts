import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { DeleteConfiDialogComponent } from '../../delete-confi-dialog/delete-confi-dialog.component';
import { CuponDialogComponent } from '../dialogs/cupon-dialog/cupon-dialog.component';

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.scss']
})
export class GeneralComponent implements OnInit {

  dataCouponSource = new MatTableDataSource();
  displayedCouponColumns: string[] = ['index', 'name', 'discount', 'period', 'to', 'count', 'actions'];

  @ViewChild('couponPaginator', { static: false }) set content(
    paginator1: MatPaginator
  ) {
    this.dataCouponSource.paginator = paginator1;
  }
  initCoupon$: Observable<any>




  constructor(
    private dialog: MatDialog,
    public dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.initCoupon$ = this.dbs.getCoupons().pipe(
      tap((res) => {
        this.dataCouponSource.data = res;
      })
    );
  }

  openCupon(movil: boolean, data) {
    this.dialog.open(CuponDialogComponent, {
      data: {
        edit: movil,
        data: data
      }
    })
  }


  deleteDialog(id: string, type: string, title: string) {
    this.dialog.open(DeleteConfiDialogComponent, {
      data: {
        id: id,
        title: title,
        type: type,
        image: false
      }
    })
  }
}
