import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router, NavigationEnd } from '@angular/router'
@Component({
  selector: 'app-no-login-dialog',
  templateUrl: './no-login-dialog.component.html'
})
export class NoLoginDialogComponent implements OnInit {

  constructor(
    private dialogref: MatDialogRef<NoLoginDialogComponent>,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  close() {
    localStorage.setItem('aitec-user-login', this.router.url);
    this.dialogref.close()
  }
}
