import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-list-dialog',
  templateUrl: './list-dialog.component.html',
  styleUrls: ['./list-dialog.component.scss']
})
export class ListDialogComponent implements OnInit {

  init$:Observable<any>
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { name: string, id: string},
    private dbs:DatabaseService
  ) { }

  ngOnInit(): void {
    this.init$ = this.dbs.getWarehouseSeriesValueChanges(this.data.id)
    
  }
}
