import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-list-dialog',
  templateUrl: './list-dialog.component.html',
  styleUrls: ['./list-dialog.component.scss']
})
export class ListDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { name: string, series: Array<any>, sku: string },
  ) { }

  ngOnInit(): void {
  }
}
