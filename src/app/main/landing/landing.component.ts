import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { LandingService } from 'src/app/core/services/landing.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  prods: Array<number> = [1, 2, 3, 4, 5, 6, 7, 8]

  slideConfig = {
    "dots": true, "slidesToShow": 1, "slidesToScroll": 1, "autoplay": true,
    "autoplaySpeed": 5000, "lazyLoad": 'ondemand', "arrows": false
  };
  slides = [];
  slideConfig2 = {
    "slidesToShow": 4, "slidesToScroll": 1,
    "autoplay": true,
    "autoplaySpeed": 7000,
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
          slidesToShow: 1,
          arrows: false
        }
      }
    ]
  };

  slideConfig3 = {
    "slidesToShow": 3, "slidesToScroll": 1,
    "autoplay": true,
    "autoplaySpeed": 7000,
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
          slidesToShow: 1,
          arrows: false
        }
      }
    ]
  };

  init$: Observable<any>
  products$: Observable<any>
  listproducts: Array<any> = []
  lastProducts: Array<any> = []
  offersProducts: Array<any> = []
  offers: Array<any>

  banners: Array<any> = []


  promo: Array<any> = []
  testimonies: Array<any> = []

  middle: any

  constructor(
    private ld: LandingService,
    private dbs: DatabaseService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Debugin start
       if (screen.width < 1024) {
         console.log("Pantalla Grande ...");        
       } else if (screen.width < 900) {
        console.log("Pantalla Mediana ...");
       } else if (screen.width < 600) {
        console.log("Pantalla Pequeña ...");
       }  

    // Debugin end

    this.products$ = this.dbs.getLastProducts().pipe(
      map(prods => prods.filter(el => el.published)),
      tap(res => {
        this.listproducts = res.filter(el => !el.promo).filter(el => el.searchNumber).sort((a, b) => b.searchNumber - a.searchNumber).slice(0, 4)
        this.lastProducts = res.slice(0, 4)
        this.offers = res.filter(el => el.promo)
        this.offersProducts = this.offers.slice(0, 4)
      })
    )

    this.init$ = combineLatest(
      this.ld.getBanners('carousel'),
      this.ld.getBanners('promo'),
      this.ld.getTestimonies(),
      this.ld.getConfig(),
      this.products$
    ).pipe(
      map(([carousel, promo, test, confi]) => {
        this.banners = carousel
        this.promo = promo
        this.testimonies = test
        this.middle = confi['middle']
        return true
      })
    )
  }

  getStars(number) {
    let star = [false, false, false, false, false]
    for (let i = 0; i < number; i++) {
      star[i] = true
    }
    return star
  }

  navigateBrand(banner) {
    console.log(banner);

    switch (banner['redirectTo']) {
      case 'Categoría/subcategoría':
        console.log(banner.category.split(' >> '));

        let category = banner['category'].split(' >> ')
        switch (category.length) {
          case 1:
            this.router.navigate(['/main/productos', category[0].split(' ').join('-').toLowerCase()]);
            break;
          case 2:
            this.router.navigate(['/main/productos', category[0].split(' ').join('-').toLowerCase(), category[1].split(' ').join('-').toLowerCase()]);
            break;
          case 3:
            let subsub = category[2].split(' ').join('-').toLowerCase()
            this.router.navigate(['/main/productos', category[0].split(' ').join('-').toLowerCase(), category[0].split(' ').join('-').toLowerCase(), category[1].split(' ').join('-').toLowerCase(), subsub]);
            break;
          default:
            break;
        }

        break;
      case 'Marca':
        this.router.navigate(['/main/productos'], {
          queryParams: { brand: banner.brand },
        });
        break;
      case 'Producto':
        if (banner.products.length > 1) {
          this.router.navigate(['/main/productos'], {
            queryParams: { productos: banner.products.map(el => el.id).join('-') },
          });
        } else {
          this.router.navigate(['/main/producto', banner.products[0]['id']]);
        }
        break;
      default:
        break;
    }
  }

}
