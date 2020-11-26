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
    itemsPerPage: 9,
    currentPage: 1,
  };

  products: Array<any>;
  products$: Observable<any>;
  searchForm: FormControl = new FormControl('');

  p: number = 1;

  searchCategory: string;
  searchSubCategory: string;
  searchSubSubCategory: string;

  search:string;
  searchPromo:string;
  searchBrand:string;


  constructor(
    private dbs: DatabaseService,
    private route: ActivatedRoute,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.category$ = this.dbs.getCategories()

    this.products = this.dbs.products;

    this.products$ = combineLatest(
      this.searchForm.valueChanges.pipe(startWith('')),
      this.route.params,
      this.route.queryParams
    ).pipe(
      map(([word, id, param]) => {
        let cat=''
        let sub = ''
        let subsub=''

        let frag = null
        let promo = false
        let brand = null
        
        console.log(param);
        console.log(id);
        
        if (param.search) {
          this.search = param.search;
          frag = param.search.toLowerCase()
        }

        if (param.brand) {
          this.searchBrand = param.search;
          brand = param.brand.toLowerCase()
        }

        if (param.promo) {
          this.searchPromo = param.promo;
          promo = true
        }

        if (id.id) {
          cat = id.id.split('-').join(' ')
          this.searchCategory = cat;
        }
        if (id.cat) {
          sub = id.cat.split('-').join(' ')
          this.searchSubCategory = sub;
        }
        if (id.sub) {
          subsub = id.sub.split('-').join(' ')
          this.searchSubSubCategory = subsub;
        }

        if(promo){
          return this.dbs.products.filter((el) => el.promo)
        }else{
          return this.dbs.products
          .filter((el) =>
            el.description.toLowerCase().includes(word.toLowerCase())
          )
          .filter((el) =>
            brand?el.brand.toLowerCase().includes(brand):true
          )
          .filter((el) => (cat ? el.category.toLowerCase() == cat.toLowerCase() : true))
          .filter((el) => (sub ? el.subcategory.toLowerCase() == sub.toLowerCase() : true))
          .filter((el) => (subsub ? el.subsubcategory.toLowerCase() == subsub.toLowerCase() : true))
          .filter((el) =>
            frag
              ? el['description'].toLowerCase().includes(frag) ||
                el['sku'].toLowerCase().includes(frag) ||
                el['category'].toLowerCase().includes(frag) ||
                el['subcategory'].toLowerCase().includes(frag)
              : true
          );
        }
        
      }),
      tap((res) => {
        this.products = res;
      })
    );
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

  showInfo(link){
    console.log(link);
    
  }
}
