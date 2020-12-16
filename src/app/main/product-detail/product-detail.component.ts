import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, switchMap, switchMapTo, takeLast, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  product$: Observable<any>;
  productDiv: any
  prods: Array<any> = []
  galleryImg: Array<any>
  selectImage: any
  slideConfig2 = {
    "slidesToShow": 4, "slidesToScroll": 1,
    "autoplay": false,
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
    ]
  };

  @ViewChild("image") image: ElementRef;

  defaultImage = "../../../assets/images/icono-aitec-01.png";

  colorSelected: any = null
  constructor(
    private dbs: DatabaseService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private router: Router
  ) {
    this.route.paramMap.subscribe(params => {
      this.ngOnInit();
    });
  }

  ngOnInit(): void {
    this.productDiv = null
    this.product$ = this.route.params.pipe(
      switchMap((param) => {
        return combineLatest(
          this.dbs.getProduct(param.id),

          this.dbs.getProductsListValueChanges()
        ).pipe(
          map(([product, prods]) => {

            this.prods = prods.filter(el => el.category == product.category)
            return product
          })
        )
      }),
      tap(res => {
        this.productDiv = res
        this.colorSelected = res.colors[0]
        this.loading.next(false)

        this.galleryImg = res.gallery.map((el, i) => { return { ind: i + 1, photoURL: el.photoURL } })
        this.selectImage = this.galleryImg[res.indCover]

      })
    );

  }

  changeSelectImage(image) {
    this.selectImage = image
  }

  zoom(e) {
    var zoomer = e.currentTarget;
    let offsetX = e.offsetX
    let offsetY = e.offsetY

    let x = offsetX / zoomer.offsetWidth * 100
    let y = offsetY / zoomer.offsetHeight * 100
    this.renderer.setStyle(this.image.nativeElement, 'background-position', x + '% ' + y + '%')
  }

  navigate(category, subcategory) {
    if (subcategory) {
      this.router.navigate(['/main/productos', category], {
        queryParams: { sub: subcategory },
      });
    } else {
      this.router.navigate(['/main/productos', category]);
    }

  }

  navigateOnlyCategory(category) {
    let cat = category.split(' ').join('-').toLowerCase()
    this.router.navigate(['/main/productos', cat]);
  }

  navigateCategory(category, subcategory) {
    let cat = category.split(' ').join('-').toLowerCase()
    let sub = subcategory.split(' ').join('-').toLowerCase()
    this.router.navigate(['/main/productos', cat, sub]);
  }

  navigateSubCategory(category, subcategory, subsubcategory) {
    let cat = category.split(' ').join('-').toLowerCase()
    let sub = subcategory.split(' ').join('-').toLowerCase()
    let subsub = subsubcategory.split(' ').join('-').toLowerCase()
    this.router.navigate(['/main/productos', cat, sub, subsub]);
  }

}
