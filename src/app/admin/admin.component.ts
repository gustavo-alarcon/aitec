import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../core/services/auth.service';
import { DatabaseService } from '../core/services/database.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  version: string

  openedMenu: boolean = false;

  constructor(
    public auth: AuthService,
    private dialog: MatDialog,
    public dbs: DatabaseService
  ) { }

  ngOnInit(): void {
  }

  toggleSideMenu(): void {
    this.openedMenu = !this.openedMenu;
  }
}
