import { Component, OnInit, Input } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { Sale, saleStatusOptions, SaleRequestedProducts } from 'src/app/core/models/sale.model';
import { shareReplay, startWith, switchMap, map } from 'rxjs/operators';
import { FormControl, FormGroup } from '@angular/forms';
import { DatabaseService } from 'src/app/core/services/database.service';
import { MatDialog } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
import { DatePipe } from '@angular/common';
import { SalesAddressDialogComponent } from '../sales-address-dialog/sales-address-dialog.component';
import { ShoppingCarService } from 'src/app/core/services/shopping-car.service';
import { Waybill } from 'src/app/core/models/waybill.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { User } from 'src/app/core/models/user.model';


@Component({
  selector: 'app-sales-master',
  templateUrl: './sales-master.component.html',
  styleUrls: ['./sales-master.component.scss']
})
export class SalesMasterComponent implements OnInit {
  @Input() detailSubject: BehaviorSubject<Sale>;
  @Input() locationSubject: BehaviorSubject<Number>;
  @Input() totalPriceSubject: BehaviorSubject<number>;

  defaultImage = '../../../../assets/images/no-image.png'

  saleStatusOptions = new saleStatusOptions();

  p: number = 1;

  saleStateSubject: BehaviorSubject<string> = new BehaviorSubject('Total');
  saleState$: Observable<string> = this.saleStateSubject.asObservable().pipe(shareReplay(1));
  salesFiltered$: Observable<Sale[]>;

  dateForm: FormGroup;
  statusForm: FormControl;
  search: FormControl;

  sales$: Observable<Sale[]>;
  status: string[] = [];
  search$: Observable<string>;
  user$: Observable<User>;

  constructor(
    private dbs: DatabaseService,
    private dialog: MatDialog,
    public datePipe: DatePipe,
    public shopCar: ShoppingCarService,
    private auth: AuthService
  ) { }


  ngOnInit() {
    this.initForms();
    this.initObservables();
  }

  initForms() {
  
    const view = this.dbs.getCurrentMonthOfViewDate();

    let beginDate = view.from;
    let endDate = new Date();
    endDate.setHours(23, 59, 59);

    this.dateForm = new FormGroup({
      begin: new FormControl(beginDate),
      end: new FormControl(endDate)
    });

    this.status = Object.values(this.saleStatusOptions)

    this.statusForm = new FormControl('Todos')
    this.search = new FormControl('');
  }

  initObservables() {
    this.user$ = this.auth.user$.pipe(shareReplay(1))

    const view = this.dbs.getCurrentMonthOfViewDate();

    let beginDate = view.from;
    let endDate = new Date();
    this.sales$ = combineLatest([
      this.dateForm.get('begin').valueChanges.pipe(
        startWith(beginDate),
        map(begin => begin.setHours(0, 0, 0, 0))
      ),
      this.dateForm.get('end').valueChanges.pipe(
        startWith(endDate),
        map(end =>  end?end.setHours(23, 59, 59):null)
      )]
    ).pipe(
      switchMap(([startdate,enddate]) => {
        return this.user$.pipe(switchMap(user => {
          return this.dbs.getSalesUser(user, { begin: startdate, end: enddate })
        }))
      }),
      map(sales => {
        return sales
      })
    );

    this.search$ = this.search.valueChanges;


    this.salesFiltered$ = combineLatest([
      this.search$.pipe(startWith('')),
      this.sales$,
      this.statusForm.valueChanges.pipe(startWith('Todos'))])
      .pipe(
        map(([search, sales, saleState]) => {
          //(sales);
          
          let order = sales.sort((a, b) => Number(b.correlative) - Number(a.correlative))
          if (saleState == 'Todos') {
            if (this.totalPriceSubject) {
              this.totalPriceSubject.next(this.giveTotalSalesPrice(order.filter(el => el.status != 'Anulado')))
            }

            return order.filter(el => {
              return el.correlative.toString().includes(search) ||
                el.user.email?.includes(search.toLowerCase()) ||
                el.documentInfo.name?.toLowerCase().includes(search.toLowerCase()) ||
                el.documentInfo.number?.toString().toLowerCase().includes(search.toLowerCase())
            });

          } else {
            if (this.totalPriceSubject) {
              this.totalPriceSubject.next(this.giveTotalSalesPrice(order.filter(el => el.status == saleState)))
            }
            return order.filter(el => {
              return el.status == saleState && (
                el.correlative.toString().includes(search) ||
                el.user.email?.includes(search.toLowerCase()) ||
                el.user.personData.name?.toLowerCase().includes(search.toLowerCase()) ||
                el.user.personData['lastName']?.toLowerCase().includes(search.toLowerCase()) ||
                el.user.lastName?.toLowerCase().includes(search.toLowerCase()) ||
                el.user.name?.toLowerCase().includes(search.toLowerCase()) ||
                el.user.personData['ruc']?.toString().toLowerCase().includes(search.toLowerCase())
              )
            }
            );
          }
        }),
        shareReplay(1)
      )
  }



  onSelectDetail(data: Sale, salesFiltered: Sale[]) {
    this.detailSubject.next(undefined);
    let index = salesFiltered.findIndex(el => el.id == data.id);
    setTimeout(() => {
      this.locationSubject.next(index);
      this.detailSubject.next(data);
    }, 4);
  }

  onCheckDirection(el: Sale, event) {
    event.stopPropagation()
    this.dialog.open(SalesAddressDialogComponent, {
      data: el,
      width: '90vw',
      maxWidth: '700px'
    })
  }

  // onCheckreferralGuide(sale: Sale, edit: boolean, event) {
  //   event.stopPropagation()
  //   if(edit){
  //     this.dialog.open(WarehouseViewReferralGuideDialogComponent, {
  //       data: sale,
  //     })
  //   }
    
  // }

  getName(displayName: string): string {
    let name = displayName.split(" ");
    switch (name.length) {
      case 1:
      case 2:
        return displayName;
      default:
        return name[0] + " " + name[2];
    }
  }

  // getTotalPrice(sales: Sale[]): number {
  //   if (sales) {
  //     return sales.reduce((acc, curr) => {
  //         return curr.deliveryPrice + curr.total + acc
  //       }, 0)
  //   }
  //   else {
  //     return 0;
  //   }
  // }

  downloadXls(sales: Sale[]): void {
    //console.log(sales);
    let table_xlsx: any[] = [];
    
    let headersXlsx = [
      'Correlativo',
      'Usuario',
      'DNI/RUC',
      'Correo',
      'Teléfono',
      'Estado',
      'Tipo de entrega',      //Recojo en tienda, Entrega, A coordinar
      'Dirección',
      'Departamento',
      'Distrito',
      'Provincia',
      'Referencia',           //Solo en el caso de entrega

      'Tipo Documento',
      'RUC',
      'Nombre/Razón social',
      'Dirección de empresa',

      'Tipo de pago',

      'Asesor',

      'Fecha de Solicitud',

      'Fecha de Atención', 
      'Usuario responsable',

      'Fecha de Confirmación de Solicitud',
      'Usuario de Confirmación de Solicitud',
      'Fecha Asignada',
      'Codigo de seguimiento',
      'Observación',

      'Fecha de Confirmación de Comprobante',
      'Usuario de Confirmación de Comprobante',
      'Número de comprobante',

      'Guía de remisión',
      'Usuario de delivery',
      'Fecha de Confirmación de Delivery',
      'Usuario de Confirmación de Delivery',

      'Fecha de Entrega',
      'Usuario de Entrega',
      'Observaciones de Entrega',

      'Fecha de Anulación',
      'Usuario de Anulación',

      'Calificación de servicio',
      'Calificación de productos',
      'Calificación de delivery',
      'Observación',

      'Sub-total',
      'IGV',
      'Precio por delivery',
      'Descuento por cupón',
      'Precio adicional',
      'Total',

      'Producto',
      'Color',
      'Cantidad',
      'Precio'

    ];

    table_xlsx.push(headersXlsx);


    let noData = "--"

    sales.forEach(sale => {
      const temp = [
        sale.correlative.toString().padStart(6, "0"),
        sale.user.personData.name,
        !!sale.user.personData["dni"] ? sale.user.personData["dni"] : !!sale.user.personData["ruc"] ? sale.user.personData["ruc"] : "Sin documento",
        sale.user.email,
        sale.user.personData.phone ?  sale.user.personData.phone: 'Sin número',
        sale.status,
        sale.deliveryPickUp ? "Recojo en tienda" : sale.location ? "Entrega" : "A coordinar",

        sale.deliveryPickUp ? sale.delivery["address"] : sale.location ? sale.location.address : noData,
        sale.deliveryPickUp ? sale.delivery["departamento"] : sale.location ? sale.location.departamento : noData,
        sale.deliveryPickUp ? sale.delivery["distrito"] : sale.location ? sale.location.distrito : noData,
        sale.deliveryPickUp ? sale.delivery["provincia"] : sale.location ? sale.location.provincia : noData,
        sale.deliveryPickUp ? noData : sale.location ? sale.location.reference : noData,

        sale.document,
        sale.documentInfo.number,
        sale.documentInfo.name,
        sale.documentInfo.address ? sale.documentInfo.address : noData,

        sale.payType.name,

        sale.adviser?.displayName ? sale.adviser?.displayName : "Sin asesor",

        sale.createdAt ? this.getXlsDate(sale.createdAt) : noData,

        sale.attendedData ? this.getXlsDate(sale.attendedData.attendedAt) : noData,
        sale.attendedData ? sale.attendedData.attendedBy.personData.name : noData,

        sale.confirmedRequestData ? this.getXlsDate(sale.confirmedRequestData.confirmedAt) : noData,
        sale.confirmedRequestData ? sale.confirmedRequestData.confirmedBy.personData.name : noData,
        sale.confirmedRequestData ? this.getXlsDate(sale.confirmedRequestData.assignedDate) : noData,
        sale.confirmedRequestData ? sale.confirmedRequestData.trackingCode: noData,
        sale.confirmedRequestData ? sale.confirmedRequestData.observation: noData,

        sale.confirmedDocumentData ? this.getXlsDate(sale.confirmedDocumentData.confirmedAt) : noData,
        sale.confirmedDocumentData ? sale.confirmedDocumentData.confirmedBy : noData,
        sale.confirmedDocumentData ? sale.confirmedDocumentData.documentNumber : noData,

        sale.confirmedDeliveryData ? sale.confirmedDeliveryData.referralGuide ? sale.confirmedDeliveryData.referralGuide.orderCode : noData : noData,
        sale.confirmedDeliveryData ? sale.confirmedDeliveryData.deliveryUser.personData.name : noData,
        sale.confirmedDeliveryData ? this.getXlsDate(sale.confirmedDeliveryData.confirmedAt) : noData,
        sale.confirmedDeliveryData ? sale.confirmedDeliveryData.confirmedBy.personData.name : noData,

        sale.finishedData ? this.getXlsDate(sale.finishedData.finishedAt) : noData,
        sale.finishedData ? sale.finishedData.finishedBy : noData,
        sale.finishedData ? sale.finishedData.observation : noData,

        sale.cancelledData ? this.getXlsDate(sale.cancelledData.cancelledAt) : noData,
        sale.cancelledData ? sale.cancelledData.cancelledBy.personData.name : noData,

        sale.rateData ? sale.rateData.serviceRate : noData,
        sale.rateData ? sale.rateData.productRate : noData,
        sale.rateData ? sale.rateData.deliveryRate : noData,
        sale.rateData ? sale.rateData.observation ? sale.rateData.observation : noData : noData,

        (this.dbs.giveProductPriceOfSale(sale.requestedProducts, sale.user.mayoristUser) / 1.18).toFixed(2),
        (this.dbs.giveProductPriceOfSale(sale.requestedProducts, sale.user.mayoristUser) / 1.18 * 0.18).toFixed(2),
        sale.deliveryPrice ? sale.deliveryPrice : "0",
        sale.couponDiscount ? sale.couponDiscount : "0",
        sale.additionalPrice ? sale.additionalPrice : "0",

        (this.dbs.giveProductPriceOfSale(sale.requestedProducts, sale.user.mayoristUser) + 
        (sale.deliveryPrice ? sale.deliveryPrice : 0)-
        (sale.couponDiscount ? sale.couponDiscount : 0)+
        (sale.additionalPrice ? sale.additionalPrice : 0)).toFixed(2),

      ];
      //      'Producto', 'Color', 'Cantidad', 'Precio'

      sale.requestedProducts.forEach(prod => {       
        let temp2;

        temp2 = [
          ...temp,
          prod.product.description,
          prod.chosenProduct.color.name,
          prod.quantity,
          prod.price
        ]
        
        table_xlsx.push(temp2);
      })
    })

    /* generate worksheet */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relacion_de_Ventas');

    /* save to file */
    const name = 'Relacion_de_Ventas' + '.xlsx';
    XLSX.writeFile(wb, name);
  }


  getCurrentMonthOfViewDate(): { from: Date, to: Date } {
    const date = new Date();
    const fromMonth = date.getMonth();
    const fromYear = date.getFullYear();

    const actualFromDate = new Date(fromYear, fromMonth, 1);

    const toMonth = (fromMonth + 1) % 12;
    let toYear = fromYear;

    if (fromMonth + 1 >= 12) {
      toYear++;
    }

    const toDate = new Date(toYear, toMonth, 1);

    return { from: actualFromDate, to: toDate };
  }

  getCorrelative(corr: number) {
    return corr.toString().padStart(6, '0')
  }

  getUser(userId): Observable<string> {
    //console.log("now")
    return this.dbs.getUserDisplayName(userId)
  }

  getXlsDate(date) {
    let dateObj = new Date(1970);
    dateObj.setSeconds(date['seconds'])
    return this.datePipe.transform(dateObj, 'dd/MM/yyyy');
  }

  // givePrice(item: SaleRequestedProducts): number {
  //   let amount = item['quantity']
  //   let price = item['product']['price']
  //   if (item.product.promo) {
  //     let promo = item['product']['promoData']['quantity']
  //     let pricePromo = item['product']['promoData']['promoPrice']

  //     if (amount >= promo) {
  //       let wp = amount % promo
  //       let op = Math.floor(amount / promo)
  //       return wp * price + op * pricePromo
  //     } else {
  //       return amount * price
  //     }
  //   } else {
  //     return amount * price
  //   }
  // }

  giveTotalSalesPrice(sales: Sale[]): number {
    return sales.reduce((a, b) => a + 
      this.dbs.giveProductPriceOfSale(b.requestedProducts, b.user.mayoristUser) 
      + b.deliveryPrice - Number(b.couponDiscount) + Number(!!b.additionalPrice ? b.additionalPrice : 0)
      , 0)
  }

  printPdf(data: Waybill){
    this.dbs.printWaybillPdf(data)
  }

}


