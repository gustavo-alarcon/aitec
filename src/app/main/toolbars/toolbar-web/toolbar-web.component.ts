import { combineLatest, interval, Observable, of } from 'rxjs';
import { User } from 'src/app/core/models/user.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { map, shareReplay, filter, startWith, switchMap, takeWhile, tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { LandingService } from 'src/app/core/services/landing.service';
import { ShoppingCarService } from 'src/app/core/services/shopping-car.service';
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

  shopCarNumber$: Observable<number>

  defaultImage = "../../../../assets/images/icono-aitec-01.png";
  timer$: Observable<number>;
  user$: Observable<User>;
  constructor(
    public auth: AuthService,
    private router: Router,
    public dbs: DatabaseService,
    private ld: LandingService,
    private renderer: Renderer2,
    private dialog: MatDialog,
    public shopCar: ShoppingCarService,
  ) { }

  ngOnInit(): void {
    this.user$ = this.auth.user$.pipe(
      map(res => {
        res['alternativeName'] = this.getName(res);
        return res
      }),
      shareReplay(1))

    this.timer$ = this.user$.pipe(
      switchMap(user => {
        //console.log(user)
        if(!user.pendingPayment){
          return of(0)
        } else {
        return this.dbs.getPayingSales(user.uid).pipe(
          switchMap(sale => {
            console.log('Sale');
            
    
            return interval(1000).pipe(
              map(actualSecondLapsed => {
                let lapsedTime = Math.round((new Date()).valueOf()/1000) - sale.createdAt['seconds']
                let leftTime = 3600 - lapsedTime
                return leftTime
              }),
              takeWhile(leftTime => {
                //console.log(leftTime)
                if(leftTime > -900){
                  return true
                } else {
                  return false
                }
              }, true),
              map(leftTime => {
                if(leftTime >0){
                  return leftTime*1000
                } else {
                  return 0
                }
              })
            )
            
          })
        )}
      }),
      shareReplay(1)
    )
    
    this.shopCarNumber$ = this.shopCar.reqProdListObservable.pipe(
      map(list => {
        if(list){
          return list.length
        } else {
          return null
        }
      })
    )

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

  logOut() {
    this.auth.logout();
  }

  toggleMenu() {
    this.openedMenu = !this.openedMenu;
    this.firstOpening = !this.firstOpening;
    this.selectCategory = null
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
    console.log('clearInput');
    
    this.searchForm.setValue('');
  }

  navigate() {
    console.log('navigate');
    
    let name = this.searchForm.value;
    if (name.length > 1) {
      this.router.navigate(['/main/productos'], {
        queryParams: { search: name },
      });
      this.clearInput();
    }
  }

  navigatePromo() {
    console.log('navigatePromo');
    this.router.navigate(['/main/productos'], {
      queryParams: { promo: true },
    });
    this.toggleMenu()
    this.closeSection()
  }

  navigateProduct(product) {
    console.log('navigateProduct');
    this.router.navigate(['/main/producto', product['sku']]);
    this.clearInput();
  }

  navigateOnlyCategory(category) {
    console.log('navigateOnlyCategory');
    let cat = category.split(' ').join('-').toLowerCase()
    this.router.navigate(['/main/productos', cat]);
    this.toggleMenu()
    this.closeSection()
  }

  navigateCategory(category, subcategory) {
    console.log('navigateCategory');
    let cat = category.split(' ').join('-').toLowerCase()
    let sub = subcategory.split(' ').join('-').toLowerCase()
    this.router.navigate(['/main/productos', cat, sub]);
    this.toggleMenu()
    this.closeSection()
  }

  navigateSubCategory(category, subcategory, subsubcategory) {
    console.log('navigateSubCategory');
    let cat = category.split(' ').join('-').toLowerCase()
    let sub = subcategory.split(' ').join('-').toLowerCase()
    let subsub = subsubcategory.split(' ').join('-').toLowerCase()
    this.router.navigate(['/main/productos', cat, sub, subsub]);
    this.toggleMenu()
    this.closeSection()
  }

  navigateBrand(name) {
    console.log('navigateBrand');
    this.toggleMenu()
    this.router.navigate(['/main/productos'], {
      queryParams: { brand: name },
    });
    this.closeSection()
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
