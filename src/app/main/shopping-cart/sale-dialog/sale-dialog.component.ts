import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-sale-dialog',
  templateUrl: './sale-dialog.component.html',
  styleUrls: ['./sale-dialog.component.scss']
})
export class SaleDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { name: string, email: string, number: string, asesor: any },
  ) { }

  ngOnInit(): void {
  }
}
