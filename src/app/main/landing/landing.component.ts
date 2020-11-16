import { Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  prods:Array<number> = [1,2,3,4,5,6,7,8]

  slideConfig = {"slidesToShow": 1, "slidesToScroll": 1,"autoplay": true,
  "autoplaySpeed":5000,"lazyLoad": 'ondemand',};
  slides = [];
  slideConfig2 = {"slidesToShow": 4, "slidesToScroll": 1,
  "autoplay": true,
  "autoplaySpeed":7000,
  responsive: [
    {
      breakpoint: 1360,
      settings: {
        slidesToShow: 3
      }
    },
    {
      breakpoint: 780,
      settings: {
        slidesToShow: 2
      }
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1
      }
    }
  ]};

  slideConfig3 = {"slidesToShow": 3, "slidesToScroll": 1,
  "autoplay": true,
  "autoplaySpeed":7000,
  responsive: [
    {
      breakpoint: 1010,
      settings: {
        slidesToShow: 2
      }
    },
    {
      breakpoint: 780,
      settings: {
        slidesToShow: 1
      }
    }
  ]};

  listproducts:Array<any>
  offers:Array<any>

  constructor(
    private dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.listproducts = this.dbs.products.filter(el=>!el.promo).slice(0,8)
    
    this.offers = this.dbs.products.filter(el=>el.promo)
  }

}
