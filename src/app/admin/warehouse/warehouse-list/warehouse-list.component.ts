import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Warehouse } from 'src/app/core/models/warehouse.model';
import { WarehouseCreateEditComponent } from '../warehouse-create-edit/warehouse-create-edit.component';

@Component({
  selector: 'app-warehouse-list',
  templateUrl: './warehouse-list.component.html',
  styleUrls: ['./warehouse-list.component.scss']
})
export class WarehouseListComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();
  
  constructor(
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
  }

  onCreateEditItem(edit: boolean, warehouse?: Warehouse) {
    this.dialog.open(WarehouseCreateEditComponent, {
      data: {
        edit: edit,
        warehouse: warehouse
      }
    })
  }



}
