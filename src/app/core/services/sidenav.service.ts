import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidenavService {

  public sidenavSystemToggle: boolean = false;
  public sidenavUsersToggle: boolean = false;
  public sidenavNotificationsToggle: boolean = false;
  
  constructor() { }

  sidenavSystem(): void{
    this.sidenavSystemToggle = !this.sidenavSystemToggle;
  }

  sidenavUsers(): void{
    this.sidenavUsersToggle = !this.sidenavUsersToggle;
  }

  sidenavNotifications(): void{
    this.sidenavNotificationsToggle = !this.sidenavNotificationsToggle;
  }

}
