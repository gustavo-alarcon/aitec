import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss']
})
export class ShoppingListComponent implements OnInit {
  dataSource = new MatTableDataSource();
  displayedColumns: string[] = ['index', 'image', 'product','sku', 'quantity', 'unit','subtotal', 'delete'];

  prod:Array<number>=[1,2,3,4]

  ejem = {
    product:{
      description:'MEMORIA RAM CRUCIAL - 8GB - DDR4-2666/PC4-21300 DDR4 SDRAM 260-PIN - SODIMM (PN CT8G4SFS8266)',
      photoURL:'../../../../assets/images/producto.png',
      sku:'AITEC-00000168',
      price:142
    },
    quantity:1
  }

  constructor() { }

  ngOnInit(): void {
    this.dataSource.data = this.prod.map(el=>this.ejem)
  }

}
