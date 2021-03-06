import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { DeleteConfiDialogComponent } from '../../delete-confi-dialog/delete-confi-dialog.component';
import { AsesoresDialogComponent } from '../dialogs/asesores-dialog/asesores-dialog.component';
import { CuponDialogComponent } from '../dialogs/cupon-dialog/cupon-dialog.component';
import { PaymentMethodDialogComponent } from '../dialogs/payment-method-dialog/payment-method-dialog.component';

@Component({
  selector: 'app-advisers',
  templateUrl: './advisers.component.html'
})
export class AdvisersComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  dataAdviserSource = new MatTableDataSource();
  displayedAdviserColumns: string[] = ['index', 'code', 'name', 'lastname', 'email', 'phone', 'actions'];

  @ViewChild('adviserPaginator', { static: false }) set content2(
    paginator2: MatPaginator
  ) {
    this.dataAdviserSource.paginator = paginator2;
  }

  initAdviser$: Observable<any>

  constructor(
    private dialog: MatDialog,
    public dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.initAdviser$ = this.dbs.getAdvisers().pipe(
      tap((res) => {
        this.dataAdviserSource.data = res;
        this.loading.next(false)
      })
    );

  }

  openUser(movil: boolean, data) {
    this.dialog.open(AsesoresDialogComponent, {
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
    this.dataAdviserSource.filter = filterValue.trim().toLowerCase();

    if (this.dataAdviserSource.paginator) {
      this.dataAdviserSource.paginator.firstPage();
    }
  }
}
