import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, BehaviorSubject, merge, combineLatest, iif, of, throwError, empty } from 'rxjs';
import { Sale, SaleEmailData, SaleRequestedProducts, saleStatusOptions } from 'src/app/core/models/sale.model';
import { DatabaseService } from 'src/app/core/services/database.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { startWith, map, tap, take, switchMap, debounceTime, pairwise, filter, first } from 'rxjs/operators';
import { Product, Zone } from 'src/app/core/models/product.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { User } from 'src/app/core/models/user.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { SalesPhotoDialogComponent } from '../sales-photo-dialog/sales-photo-dialog.component';
import { GeneralConfig } from 'src/app/core/models/generalConfig.model';
import { Package } from 'src/app/core/models/package.model';
import { Adviser } from 'src/app/core/models/adviser.model';

@Component({
  selector: 'app-sales-detail',
  templateUrl: './sales-detail.component.html',
  styleUrls: ['./sales-detail.component.scss']
})
export class SalesDetailComponent implements OnInit {
  now: Date = new Date();

  loading$: BehaviorSubject<boolean> = new BehaviorSubject(false)

  productForm: FormGroup;
  confirmedRequestForm: FormGroup;
  confirmedDocumentForm: FormGroup;
  confirmedDeliveryForm: FormGroup;
  voucherCheckedForm: FormControl;
  adviserForm: FormControl;

  searchProductControl: FormControl;

  products$: Observable<(Product | Package)[]>  //Used to search new products in order to add
  weight$: Observable<any>;

  @Input() sale: Sale
  @Input() detailSubject: BehaviorSubject<Sale>

  saleStatusOptions = new saleStatusOptions();
  status$: any;
  advisers$: Observable<Adviser[]>;
  deliveryUser$: Observable<any[]>;
  finishedForm: FormGroup;
  dateFilter: Date;

  constructor(
    private fb: FormBuilder,
    private dbs: DatabaseService,
    private snackBar: MatSnackBar,
    public auth: AuthService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    //console.log(this.sale)
    this.initForm()
    this.initObservables()
  }



  initForm() {
    this.dateFilter = new Date(1970)
    this.dateFilter.setMilliseconds(this.sale.createdAt["seconds"]*1000)
    this.dateFilter.setHours(0, 0, 1)

    this.searchProductControl = new FormControl("")

    this.productForm = this.fb.group({
      deliveryPrice: [(!(<Zone>this.sale?.delivery)?.delivery) ? 0 : (<Zone>this.sale?.delivery)?.delivery, Validators.required],
      productList: this.fb.array([]),
      couponDiscount: [!!this.sale.couponDiscount ? this.sale.couponDiscount : 0],
      additionalPrice: [!!this.sale.additionalPrice ? this.sale.additionalPrice : 0],
    });

    // this.voucherCheckedForm = new FormControl(!!this.sale.voucherChecked, 
    //                           this.sale.voucher ? Validators.requiredTrue : null);

    this.sale.requestedProducts.forEach((product, index) => {
      (<FormArray>this.productForm.get('productList')).insert(index,
        // product.product.package ?
        //   this.fb.group({
        //     product: [product.product, Validators.required],
        //     quantity: [product.quantity, Validators.required],
        //     chosenOptions: this.fb.array(
        //       product.chosenOptions.map(opt => new FormControl(opt))
        //     )
        //   }) :
          this.fb.group({
            product: [product.product, Validators.required],
            chosenProduct: [product.chosenProduct, Validators.required],
            quantity: [product.quantity, Validators.required],
          })
      )
    })



    this.confirmedRequestForm = this.fb.group({
      // desiredDate: [this.getDateFromDB(this.sale.requestDate)],
      assignedDate: [
        !this.sale.confirmedRequestData ? null :
          this.getDateFromDB(this.sale.confirmedRequestData.assignedDate),
        Validators.required],
      trackingCode: [
        !this.sale.confirmedRequestData ? null :
          this.sale.confirmedRequestData?.trackingCode],
      observation: [
        !this.sale.confirmedRequestData ? null :
          this.sale.confirmedRequestData?.observation],
    })

    this.confirmedDocumentForm = this.fb.group({
      document: [this.sale.document],
      documentNumber: [
        !this.sale.confirmedDocumentData ? null :
          this.sale.confirmedDocumentData.documentNumber,
        Validators.required
      ]
    })

    this.confirmedDeliveryForm = this.fb.group({
      referralGuide: [
        !this.sale.confirmedDeliveryData ? null :
          this.sale.confirmedDeliveryData.referralGuide ? 
          this.sale.confirmedDeliveryData.referralGuide : null,
        Validators.required
      ],
      deliveryUser: [
        !this.sale.confirmedDeliveryData ? null :
          this.sale.confirmedDeliveryData.deliveryUser ? 
          this.sale.confirmedDeliveryData.deliveryUser : null,
        [Validators.required, this.objectValidator()]
      ],
    })

    this.finishedForm = this.fb.group({
      observation: !this.sale.finishedData ? null:
        this.sale.finishedData.observation
    })

    this.adviserForm = new FormControl(this.sale.adviser, this.objectValidator())

  }

  //initRequestConfirmed

  getDateFromDB(date: Date) {
    let parsedDate = new Date(1970);
    parsedDate.setSeconds(date['seconds'])
    return parsedDate
  }

  initObservables() {
    this.status$ = this.confirmedRequestForm.valueChanges.pipe(
      tap(res => {
        //console.log(res)
      })
    ).subscribe()

    this.advisers$ = combineLatest(
      [
        this.adviserForm.valueChanges.pipe(
          startWith(this.sale.adviser)
          ),
        this.dbs.getAdvisersStatic().pipe(map(advisers => {
          let newAdvisers = []

          if(this.sale.adviser){
            newAdvisers = [
              this.sale.adviser,
              ...advisers.filter(ad => ad.id != this.sale.adviser.id)
            ]
          } else {
            newAdvisers = [...advisers]
          }

          return newAdvisers
        }))
      ]
    ).pipe(
      map(([value, advisers]) => {
        //console.log(value)
        let filt = null
        if(value){
          filt = typeof value == 'object' ? (<Adviser>value).displayName : (<string>value)
        } else {
          filt = ""
        }

        return advisers.filter((el) =>
          value ? el.displayName.toLowerCase().includes(filt.toLowerCase()) : true
        );
      })
    );

    this.deliveryUser$ = combineLatest(
      [
        this.confirmedDeliveryForm.get("deliveryUser").valueChanges.pipe(
          startWith(this.sale.confirmedDeliveryData?.deliveryUser)
          ),
        this.dbs.getDeliveryUserStatic().pipe(map(deliveryGuys => {
          let newDeliveryGuys: User[] = []

          if(this.sale?.confirmedDeliveryData?.deliveryUser){
            newDeliveryGuys = [
              this.sale.confirmedDeliveryData.deliveryUser,
              ...deliveryGuys.filter(ad => ad.uid != this.sale.confirmedDeliveryData.deliveryUser.uid)
            ]
          } else {
            newDeliveryGuys = [...deliveryGuys]
          }

          return newDeliveryGuys
        }))
      ]
    ).pipe(
      map(([value, deliveryGuys]) => {
        //console.log(value)
        let filt = null
        if(value){
          filt = typeof value == 'object' ? ((<User>value).personData.name+" "+(<User>value).personData["lastName"]) : (<string>value)
        } else {
          filt = ""
        }

        return deliveryGuys.filter((el) =>
          value ? (el.personData.name+" "+el.personData["lastName"]).toLowerCase().includes(filt.toLowerCase()) : true
        );
      })
    );

    //Search Product
    // this.products$ = combineLatest([
    //   this.searchProductControl.valueChanges.pipe(startWith("")),
    //   combineLatest([this.dbs.getProductsListValueChanges(), this.dbs.getPackagesListValueChanges()
    //   ]).pipe(map(([prod, pack]) => [...prod, ...pack].sort((a, b) =>
    //     a.description > b.description ? 1 : a.description < b.description ? -1 : 0))
    //   ),
    //   this.dbs.getGeneralConfigDoc()]).pipe(
    //     map(([formValue, productsList, generalConfig]) => {

    //       //console.log(formValue);

    //       let products = !productsList.length ? [] :
    //         productsList.filter(el => !this.productForm.get('productList').value.find(
    //           (product: SaleRequestedProducts) => product.product.id == el.id
    //         ))

    //       if (typeof formValue === 'string') {
    //         return products.filter(el => el.description.match(new RegExp(formValue, 'ig')))
    //       } else {

    //         // let product: SaleRequestedProducts = {
    //         //   product: (<Product | Package>formValue),
    //         //   quantity: 1,
    //         //   chosenOptions: !(<Product | Package>formValue).package ? null :
    //         //     new Array((<Package>formValue).totalItems)
    //         // };


    //         //   (<FormArray>this.productForm.get('productList')).insert(0,
    //         //     product.product.package ?
    //         //       this.fb.group({
    //         //         product: [product.product, Validators.required],
    //         //         quantity: [product.quantity, Validators.required],
    //         //         chosenOptions: this.fb.array(
    //         //           product.product.items.map(item =>
    //         //             item.productsOptions.length != 1 ? new FormControl()
    //         //               : new FormControl(item.productsOptions[0])
    //         //           )
    //         //         )
    //         //       }) :
    //         //       this.fb.group({
    //         //         product: [product.product, Validators.required],
    //         //         quantity: [product.quantity, Validators.required],
    //         //       })
    //         //   )

    //           this.searchProductControl.setValue("")
    //           return productsList.filter(el => !this.productForm.get('productList').value.find(
    //             (product: SaleRequestedProducts) => product.product.id == el.id
    //           ))
            
    //       }
    //     })
    //   )


  }

  onDeleteProduct(index: number) {
    (<FormArray>this.productForm.get('productList')).removeAt(index);
  }

  confirmVoucherChecked(event: MouseEvent, user: User) {
    // event.preventDefault();
    // this.loading$.next(true)
    // let dialogRef: MatDialogRef<ConfirmationDialogComponent>;

    // if (this.voucherCheckedForm.value) {
    //   dialogRef = this.dialog.open(ConfirmationDialogComponent, {
    //     closeOnNavigation: false,
    //     disableClose: true,
    //     width: '360px',
    //     maxWidth: '360px',
    //     data: {
    //       warning: `Cancelar Voucher.`,
    //       content: `¿Está seguro de deshacer la validación del Voucher?`,
    //       noObservation: true,
    //       observation: null,
    //       title: 'Deshacer',
    //       titleIcon: 'warning'
    //     }
    //   })
    // } else {
    //   dialogRef = this.dialog.open(ConfirmationDialogComponent, {
    //     closeOnNavigation: false,
    //     disableClose: true,
    //     width: '360px',
    //     maxWidth: '360px',
    //     data: {
    //       warning: `Confirmar Voucher.`,
    //       content: `¿Está seguro de confirmar la validación del Voucher?`,
    //       noObservation: true,
    //       observation: null,
    //       title: 'Confirmar',
    //       titleIcon: 'warning'
    //     }
    //   })
    // }

    // dialogRef.afterClosed().pipe(
    //   take(1),
    //   switchMap((answer: { action: string, lastObservation: string }) => iif(
    //     //condition
    //     () => { return answer.action == "confirm" },
    //     //confirmed
    //     of(this.dbs.onUpdateSaleVoucher(this.sale.id, !this.voucherCheckedForm.value, user)).pipe(
    //       switchMap(
    //         batch => {

    //           return batch.commit().then(
    //             res => {
    //               this.voucherCheckedForm.setValue(!this.voucherCheckedForm.value);
    //               this.snackBar.open('El pedido fue editado satisfactoriamente', 'Aceptar');
    //             },
    //             err => {
    //               throwError(err)
    //             }
    //           )
    //         }
    //       )
    //     ),
    //     //Rejected
    //     empty()
    //   ))).subscribe(
    //     () => {
    //       this.loading$.next(false)
    //     },
    //     err => {
    //       this.loading$.next(false)
    //       console.log(err);
    //       this.snackBar.open('Ocurrió un error. Vuelva a intentarlo.', 'Aceptar');
    //     },
    //     () => {
    //       this.loading$.next(false)
    //     }
    //   )
  }

  checkVouchers(user: User) {
    let dialogRef: MatDialogRef<SalesPhotoDialogComponent>
    dialogRef = this.dialog.open(SalesPhotoDialogComponent, {
      width: '350px',
      data: {
        data: this.sale,
        edit: this.sale.status == this.saleStatusOptions.attended,
        user: user
      }
    });

    dialogRef.afterClosed().pipe(
      take(1)).subscribe(
        (newSale: Sale) => {
          if (newSale) {
            this.detailSubject.next(newSale);
          }
        }
      )
  }


  //newStatus will work as an old status when we edit (deshacer)
  //edit=true for deschacer
  onSubmitForm(newStatus: Sale['status'], user: User, downgrade?: boolean) {
    //Edit is used only when downgrading
    this.loading$.next(true);
    let downNewStatus = downgrade ? this.onEditSaleGetNewStatus(newStatus, true) : null;
    let sale = downgrade ? this.onGetUpdatedSale(downNewStatus, user) : this.onGetUpdatedSale(newStatus, user);
    //console.log("updating")
    of(!!downgrade).pipe(
      switchMap(downgrade => {
        if (!downgrade) {
          return this.upgradeConfirmation(newStatus)
          
        } else {
          return this.downgradeConfirmation(downNewStatus)
        }
      }),
      first(),
      tap(answer => {
        //console.log(answer)
        if(answer.action == "confirm"){
          let batch = this.dbs.onSaveSale(sale)
          batch.commit().then(
            res => {
              this.loading$.next(false)
              this.snackBar.open('El pedido fue editado satisfactoriamente', 'Aceptar');
              this.detailSubject.next(sale);
            },
            err => {
              this.loading$.next(false)
              console.log(err)
              this.snackBar.open('Ocurrió un error. Vuelva a intentarlo.', 'Aceptar');
            }
          )
        } else {
          this.loading$.next(false)
        }
      }
      )
    ).subscribe()
  }

  onEditSaleGetNewStatus(actualStatus: Sale['status'], downgrade?: boolean): Sale['status'] {
    if(downgrade){
      switch (actualStatus) {
        case this.saleStatusOptions.attended:
          return this.saleStatusOptions.requested
        case this.saleStatusOptions.confirmedRequest:
          return this.saleStatusOptions.attended
        case this.saleStatusOptions.confirmedDocument:
          return this.saleStatusOptions.confirmedRequest
      }
    } else {
      switch(actualStatus){
        case this.saleStatusOptions.requested:
          return this.saleStatusOptions.attended
        case this.saleStatusOptions.attended:
          return this.saleStatusOptions.confirmedRequest
        case this.saleStatusOptions.confirmedRequest:
          return this.saleStatusOptions.confirmedDocument
        case this.saleStatusOptions.confirmedDocument:
          return this.saleStatusOptions.confirmedDelivery
        case this.saleStatusOptions.confirmedDelivery:
          return this.saleStatusOptions.finished

      }
    }
  }

  downgradeConfirmation(newStatus: Sale['status']):
    Observable<{ action: string, lastObservation: string }> {
    let dialogRef: MatDialogRef<ConfirmationDialogComponent>;

    if (newStatus == this.saleStatusOptions.confirmedRequest) {
      dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        closeOnNavigation: false,
        disableClose: true,
        width: '360px',
        maxWidth: '360px',
        data: {
          warning: `La solicitud será editada.`,
          content: `¿Está seguro de regresar la solicitud al estado <b>'${newStatus}'</b>?
          Con esta acción, se reestablecerá el stock correspondiente.`,
          noObservation: true,
          observation: null,
          title: 'Deshacer',
          titleIcon: 'warning'
        }
      })
    } else {
      dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        closeOnNavigation: false,
        disableClose: true,
        width: '360px',
        maxWidth: '360px',
        data: {
          warning: `La solicitud será editada.`,
          content: `¿Está seguro de regresar la solicitud al estado <b>'${newStatus}'</b>?`,
          noObservation: true,
          observation: null,
          title: 'Deshacer',
          titleIcon: 'warning'
        }
      })
    }

    return dialogRef.afterClosed().pipe(take(1))
  }

  upgradeConfirmation(newStatus: Sale['status']):
    Observable<{ action: string, lastObservation: string }> {
    let dialogRef: MatDialogRef<ConfirmationDialogComponent>;

    if (newStatus == this.saleStatusOptions.confirmedDocument) {
      dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        closeOnNavigation: false,
        disableClose: true,
        width: '360px',
        maxWidth: '360px',
        data: {
          warning: `La solicitud será actualizada.`,
          content: `¿Está seguro de actualizar la solicitud al estado <b>'${newStatus}'</b>?
          Con esta acción, se descontará el stock correspondiente.`,
          noObservation: true,
          observation: null,
          title: 'Actualizar',
          titleIcon: 'warning'
        }
      })
    } else {
      if (newStatus == this.saleStatusOptions.cancelled) {
        dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          closeOnNavigation: false,
          disableClose: true,
          width: '360px',
          maxWidth: '360px',
          data: {
            warning: `La solicitud será anulada.`,
            content: `¿Está seguro de <b>cancelar</b> la solicitud? Si la solicitud
          se encuentra en estado 'Comprobante Confirmado' se repondrá el stock correspondiente`,
            noObservation: true,
            observation: null,
            title: 'Anular',
            titleIcon: 'warning'
          }
        })
      } else {
        dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          closeOnNavigation: false,
          disableClose: true,
          width: '360px',
          maxWidth: '360px',
          data: {
            warning: `La solicitud será actualizada.`,
            content: `¿Está seguro de actualizar la solicitud al estado <b>'${newStatus}'</b>?`,
            noObservation: true,
            observation: null,
            title: 'Actualizar',
            titleIcon: 'warning'
          }
        })
      }
    }

    return dialogRef.afterClosed().pipe(take(1))
  }

  onGetUpdatedSale(newStatus: Sale['status'], user: User): Sale {
    let date = new Date()
    this.productForm.markAsPending();

    let sale: Sale = {
      ...this.sale,
      additionalPrice: this.productForm.get("additionalPrice").value,
      status: newStatus,
      adviser: this.adviserForm.valid ? this.adviserForm.value : null
      //requestedProducts: [],
      //voucher: this.sale.voucher,
      //voucherChecked: this.voucherCheckedForm.value,
      //driverAssignedData: null,
      //finishedData: null
    };

    switch(newStatus){
      case this.saleStatusOptions.attended:
        sale.attendedData = {
          attendedAt: date,
          attendedBy: user
        }
        sale.confirmedRequestData = null
        sale.confirmedDocumentData = null
        sale.confirmedDeliveryData = null
        sale.finishedData = null
        break;
      case this.saleStatusOptions.confirmedRequest:
        sale.confirmedRequestData = {
          assignedDate: this.confirmedRequestForm.get('assignedDate').value,
          trackingCode: this.confirmedRequestForm.get('trackingCode').value,
          observation: this.confirmedRequestForm.get('observation').value,
          confirmedBy: user,
          confirmedAt: new Date(),
        }
        sale.confirmedDocumentData = null
        sale.confirmedDeliveryData = null
        sale.finishedData = null
        break;
      case this.saleStatusOptions.confirmedDocument:
        sale.confirmedDocumentData = {
          documentNumber: this.confirmedDocumentForm.get("documentNumber").value,
          confirmedBy: user,
          confirmedAt: date,
        }
        sale.confirmedDeliveryData = null
        sale.finishedData = null
        break;
      case this.saleStatusOptions.confirmedDelivery:
        sale.confirmedDeliveryData = {
          deliveryUser: this.confirmedDeliveryForm.get("deliveryUser").value,

          referralGuide: this.sale.confirmedDeliveryData.referralGuide,

          confirmedBy: user,
          confirmedAt: date,        
        }
        sale.finishedData = null
        break;
      case this.saleStatusOptions.finished:
        sale.finishedData = {
          observation: this.finishedForm.get("observation").value,
          finishedAt: date,
          finishedBy: user
        }
    }
    
    return sale

  }
/*
  onUpdateStock(requestedProducts: Sale['requestedProducts'], batch: firebase.firestore.WriteBatch, decrease: boolean) {
    this.dbs.onUpdateStock(requestedProducts, batch, decrease)
  }*/
//ELIMINADOOOOOOOOOOOOOO
  // getSaleRequestedProducts(): Sale['requestedProducts'] {
  //   let requestedProducts: Sale['requestedProducts'] = [];
  //   (<FormArray>this.productForm.get('productList')).controls.forEach(formGroup => {
  //     //If product quantity is 0, we don't need to save it again
  //     if (formGroup.get('quantity').value) {
  //       if (!(<Product | Package>formGroup.get('product').value).package) {
  //         requestedProducts.push({
  //           quantity: formGroup.get('quantity').value,
  //           product: formGroup.get('product').value
  //         });
  //       } else {
  //         requestedProducts.push({
  //           quantity: formGroup.get('quantity').value,
  //           product: formGroup.get('product').value,
  //           chosenOptions: formGroup.get('chosenOptions').value
  //         });
  //       }
  //     }
  //   });
  //   return requestedProducts
  // }
 

  displayFn(input: Product) {
    if (!input) return '';
    return input.description;
  }

  onFloor(el: number, el2: number): number {
    return Math.floor(el / el2);
  }

  getCorrelative(corr: number) {
    return corr.toString().padStart(4, '0')
  }

  showAdviser(adv: Adviser): string | undefined {
    return adv ? adv.displayName : "Sin asesor";
  }

  showDeliveryUser(usr: User): string | undefined {
    return usr ? usr.personData.name + (usr.personData["lastName"] ? (" "+ usr.personData["lastName"]) : ""):""
  }

  objectValidator() {
    return (control: AbstractControl): ValidationErrors => {

      let type = control.value
      if(type){
        if(typeof type == 'string'){
          return {noObject: true}
        } else {
          return null
        }
      } else {
        return null
      }
      
    }
  }

  getSaleEmail(sale: Sale){
    let date = new Date(1970)
    date.setMilliseconds(sale.createdAt["seconds"]*1000)

    let monthString= ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", 
                      "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"]

    let firstTotal = this.giveProductPriceOfSale(sale.requestedProducts, sale.createdBy.mayoristUser)

    let saleEmailData: SaleEmailData = {
      adviser: !!sale.adviser,
      adviserMail: sale.adviser ? sale.adviser.email : "---",
      adviserNumber: sale.adviser ? sale.adviser.phone : "---",

      correlative: `${sale.correlativeType} ${sale.correlative.toString().padStart(4, "0")}`,
      createdAt: `${date.getDate()} ${monthString[date.getMonth()]}, ${date.getFullYear()}`,

      paymentMethod: sale.payType.name,

      document: sale.document,
      documentInfoNumber: sale.documentInfo.number,
      documentInfoName: sale.documentInfo.name,
      documentInfoAddress: sale.document == "Factura" ? sale.documentInfo.address : "---",

      deliveryType: !sale.delivery ? "A coordinar" : sale.deliveryPickUp ? "Recojo en tienda" : "Envío",
      departamento: !sale.delivery ? "---" : sale.deliveryPickUp ? sale.delivery["departamento"].name: sale.location.departamento.name,
      provincia: !sale.delivery ? "---" : sale.deliveryPickUp ? sale.delivery["provincia"].name: sale.location.provincia.name,
      distrito: !sale.delivery ? "---" : sale.deliveryPickUp ? sale.delivery["distrito"].name: sale.location.distrito.name,
      address: !sale.delivery ? "---" : sale.deliveryPickUp ? sale.delivery["address"]: sale.location.address,

      productData: [],
      subTotal: (firstTotal/1.18).toFixed(2),
      igv: (firstTotal/1.18*0.18).toFixed(2),
      sum: firstTotal.toFixed(2),
      promotionalDiscount: sale.couponDiscount.toFixed(2),
      delivery: sale.deliveryPrice.toFixed(2),
      total: (firstTotal+sale.deliveryPrice-sale.couponDiscount).toFixed(2),
    }

    saleEmailData.productData = sale.requestedProducts.map(el => ({
      description: `${el.product.description} (${el.chosenProduct.color.name})`,
      quantity: el.quantity,
      total: this.giveProductPrice(el, sale.user.mayoristUser).toFixed(2),
    }))
    
  }

  giveProductPrice(item: {product: Product, quantity: number}, mayorist: boolean): number {
    if (item.product.promo) {

      if(((item.product.promoData.type == 1) && (!mayorist)) || 
        ((item.product.promoData.type == 2) && (mayorist)) || 
        ((item.product.promoData.type == 3))){

          let promTotalQuantity = Math.floor(item.quantity / item.product.promoData.quantity);
          let promTotalPrice = promTotalQuantity * item.product.promoData.promoPrice;
          let noPromTotalQuantity = item.quantity % item.product.promoData.quantity;
          let noPromTotalPrice = noPromTotalQuantity * (mayorist ? item.product.priceMay : item.product.priceMin);

          return promTotalPrice + noPromTotalPrice;

        }
      
    }
    return item.quantity * (mayorist ? item.product.priceMay: item.product.priceMin)
  }

  giveProductPriceOfSale(requestedProducts: {product: Product, quantity: number}[], mayorist: boolean): number{
    let sum = [...requestedProducts]
      .map((el) => this.giveProductPrice(el, mayorist))
      .reduce((a, b) => a + b, 0);

    return sum
  }
}
