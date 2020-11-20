import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { filter, take, tap } from 'rxjs/operators';
import { GeneralConfig } from './core/models/generalConfig.model';
import { AuthService } from './core/services/auth.service';
import { DatabaseService } from './core/services/database.service';
import { ThemeService } from './core/services/theme.service';
import { PushService } from './core/services/push.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'aitec';
  version$: Observable<GeneralConfig>
  user$: Observable<any>

  constructor(
    public themeService: ThemeService,
    private dbs: DatabaseService,
    private snackBar: MatSnackBar,
    private auth: AuthService,
    public push: PushService
  ){}

  ngOnInit(){
    this.version$ = this.dbs.getGeneralConfigDoc().pipe(
      tap(conf => {
        console.log(conf.lastVersion);
        if(conf.lastVersion != this.dbs.version){
          this.snackBar.open("Versión incorrecta")
        }
      }),
    )
    this.user$ = this.auth.user$.pipe(
      filter(user => !!user),
      take(1),
      tap(user => {
        this.push.getPermission(user)
        this.push.receiveMessages()
      })
    )
  }
}