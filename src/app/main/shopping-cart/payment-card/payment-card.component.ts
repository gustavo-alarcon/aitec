import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Sale } from 'src/app/core/models/sale.model';
import { User } from 'src/app/core/models/user.model';
import KRGlue from "@lyracom/embedded-form-glue";
import { tap } from 'rxjs/operators';


@Component({
  selector: 'app-payment-card',
  templateUrl: './payment-card.component.html',
  styleUrls: ['./payment-card.component.scss']
})
export class PaymentCardComponent implements OnInit {
  noLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false)

  @Input() total:string;
  @Input() user: User;
  @Input() sale: Sale

  private API_ENDPOINT = 'https://api.micuentaweb.pe';
  private API_KEY = '13421879:testpublickey_OiXCXWh4P0RiAuqIv3BUP0U27UGUdyOdNQpFM5VdFH61n';
  data: { ipnTargetUrl: string; metadata: Sale; amount: string; currency: string; orderId: string; customer: { email: string; reference: string; billingDetails: { cellPhoneNumber: string; firstName: string; }; }; };


  constructor(
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    let decimal=parseFloat(this.total).toFixed(2);    
    let totalPay =decimal.replace(/\./g,'');
    
    //Saving data
    this.data = {
      ipnTargetUrl: 'https://us-central1-aitec-ecommerce.cloudfunctions.net/cardPayment',
      metadata  :  this.sale,
      amount    :  totalPay,
      currency  :  "PEN",
      orderId   :  this.sale.id,
      customer  :  {
          email : this.user.email,
          reference: this.user.uid,
          billingDetails: {
            cellPhoneNumber: String(this.user.personData.phone),
            firstName: this.user.personData.name
          }

      }
    };
    console.log("loading form")

    //loading Form Token
    this.loadFormToken(this.data).toPromise()
    .then(formToken => {
      return this.loadPaymentLibrary(formToken)
    })

  }

  //We first request formToken. The formToken will be valid only for 15 min
  loadFormToken(data): Observable<Object>{
    const username = '13421879';
    const password = 'testpassword_MrLOJyprSofwHEEbSrJYyIwv5DZsTG76WwiOq9msFmj6L';

    var auth = 'Basic ' + btoa(username + ":" + password);

    var url = "/api-payment/V4/Charge/CreatePayment";

    const httpOptions = {
      headers: new HttpHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        Authorization: auth,
      })
    };

    let formToken = this.http.post(url, JSON.stringify(data), httpOptions).pipe(tap((console.log)))

    return formToken;
  }

  loadPaymentLibrary(formToken) {
    KRGlue.loadLibrary(this.API_ENDPOINT, this.API_KEY)
      .then(({KR}) => {
        console.log("Library Loaded")
        return KR.setFormConfig({
          'formToken': formToken.answer.formToken,
          'kr-language': 'en-US'
        })
      })
      .then(({KR}) => {
        console.log("form config set")
        return KR.addForm("#myPaymentForm")
      })
      .then(({KR, result})=> {
        console.log("Form added")
        this.noLoading$.next(true)
        KR.onSubmit((res)=> {console.log('success: '+res)})
        KR.onError((res)=> {console.log('error: '+res)})
        return KR.showForm(result.formId)
      })
      
  }



}
