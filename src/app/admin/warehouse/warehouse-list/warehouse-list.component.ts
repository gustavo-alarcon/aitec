import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { Warehouse } from 'src/app/core/models/warehouse.model';
import { DatabaseService } from 'src/app/core/services/database.service';
import { WarehouseCreateEditComponent } from '../warehouse-create-edit/warehouse-create-edit.component';

@Component({
  selector: 'app-warehouse-list',
  templateUrl: './warehouse-list.component.html',
  styleUrls: ['./warehouse-list.component.scss']
})
export class WarehouseListComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  warehouses$: Observable<Array<Warehouse>>;

  searchFormControl = new FormControl('');

  dataSource = new MatTableDataSource<Warehouse>();
  displayedColumns: string[] = ['index', 'name', 'location', 'address', 'actions'];
  @ViewChild('paginator', { static: false }) set content(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }
  @ViewChild(MatSort, { static: false }) set content2(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  constructor(
    private router: Router,
    private dialog: MatDialog,
    public dbs: DatabaseService,
    private snackbar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.warehouses$ = combineLatest(
      this.dbs.getWarehouseList(),
      this.searchFormControl.valueChanges.pipe(
        startWith(''),
        map(value => { return value.toLowerCase() })
      )).pipe(
        map(([warehouses, search]) => {
          return warehouses.filter(el => el.name.toLowerCase().includes(search))
        }),
        tap(res => {
          this.dataSource.data = res
          this.loading.next(false)
        })
      )
  }

  onCreateEditItem(edit: boolean, warehouse?: Warehouse) {
    this.dialog.open(WarehouseCreateEditComponent, {
      data: {
        edit: edit,
        warehouse: warehouse
      },
      maxWidth: 700
    })
  }

  deleteWarehouse(id: string): void {
    this.loading.next(true);

    this.dbs.deleteWarehouse(id)
      .commit()
      .then(() => {
        this.loading.next(false);
        this.snackbar.open(`Almacén borrado satisfactoriamente!`, "Aceptar", {
          duration: 6000
        });
      })
      .catch(err => {
        console.log(err);
        this.loading.next(false);
        this.snackbar.open(`Parece que hubo un error borrando el almacén!`, "Aceptar", {
          duration: 6000
        });
      })
  }



}
