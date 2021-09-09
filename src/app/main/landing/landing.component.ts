import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { LandingService } from 'src/app/core/services/landing.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
  prods: Array<number> = [1, 2, 3, 4, 5, 6, 7, 8];

  slideConfig = {
    dots: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    lazyLoad: 'ondemand',
    arrows: false,
  };
  slides = [];
  slideConfig2 = {
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 7000,
    responsive: [
      {
        breakpoint: 1360,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 780,
        settings: {
          slidesToShow: 2,
        },
      },
    ],
  };

  slideConfig3 = {
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 7000,
    responsive: [
      {
        breakpoint: 1010,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 780,
        settings: {
          slidesToShow: 1,
          arrows: false,
        },
      },
    ],
  };

  init$: Observable<any>;
  products$: Observable<any>;
  latestProducts: Array<any> = [];
  mostSearched: Array<any> = [];
  lastProducts: Array<any> = [];
  offersProducts: Array<any> = [];
  offers: Array<any>;

  allCategories: Array<any> = [];

  banners: Array<any> = [];

  promo: Array<any> = [];
  testimonies: Array<any> = [];

  middle: any;

  constructor(
    private ld: LandingService,
    private dbs: DatabaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.products$ = combineLatest(
      this.dbs.getLastProducts(),
      this.dbs.getSearchsProducts(),
      this.dbs.getAllCategoriesDoc()
    ).pipe(
      map(([last, searched, cat]) => {
        // most searched
        this.mostSearched = searched.slice(0, 6);

        // latest products
        this.latestProducts = last.filter((prod) => prod.published).slice(0, 6);

        // offers
        this.offersProducts = last.filter((el) => el.promo).slice(0, 6);

        this.allCategories = cat;
      })
    );

    this.init$ = combineLatest(
      this.ld.getBanners('carousel'),
      this.ld.getBanners('promo'),
      this.ld.getTestimonies(),
      this.ld.getConfig(),
      this.products$
    ).pipe(
      map(([carousel, promo, testList, confi]) => {
        console.log(promo);
        
        this.banners = carousel;
        this.promo = promo;
        this.testimonies = testList.map((test) => {
          // construct an array of boolean for stars rating and adding it to the object
          test['stars'] = this.getStars(test['rating']);
          return test;
        });
        this.middle = confi['middle'];
        return true;
      })
    );
  }

  getStars(number) {
    let star = [false, false, false, false, false];
    for (let i = 0; i < number; i++) {
      star[i] = true;
    }
    return star;
  }

  navigateBrand(banner) {
    console.log('NavigatetBrand');
    switch (banner['redirectTo']) {
      case 'Categoría/subcategoría':
        let category = this.allCategories
          .find((ct) => ct.id == banner['category'])
          .completeName.split(' >> ');
        switch (category.length) {
          case 1:
            this.router.navigate([
              '/main/productos',
              category[0].split(' ').join('-').toLowerCase(),
            ]);
            break;
          case 2:
            this.router.navigate([
              '/main/productos',
              category[0].split(' ').join('-').toLowerCase(),
              category[1].split(' ').join('-').toLowerCase(),
            ]);
            break;
          case 3:
            let subsub = category[2].split(' ').join('-').toLowerCase();
            this.router.navigate([
              '/main/productos',
              category[0].split(' ').join('-').toLowerCase(),
              category[1].split(' ').join('-').toLowerCase(),
              subsub,
            ]);
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
        console.log(banner);
        
        if (banner.products.length > 1) {
          this.router.navigate(['/main/productos'], {
            queryParams: {
              productos: banner.products.map((el) => el.id).join('-'),
            },
          });
        } else {
          // let prod = this.latestProducts.filter(
          //   (pr) => banner.products[0]['id'] == pr.id
          // )[0];
          this.router.navigate(['/main/producto', banner.products[0].sku]);
        }
        break;
      default:
        break;
    }
  }
}
