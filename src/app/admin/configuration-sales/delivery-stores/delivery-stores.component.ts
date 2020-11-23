import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { DeleteDocComponent } from '../dialogs/delete-doc/delete-doc.component';
import { DeliveryDialogComponent } from '../dialogs/delivery-dialog/delivery-dialog.component';

@Component({
  selector: 'app-delivery-stores',
  templateUrl: './delivery-stores.component.html',
  styleUrls: ['./delivery-stores.component.scss']
})
export class DeliveryStoresComponent implements OnInit {
  dataSource = new MatTableDataSource();
  displayedColumns: string[] = [
    'index',
    'departamento',
    'provincia',
    'distritos',
    'delivery',
    'actions',
  ];

  @ViewChild('productsPaginator', { static: false }) set content(
    paginator1: MatPaginator
  ) {
    this.dataSource.paginator = paginator1;
  }
  
  init$:Observable<any>
  constructor(
    private afs: AngularFirestore,
    private dialog: MatDialog,
    private dbs:DatabaseService
  ) { }

  ngOnInit(): void {
    this.init$ = this.dbs.getDelivery().pipe(
      tap((res) => {
        this.dataSource.data = res;
      })
    );
  }
  openDialog(movil: boolean,data) {
    let ind = 0
    
    this.dialog.open(DeliveryDialogComponent, {
      data: {
        edit: movil,
        data:data
      }
    })
  }

  deleteDialog(id: string) {
    this.dialog.open(DeleteDocComponent, {
      data: {
        id:id,
        title:'Delivery',
        type:'delivery'
      }
    })
  }


}
