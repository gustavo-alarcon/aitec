import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { filter, first, switchMap, take, tap } from 'rxjs/operators';
import { GeneralConfig } from './core/models/generalConfig.model';
import { AuthService } from './core/services/auth.service';
import { DatabaseService } from './core/services/database.service';
import { ThemeService } from './core/services/theme.service';
import { PushService } from './core/services/push.service';
import { User } from './core/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { NewsDialogComponent } from './main/news-dialog/news-dialog.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'aitec';
  version$: Observable<GeneralConfig>
  user$: Observable<User>
  push$: Observable<any>

  newsViewed = false;

  constructor(
    public themeService: ThemeService,
    private dbs: DatabaseService,
    private snackBar: MatSnackBar,
    private auth: AuthService,
    public push: PushService,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.version$ = this.dbs.getGeneralConfigDoc().pipe(
      tap(conf => {
        // console.log(conf.lastVersion);
        if (conf.lastVersion != this.dbs.version) {
          this.snackBar.open("🤓 Hola! --- Hay una nueva versión de la página, actualízala para tener las últimas características 😉", 'Aceptar', {
            duration: 10000
          })
        }

        if (conf.news.visible && !this.newsViewed) {
          this.dialog.open(NewsDialogComponent, {
            maxWidth: 750,
            maxHeight: 750
          }).afterClosed()
            .pipe(
              first()
            )
            .subscribe(res => {
              console.log(res);
              this.newsViewed = true;
            })
        }
      }),
    )
    this.push$ = this.auth.user$.pipe(
      filter(user => !!user),
      take(1),
      switchMap(user => {
        this.dbs.uidUser = user.uid
        if (user.customerType == 'Mayorista') {
          this.dbs.isMayUser.next(true)
        }
        return this.push.getPermission(user)
      })
    )
  }
}