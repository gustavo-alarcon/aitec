import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-sale-dialog',
  templateUrl: './sale-dialog.component.html',
  styleUrls: ['./sale-dialog.component.scss']
})
export class SaleDialogComponent implements OnInit {
  correlative$: Observable<string>;

  //number refers to the id of the sale
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { name: string, email: string, number: string, asesor: any },
    private dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.correlative$ = this.dbs.getSaleId(this.data.number).pipe(map(sale => {
      if(!sale){
        return null
      }
      let corr = sale.correlative
      if(corr){
        return String(corr).padStart(6, "0")
      } else {
        return null
      }
    }),
    shareReplay(1))
  }
}
