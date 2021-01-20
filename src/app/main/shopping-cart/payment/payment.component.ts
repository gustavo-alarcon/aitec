import { Component, OnInit, Input } from '@angular/core';
//library KRGlue
import KRGlue from "@lyracom/embedded-form-glue";
import { DatabaseService } from '../../../core/services/database.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
 
  @Input() total:string;

  // payment gateway
  
  promiseError = null;

  KR;

  private static readonly API_ENDPOINT = 'https://api.micuentaweb.pe';
  private static readonly API_KEY = '13421879:testpublickey_OiXCXWh4P0RiAuqIv3BUP0U27UGUdyOdNQpFM5VdFH61n';
  
  data = {
    "amount":   2000,
    "currency": "PEN",
    "orderId":  "myOrderId - Test - Prueba",
    "customer": {
        "email": "mhalanocca@meraki-s.com"
    }
  };

  constructor(
              private readonly db:DatabaseService,
              private readonly router:Router,

              ) { }

  async ngOnInit(): Promise<void> {   
        
    await this.loadPaymentLibrary();
    await this.initializePaymentForm();
  }

  private async loadPaymentLibrary(): Promise<void> {
    if (!this.KR) {
      await KRGlue.loadLibrary(PaymentComponent.API_ENDPOINT, PaymentComponent.API_KEY).then(async ({KR}) => {
        await KR.setFormConfig({'kr-language': 'en-US'});

        this.KR = KR;
        console.log('Library loaded');
      });
    }
  }

  private async initializePaymentForm(): Promise<void> {

    await this.KR.removeForms();

    this.KR.onSubmit((response) => {

      console.log('response : ', response);

      //console.log(`Form submitted : ${response.formId}`);
      if (response.clientAnswer.orderStatus === 'PAID') {
        console.log('Payment success');

        this.PayFinishForm(response);
        return true;
      }
      else {
        console.error(`Payment status : ${response.clientAnswer.orderStatus}`);
        return false;
      }
    });
    this.KR.onError((error) => {
      console.error(error.errorMessage);
    });

    // Gets a new token every time    
    const formToken = await this.db.methodPostAsync(this.data);

    console.log('formToken : ',formToken)

    // Builds the form
    await this.KR.setFormToken(formToken.answer.formToken);
    await this.KR.addForm('#myPaymentForm').then(({KR, result}) => {
      console.log(`Form added : ${result.formId}`);
      return KR.showForm(result.formId);
    });
  }

  
  PayFinishForm(response){
    
    this.router.navigate(['/paysuccess']);
    
    /* this.transfereService.setData(response); 
    this.router.navigate(['/finishpay']); */
    //return `${this.router.navigate(['/finishpay',response])}`;

  }

  

}
