import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Sale, saleStatusOptions } from 'src/app/core/models/sale.model';
import { User } from 'src/app/core/models/user.model';
import KRGlue from "@lyracom/embedded-form-glue";
import { catchError, tap } from 'rxjs/operators';
import { Payments } from 'src/app/core/models/payments.model';
import { MatDialog } from '@angular/material/dialog';
import { SaleDialogComponent } from '../sale-dialog/sale-dialog.component';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-payment-card',
  templateUrl: './payment-card.component.html',
  styleUrls: ['./payment-card.component.scss']
})
export class PaymentCardComponent implements OnInit {
  noLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false)

  @Input() total:string;
  @Input() user: User;
  @Input() sale: Sale;
  @Input() paymentMethod: Payments

  private API_ENDPOINT = 'https://api.micuentaweb.pe';
  private API_KEY = '13421879:testpublickey_OiXCXWh4P0RiAuqIv3BUP0U27UGUdyOdNQpFM5VdFH61n';


  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    let decimal=parseFloat(this.total).toFixed(2);    
    let totalPay =decimal.replace(/\./g,'');

    let newSale = {...this.sale}

    let coupon_id = null
    if(!!newSale.coupon){
      coupon_id = newSale.coupon.id
    }
    
    //Saving data
    let data = {
      ipnTargetUrl: 'https://us-central1-aitec-ecommerce.cloudfunctions.net/cardPayment',
      metadata  :  {
        user_uid: newSale.user.uid,
        coupon_id: coupon_id,
        sale_id: newSale.id,
        payType_account: this.paymentMethod.account,
        payType_id: this.paymentMethod.id,
        payType_name: this.paymentMethod.name,
        payType_voucher: this.paymentMethod.voucher,
        payType_type: this.paymentMethod.type,
        status: (new saleStatusOptions()).requested
      },
      amount    :  totalPay,
      currency  :  "PEN",
      orderId   :  newSale.id,
      customer  :  {
          email : this.user.email,
          reference: this.user.uid,
          billingDetails: {
            cellPhoneNumber: String(this.user.personData.phone),
            firstName: this.user.personData.name,
            language: "ES"
          }

      }
    };
    console.log("loading form")
    console.log(data)

    //loading Form Token
    this.loadFormToken(data).toPromise()
    .then((formToken: string) => {
      return this.loadPaymentLibrary(formToken)
    }).catch(err => {
      console.log(err)
    })

  }

  //We first request formToken. The formToken will be valid only for 15 min
  loadFormToken(data): Observable<Object>{

    let url = "https://us-central1-aitec-ecommerce.cloudfunctions.net/reqForm";

    //You should choose which mode you want
    let mode: "TEST"|"PROD" = "TEST"

    const httpOptions = {
      headers: new HttpHeaders({
        'Access-Control-Allow-Origin': '*',
      })
    };

    let formToken = this.http.post(url+`/?mode=${mode}`, data, {...httpOptions, responseType: 'text'}).pipe(
      catchError((err, caught)=> {
        console.log("catching error")
        console.log(err)
        this.snackBar.open("Error. Por favor, refresque la página.", "Aceptar")
        return null
      }))

    return formToken;
  }

  loadPaymentLibrary(formToken: string){
    KRGlue.loadLibrary(this.API_ENDPOINT, this.API_KEY)
      .then(({KR}) => {
        console.log("Library Loaded")
        return KR.setFormConfig({
          'formToken': formToken,
          'kr-language': 'es-PE'
        })
      })
      .then(({KR}) => {
        console.log("form config set")
        return KR.addForm("#myPaymentForm")
      })
      .then(({KR, result})=> {
        console.log("Form added")
        this.noLoading$.next(true)
        //What to do with submission
        KR.onSubmit(
          res => {
            console.log(res)
            if (res.clientAnswer.orderStatus === 'PAID') {
  
              console.log('Payment success');
              this.dialog.open(SaleDialogComponent, 
                {
                  closeOnNavigation: false,
                  disableClose: true,
                  maxWidth: '260px',
                  data: { 
                    name: !!this.sale.user.name ? this.sale.user.name : this.sale.user.personData.name, 
                    email: this.sale.user.email, 
                    number: this.sale.id, 
                    asesor: this.sale.adviser }
                  }
                )
              this.router.navigate(["main"])
      
              return false;
            }
            else {
              console.error(`Payment status : ${res.clientAnswer.orderStatus}`);
             
              return  false;
            }
          }
        )
        return KR.showForm(result.formId)
      })
      
  }



}

