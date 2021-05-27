import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { combineLatest, interval, Observable, of } from 'rxjs';
import { filter, map, shareReplay, startWith, switchMap, takeWhile } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { ShoppingCarService } from 'src/app/core/services/shopping-car.service';

@Component({
  selector: 'app-toolbar-mobile',
  templateUrl: './toolbar-mobile.component.html',
  styleUrls: ['./toolbar-mobile.component.scss']
})
export class ToolbarMobileComponent implements OnInit {
  @Input() categories: Array<any>

  openSideNav: boolean = false
  searchForm: FormControl = new FormControl('');
  search$: Observable<any>;
  filteredProducts$: Observable<any>;
  openedSearch: boolean = false;
  selectCategory: {
    category: string;
    subcategories: any;
    brands: Array<any>;
  } = null

  shopCarNumber$: Observable<number>
  pendingPayment$: Observable<boolean>;

  constructor(
    public auth: AuthService,
    private router: Router,
    public dbs: DatabaseService,
    public shopCar: ShoppingCarService,
  ) { }

  ngOnInit(): void {
    this.shopCarNumber$ = this.shopCar.reqProdListObservable.pipe(
      map(list => {
        if(list){
          return list.length
        } else {
          return null
        }

      })
    )

    this.pendingPayment$ = this.auth.user$.pipe(map(user => !!user.pendingPayment))

    this.search$ = this.searchForm.valueChanges.pipe(
      startWith(''),
      map((word) => {
        return word.length > 2;
      })
    );

    this.filteredProducts$ = combineLatest(
      this.searchForm.valueChanges.pipe(
        map((value) => typeof value == 'string' ? value : value.description)
      ),
      this.dbs.getProductsList2()
    ).pipe(

      map(([val, products]) => {
        let prod = products.filter(p => p.published)
        let value = val ? val.toLowerCase() : ''
        return value.length
          ? prod.filter(
            (option) =>
              option['description']?.toLowerCase().includes(value) ||
              option['sku']?.toLowerCase().includes(value) ||
              option['category']?.toLowerCase().includes(value)
          )
          : [];
      })
    );
  }

  openSide() {
    this.openSideNav = !this.openSideNav
  }

  logOut() {
    this.auth.logout();
  }


  getName(user) {
    let name;
    let lastName;
    if (user.personData) {
      name = user.personData.name.split(' ')[0]
      lastName = user.personData.lastName.split(' ')[0]
    } else {
      name = user.name.split(' ')[0]
      lastName = user.lastName.split(' ')[0]
    }
    return name + ' ' + lastName
  }

  clearInput() {
    this.searchForm.setValue('');
  }


  showSelectedUser(staff): string | undefined {
    return staff ? staff['description'] : undefined;
  }

  toggleSearch(): void {
    this.openedSearch = !this.openedSearch;
  }


  navigate() {
    let name = this.searchForm.value;
    if (name.length > 1) {
      this.router.navigate(['/main/productos'], {
        queryParams: { search: name },
      });
      this.clearInput();
      this.openedSearch = false
    }
  }

  navigatePromo() {
    this.router.navigate(['/main/productos'], {
      queryParams: { promo: true },
    });
  }

  navigateProduct(product) {
    this.router.navigate(['/main/producto', product['sku']]);
    this.clearInput();
    this.toggleSearch();
  }

  navigateOnlyCategory(category) {
    let cat = category.split(' ').join('-').toLowerCase()
    this.router.navigate(['/main/productos', cat]);
  }

  navigateCategory(category, subcategory) {
    let cat = category.split(' ').join('-').toLowerCase()
    let sub = subcategory.split(' ').join('-').toLowerCase()
    this.router.navigate(['/main/productos', cat, sub]);
    this.openSide()
  }

  navigateSubCategory(category, subcategory, subsubcategory) {
    let cat = category.split(' ').join('-').toLowerCase()
    let sub = subcategory.split(' ').join('-').toLowerCase()
    let subsub = subsubcategory.split(' ').join('-').toLowerCase()
    this.router.navigate(['/main/productos', cat, sub, subsub]);
    this.openSide()
  }

  navigateBrand(name) {
    this.router.navigate(['/main/productos'], {
      queryParams: { brand: name },
    });
  }
}
