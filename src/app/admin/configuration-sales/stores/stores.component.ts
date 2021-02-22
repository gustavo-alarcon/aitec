import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { DeleteConfiDialogComponent } from '../../delete-confi-dialog/delete-confi-dialog.component';
// import { DeliveryDialogComponent } from '../dialogs/delivery-dialog/delivery-dialog.component';
import { StoreDialogComponent } from '../dialogs/store-dialog/store-dialog.component';

@Component({
  selector: 'app-stores',
  templateUrl: './stores.component.html'
})
export class StoresComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  dataStoreSource = new MatTableDataSource();
  displayedStoreColumns: string[] = ['index', 'departamento', 'provincia', 'distritos', 'address', 'schedule', 'actions'];

  @ViewChild('storePaginator', { static: false }) set content2(
    paginator1: MatPaginator
  ) {
    this.dataStoreSource.paginator = paginator1;
  }

  initStore$: Observable<any>

  constructor(
    private dialog: MatDialog,
    public dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.initStore$ = this.dbs.getStores().pipe(
      tap((res) => {
        this.dataStoreSource.data = res;
        this.loading.next(false)
      })
    );
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

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataStoreSource.filter = filterValue.trim().toLowerCase();

    if (this.dataStoreSource.paginator) {
      this.dataStoreSource.paginator.firstPage();
    }
  }
}
