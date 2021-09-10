import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Sale } from 'src/app/core/models/sale.model';

@Component({
  selector: 'app-warehouse-view-referral-guide-dialog',
  templateUrl: './warehouse-view-referral-guide-dialog.component.html',
  styleUrls: ['./warehouse-view-referral-guide-dialog.component.scss']
})
export class WarehouseViewReferralGuideDialogComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Sale,
    private dialogRef: MatDialogRef<WarehouseViewReferralGuideDialogComponent>
  ) { }

  ngOnInit(): void {
  }

  closeDialog() {
    this.dialogRef.close()
  }

}
