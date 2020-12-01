import { switchMap, map, startWith, tap, takeLast } from "rxjs/operators";
import { Observable, combineLatest, BehaviorSubject } from "rxjs";
import { Sale } from "./../../core/models/sale.model";
import { DatabaseService } from "src/app/core/services/database.service";
import { AuthService } from "src/app/core/services/auth.service";
import { FormControl, FormGroup } from "@angular/forms";
import { Component, OnInit } from "@angular/core";
@Component({
  selector: 'app-shopping-history',
  templateUrl: './shopping-history.component.html',
  styleUrls: ['./shopping-history.component.scss']
})
export class ShoppingHistoryComponent implements OnInit {
  dateForm: FormGroup;
  init$: Observable<Sale[]>;
  prueba$: Observable<any>;
  chooseSale: Sale;

  view = new BehaviorSubject<number>(1);
  view$ = this.view.asObservable();

  p: number = 1;
  p1: number = 1;

  dataX: any

  constructor(private dbs: DatabaseService, private auth: AuthService) { }

  ngOnInit(): void {
    const view = this.dbs.getCurrentMonthOfViewDate();

    let beginDate = view.from;
    let endDate = new Date();
    endDate.setHours(23, 59, 59);

    this.dateForm = new FormGroup({
      start: new FormControl(beginDate),
      end: new FormControl(endDate)
    });

    this.init$ = this.auth.user$.pipe(
      switchMap((user) => {
        return combineLatest(
          this.dbs.getSalesUser(user.uid),
          this.dateForm.get('start').valueChanges.pipe(
            startWith(beginDate),
            map(begin => begin.setHours(0, 0, 0, 0))
          ),
          this.dateForm.get('end').valueChanges.pipe(
            startWith(endDate),
            map(end =>  end.setHours(23, 59, 59))
          )
        ).pipe(
          map(([products, startdate,enddate]) => {
            let date = {begin:startdate,end:enddate}
            return products.filter((el) => {
              return this.getFilterTime(el["createdAt"], date);
            });
          })
        );
      })
    );


  }

  getTotal(order) {
    return order
      .map((el) => this.giveProductPrice(el))
      .reduce((a, b) => a + b, 0);
  }

  roundNumber(number) {
    return Number(parseFloat(number).toFixed(1));
  }

  giveProductPrice(item) {
    if (item.product.promo) {
      let promTotalQuantity = Math.floor(
        item.quantity / item.product.promoData.quantity
      );
      let promTotalPrice =
        promTotalQuantity * item.product.promoData.promoPrice;
      let noPromTotalQuantity = item.quantity % item.product.promoData.quantity;
      let noPromTotalPrice = noPromTotalQuantity * item.product.price;
      return this.roundNumber(promTotalPrice + noPromTotalPrice);
    } else {
      return this.roundNumber(item.quantity * item.product.price);
    }
  }

  getFilterTime(el, time) {
    let date = el.toMillis();
    let begin = time.begin;
    let end = time.end;
    return date >= begin && date <= end;
  }

  showList(item, small: boolean) {
    this.chooseSale = item;
    if (small) {
      this.view.next(2);
    }
  }

  hideList() {
    this.chooseSale = null;
  }

  back() {
    this.view.next(1);
    this.hideList();
  }

  getStatus(status: string) {
    switch (status.toLowerCase()) {
      case "solicitado":
        return "Solicitado";
        break;
      case "atendido":
        return "En atención";
        break;
      case "anulado":
        return "Anulado";
        break;
      default:
        return "Atendido";
        break;
    }
  }

  getColor(status: string) {
    switch (status.toLowerCase()) {
      case "atendido":
        return "attend status";
        break;
      case "anulado":
        return "anulado status";
        break;
      default:
        return "solicitado status";
        break;
    }
  }

  getPrice(item) {
    if (item.product.promo) {
      return item.product.promoData.promoPrice * item.quantity;
    } else {
      return item.product.price * item.quantity;
    }
  }
}
