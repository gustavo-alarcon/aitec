import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { GeneralConfig } from './core/models/generalConfig.model';
import { DatabaseService } from './core/services/database.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'aitec';
  version$: Observable<GeneralConfig>

  constructor(
    public themeService: ThemeService,
    private dbs: DatabaseService,
    private snackBar: MatSnackBar
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
  }
}