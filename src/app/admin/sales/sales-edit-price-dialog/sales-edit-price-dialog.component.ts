import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Sale } from 'src/app/core/models/sale.model';

@Component({
  selector: 'app-sales-edit-price-dialog',
  templateUrl: './sales-edit-price-dialog.component.html',
  styleUrls: ['./sales-edit-price-dialog.component.scss']
})
export class SalesEditPriceDialogComponent implements OnInit {
  unitPrice: FormControl;


  constructor(
    public dialogRef: MatDialogRef<SalesEditPriceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      item: Sale["requestedProducts"][0]
    }
  ) { }

  ngOnInit() {
    //Observation
    this.unitPrice = new FormControl(
      this.data.item.product.price, Validators.required);
  }


  action(action: string){
    let item = {...this.data.item}
    item.product.price = this.unitPrice.value
    ////console.log(action);
    this.dialogRef.close({
      action: action,
      item
    });
  }

}

