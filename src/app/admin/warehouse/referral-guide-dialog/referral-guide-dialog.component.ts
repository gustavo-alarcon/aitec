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
import { AngularFirestore } from '@angular/fire/firestore';
import { SerialNumber } from 'src/app/core/models/SerialNumber.model';
import { Product } from 'src/app/core/models/product.model';
import { Waybill, WaybillProductList } from 'src/app/core/models/waybill.model';
import { SerialItem } from 'src/app/core/models/SerialItem.model';

@Component({
  selector: 'app-referral-guide-dialog',
  templateUrl: './referral-guide-dialog.component.html',
  styleUrls: ['./referral-guide-dialog.component.scss']
})
export class ReferralGuideDialogComponent implements OnInit {
  currentDate: number = Date.now();
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
  actualProduct: Product = null;

  serialList: Array<SerialNumber> = [];
  arrayProducts: Array<WaybillProductList> = [];
  entryStock: number = 0;

  scanValidation = new BehaviorSubject<boolean>(false);
  scanValidation$ = this.scanValidation.asObservable();

  validatingScan = new BehaviorSubject<boolean>(false);
  validatingScan$ = this.validatingScan.asObservable();

  actionAddSerie = new BehaviorSubject<boolean>(false);
  actionAddSerie$ = this.actionAddSerie.asObservable();

  radioOptions = {
    "1": "Ventas",
    "2": "Translado de establecimiento de la misma empresa",
    "3": "Importación",
    "4": "Venta sujeto a confirmacion del comprador",
    "5": "Translado de bienes para transformacion",
    "6": "Exportación",
    "7": "Compra",
    "8": "Recojo de bines",
    "9": "Venta con entrega a terceros",
    "10": "Consignación",
    "11": "Translado por emison de itenerante de comprobante de pago",
    "12": "Otros no incluidos en los puntos anteriores tales como exhibición, demostración, etc.",
    "13": "Devolución",
    "14": "Translado de zona primaria",
  };

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
          return this.dbs.getStoredSerialNumbers(warehouse.id, product.id).pipe(
            map(serials => { return serials.find(serial => serial.barcode === scan) }),
            tap(serial => {

              if (serial) {
                this.addSerie(serial.id);
              } else {
                this.entryScanControl.setErrors(null)
                this.entryScanControl.markAsTouched()
                this.entryScanControl.setErrors({
                  repeated: true
                });
                this.snackbar.open(`🚨 El código escaneado no es parte de este almacén o está vendido!`, 'Aceptar', {
                  duration: 6000
                });
              }

              this.validatingScan.next(false);
              this.actionAddSerie.next(false);

              return !!serial;
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

  
  
  showEntrySerial(serie: SerialItem): string | null {
    return serie.barcode ? serie.barcode : null;
  }


  saveReferral(){
   
    this.auth.user$.pipe(take(1)).subscribe(user => {    
              
      const batch = this.afs.firestore.batch()
      const referralRef = this.afs.firestore.collection(`/db/aitec/referralSlips`).doc();    

      const data = {
        uid: referralRef.id,
        orderCode:this.guideFormGroup.value['codigo'],
        addressee:this.guideFormGroup.value['Addressee'],
        DNI:this.guideFormGroup.value['dni'],
        dateTranfer:this.guideFormGroup.get('startDate').value,
        startingPoint:this.guideFormGroup.value['point'],
        arrivalPoint:this.guideFormGroup.value['arrivalPoint'],
        reasonTransfer:this.guideFormGroup.get('translate').value,
        observations:this.guideFormGroup.value['oservations'],
        warehouse:this.entryWarehouseControl.value,
        productList:this.arrayProducts,
        createdAt:new Date(),
        createBy:user,

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

  changeView(view): void {
    this.view = view;
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
          id: id,
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

  showEntryProduct(product: WarehouseProduct): string | null {
    return product.description ? product.description : null;
  }

  selectedEntryProduct(event: any): void {
    this.selectedProduct.next(event.option.value);
    this.actualProduct = event.option.value;
  }




  // AQUUIIIII ME QUEDE, AGREGANDO LA LISTA DE SERIES A LA LISTA DE PRODUCTOS
  checkIfExistOnProducts(product: Product): boolean {
    let exist = false;

    this.arrayProducts.every(list => {
      exist = list.mainCode === product.sku;
      return !exist
    });

    return exist;
  }


  addProducts() {

    if (this.checkIfExistOnProducts(this.actualProduct)) {
      this.snackbar.open(`🚨 Este producto ya se encuentra en la lista de emisión!`, 'Aceptar', {
        duration: 6000
      });
      return;
    }

    let data: WaybillProductList = {
      mainCode: this.actualProduct.sku,
      description: this.actualProduct.description,
      invoice: this.guideFormGroup.value['orderCode'],
      waybill: this.guideFormGroup.value['orderCode'],
      productId: this.actualProduct.id,
      warehouseId: this.entryWarehouseControl.value.id,
      serialList: this.serialList,
      quantity: this.serialList.length,
      unit: 'unidades',
      totalWeight: this.actualProduct.weight ? (this.actualProduct.weight * this.serialList.length) : 0
    };

    this.arrayProducts.push(data);
    this.serialList = [];

  }

  deleteProduct(index: number) {
    this.arrayProducts.splice(index, 1);
  }

  saveWaybill() {
    if (!this.arrayProducts.length) {
      this.snackbar.open(`🚨 La lista de productos de emisión esta vacía!`, 'Aceptar', {
        duration: 6000
      });
      return
    }

    this.loading.next(true);

    this.auth.user$
      .pipe(
        take(1)
      )
      .subscribe(user => {

        const data: Waybill = {
          id: '',
          orderCode: this.guideFormGroup.value['orderCode'],
          addressee: this.guideFormGroup.value['addressee'],
          dni: this.guideFormGroup.value['dni'],
          transferDate: this.guideFormGroup.value['transferDate'],
          startingPoint: this.guideFormGroup.value['startingPoint'],
          arrivalPoint: this.guideFormGroup.value['arrivalPoint'],
          transferReason: this.radioOptions[this.guideFormGroup.value['transferReason']],
          observations: this.guideFormGroup.value['observations'],
          warehouse: this.entryWarehouseControl.value,
          productList: this.arrayProducts,
          createdAt: new Date(),
          createdBy: user,
          editedAt: null,
          editedBy: null
        }

        this.dbs.createWaybill(data, user)
          .pipe(
            take(1)
          ).subscribe(batch => {
            batch.commit()
              .then(() => {
                this.snackbar.open(`☑️ Actualizando números de serie`, 'Aceptar', {
                  duration: 6000
                });

                this.dbs.waybillSerialNumbers(this.arrayProducts, user)
                  .then(res => {
                    if (res) {
                      res.pipe(
                        take(1)
                      ).subscribe(batch => {
                        batch.commit()
                          .then(() => {
                            this.loading.next(false);
                            this.snackbar.open(`✅ Guía de remisión creada satisfactoriamente!`, 'Aceptar', {
                              duration: 6000
                            });
                          })
                      })
                    }
                  })
              })
              .catch(err => {
                console.log(err);
                this.snackbar.open(`🚨 Parece que hubo un error guardando la guía de remisión`, 'Aceptar', {
                  duration: 6000
                });
              })
          })
      })
  }

}
