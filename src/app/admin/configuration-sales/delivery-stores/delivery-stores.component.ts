import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { DeleteConfiDialogComponent } from '../../delete-confi-dialog/delete-confi-dialog.component';
import { DeliveryDialogComponent } from '../dialogs/delivery-dialog/delivery-dialog.component';
import { StoreDialogComponent } from '../dialogs/store-dialog/store-dialog.component';

@Component({
  selector: 'app-delivery-stores',
  templateUrl: './delivery-stores.component.html',
  styleUrls: ['./delivery-stores.component.scss']
})
export class DeliveryStoresComponent implements OnInit {
  dataSource = new MatTableDataSource();
  displayedColumns: string[] = ['index', 'departamento', 'provincia', 'distritos', 'delivery', 'actions'];

  @ViewChild('productsPaginator', { static: false }) set content(
    paginator1: MatPaginator
  ) {
    this.dataSource.paginator = paginator1;
  }

  dataStoreSource = new MatTableDataSource();
  displayedStoreColumns: string[] = ['index', 'departamento', 'provincia', 'distritos', 'address','schedule', 'actions'];

  @ViewChild('storePaginator', { static: false }) set content2(
    paginator1: MatPaginator
  ) {
    this.dataStoreSource.paginator = paginator1;
  }

  init$: Observable<any>
  initStore$: Observable<any>
  constructor(
    private afs: AngularFirestore,
    private dialog: MatDialog,
    private dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.init$ = this.dbs.getDelivery().pipe(
      tap((res) => {
        this.dataSource.data = res;
      })
    );

    this.initStore$ = this.dbs.getStores().pipe(
      tap((res) => {
        this.dataStoreSource.data = res;
      })
    );
  }

  openDialog(movil: boolean, data) {
    this.dialog.open(DeliveryDialogComponent, {
      data: {
        edit: movil,
        data: data
      }
    })
  }

  openStoreDialog(movil: boolean, data) {
    this.dialog.open(StoreDialogComponent, {
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
