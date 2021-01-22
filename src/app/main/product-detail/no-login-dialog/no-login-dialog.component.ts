import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-no-login-dialog',
  templateUrl: './no-login-dialog.component.html'
})
export class NoLoginDialogComponent implements OnInit {

  constructor(
    private dialogref: MatDialogRef<NoLoginDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {title},
  ) { }

  ngOnInit(): void {
  }

  close(){
    this.dialogref.close()
  }
}
