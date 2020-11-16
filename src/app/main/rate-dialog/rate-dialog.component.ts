import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Sale } from 'src/app/core/models/sale.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { DatabaseService } from 'src/app/core/database.service';

@Component({
  selector: 'app-rate-dialog',
  templateUrl: './rate-dialog.component.html',
  styleUrls: ['./rate-dialog.component.css']
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
      observation: this.formGroup.get('observation').value,
    }
    this.dialogRef.close(sale);
  }

}
