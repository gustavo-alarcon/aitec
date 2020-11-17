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
  constructor(
    private dbs: DatabaseService,
    private route: ActivatedRoute,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.products = this.dbs.products;

    this.products$ = combineLatest(
      this.searchForm.valueChanges.pipe(startWith('')),
      this.route.params,
      this.route.queryParams,
      this.route.fragment
    ).pipe(
      map(([word, id, param, frag]) => {
        console.log(param);
        console.log(id);
        if (param.sub) {
          this.searchSubCategory = param.sub;
        }else{
          this.searchSubCategory = null;
        }
        if (id.id) {
          this.searchCategory = id.id;
        }
        return this.dbs.products
          .filter((el) =>
            el.description.toLowerCase().includes(word.toLowerCase())
          )
          .filter((el) => (id.id ? el.category == id.id : true))
          .filter((el) => (param.sub ? el.subcategory == param.sub : true))
          .filter((el) =>
            frag
              ? el['description'].toLowerCase().includes(frag) ||
                el['sku'].toLowerCase().includes(frag) ||
                el['category'].toLowerCase().includes(frag) ||
                el['subcategory'].toLowerCase().includes(frag)
              : true
          );
      }),
      tap((res) => {
        this.products = res;
      })
    );
  }

  navigate(category, subcategory) {
    this.router.navigate(['/main/productos', category], {
      queryParams: { sub: subcategory },
    });
  }

  navigateCategory(category) {
    this.router.navigate(['/main/productos', category]);
  }
}
