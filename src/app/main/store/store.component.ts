import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaginationInstance } from 'ngx-pagination';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, startWith, switchMap, tap } from 'rxjs/operators';
import { Category } from 'src/app/core/models/category.model';
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
  allCategories: Category[];

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
    this.category$ = this.dbs.getAllCategories().pipe(
      map((categories) => {
        this.allCategories = categories
        let onlyCategory = categories.filter(ct => !ct.idCategory)
        return onlyCategory.map(ct => {
          let subcategories = categories.filter(ct => !ct.idSubCategory).filter(sb => sb.idCategory == ct.id).map(sub => {
            return {
              name: sub.name,
              categories: categories.filter(sbb => sbb.idSubCategory == sub.id).map(sbb => sbb.name)
            }
          })
          return {
            category: ct.name,
            subcategories: subcategories,
            brands: ct.brands
          }
        })
      })
    )

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
              cat += ' >> ' + sub
              this.searchSubCategory = sub;
              state = 'sub'
            }
            if (id.sub) {
              subsub = id.sub.split('-').join(' ')
              this.searchSubSubCategory = subsub;
              cat += ' >> ' + subsub
              state = 'subsub'
            }
            
            if (promo) {
              return prods.filter((el) => el.promo)
            } else {

              return this.filterProduct(state, prods, brand, cat, word, frag, listProd)
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

  filterProduct(state, prod, brand, cat, word, frag, listProd) {
    
    switch (state) {
      case 'brand':
        return prod.filter(el => {
          if (typeof el.brand == 'string') {
            return el.brand.toLowerCase().trim().includes(brand)
          } else {
            return el.brand.name.toLowerCase().trim().includes(brand)
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
        let categ = this.allCategories.find(ct => ct.completeName.toLowerCase().trim().replace("  ", " ") == cat.toLowerCase().trim().replace("  ", " ")) 
        let catList = this.allCategories.filter(ct => ct.idCategory == categ.id).map(ct => ct.id)
        return prod.filter(el => categ ? el.idCategory == categ.id || catList.includes(el.idCategory) : false)
        break;
      case 'sub':
        let catego = this.allCategories.find(ct => ct.completeName.toLowerCase().trim().replace("  ", " ") == cat.toLowerCase().trim().replace("  ", " "))
        let subList = this.allCategories.filter(ct => ct.idSubCategory == catego.id).map(ct => ct.id)
        return prod.filter(el => catego ? el.idCategory == catego.id || subList.includes(el.idCategory) : false)
        break;
      case 'subsub':
        let category = this.allCategories.find(ct => ct.completeName.toLowerCase().trim().replace("  ", " ") == cat.toLowerCase().trim().replace("  ", " ")) 
        return prod.filter(el => category ? el.idCategory == category.id : false)
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
