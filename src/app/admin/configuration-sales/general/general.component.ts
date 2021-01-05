import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { DeleteConfiDialogComponent } from '../../delete-confi-dialog/delete-confi-dialog.component';
import { AsesoresDialogComponent } from '../dialogs/asesores-dialog/asesores-dialog.component';
import { CuponDialogComponent } from '../dialogs/cupon-dialog/cupon-dialog.component';
import { PaymentMethodDialogComponent } from '../dialogs/payment-method-dialog/payment-method-dialog.component';

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.scss']
})
export class GeneralComponent implements OnInit {

  dataCouponSource = new MatTableDataSource();
  displayedCouponColumns: string[] = ['index', 'name', 'discount', 'period', 'to', 'actions'];

  @ViewChild('couponPaginator', { static: false }) set content(
    paginator1: MatPaginator
  ) {
    this.dataCouponSource.paginator = paginator1;
  }
  initCoupon$: Observable<any>

  dataAdviserSource = new MatTableDataSource();
  displayedAdviserColumns: string[] = ['index', 'code', 'name', 'lastname', 'email', 'phone', 'actions'];

  @ViewChild('adviserPaginator', { static: false }) set content2(
    paginator2: MatPaginator
  ) {
    this.dataAdviserSource.paginator = paginator2;
  }

  initAdviser$: Observable<any>

  dataPaymentSource = new MatTableDataSource();
  displayedPaymentColumns: string[] = ['index', 'name', 'account', 'actions'];

  @ViewChild('paymentPaginator', { static: false }) set content3(
    paginator3: MatPaginator
  ) {
    this.dataPaymentSource.paginator = paginator3;
  }

  initPay$: Observable<any>
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

    this.initAdviser$ = this.dbs.getAdvisers().pipe(
      tap((res) => {
        this.dataAdviserSource.data = res;
      })
    );

    this.initPay$ = this.dbs.getPaymentsChanges().pipe(
      tap((res) => {
        this.dataPaymentSource.data = res;
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

  openUser(movil: boolean, data) {
    this.dialog.open(AsesoresDialogComponent, {
      data: {
        edit: movil,
        data: data
      }
    })
  }

  openPayment(movil: boolean, data) {
    this.dialog.open(PaymentMethodDialogComponent, {
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
