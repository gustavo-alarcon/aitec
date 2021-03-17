import { Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, map, shareReplay, startWith, switchMap, take, tap } from 'rxjs/operators';
import { Product, unitProduct } from 'src/app/core/models/product.model';
import { SaleRequestedProducts } from 'src/app/core/models/sale.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { ShoppingCarService } from 'src/app/core/services/shopping-car.service';
import { NoLoginDialogComponent } from '../no-login-dialog/no-login-dialog.component';

@Component({
  selector: 'app-web-view',
  templateUrl: './web-view.component.html',
  styleUrls: ['./web-view.component.scss']
})
export class WebViewComponent implements OnInit {
  @Input() product: Product
  @Input() price: number
  @Input() promo: boolean
  
  selectImage: any
  galleryImg: Array<any>

  @ViewChild("image") image: ElementRef;
  productSelected: any = null

  selectedProduct:any
  selected = new FormControl('')
  changeColor$: Observable<unitProduct>

  defaultImage = "../../../../assets/images/icono-aitec-01.png";

  favorite$: Observable<any>

  loadingFav = new BehaviorSubject<boolean>(false);
  loadingFav$ = this.loadingFav.asObservable();

  slideConfig = {
    "slidesToShow": 1, "slidesToScroll": 1,
    "autoplay": false
  };

  reqProdObservable$: Observable<SaleRequestedProducts>
  verifyStock$: Observable<boolean>
  pendingPayment$: Observable<boolean>;

  constructor(
    public auth: AuthService,
    private afs: AngularFirestore,
    private renderer: Renderer2,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public ShopCar: ShoppingCarService
  ) { }

  ngOnInit(): void {
    //console.log("init")
    this.reqProdObservable$ = this.changeColor$.pipe(
      switchMap(color => {
        //console.log("changing color")
        return this.ShopCar.getReqProductObservable(this.product.sku, color.sku).pipe(
          debounceTime(100),
          startWith(null),
        )
      })
    )
    this.verifyStock$ = this.changeColor$.pipe(
      switchMap(color => {
        return this.ShopCar.getProductDbObservable(this.product.id).pipe(
          map(prodDb => {
            // console.log(this.product.id)
            // console.log(prodDb)
            let prodColor = prodDb.products.find(el => el.sku == color.sku)
            // console.log(prodColor)
            if(!!prodColor){
              return prodColor.virtualStock > 0
            } else {
              return false
            }
          })
        )
        }
      )
    )

    this.pendingPayment$ = this.auth.user$.pipe(
      map(user => {
        return !!user.pendingPayment
      })
    )
  }

  ngOnChanges() {
    this.selectedProduct = this.product
    this.selected.setValue(this.product.products[0])
    
    this.changeColor$ = this.selected.valueChanges.pipe(
      startWith(this.product.products[0]),
      tap((res: unitProduct) => {
        this.productSelected = res
        this.galleryImg = res.gallery.map((el, i) => { return { ind: i + 1, photoURL: el.photoURL } })
        this.selectImage = this.galleryImg[0]
      }),
      shareReplay(1)
    )

    this.favorite$ = this.auth.user$.pipe(
      map(user => {
        if (user) {
          let ind = user.favorites ? user.favorites.indexOf(this.product.id) : -1
          return ind == 0 ? ind + 2 : ind
        } else {
          return -1
        }
      })
    )
  }

  addProd() {

    let newProduct: SaleRequestedProducts = {
      product: this.product,
      quantity: 1,                  
      chosenProduct: this.selected.value,
      color: this.product.products.length > 1,
      price: this.price
    };

    this.ShopCar.addProd(newProduct)
    
  }

  changeSelectImage(image) {
    this.selectImage = image
  }

  zoom(e) {
    var zoomer = e.currentTarget;
    let offsetX = e.offsetX
    let offsetY = e.offsetY

    let x = offsetX / zoomer.offsetWidth * 100
    let y = offsetY / zoomer.offsetHeight * 100
    this.renderer.setStyle(this.image.nativeElement, 'background-position', x + '% ' + y + '%')
  }

  addFavorites() {
    this.loadingFav.next(true)
    this.auth.user$.pipe(take(1)).subscribe(user => {
      const batch = this.afs.firestore.batch()
      let ref = this.afs.firestore.collection(`/users`).doc(user.uid);
      let exist = user.favorites ? user.favorites : []
      exist.push(this.product.id)
      batch.update(ref, {
        favorites: exist
      })

      batch.commit().then(() => {
        this.loadingFav.next(false)
        this.snackBar.open('Agregado a favoritos', 'Cerrar', {
          duration: 6000,
        });
      })
    })
  }

  removeFavorites() {
    this.loadingFav.next(true)
    this.auth.user$.pipe(take(1)).subscribe(user => {
      const batch = this.afs.firestore.batch()
      let ref = this.afs.firestore.collection(`/users`).doc(user.uid);
      let exist = user.favorites
      let ind = exist.indexOf(this.product.id)
      exist.splice(ind, 1)
      batch.update(ref, {
        favorites: exist
      })

      batch.commit().then(() => {
        this.loadingFav.next(false)
        this.snackBar.open('Desagregado a favoritos', 'Cerrar', {
          duration: 6000,
        });

      })
    })
  }

  login() {
    let title='¡Hola! Para comprar, ingresa a tu cuenta';
    this.dialog.open(NoLoginDialogComponent, {
      data:{title},
      width: '300px'
    })
  }

  getDiscount(promo) {
    let price = this.price
    let moneyDisccount: number = 0
    let percentageDisccount: number = 0
    moneyDisccount = (price * promo.quantity - promo.promoPrice);
    percentageDisccount = (moneyDisccount / (price * promo.quantity)) * 100.0;
    return Math.round(percentageDisccount)
  }

}
