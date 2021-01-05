import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, Observer } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
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
    private afs: AngularFirestore
  ) { }

  ngOnInit(): void {
    this.productDiv = null
    this.product$ = this.route.params.pipe(
      switchMap((param) => {
        window.scroll(0, 0);
        this.loading.next(true)
        return this.dbs.getProduct(param.id)
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
