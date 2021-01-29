import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaginationInstance } from 'ngx-pagination';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, startWith, switchMap, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.scss'],
})
export class StoreComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  category$: Observable<any>;
  config: PaginationInstance = {
    id: 'custom',
    itemsPerPage: 12,
    currentPage: 1,
  };

  products: Array<any> = [];
  products$: Observable<any>;
  searchForm: FormControl = new FormControl('');

  p: number = 1;

  searchCategory: string;
  searchSubCategory: string;
  searchSubSubCategory: string;

  search: string;
  searchPromo: string;
  searchBrand: string;


  constructor(
    private dbs: DatabaseService,
    private route: ActivatedRoute,
    public auth: AuthService,
    private router: Router
  ) {
    this.route.paramMap.subscribe(params => {
      this.ngOnInit();
    });
  }

  ngOnInit(): void {
    this.category$ = this.dbs.getCategories()

    this.products$ = combineLatest(
      this.route.params,
      this.route.queryParams
    ).pipe(
      switchMap(([id, param]) => {
        this.loading.next(true)
        return combineLatest(
          this.searchForm.valueChanges.pipe(startWith('')),
          this.dbs.getProductsListValueChanges()
        ).pipe(
          map(([word, products]) => {

            let state = 'nada'
            let prods = products.filter(el => el.published)
            let cat = ''
            let sub = ''
            let subsub = ''

            let frag = null
            let promo = false
            let brand = null

            let listProd = []
            console.log(param);
            
            if (param.search) {
              this.search = param.search;
              frag = param.search.toLowerCase()
              state = 'frag'
            }

            if (param.brand) {
              this.searchBrand = param.brand;
              brand = param.brand.toLowerCase().trim()
              state = 'brand'
            }

            if (param.promo) {
              this.searchPromo = param.promo;
              promo = true
            }

            if (param.productos) {
              listProd = param.productos.split('-')
              state = 'productos'
            }

            if (id.id) {
              cat = id.id.split('-').join(' ')
              this.searchCategory = cat;
              state = 'cat'
            }
            if (id.cat) {
              sub = id.cat.split('-').join(' ')
              this.searchSubCategory = sub;
              state = 'sub'
            }
            if (id.sub) {
              subsub = id.sub.split('-').join(' ')
              this.searchSubSubCategory = subsub;
              state = 'subsub'
            }

            console.log(state);

            if (promo) {
              return prods.filter((el) => el.promo)
            } else {

              return this.filterProduct(state, prods, brand, cat, sub, subsub, word, frag, listProd)
            }

          }),
        )
      }),
      tap((res) => {
        this.loading.next(false)
        this.products = res;
      })
    );
  }

  filterProduct(state, prod, brand, cat, sub, subsub, word, frag, listProd) {
    switch (state) {
      case 'brand':
        return prod.filter(el => {
          if (typeof el.brand == 'string') {
            return el.brand.toLowerCase().trim().includes(brand)
          } else {
            el.brand.name.toLowerCase().trim().includes(brand)
          }
        })
        break;
      case 'frag':
        return prod.filter((el) =>
          frag
            ? el['description'].toLowerCase().includes(frag)
            || el['sku'].toLowerCase().includes(frag)
            || (el['category'] ? el['category'].toLowerCase().includes(frag) : false)
            //el['subcategory']?el['subcategory'].toLowerCase().includes(frag):false
            : true
        );
        break;
      case 'cat':
        return prod.filter(el => el.category.toLowerCase().trim() == cat.toLowerCase().trim())
        break;
      case 'sub':
        return prod.filter(el => el.category.toLowerCase().trim() == cat.toLowerCase().trim())
          .filter(el => el.subcategory.toLowerCase().trim() == sub.toLowerCase().trim())
        break;
      case 'subsub':
        return prod.filter(el => el.category.toLowerCase().trim() == cat.toLowerCase().trim())
          .filter(el => el.subcategory.toLowerCase().trim() == sub.toLowerCase().trim())
          .filter(el => el.subsubcategory ? el.subsubcategory.toLowerCase().trim() == subsub.toLowerCase().trim() : false)
        break;

      case 'productos':
        return prod.filter(el => listProd.includes(el.id))
        break;
      default:
        return prod.filter((el) =>
          word ? el.description.toLowerCase().includes(word.toLowerCase()) : true
        )
        break;
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

  showInfo(link) {
    console.log(link);

  }
}
