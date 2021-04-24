import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { User } from 'src/app/core/models/user.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { SaleDialogComponent } from './sale-dialog/sale-dialog.component';



@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.scss'],
})

export class ShoppingCartComponent implements OnInit {
  user$: Observable<User>;
  action$: Observable<boolean>;

  constructor(
    public auth: AuthService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.user$ = this.auth.user$
    this.action$ = this.route.queryParams.pipe(
      map(params => {
      console.log(params)
      if(!!Object.keys(params).length){
        switch(params.action){
          case 'cancelled':
            console.log("cancelling")
            return true
          case 'refused':
            console.log("refusing")
            return true
          case 'success':
            this.dialog.open(SaleDialogComponent, {
              closeOnNavigation: false,
              disableClose: true,
              maxWidth: "330px",
              data: {
                name: params.vads_cust_first_name,
                number: params.vads_order_id,
                email: params.vads_cust_email,
              }
            })
            this.router.navigate(["main"])
            return false
        }
      } else {
        return true
      }
    })
    )
  }


}