import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
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
productDiv:any
  prods:Array<any> = []
  galleryImg:Array<any>
  selectImage:any
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

  @ViewChild("image") image: ElementRef;

  constructor(
    private dbs: DatabaseService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.product$ = this.route.params.pipe(
      map((param) => {
        return this.dbs.products.filter((el) => el.sku == param.id)[0];
      }),
      tap(res=>{
        this.productDiv = res
        this.loading.next(false)
        this.prods = this.dbs.products.filter(el=>el.category==res.category)
        this.galleryImg = res.gallery.map((el,i)=>{return {ind:i+1,photoURL:el}})
        this.selectImage = this.galleryImg[0]
       
      })
    );
  }
  
  changeSelectImage(image){
    this.selectImage = image
  }

  zoom(e){
    var zoomer = e.currentTarget;
    let offsetX = e.offsetX
    let offsetY = e.offsetY 

    let x = offsetX/zoomer.offsetWidth*100
    let y = offsetY/zoomer.offsetHeight*100
    this.renderer.setStyle(this.image.nativeElement,'background-position', x + '% ' + y + '%')
  }

  navigate(category, subcategory) {
    if(subcategory){
      this.router.navigate(['/main/productos', category], {
        queryParams: { sub: subcategory },
      });
    }else{
      this.router.navigate(['/main/productos', category]);
    }
    
  }
}
