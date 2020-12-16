import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-toolbar-mobile',
  templateUrl: './toolbar-mobile.component.html',
  styleUrls: ['./toolbar-mobile.component.scss']
})
export class ToolbarMobileComponent implements OnInit {
  @Input() categories: Array<any>

  openSideNav:boolean = false
  searchForm: FormControl = new FormControl('');
  search$: Observable<any>;
  filteredProducts$: Observable<any>;
  openedSearch: boolean = false;
  selectCategory: {
    category: string;
    subcategories: any;
    brands: Array<any>;
  } = null

 
  constructor(
    public auth: AuthService,
    private router: Router,
    public dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.search$ = this.searchForm.valueChanges.pipe(
      startWith(''),
      map((word) => {
        return word.length > 2;
      })
    );

    this.filteredProducts$ = combineLatest(
      this.searchForm.valueChanges.pipe(
        filter((input) => input !== null),
      ),
      this.dbs.getProductsList()
    ).pipe(

      map(([value, products]) => {
        return value.length
          ? products.filter(
            (option) =>
              option['description'].toLowerCase().includes(value) ||
              option['sku'].toLowerCase().includes(value) ||
              option['category'].toLowerCase().includes(value)
          )
          : [];
      })
    );
  }

  openSide(){
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
    }
  }

}
