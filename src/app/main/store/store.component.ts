import { Component, OnInit } from '@angular/core';
import { PaginationInstance } from 'ngx-pagination';

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.scss']
})
export class StoreComponent implements OnInit {

  prods:Array<number> = [1,2,3,4,5,6,7,8,9,10,11,12,13, 14,15,16]

  config: PaginationInstance = {
    id: "custom",
    itemsPerPage: 12,
    currentPage: 1,
  };

  p: number = 1;
  constructor() { }

  ngOnInit(): void {
  }

}
