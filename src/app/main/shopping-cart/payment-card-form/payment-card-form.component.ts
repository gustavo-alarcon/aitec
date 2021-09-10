import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map, startWith, tap } from 'rxjs/operators';
import { GeneralConfig } from 'src/app/core/models/generalConfig.model';
import { Payments } from 'src/app/core/models/payments.model';
import { Sale, saleStatusOptions } from 'src/app/core/models/sale.model';
import { User } from 'src/app/core/models/user.model';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-payment-card-form',
  templateUrl: './payment-card-form.component.html',
  styleUrls: ['./payment-card-form.component.scss', '../pay-sale/pay-sale.component.scss']
})
export class PaymentCardFormComponent implements OnInit {
  noLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false)

  @ViewChild('postForm') postForm:ElementRef;

  @Input() total:string;
  @Input() user: User;
  @Input() sale: Sale;
  @Input() paymentMethod: Payments;

  amountForm: FormGroup;
  vads_payment_config_amount: FormGroup;
  vads_page_action_change_count: Observable<any>;
  paymentForm$: Observable<void>;
  signature: string;
  sth: any;
  paymentData: any;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private renderer: Renderer2,
    private dbs: DatabaseService
  ) { }
  
  paymentForm: FormGroup

  ngOnInit(): void {
    //console.log(this.user)
    let newSale = {...this.sale}

    let date = new Date()
    let dateNumber = Number(String(date.getUTCFullYear())+String(date.getUTCMonth()+1).padStart(2,"0")
                    +String(date.getUTCDate()).padStart(2,"0")+String(date.getUTCHours()).padStart(2,"0")
                    +String(date.getUTCMinutes()).padStart(2,"0")+String(date.getUTCSeconds()).padStart(2,"0"));

    let total = Math.ceil(Number(this.total)*100);    
    
    this.paymentData = {
      vads_action_mode: "INTERACTIVE",
      vads_amount: total,
      vads_ctx_mode: "PRODUCTION",//PRODUCTION, TEST
      vads_currency: 604,
      vads_cust_email: this.sale.user.email,
      vads_cust_first_name : this.sale.user.personData.name,
      vads_cust_id: this.sale.user.uid,
      vads_cust_last_name: this.sale.user.personData["lastName"] ? this.sale.user.personData["lastName"]:"",
      vads_ext_info_payType_account: this.paymentMethod.account,
      vads_ext_info_payType_id: this.paymentMethod.id,
      vads_ext_info_payType_name: this.paymentMethod.name,
      vads_ext_info_payType_type: this.paymentMethod.type,
      vads_ext_info_status: (new saleStatusOptions()).requested,
      vads_order_id: this.sale.id,
      vads_page_action: "PAYMENT",
      vads_payment_cards: "",
      vads_payment_config: "SINGLE",
      vads_payment_option_code: "",
      vads_return_mode: "GET",
      vads_site_id: 13421879,
      vads_theme_config: `SUBMIT_BUTTON_LABEL=PAGAR S/.${(total/100).toFixed(2)};FORM_TARGET=_top; RESPONSIVE_MODEL=Model_2`,
      vads_trans_date: dateNumber,
      vads_trans_id: this.makeid(6),
      vads_url_cancel: `https://aitecperu.com.pe/main/carrito/?action=cancelled&saleId=${this.sale.id}`,
      vads_url_refused: `https://aitecperu.com.pe/main/carrito/?action=refused&saleId=${this.sale.id}`,
      vads_url_success: `https://aitecperu.com.pe/main/carrito/?action=success&saleId=${this.sale.id}`,
      vads_version: "V2"
    }
    //console.log(this.paymentData)
    
    let string = Object.values(this.paymentData).join("+")
    //console.log("String: "+string)

    this.loadFormSignature(string).toPromise().then((res: string) => {
      this.signature = res
      //console.log(this.signature)
    }, err => {
      this.snackBar.open("Ocurrió un Error. Por favor, refresque la página", "Aceptar")
    }).finally(()=> {
      //console.log("submitting")
      //console.log(this.renderer.selectRootElement(this.postForm))
      setTimeout(() => {
        this.renderer.selectRootElement(this.postForm).nativeElement.submit();
      }, 500);
    })

  }

  //We first request formToken. The formToken will be valid only for 15 min
  loadFormSignature(data: string): Observable<Object>{
  

    let url = "https://us-central1-aitec-ecommerce.cloudfunctions.net/reqVadsForm";

    //You should choose which mode you want
    let mode: "TEST"|"PROD" = "PROD"

    const httpOptions = {
      headers: new HttpHeaders({
        'Access-Control-Allow-Origin': "*",
      })
    };

    

    let formToken = this.http.post(url+`/?mode=${mode}`, data, {...httpOptions, responseType: 'text'}).pipe(
      tap(res => {
         //console.log(res)
      }),
      catchError((err, caught)=> {
        console.log("catching error")
        console.log(err)
        this.snackBar.open("Error. Por favor, refresque la página.", "Aceptar")
        return null
      }))

    return formToken;
  }

  //Function used only for testing purposes. Use backend instead
  // encryptBase64(key: string, str: string){
  //   var enc = new TextEncoder();
  //   //console.log("str: ", str)

  //   return window.crypto.subtle.importKey(
  //       "raw", // raw format of the key - should be Uint8Array
  //       enc.encode(key),
  //       { // algorithm details
  //           name: "HMAC",
  //           hash: {name: "SHA-256"}
  //       },
  //       false, // export = false
  //       ["sign", "verify"] // what this key can do
  //   ).then( key => {
  //       return window.crypto.subtle.sign(
  //           "HMAC",
  //           key,
  //           enc.encode(str)
  //       )
  //   }).then(signature => {
  //     let base64String = btoa(String.fromCharCode(...new Uint8Array(signature)));
  //     return base64String
  // });
  // }

  makeid(length) {
    var result           = [];
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345678';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result.push(characters.charAt(Math.floor(Math.random() *  charactersLength)));
    }
    return result.join('');
}

}


