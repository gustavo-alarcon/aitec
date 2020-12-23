import { combineLatest, Observable, of } from 'rxjs';
import { User } from 'src/app/core/models/user.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { map, shareReplay, filter, startWith, switchMap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { LandingService } from 'src/app/core/services/landing.service';
@Component({
  selector: 'app-toolbar-web',
  templateUrl: './toolbar-web.component.html',
  styleUrls: ['./toolbar-web.component.scss']
})
export class ToolbarWebComponent implements OnInit {

  @Input() listCategories: Array<any>
  @Input() info: any
  openedMenu: boolean = false
  firstOpening: boolean = false;

  searchForm: FormControl = new FormControl('');
  search$: Observable<any>;
  filteredProducts$: Observable<any>;

  selectCategory: {
    category: string;
    subcategories: any;
    brands: Array<any>;
  } = null

  @ViewChild("megaMenu") menu: ElementRef;

  constructor(
    public auth: AuthService,
    private router: Router,
    public dbs: DatabaseService,
    private ld: LandingService,
    private renderer: Renderer2,
    private dialog: MatDialog
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

  logOut() {
    this.auth.logout();
  }

  toggleMenu() {
    this.openedMenu = !this.openedMenu;
    this.firstOpening = !this.firstOpening;

    //this.renderer.setStyle(this.menu.nativeElement, "display",'block');
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

  navigate() {
    let name = this.searchForm.value;
    if (name.length > 1) {
      this.router.navigate(['/main/productos'], {
        queryParams: { search: name },
      });
      this.clearInput();
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
  }

  navigateOnlyCategory(category) {
    let cat = category.split(' ').join('-').toLowerCase()
    this.router.navigate(['/main/productos', cat]);
  }

  navigateCategory(category, subcategory) {
    let cat = category.split(' ').join('-').toLowerCase()
    let sub = subcategory.split(' ').join('-').toLowerCase()
    this.router.navigate(['/main/productos', cat, sub]);
    this.toggleMenu()
  }

  navigateSubCategory(category, subcategory, subsubcategory) {
    let cat = category.split(' ').join('-').toLowerCase()
    let sub = subcategory.split(' ').join('-').toLowerCase()
    let subsub = subsubcategory.split(' ').join('-').toLowerCase()
    this.router.navigate(['/main/productos', cat, sub, subsub]);
    this.toggleMenu()
  }

  navigateBrand(name) {
    this.router.navigate(['/main/productos'], {
      queryParams: { brand: name },
    });
  }

  showSelectedUser(staff): string | undefined {
    return staff ? staff['description'] : undefined;
  }

  openSection(title) {
    this.selectCategory = title

    this.renderer.setStyle(this.menu.nativeElement, "display", 'block');
  }

  closeSection() {
    this.selectCategory = null
    this.renderer.setStyle(this.menu.nativeElement, "display", 'none');
  }

}
