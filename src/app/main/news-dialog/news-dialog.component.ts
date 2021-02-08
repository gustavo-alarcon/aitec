import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { GeneralConfig } from 'src/app/core/models/generalConfig.model';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-news-dialog',
  templateUrl: './news-dialog.component.html',
  styleUrls: ['./news-dialog.component.scss']
})
export class NewsDialogComponent implements OnInit {

  config$: Observable<GeneralConfig>;

  constructor(
    public dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.config$ = this.dbs.getStaticConfigDoc();
  }

}
