import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss']
})
export class ShoppingListComponent implements OnInit {
  dataSource = new MatTableDataSource();
  displayedColumns: string[] = ['index', 'image', 'product','sku', 'quantity', 'unit','subtotal', 'delete'];


  constructor(
    private dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.dataSource.data = this.dbs.order
  }

}
