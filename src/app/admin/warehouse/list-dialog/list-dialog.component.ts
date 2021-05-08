import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from 'src/app/core/models/product.model';
import { SerialNumber } from 'src/app/core/models/SerialNumber.model';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-list-dialog',
  templateUrl: './list-dialog.component.html',
  styleUrls: ['./list-dialog.component.scss']
})
export class ListDialogComponent implements OnInit {

  serialNumber$:Observable<{
    colorName: string,
    serial: SerialNumber[]
  }[]>

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {product: Product, warehouseId: string},
    private dbs:DatabaseService
  ) { }

  ngOnInit(): void {
    this.serialNumber$ = this.dbs.getWarehouseSeriesValueChanges(this.data.product.id, this.data.warehouseId).pipe(
      map(res => {
        console.log(res)
        if(res.length){
          return Array.from(new Set(res.map(el => el.color.name))).map(colorName=> {
            return {
              colorName,
              serial: res.filter(el => el.color.name == colorName)
            }
          })
        } else return []
        
      })
    )
    
  }
}
