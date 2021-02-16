import { Component, OnInit, Inject, SimpleChanges } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { PlacesService } from '../../../core/services/places.service';
import { AuthService } from '../../../core/services/auth.service';
import { DatabaseService } from '../../../core/services/database.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { startWith, map, tap, switchMap, debounceTime, distinctUntilChanged, filter, take } from 'rxjs/operators';
import { Product } from '../../../core/models/product.model';
import { Warehouse } from '../../../core/models/warehouse.model';
import { WarehouseProduct } from '../../../core/models/warehouseProduct.model';
import { SerialItem } from '../../../core/models/SerialItem.model';
import { AngularFirestore } from '@angular/fire/firestore';
import { Push } from '../../../core/models/push.model';

@Component({
  selector: 'app-referral-guide-dialog',
  templateUrl: './referral-guide-dialog.component.html',
  styleUrls: ['./referral-guide-dialog.component.scss']
})
export class ReferralGuideDialogComponent implements OnInit {
  
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();
  guideFormGroup: FormGroup;

  existSerie:boolean;

  entryWarehouseControl: FormControl;
  entryProductControl: FormControl;
  entryQuantitycontrol:FormControl;
  entryScanControl: FormControl;
  entrySeries: FormControl;
  entryselectProductControl: FormControl;

  arrayProducts:ProductsWarehouse []=[];
  arraySeries:ProductsSeries []=[];
   
  
  categorySelected: boolean = false;

  view: string = "products";
  warehouses$: Observable<Warehouse[]>;
  entryProducts$: Observable<WarehouseProduct[]>;
  entrySeries$: Observable<SerialItem[]>;

  selectedProduct = new BehaviorSubject<any>(null);
  selectedProduct$ = this.selectedProduct.asObservable();

  serialList: Array<any> = [];
  entryStock: number = 0;

  closeSubscriptions = new BehaviorSubject<boolean>(false);
  closeSubscriptions$ = this.closeSubscriptions.asObservable();

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
              public snackbar: MatSnackBar,
              @Inject(MAT_DIALOG_DATA) public data: { data },
              public dialogRef: MatDialogRef<ReferralGuideDialogComponent>
  ) { }

  ngOnInit(): void {
    this.guideFormGroup = this.fb.group({
      codigo: ['', Validators.required],
      Addressee: ['', Validators.required],
      point: ['', Validators.required],
      dni: ['', Validators.required],
      arrivalPoint: ['', Validators.required],
      translate: ['', Validators.required],
      oservations: ['', Validators.required],
      startDate: ['', Validators.required],     
    })
    this.entryWarehouseControl = this.fb.control('', Validators.required);
    this.entryProductControl = this.fb.control('', Validators.required);
    this.entryQuantitycontrol = this.fb.control('', Validators.required);

    this.entrySeries= this.fb.control('', Validators.required);
    
    this.entryScanControl = this.fb.control('');
    this.entryselectProductControl = this.fb.control('');

    
    this.warehouses$ = this.dbs.getWarehouseList();


    this.entryProducts$ = combineLatest(
      this.entryWarehouseControl.valueChanges
        .pipe(
          startWith(''),
          switchMap((warehouse )=> { return this.dbs.getWarehouseProducts(warehouse) })
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

    this.entrySeries$ = combineLatest(
      this.entryWarehouseControl.valueChanges,
      this.entryProductControl.valueChanges,    
      this.entrySeries.valueChanges
        .pipe(
          startWith(''),
          debounceTime(300),
          distinctUntilChanged(),
          map(serie => serie.barcode ? serie.barcode : serie)
        ),
        this.actionAddSerie$.pipe(distinctUntilChanged())

    ).pipe(
      switchMap(([warehouse, product,entrySeries,add]) => {

       return this.dbs.getProductSerialNumbers(warehouse.id, product.id).pipe(
         map( serialList=>{

          return serialList.filter(serie => { return serie.barcode.toLowerCase().includes(entrySeries.toLowerCase()) })

         }  

         ),
         tap( res=>{          
           
          if (res) {
            this.entryScanControl.markAsTouched()
            this.entryScanControl.setErrors({
              repeated: true
            });
            this.snackbar.open(`🚨 El código escaneado ya existe en este almacén!`, 'Aceptar', {
              duration: 6000
            });
          } /* else {
            if (add) {
              this.addSerie();
            }
            this.entryScanControl.setErrors(null)
          }

          this.validatingScan.next(false);
          this.actionAddSerie.next(false); */

          }
         )
       )

      })
    )
    
    
  }
  addSeries(serie){

  let barcode=serie.barcode;
  let getBarcodeName=[];
  let existSerie:boolean;

  getBarcodeName=this.arraySeries.map((serie)=>{
    return serie.name;
  })

  existSerie = getBarcodeName.includes(barcode);
  
  if (!existSerie&&barcode) {
    const series:ProductsSeries={name:barcode};
    this.arraySeries.push(series);

    this.entryQuantitycontrol.setValue(this.arraySeries.length)
  }else{
      this.snackbar.open(`🚨 El código escaneado no existe en este almacén!`, 'Aceptar', {
      duration: 6000
      });
    }  
   

  }
  deleteSerie(serie:ProductsSeries){
    this.arraySeries = this.arraySeries.filter(c => c.name !== serie.name);
    this.entryQuantitycontrol.setValue(this.arraySeries.length)

  }
  
  showEntrySerial(serie: SerialItem): string | null {
    return serie.barcode ? serie.barcode : null;
  }

  addProducts(itemProduct:WarehouseProduct){  

    console.log('itemProduct: ', itemProduct)
    
    let namesSeries = []; 
    let productsNameSeries=[]; 
    let  productsNamesSerials=[];

    var existname:boolean=false;
    
    this.arraySeries.forEach((i) => namesSeries.push(i.name));

    this.arrayProducts.forEach((i) => productsNameSeries.push(i.series));

   productsNameSeries.forEach(pd=>{
     pd.forEach(p=>{       
      productsNamesSerials.push(p);
     })
   })

    for (let i = 0; i < productsNamesSerials.length; i++) {
      for (let j = 0; j < namesSeries.length; j++) {
         if (productsNamesSerials[i]===namesSeries[j]) {
             existname=true ;         
             console.log('existname',existname)
          }       
      }      
    }

    if (!existname) {
      const weight:number=100;
      const products:ProductsWarehouse = {code:itemProduct.sku, name:itemProduct.description,series: namesSeries,quantity:this.entryQuantitycontrol.value,und:'unidades',weight:this.entryQuantitycontrol.value*weight};
      this.arrayProducts.push(products);      
    }else{
      this.snackbar.open(`🚨 El el serie agregado ya existe en la lista de productos!`, 'Aceptar', {
        duration: 6000
        });
    }
  }
  deleteProduct(product:ProductsWarehouse){
    this.arrayProducts = this.arrayProducts.filter(c =>c.code !== product.code);
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
        this.dialogRef.close();
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

  showEntryProduct(product: WarehouseProduct): string | null {
    return product.description ? product.description : null;
  }

  selectedEntryProduct(event: any): void {
    this.selectedProduct.next(event.option.value);
  }


  addSerie() {
    let scan = this.entryScanControl.value.trim();

    // First, lets check if the scanned code is part of our inventory
    let validation = this.checkSKU(scan);
    
    if (validation.exists) {
      // If exist in our inventory, then check if the barcode already exists in the product serial numbers
      if (this.checkSerialList(scan)) {
        this.snackbar.open(`🚨 El código escaneado ya se encuentra en la lista!`, 'Aceptar', {
          duration: 6000
        });
      } else {
        this.serialList.unshift(scan);
        this.entryStock = this.serialList.length;
        this.entryScanControl.setValue('');
      }
    } else {
      // If not exists, we have to add the SKU to the current product
      this.addNewSKUToProduct(this.entryProductControl.value);
    }
  }

  removeSerie(i) {
    this.serialList.splice(i, 1)
    this.entryStock = this.serialList.length;
  }

  checkSKU(code: string): {exists: boolean, sku: string} {
    let product = this.entryProductControl.value;
    let exist = false;
    let sku: string;

    product.skuArray.every(sku => {
      exist = code.startsWith(sku);
      sku = sku
      return !exist;
    });

    return {exists: exist, sku: sku};
  }

  checkSerialList(barcode: string): boolean {
    let exist = false;

    this.serialList.every(serie => {
      exist = serie === barcode;
      return !exist
    })

    return exist;
  }

  addNewSKUToProduct(product: WarehouseProduct): void {
    console.log('new sku');
  }

  save(): void {
    this.loading.next(true);
    if (this.serialList.length > 0) {

      this.auth.user$
        .pipe(
          take(1)
        )
        .subscribe(user => {

        })

    } else {
      this.snackbar.open('🚨 No hay números de serie!', 'Aceptar', {
        duration: 6000
      });
    }
  }

  
}
export interface ProductsWarehouse{
  code:any;
  name:string;
  series:any;
  quantity:number;
  und:string;
  weight:number;
}
export interface ProductsSeries{
  name:string;
}
