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

  login(){}

  getName(user) {
    let name;
    let lastName;
    if (user.personData) {
      name = user.personData.name.split(' ')[0]
      lastName = user.personData.lastName.split(' ')[0]
    } else {
      name = user.name.split(' ')[0]
      lastName = user.lastName.split(' ')[0]
    }
    return name + ' ' + lastName
  }
}
