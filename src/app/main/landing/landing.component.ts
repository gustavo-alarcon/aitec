import { Component, OnInit } from '@angular/core';
import { Router } from 'express';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { LandingService } from 'src/app/core/services/landing.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  prods:Array<number> = [1,2,3,4,5,6,7,8]

  slideConfig = { "dots":true,"slidesToShow": 1, "slidesToScroll": 1,"autoplay": true,
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

  init$:Observable<any>
  listproducts:Array<any>
  offers:Array<any>

  banners:Array<any>=[]

  
  promo:Array<any>=[]
  testimonies:Array<any> = []

  middle:any

  constructor(
    private ld:LandingService,
    private dbs: DatabaseService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.listproducts = this.dbs.products.filter(el=>!el.promo).slice(0,8)
    
    this.offers = this.dbs.products.filter(el=>el.promo)

    this.init$=combineLatest(
      this.ld.getBanners('carousel'),
      this.ld.getBanners('promo'),
      this.ld.getTestimonies(),
      this.ld.getConfig()
    ).pipe(
      map(([carousel,promo,test,confi])=>{
        this.banners = carousel
        this.promo=promo
        this.testimonies = test
        this.middle = confi['middle']
        return true
      })
    )
  }

  getStars(number){
    let star = [false,false,false,false,false]
    for (let i = 0; i < number; i++) {
      star[i]=true
    }
    return star
  }

  navigateBrand(brand){
    switch (brand['redirecTo']) {
      case 'Categoría/subcategoría':
        
        break;
        case 'Marca':
        
        break;
      case 'Producto':
        break;
      default:
        break;
    }
  }

}
