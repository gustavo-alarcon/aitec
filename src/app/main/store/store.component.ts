import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaginationInstance } from 'ngx-pagination';
import { combineLatest, Observable } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.scss'],
})
export class StoreComponent implements OnInit {

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
  ) { }

  ngOnInit(): void {
    this.category$ = this.dbs.getCategories()

    this.products$ = combineLatest(
      this.searchForm.valueChanges.pipe(startWith('')),
      this.route.params,
      this.route.queryParams,
      this.dbs.getProductsListValueChanges()
    ).pipe(
      map(([word, id, param, products]) => {
        let state = 'nada'
        let prods = products.filter(el => el.published)
        let cat = ''
        let sub = ''
        let subsub = ''

        let frag = null
        let promo = false
        let brand = null

        if (param.search) {
          this.search = param.search;
          frag = param.search.toLowerCase()
          state = 'frag'
        }

        if (param.brand) {
          this.searchBrand = param.brand;
          brand = param.brand.toLowerCase()
          state = 'brand'
        }

        if (param.promo) {
          this.searchPromo = param.promo;
          promo = true
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

        if (promo) {
          return prods.filter((el) => el.promo)
        } else {

          return this.filterProduct(state, prods, brand, cat, sub, subsub, word, frag)
        }

      }),
      tap((res) => {
        this.products = res;
      })
    );
  }

  filterProduct(state, prod, brand, cat, sub, subsub, word, frag) {
    switch (state) {
      case 'brand':
        return prod.filter(el => el.brand.toLowerCase().includes(brand))
        break;
      case 'frag':
        return prod.filter((el) =>
          frag
            ? el['description'].toLowerCase().includes(frag) ||
            el['sku'].toLowerCase().includes(frag) ||
            el['category'].toLowerCase().includes(frag) ||
            el['subcategory'].toLowerCase().includes(frag)
            : true
        );
        break;
      case 'cat':
        return prod.filter(el => el.category.toLowerCase() == cat.toLowerCase())
        break;
      case 'sub':
        return prod.filter(el => el.category.toLowerCase() == cat.toLowerCase())
          .filter(el => el.subcategory.toLowerCase() == sub.toLowerCase())
        break;
      case 'subsub':
        return prod.filter(el => el.category.toLowerCase() == cat.toLowerCase())
          .filter(el => el.subcategory.toLowerCase() == sub.toLowerCase())
          .filter(el => el.subsubcategory.toLowerCase() == subsub.toLowerCase())
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
