import { Component, Input, OnInit } from '@angular/core';
import { Product } from 'src/app/core/models/product.model';

@Component({
  selector: 'app-mobile-view',
  templateUrl: './mobile-view.component.html',
  styleUrls: ['./mobile-view.component.scss']
})
export class MobileViewComponent implements OnInit {
  @Input() product:Product

  defaultImage = "../../../../assets/images/icono-aitec-01.png";

  slideConfig = {
    "slidesToShow": 1, "slidesToScroll": 1,
    "autoplay": false
  };

  constructor() { }

  ngOnInit(): void {
  }

}
