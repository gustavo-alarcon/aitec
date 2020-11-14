import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { Gallery, GalleryRef } from 'ng-gallery';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  product$: Observable<any>;

  prods:Array<number> = [1,2,3,4,5,6,7,8]
  slideConfig2 = {"slidesToShow": 4, "slidesToScroll": 1,
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
  ]};
  constructor(
    private dbs: DatabaseService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private gallery: Gallery
  ) {}

  ngOnInit(): void {
    this.product$ = this.route.params.pipe(
      map((param) => {
        return this.dbs.products.filter((el) => el.sku == param.id)[0];
      }),
      tap(res=>{
        this.loading.next(false)
        const galleryRef: GalleryRef = this.gallery.ref('mini');
        res.gallery.forEach(el=>{
          galleryRef.addImage({
            src: el,
            thumb: el
          });
        })
      })
    );
  }
}
