import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { DeleteConfiDialogComponent } from '../../delete-confi-dialog/delete-confi-dialog.component';
import { PaymentMethodDialogComponent } from '../dialogs/payment-method-dialog/payment-method-dialog.component';

@Component({
  selector: 'app-payment-view',
  templateUrl: './payment-view.component.html'
})
export class PaymentViewComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

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
    this.initPay$ = this.dbs.getPaymentsChanges().pipe(
      tap((res) => {
        this.dataPaymentSource.data = res;
        this.loading.next(false)
      })
    );
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

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataPaymentSource.filter = filterValue.trim().toLowerCase();

    if (this.dataPaymentSource.paginator) {
      this.dataPaymentSource.paginator.firstPage();
    }
  }
}
