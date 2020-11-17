import { Observable, of } from 'rxjs';
import { User } from '../core/models/user.model';
import { AuthService } from '../core/services/auth.service';
import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { DatabaseService } from '../core/services/database.service';
import { MatDialog } from '@angular/material/dialog';
import { RateDialogComponent } from './rate-dialog/rate-dialog.component';
import { Sale } from '../core/models/sale.model';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  user$: Observable<User>
  constructor(
    private auth: AuthService,
    private dbs: DatabaseService,
    private dialog: MatDialog
  ) { }
  openedMenu:boolean = false
  firstOpening: boolean = false;

  ngOnInit(): void {
    this.user$ = this.auth.user$.pipe(
      switchMap(
        user => {
          if(user){
            return this.dbs.getUserFinishedSales(user).pipe(
              map(sales => {
                console.log(sales);
                console.log(sales[0]);
                if (sales.length) {
                  let dialogRef = this.dialog.open(RateDialogComponent, {
                    width: '307px',
                    closeOnNavigation: false,
                    disableClose: true,
                    data: {
                      sale: sales[0],
                    }
                  });
                  dialogRef.afterClosed().pipe(
                    switchMap((rate: Sale["rateData"]) => this.dbs.onSaveRate(sales[0].id, rate)))
                    .subscribe(() => {
                        console.log("rated!")
                    }, console.log)
                }
                return user
              })
            )
          } else {
            return of(user)
          }
        }),
      shareReplay(1)
    )
  }

  logOut(){
    this.auth.logout()
  }
  toggleMenu(){
    this.openedMenu = !this.openedMenu;
    this.firstOpening = true;
    
    //this.renderer.setStyle(this.menu.nativeElement, "display",'block');
  }
}
