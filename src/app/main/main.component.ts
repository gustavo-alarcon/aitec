import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../core/models/user.model';
import { AuthService } from '../core/services/auth.service';
import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  user$: Observable<User>
  constructor(
    private auth: AuthService
  ) { }
  openedMenu:boolean = false

  ngOnInit(): void {
    this.user$ = this.auth.user$
  }

  logOut(){
    this.auth.logout()
  }
  toggleMenu(){
    this.openedMenu = !this.openedMenu;
    console.log(this.openedMenu);
    
    //this.renderer.setStyle(this.menu.nativeElement, "display",'block');
  }
}
