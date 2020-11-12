import { Component, OnInit } from '@angular/core';

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

  constructor() { }

  ngOnInit(): void {
  }

}
