import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, Observer } from 'rxjs';
import { map, switchMap, switchMapTo, take, takeLast, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  isSmall = false
  product$: Observable<any>;
  productDiv: any
  prods: Array<any> = []
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
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
          arrows: false
        }
      }
    ]
  };

  isSmall$: Observer<any>

  @ViewChild("image") image: ElementRef;

  defaultImage = "../../../assets/images/icono-aitec-01.png";

  colorSelected: any = null
  count: number = 1
  constructor(
    private dbs: DatabaseService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    public breakpointObserver: BreakpointObserver,
    private afs: AngularFirestore
  ) { }

  ngOnInit(): void {
    this.productDiv = null
    this.product$ = combineLatest(
      this.route.params,
      this.dbs.getProductsList()
    ).pipe(
      switchMap(([param,prods]) => {
        window.scroll(0, 0);
        this.loading.next(true)
        return this.dbs.getProduct(param.id).pipe(
          map(product => {

            this.prods = prods.filter(el => el.category == product.category)
            return product
            
          })
        )
      }),
      tap(res => {
        if (this.count == 1) {
          this.searchNumber(res)
        }
        this.loading.next(false)
      })
    );
    
   


  }

  searchNumber(product) {
    this.afs.firestore.runTransaction((transaction) => {
      const ref = this.afs.firestore.collection(`/db/aitec/productsList`).doc(product.id);

      return transaction.get(ref).then((doc) => {
        let searchNumber = doc.data().searchNumber ? doc.data().searchNumber : 0;
        searchNumber++
        transaction.update(ref, { searchNumber: searchNumber });
      });
    }).then(() => {
      this.count++

    })
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
