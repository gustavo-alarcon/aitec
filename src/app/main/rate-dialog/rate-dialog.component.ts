import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Sale } from 'src/app/core/models/sale.model';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-rate-dialog',
  templateUrl: './rate-dialog.component.html',
  styleUrls: ['./rate-dialog.component.scss']
})
export class RateDialogComponent implements OnInit {
  formGroup: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dbs: DatabaseService,
    private dialogRef: MatDialogRef<RateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { sale: Sale }
  ) { }

  ngOnInit() {
    this.formGroup = this.fb.group({
      serviceRate: [null, Validators.required],
      productRate: [null, Validators.required],
      deliveryRate: [null, Validators.required],
      observation: [null]
    })
  }

  onCancelForm(){
    let sale: Sale["rateData"] = null
    this.dialogRef.close(sale);
  }

  onSubmitForm(){
    this.formGroup.markAsPending();
    let sale: Sale["rateData"] = {
      productRate: Number(this.formGroup.get('productRate').value),
      serviceRate: Number(this.formGroup.get('serviceRate').value),
      deliveryRate: Number(this.formGroup.get('deliveryRate').value),
      observation: this.formGroup.get('observation').value,
    }
    this.dialogRef.close(sale);
  }

  getCorrelative(){
    return this.data.sale.correlative.toString().padStart(6,"0")
  }

}
