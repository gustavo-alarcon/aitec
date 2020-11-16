import { Component, OnInit } from '@angular/core';
import { PaginationInstance } from 'ngx-pagination';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.scss']
})
export class StoreComponent implements OnInit {

  config: PaginationInstance = {
    id: "custom",
    itemsPerPage: 9,
    currentPage: 1,
  };

  products:Array<any>

  p: number = 1;
  constructor(
    private dbs: DatabaseService,
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    this.products = this.dbs.products
  }

}
