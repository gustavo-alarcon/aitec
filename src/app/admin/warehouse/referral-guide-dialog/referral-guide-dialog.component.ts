import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { PlacesService } from '../../../core/services/places.service';
import { AuthService } from '../../../core/services/auth.service';
import { DatabaseService } from '../../../core/services/database.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { startWith, map, tap, switchMap, debounceTime, distinctUntilChanged, take, filter, shareReplay } from 'rxjs/operators';
import { Warehouse } from '../../../core/models/warehouse.model';
import { AngularFirestore } from '@angular/fire/firestore';
import { SerialNumber, SerialNumberWithPrice } from 'src/app/core/models/SerialNumber.model';
import { Product } from 'src/app/core/models/product.model';
import { TRANSFER_REASON, Waybill, WaybillProductList } from 'src/app/core/models/waybill.model';
import { Sale, SaleRequestedProducts } from 'src/app/core/models/sale.model';
import { User } from 'c:/Users/Junjiro/Documents/Meraki/aitec/src/app/core/models/user.model';

@Component({
  selector: 'app-referral-guide-dialog',
  templateUrl: './referral-guide-dialog.component.html',
  styleUrls: ['./referral-guide-dialog.component.scss']
})
export class ReferralGuideDialogComponent implements OnInit {
  @Input() sale: Sale
  @Output() closeDialog = new EventEmitter()  //Used when checking sales on logistics

  cumSeriesList: SerialNumberWithPrice[] = []

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();
  guideFormGroup: FormGroup;

  existSerie: boolean;

  entryWarehouseControl: FormControl;
  entryProductControl: FormControl;
  entryQuantitycontrol: FormControl;
  entryScanControl: FormControl;
  entrySeries: FormControl;
  entryselectProductControl: FormControl;


  serialList: Array<SerialNumber> = [];
  arrayProducts: Array<WaybillProductList> = [];

  radioOptions = TRANSFER_REASON;
  user$: Observable<User>;

  constructor(
    public places: PlacesService,
    private afs: AngularFirestore,
    public fb: FormBuilder,
    public auth: AuthService,
    public dbs: DatabaseService,
    public snackbar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.initObservables();
  }

  initForms(): void {
    this.guideFormGroup = this.fb.group({
      orderCode: [null, Validators.required],
      addressee: [null, Validators.required],
      dni: [null, Validators.required],
      transferDate: [new Date(), Validators.required],
      startingPoint: [null, Validators.required],
      arrivalPoint: [null, Validators.required],
      transferReason: [null, Validators.required],
      observations: [null],
    });

  }

  initObservables(): void {
    this.user$ = this.auth.user$.pipe(shareReplay(1))
  }

  addProducts() {
    this.arrayProducts = this.cumSeriesList.map(actualProduct => {
      let data: WaybillProductList = {
        mainCode: actualProduct.product.sku,
        description: actualProduct.product.description,
        invoice: this.guideFormGroup.value['orderCode'],
        waybill: this.guideFormGroup.value['orderCode'],
        productId: actualProduct.product.id,
        warehouseId: actualProduct.warehouse.id,
        serialList: <SerialNumber[]>actualProduct.list,
        quantity: actualProduct.list.length,
        unit: 'unidades',
        totalWeight: actualProduct.product.weight ? (actualProduct.product.weight * this.serialList.length) : 0
      };
      return data
    })

  }

  saveWaybill(user: User) {
    //this.loading.next(true);

    this.addProducts()
    const data: Waybill = this.getWaybill(user)

    if(this.sale){
      if(!this.validateSaleMatch(this.cumSeriesList, this.sale.requestedProducts)){
        return
      } 
    }


    let batch = this.dbs.createWaybill(data, this.cumSeriesList, user, this.sale)
    batch.commit()
      .then(() => {
        this.snackbar.open(`✅ Guía de remisión creada satisfactoriamente!`, 'Aceptar', {
          duration: 6000
        });

        this.cumSeriesList = []

        this.loading.next(false);

        this.guideFormGroup.setValue({
          orderCode: null,
          addressee: null,
          dni: null,
          transferDate: new Date(),
          startingPoint: null,
          arrivalPoint: null,
          transferReason: null,
          observations: null,
        });

        this.guideFormGroup.markAsUntouched()

        if(this.sale){
          this.closeDialog.emit(null)
        }
      })
      .catch(err => {
        console.log(err);
        this.snackbar.open(`🚨 Parece que hubo un error guardando la guía de remisión`, 'Aceptar', {
          duration: 6000
        });
      })

    
  }

  validateSaleMatch(cumSeriesList: SerialNumberWithPrice[], products: SaleRequestedProducts[]) {

    let summarySale: {
      prodId: string,
      colors: {
        colId: string,
        quantity: number
      }[]
    }[] = []

    let summaryList: typeof summarySale = []

    //From sale
    let prodIdSaleList = new Set(products.map(el => el.product.id))

    prodIdSaleList.forEach(prodId => {
      let prodFiltered = products.filter(el => el.product.id == prodId)
      let prodColorId = new Set(prodFiltered.map(el => el.chosenProduct.sku))
      let summarySaleAux: typeof summarySale[0] = {
        prodId,
        colors: []
      }

      summarySaleAux.colors = Array.from(prodColorId).map(colId => {
        let filteredColor = prodFiltered.find(el => el.chosenProduct.sku == colId)
        return ({
          colId,
          quantity: filteredColor.quantity
        })
      })
      summarySale.push(summarySaleAux)
    })

    //From the list of the table

    summaryList = cumSeriesList.reduce((prev, curr)=> {
      console.log("previous: ", prev)
      //We find matching prodId
      let foundProduct = prev.find(el => el.prodId == curr.product.id)

      if(foundProduct){
        let skuSet = (<SerialNumber[]>curr.list).map(el => el.sku);
        skuSet.forEach(el => {
          let foundColor = foundProduct.colors.find(el2 => el2.colId == el)
          if(foundColor){
            foundColor.quantity += 1
          } else {
            foundProduct.colors.push({
              colId: el,
              quantity: 1
            })
          }
        })
        return prev
      } else {

        let aux = {
          prodId: curr.product.id,
          colors: []
        }

        let skuSet = (<SerialNumber[]>curr.list).map(el => el.sku);
        skuSet.forEach(el => {
          let foundColor = aux.colors.find(el2 => el2.colId == el)
          if(foundColor){
            foundColor.quantity += 1
          } else {
            aux.colors.push({
              colId: el,
              quantity: 1
            })
          }
        })

        return [...prev, aux]
      }
    }, summaryList)

    let bool = summarySale.every(el => {
      let aux = summaryList.find(el2 => el2.prodId == el.prodId)
      if(!aux){
        return false
      }
      return el.colors.every(el2 => {
        let aux2 = aux.colors.find(el3 => el3.colId == el2.colId)
        if(!aux2){
          return false
        } else {
          return aux2.quantity == el2.quantity
        }
      })
    })
    
    let bool2 = summaryList.every(el => {
      let aux = summarySale.find(el2 => el2.prodId == el.prodId)
      if(!aux){
        return false
      }
      return el.colors.every(el2 => {
        let aux2 = aux.colors.find(el3 => el3.colId == el2.colId)
        if(!aux2){
          return false
        } else {
          return aux2.quantity == el2.quantity
        }
      })
    })

    console.log("sale:")
    console.log(summarySale)
    console.log("list:")
    console.log(summaryList)

    if(!bool || !bool2){
      this.snackbar.open("Lo sentimos, el pedido no corresponde.", "Cerrar")
      return false
    } else {
      return true
    }

  }

  printWaybill(user: User){
    this.addProducts()
    let wayBill = this.getWaybill(user)
    this.dbs.printWaybillPdf(wayBill)
  }

  getWaybill(user: User): Waybill{
    let waybill: Waybill = {
      id: '',
      orderCode: this.guideFormGroup.value['orderCode'] ? this.guideFormGroup.value['orderCode'] : "--",
      addressee: this.guideFormGroup.value['addressee'] ? this.guideFormGroup.value['addressee'] : "--",
      dni: this.guideFormGroup.value['dni'] ? this.guideFormGroup.value['dni'] : "--",
      transferDate: this.guideFormGroup.value['transferDate'] ? this.guideFormGroup.value['transferDate'] : new Date(),
      startingPoint: this.guideFormGroup.value['startingPoint'] ? this.guideFormGroup.value['startingPoint'] : "--",
      arrivalPoint: this.guideFormGroup.value['arrivalPoint'] ? this.guideFormGroup.value['arrivalPoint'] : "--",
      transferReason: this.guideFormGroup.value['transferReason'] ? this.guideFormGroup.value['transferReason'] : "--",
      observations: this.guideFormGroup.value['observations'] ? this.guideFormGroup.value['observations'] : "--",
      productList: this.arrayProducts,
      createdAt: new Date(),
      createdBy: user,
      editedAt: null,
      editedBy: null
    }
    if(this.sale){
      waybill.saleOrder = this.sale.id
    }
    return waybill
  }

  getCorrelative(corr: number) {
    return corr.toString().padStart(6, '0')
  }

}
