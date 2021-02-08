import { Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-configuration-sales',
  templateUrl: './configuration-sales.component.html',
  styleUrls: ['./configuration-sales.component.scss']
})
export class ConfigurationSalesComponent implements OnInit {
  
  loadingRouteConfig: boolean;
  sidenav:boolean = true
  constructor(
    public dbs: DatabaseService
  ) { }

  ngOnInit(): void {
  }

  toggleSidenav(): void{
    !this.sidenav;
  }
}
