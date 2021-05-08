import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-take-out-confirm-dialog',
  templateUrl: './take-out-confirm-dialog.component.html',
  styleUrls: ['./take-out-confirm-dialog.component.scss']
})
export class TakeOutConfirmDialogComponent implements OnInit {
  lastObservation: FormControl;


  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      warning: string, 
      content: string,
      noObservation: boolean,
      observation: string,
      title: string,
      titleIcon: string}
  ) { }

  ngOnInit() {
    //Observation
    this.lastObservation = new FormControl(this.data.observation);
  }


  action(action: string){
    ////console.log(action);
    this.dialogRef.close({
      action: action,
      lastObservation: this.lastObservation.value
    });
  }

}

