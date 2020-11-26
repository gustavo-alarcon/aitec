import { Component, OnInit, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent implements OnInit {
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

