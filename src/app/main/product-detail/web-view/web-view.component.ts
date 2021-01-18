import { Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, startWith, take, tap } from 'rxjs/operators';
import { Product } from 'src/app/core/models/product.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
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

  selected = new FormControl('')
  changeColor$: Observable<any>

  defaultImage = "../../../../assets/images/icono-aitec-01.png";

  favorite$: Observable<any>

  loadingFav = new BehaviorSubject<boolean>(false);
  loadingFav$ = this.loadingFav.asObservable();

  slideConfig = {
    "slidesToShow": 1, "slidesToScroll": 1,
    "autoplay": false
  };

  constructor(
    public auth: AuthService,
    private afs: AngularFirestore,
    private renderer: Renderer2,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
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

  ngOnChanges() {
    this.selected.setValue(this.product.products[0])
    this.changeColor$ = this.selected.valueChanges.pipe(
      startWith(this.product.products[0]),
      tap(res => {
        this.productSelected = res
        this.galleryImg = res.gallery.map((el, i) => { return { ind: i + 1, photoURL: el.photoURL } })
        this.selectImage = this.galleryImg[0]
      })
    )



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
    this.dialog.open(NoLoginDialogComponent, {
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
