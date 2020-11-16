import { Observable } from 'rxjs';
import { User } from '../core/models/user.model';
import { AuthService } from '../core/services/auth.service';
import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { DatabaseService } from '../core/services/database.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  user$: Observable<User>
  constructor(
    private auth: AuthService,
    public dbs: DatabaseService
  ) { }
  openedMenu:boolean = false
  firstOpening: boolean = false;

  ngOnInit(): void {
    this.user$ = this.auth.user$
  }

  logOut(){
    this.auth.logout()
  }
  toggleMenu(){
    this.openedMenu = !this.openedMenu;
    this.firstOpening = !this.firstOpening;
    
    //this.renderer.setStyle(this.menu.nativeElement, "display",'block');
  }

  onActivate(event) {
    window.scroll(0, 0);
    //or document.body.scrollTop = 0;
    //or document.querySelector('body').scrollTo(0,0)
  }
}
