import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../core/models/user.model';
import { AuthService } from '../core/services/auth.service';

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

  ngOnInit(): void {
    this.user$ = this.auth.user$
  }

  logOut(){
    this.auth.logout()
  }
}
