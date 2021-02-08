<<<<<<< HEAD
import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

=======
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router, NavigationEnd } from '@angular/router'
>>>>>>> develop
@Component({
  selector: 'app-no-login-dialog',
  templateUrl: './no-login-dialog.component.html'
})
export class NoLoginDialogComponent implements OnInit {

  constructor(
    private dialogref: MatDialogRef<NoLoginDialogComponent>,
<<<<<<< HEAD
    @Inject(MAT_DIALOG_DATA) public data: {title},
=======
    private router: Router
>>>>>>> develop
  ) { }

  ngOnInit(): void {
  }

  close() {
    localStorage.setItem('aitec-user-login', this.router.url);
    this.dialogref.close()
  }
}
