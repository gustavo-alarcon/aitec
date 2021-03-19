import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from 'src/app/core/models/user.model';
import { AuthService } from 'src/app/core/services/auth.service';



@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.scss'],
})

export class ShoppingCartComponent implements OnInit {
  user$: Observable<User>;

  constructor(
    public auth: AuthService,
  ) { }

  ngOnInit(): void {
    this.user$ = this.auth.user$
  }


}