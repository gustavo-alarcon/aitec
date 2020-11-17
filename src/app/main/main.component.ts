import { combineLatest, Observable } from 'rxjs';
import { User } from '../core/models/user.model';
import { AuthService } from '../core/services/auth.service';
import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { DatabaseService } from '../core/services/database.service';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  user$: Observable<User>;

  openedMenu: boolean = false;
  firstOpening: boolean = false;

  searchForm: FormControl = new FormControl('');
  search$: Observable<any>;
  filteredProducts$: Observable<any>;

  @ViewChild("megaMenu") menu: ElementRef;
  selectCategory:any

  constructor(
    private auth: AuthService,
    private router: Router,
    public dbs: DatabaseService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.user$ = this.auth.user$;

    this.search$ = this.searchForm.valueChanges.pipe(
      startWith(''),
      map((word) => {
        return word.length > 2;
      })
    );

    this.filteredProducts$ = this.searchForm.valueChanges.pipe(
      filter((input) => input !== null),
      map((value) => {
        return value.length
          ? this.dbs.products.filter(
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

  onActivate(event) {
    window.scroll(0, 0);
  }

  clearInput() {
    this.searchForm.setValue('');
  }

  navigate() {
    let name = this.searchForm.value;
    if (name.length > 1) {
      this.router.navigate(['/main/productos'], { fragment: name });
      this.clearInput();
    }
  }

  navigateProduct(product) {
    this.router.navigate(['/main/producto', product['sku']]);
    this.clearInput();
  }

  showSelectedUser(staff): string | undefined {
    return staff ? staff['description'] : undefined;
  }

  openSection(title){
    this.selectCategory=title
    this.renderer.setStyle(this.menu.nativeElement, "visibility",'visible');
  }

  closeSection(){
    this.selectCategory=null
    this.renderer.setStyle(this.menu.nativeElement, "visibility",'hidden');
  }
}
