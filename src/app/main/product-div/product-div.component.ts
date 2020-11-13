import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-product-div',
  templateUrl: './product-div.component.html',
  styleUrls: ['./product-div.component.scss']
})
export class ProductDivComponent implements OnInit {
  @Input() offer: boolean;
  constructor() { }

  ngOnInit(): void {
  }

}
