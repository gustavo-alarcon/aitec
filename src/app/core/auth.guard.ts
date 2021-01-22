import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take, map, tap } from 'rxjs/operators';
import { AuthService } from "./services/auth.service";
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private auth: AuthService,
    private snackbar: MatSnackBar
  ) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.auth.user$.pipe(
      take(1),
      map(user => {
        //console.log('auth');
        let childComponent = state.url.split('/')[2];

        if (childComponent.startsWith('products')) {
          childComponent = 'products';
        }
        
        switch (childComponent) {
          case 'products':
            return true;
          case 'products-history':
            return true;
          case 'customers':
            return user ? (!!user.admin || !!user.seller) : false;
          case 'products-list':
            return user ? (!!user.admin || !!user.seller || !!user.logistic) : false;
          case 'sales':
            return user ? (!!user.admin || !!user.seller) : false;
          case 'logistics':
            return user ? (!!user.admin || !!user.logistic) : false;
          case 'configuration':
            return user ? !!user.admin : false; 
          case 'success':
              return true;
          default:
            return true;
        }
      }),
      tap(res => {
        if (!res) {
          this.snackbar.open('Acceso denegado', 'Aceptar');
          this.router.navigate(['/main']);
        }
      })
    )
  }

}
