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
import { Sale } from 'src/app/core/models/sale.model';
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
      observations: [null, Validators.required],
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
    this.loading.next(true);

    this.addProducts()
    const data: Waybill = this.getWaybill(user)

    let batch = this.dbs.createWaybill(data, this.cumSeriesList, user, this.sale)
    batch.commit()
      .then(() => {
        this.snackbar.open(`✅ Guía de remisión creada satisfactoriamente!`, 'Aceptar', {
          duration: 6000
        });

        this.cumSeriesList = []

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
