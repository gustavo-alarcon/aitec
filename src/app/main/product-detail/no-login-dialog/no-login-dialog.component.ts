import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-no-login-dialog',
  templateUrl: './no-login-dialog.component.html'
})
export class NoLoginDialogComponent implements OnInit {

  constructor(
    private dialogref: MatDialogRef<NoLoginDialogComponent>
  ) { }

  ngOnInit(): void {
  }

  close(){
    this.dialogref.close()
  }
}
