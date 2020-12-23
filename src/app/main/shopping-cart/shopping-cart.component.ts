import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { BehaviorSubject, combineLatest, forkJoin, Observable } from 'rxjs';
import { map, startWith, take, takeLast, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { SaleDialogComponent } from './sale-dialog/sale-dialog.component';

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.scss'],
})
export class ShoppingCartComponent implements OnInit {
  view = new BehaviorSubject<number>(1);
  view$ = this.view.asObservable();

  list$: Observable<any>;
  sum$: Observable<number>;
  discount$: Observable<number>;
  subtotal$: Observable<number>;
  igv$: Observable<number>;
  delivery$: Observable<number>;

  products: Array<any>;
  total: number = 0

  adviserForm: FormControl = new FormControl('')
  advisers$: Observable<any>;

  locationInfo:any={}
  payInfo:any={}
  
  constructor(
    private dbs: DatabaseService,
    public auth: AuthService,
    private fb: FormBuilder,
    private ng2ImgMax: Ng2ImgMaxService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    console.log(this.dbs.order);
    
    this.delivery$ = this.dbs.delivery$
    this.products = this.dbs.order;
    this.sum$ = combineLatest(this.dbs.orderObs$, this.dbs.delivery$).pipe(
      map(([ord, del]) => {
        if (ord.length) {
          let suma = [...ord]
            .map((el) => this.getPrice(el))
            .reduce((a, b) => a + b, 0);
          this.total = suma + del;
          return suma + del;
        } else {
          return 0 + del;
        }
      })
    );

    this.subtotal$ = this.dbs.orderObs$.pipe(
      map((ord) => {
        return [...ord]
          .map((el) => el.quantity * el.product.priceMin * 0.82)
          .reduce((a, b) => a + b, 0);
      })
    );

    this.igv$ = this.dbs.orderObs$.pipe(
      map((ord) => {
        return [...ord]
          .map((el) => el.quantity * el.product.priceMin * 0.18)
          .reduce((a, b) => a + b, 0);
      })
    );

    this.discount$ = this.dbs.orderObs$.pipe(
      map((ord) => {
        return [...ord]
          .map((el) => this.getDiscount(el))
          .reduce((a, b) => a + b, 0);
      })
    );

    this.advisers$ = combineLatest(
      this.adviserForm.valueChanges.pipe(
        startWith(''),
      ),
      this.dbs.getAdvisers()
    ).pipe(
      
      map(([value,advisers]) => {
        console.log(advisers);
        
        let filt = typeof value == 'object'?value.displayName:value
        return advisers.filter((el) =>
          value ? el['displayName'].toLowerCase().includes(filt.toLowerCase()) : true
        );
      })
    );

    
  }

  firstView() {
    this.view.next(1);
  }
  secondView() {
    this.view.next(2);
  }
  thirdView() {
    this.view.next(3);
  }

  finish() {
    /*
    this.view.next(4);
    this.auth.user$.pipe(take(1)).subscribe(user => {
      console.log(user);
      
      let info = {
        departamento: this.formGroup.value['departamento']['departamento'],
        provincia: this.formGroup.value['provincia']['provincia'],
        distrito: this.formGroup.value['distrito']['distrito'],
        direccion: this.formGroup.value['direccion'],
        referencia: this.formGroup.value['referencia'],
        coordenadas: this.center,
        store: this.formGroup.value['store']
      }
      let newSale = {
        id: '',
        correlative: 0,
        correlativeType: 'R',
        document: this.document == 1 ? 'Boleta' : 'Factura',
        documentInfo: this.documentForm.value,
        payType: this.method,
        payInfo: this.cardForm.value,
        deliveryType: this.delivery == 1 ? 'Entrega en domicilio' : 'Recojo en tienda',
        deliveryInfo: info,
        requestDate: null,
        createdAt: new Date(),
        createdBy: null,
        user: user,
        requestedProducts: this.dbs.order,
        status: 'Solicitado',
        total: this.total,
        deliveryPrice: this.formGroup.value['distrito']['delivery'],
        observation: this.observation.value,
        voucher: [],
        voucherChecked: false,
        adviser: null,
        coupon: null
      }


      console.log(newSale);
      let phot=this.photos.data.length?this.photos:null

      this.dbs.reduceStock(user, newSale, phot).then(() => {
        this.view.next(1)
        this.dbs.order = []
        this.dbs.orderObs.next([])
        let name = user.personData?user.personData.name + ' ' + user.personData['lastName']:user['name'] + ' ' + user['lastName']
        this.dialog.open(SaleDialogComponent, {
          data: {
            name: name,
            number: newSale.correlative,
            email: user.email
          }
        })
        this.router.navigate(['/main/mispedidos']);
      })
    })*/


  }

  getPrice(item) {
    if (item.product.promo) {
      return item.product.promoData.promoPrice * item.quantity;
    } else {
      return item.product.priceMin * item.quantity;
    }
  }

  getDiscount(item) {
    let promoPrice = this.getPrice(item);
    let realPrice = item.quantity * item.product.priceMin;
    return realPrice - promoPrice;
  }

  showAdviser(staff): string | undefined {
    return staff ? staff['displayName'] : undefined;
  }
  
  
}
