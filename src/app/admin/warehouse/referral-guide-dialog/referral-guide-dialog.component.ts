import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { PlacesService } from '../../../core/services/places.service';
import { AuthService } from '../../../core/services/auth.service';
import { DatabaseService } from '../../../core/services/database.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { startWith, map, tap, switchMap, debounceTime, distinctUntilChanged, take, filter } from 'rxjs/operators';
import { Warehouse } from '../../../core/models/warehouse.model';
import { WarehouseProduct } from '../../../core/models/warehouseProduct.model';
import { SerialItem } from '../../../core/models/SerialItem.model';
import { AngularFirestore } from '@angular/fire/firestore';
import { SerialNumber } from 'src/app/core/models/SerialNumber.model';

@Component({
  selector: 'app-referral-guide-dialog',
  templateUrl: './referral-guide-dialog.component.html',
  styleUrls: ['./referral-guide-dialog.component.scss']
})
export class ReferralGuideDialogComponent implements OnInit {

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

  warehouses$: Observable<Warehouse[]>;
  entryProducts$: Observable<WarehouseProduct[]>;

  selectedProduct = new BehaviorSubject<any>(null);
  selectedProduct$ = this.selectedProduct.asObservable();

  serialList: Array<SerialNumber> = [];
  arrayProducts: Array<any> = [];
  entryStock: number = 0;

  scanValidation = new BehaviorSubject<boolean>(false);
  scanValidation$ = this.scanValidation.asObservable();

  validatingScan = new BehaviorSubject<boolean>(false);
  validatingScan$ = this.validatingScan.asObservable();

  actionAddSerie = new BehaviorSubject<boolean>(false);
  actionAddSerie$ = this.actionAddSerie.asObservable();

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
      transferDate: [null, Validators.required],
      startingPoint: [null, Validators.required],
      arrivalPoint: [null, Validators.required],
      transferReason: [null, Validators.required],
      observations: [null, Validators.required],
    });

    this.entryWarehouseControl = this.fb.control('', Validators.required);
    this.entryProductControl = this.fb.control('', Validators.required);
    this.entryScanControl = this.fb.control('');

    this.entrySeries = this.fb.control('', Validators.required);
    this.entryselectProductControl = this.fb.control('');
  }

  initObservables(): void {
    this.warehouses$ = this.dbs.getWarehouseList();

    this.entryProducts$ = combineLatest(
      this.entryWarehouseControl.valueChanges
        .pipe(
          startWith(''),
          switchMap(warehouse => { return this.dbs.getWarehouseProducts(warehouse) })
        ),
      this.entryProductControl.valueChanges
        .pipe(
          startWith(''),
          debounceTime(300),
          distinctUntilChanged(),
          map(product => product.description ? product.description : product)
        )
    ).pipe(
      map(([products, entryProduct]) => {
        return products.filter(product => { return product.description.toLowerCase().includes(entryProduct.toLowerCase()) })
      })
    )

    this.scanValidation$ = combineLatest(
      this.entryWarehouseControl.valueChanges,
      this.entryProductControl.valueChanges,
      this.entryScanControl.valueChanges.pipe(distinctUntilChanged(), filter(scan => !(scan === ''))),
      this.actionAddSerie$.pipe(distinctUntilChanged())
    ).pipe(
      switchMap(([warehouse, product, scan, add]) => {

        this.validatingScan.next(true);
        if (warehouse && product && add) {
          return this.dbs.getProductSerialNumbers(warehouse.id, product.id).pipe(
            map(serials => { return !!serials.find(serial => serial.barcode === scan) ? true : false }),
            tap(res => {

              if (res) {
                this.addSerie();
              } else {
                this.entryScanControl.setErrors(null)
                this.entryScanControl.markAsTouched()
                this.entryScanControl.setErrors({
                  repeated: true
                });
                this.snackbar.open(`🚨 El código escaneado no es parte de este almacén!`, 'Aceptar', {
                  duration: 6000
                });
              }

              this.validatingScan.next(false);
              this.actionAddSerie.next(false);

              return res;
            })
          )
        } else {
          this.entryScanControl.setErrors(null)
          this.validatingScan.next(false);
          this.actionAddSerie.next(false);
          return of(null)
        }
      })
    )
  }

  dispatchAddSerie(): void {
    this.actionAddSerie.next(true);
  }

  addSerie() {
    let scan = this.entryScanControl.value.trim();

    // First, lets check if the scanned code is part of our inventory
    let validation = this.checkSKU(scan);

    if (validation.exists) {
      // If exist in our inventory, then check if the barcode already exists in the product serial numbers
      if (this.checkSerialList(scan)) {
        this.entryScanControl.markAsTouched()
        this.entryScanControl.setErrors({
          repeated: true
        });
        this.snackbar.open(`🚨 El código escaneado ya se encuentra en la lista!`, 'Aceptar', {
          duration: 6000
        });
      } else {

        let data: SerialNumber = {
          id: null,
          barcode: scan,
          color: validation.product.color,
          sku: validation.product.sku,
          status: null,
          createdAt: null,
          createdBy: null,
          editedAt: null,
          editedBy: null
        }

        this.serialList.unshift(data);
        this.entryStock = this.serialList.length;
        this.entryScanControl.setValue('');
      }
    } else {
      this.snackbar.open(`🚨 El código escaneado no es parte de este almacén!`, 'Aceptar', {
        duration: 6000
      });
    }
  }

  removeSerie(i) {
    this.serialList.splice(i, 1)
    this.entryStock = this.serialList.length;
  }

  checkSKU(code: string): { exists: boolean, product: { color: { color: string, name: string }, sku: string } } {
    let product = this.entryProductControl.value;
    let exist = false;
    let skuData;

    product.skuArray.every(product => {
      exist = code.startsWith(product.sku);
      skuData = product
      return !exist;
    });

    return { exists: exist, product: skuData };
  }

  checkSerialList(barcode: string): boolean {
    let exist = false;

    this.serialList.every(serial => {
      exist = serial.barcode === barcode;
      return !exist
    })

    console.log(exist);

    return exist;
  }




// AQUUIIIII ME QUEDE, AGREGANDO LA LISTA DE SERIES A LA LISTA DE PRODUCTOS

  addProducts(itemProduct: WarehouseProduct) {

    console.log('itemProduct: ', itemProduct)

    let namesSeries = [];
    let productsNameSeries = [];
    let productsNamesSerials = [];

    var existname: boolean = false;

    this.arraySeries.forEach((i) => namesSeries.push(i.name));

    this.arrayProducts.forEach((i) => productsNameSeries.push(i.series));

    productsNameSeries.forEach(pd => {
      pd.forEach(p => {
        productsNamesSerials.push(p);
      })
    })

    for (let i = 0; i < productsNamesSerials.length; i++) {
      for (let j = 0; j < namesSeries.length; j++) {
        if (productsNamesSerials[i] === namesSeries[j]) {
          existname = true;
          console.log('existname', existname)
        }
      }
    }

    if (!existname) {
      const weight: number = 100;
      const products: ProductsWarehouse = { code: itemProduct.sku, name: itemProduct.description, series: namesSeries, quantity: this.entryQuantitycontrol.value, und: 'unidades', weight: this.entryQuantitycontrol.value * weight };
      this.arrayProducts.push(products);
    } else {
      this.snackbar.open(`🚨 El el serie agregado ya existe en la lista de productos!`, 'Aceptar', {
        duration: 6000
      });
    }
  }

  deleteProduct(product: WarehouseProduct) {
    this.arrayProducts = this.arrayProducts.filter(c => c.barcode !== product.code);
  }

  saveReferral() {
    this.auth.user$
      .pipe(
        take(1)
      )
      .subscribe(user => {

        const batch = this.afs.firestore.batch()
        const referralRef = this.afs.firestore.collection(`/db/aitec/referralSlips`).doc();

        const data = {
          uid: referralRef.id,
          orderCode: this.guideFormGroup.value['codigo'],
          addressee: this.guideFormGroup.value['Addressee'],
          DNI: this.guideFormGroup.value['dni'],
          dateTranfer: this.guideFormGroup.get('startDate').value,
          startingPoint: this.guideFormGroup.value['point'],
          arrivalPoint: this.guideFormGroup.value['arrivalPoint'],
          reasonTransfer: this.guideFormGroup.get('translate').value,
          observations: this.guideFormGroup.value['oservations'],
          warehouse: this.entryWarehouseControl.value,
          productList: this.arrayProducts,
          createdAt: new Date(),
          createBy: user
        }

        batch.set(referralRef, data)

        batch.commit()
          .then(() => {
            //this.dialogRef.close();
            this.snackbar.open("guia de remision guardado", "Cerrar");
          })
          .catch(err => {
            console.log(err);
            this.snackbar.open("Ups! parece que hubo un error ...", "Cerrar");
          })

      })


  }

  showEntryProduct(product: WarehouseProduct): string | null {
    return product.description ? product.description : null;
  }

  selectedEntryProduct(event: any): void {
    this.selectedProduct.next(event.option.value);
  }


}
