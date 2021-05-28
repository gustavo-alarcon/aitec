import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as e from 'express';
import { combineLatest, Observable, of } from 'rxjs';
import { debounceTime, filter, map, startWith, switchMap, switchMapTo, tap } from 'rxjs/operators';
import { Sale } from 'src/app/core/models/sale.model';
import { SerialNumber, SerialNumberWithPrice } from 'src/app/core/models/SerialNumber.model';
import { DatabaseService } from 'src/app/core/services/database.service';
import { Product } from 'c:/Users/Junjiro/Documents/Meraki/aitec/src/app/core/models/product.model';
import { Warehouse } from 'c:/Users/Junjiro/Documents/Meraki/aitec/src/app/core/models/warehouse.model';

@Component({
  selector: 'app-select-series',
  templateUrl: './select-series.component.html',
  styleUrls: ['./select-series.component.scss']
})
export class SelectSeriesComponent implements OnInit {

  @Input() sale: Sale
  @Input() entry: boolean
  @Input() cumSeriesList: SerialNumberWithPrice[]

  seriesList: SerialNumber[] = []

  warehouseListStatus$: Observable<string>;
  productForm$: Observable<string>;
  formGroup: FormGroup;
  warehouseList$: Observable<Warehouse[]>;
  warehouseListValue$: Observable<Warehouse[]>;
  productList$: Observable<Product[]>;
  productListValue$: Observable<Product[]>;
  productListStatus$: Observable<string>;
  seriesList$: Observable<SerialNumber[]>;
  seriesListStatus$: Observable<string>;
  colorList$: Observable<string[]>;



  constructor(
    private fb: FormBuilder,
    private dbs: DatabaseService,
    public snackbar: MatSnackBar

  ) { }

  ngOnInit(): void {
    this.initForms()
    this.initObservables()
    //console.log(this.entry)
  }

  initForms() {
    //console.log("initiating forms")
    this.formGroup = new FormGroup({
      warehouseList: new FormControl(null, [Validators.required, this.objectValidator()]),
      productList: new FormControl({value: null, disabled: true}, [Validators.required, this.objectValidator()]),
      colorList: !!this.entry ? 
        new FormControl(
          {value: null, disabled: true}, [Validators.required]
        ) : 
        new FormControl(
          {value: null, disabled: true}
        ),
      seriesList: !!this.entry ? 
        new FormControl(
          {value: null, disabled: true}, [Validators.required], [this.seriesEntryValidator()]
        ) : 
        new FormControl(
          {value: null, disabled: true}, 
          [Validators.required, this.objectValidator2()]
        ),
      cost: new FormControl(
        {value: 0, disabled: (!this.entry || this.sale)},
        [Validators.required, Validators.min(0)]
      )
    })
    //console.log(this.formGroup)
  }

  initObservables(){
    this.warehouseList$ = this.dbs.getWarehouseList().pipe(tap(res => {
      //console.log("executing")
      //console.log(res)
    }));

    this.warehouseListValue$ = combineLatest([
      this.warehouseList$.pipe(tap(console.log)),
      <Observable<string | Warehouse>>this.formGroup.get("warehouseList").valueChanges.pipe(startWith(""),tap(console.log))
    ]).pipe(
      map(([warehouseList, warehouseValue]) => {
        if(this.formGroup.get("warehouseList").status != "VALID"){
          return warehouseValue ? warehouseList.filter(el => el.name.toLowerCase().includes((<string>warehouseValue).toLowerCase())) : warehouseList
        } else {
          return []
        }
      })
    )

    this.warehouseListStatus$ = this.formGroup.get("warehouseList").statusChanges.pipe(
      tap((status: string) => {
        if(status == "VALID"){
          this.formGroup.get("productList").reset()
          this.formGroup.get("productList").enable()
          this.formGroup.get("colorList").reset()
          this.formGroup.get("colorList").disable()
          this.formGroup.get("seriesList").reset()
          this.formGroup.get("seriesList").disable()
          this.seriesList = []
          this.formGroup.get("cost").setValue(0)
        } else {
          this.formGroup.get("productList").reset()
          this.formGroup.get("productList").disable()
          this.formGroup.get("colorList").reset()
          this.formGroup.get("colorList").disable()
          this.formGroup.get("seriesList").reset()
          this.formGroup.get("seriesList").disable()
          this.seriesList = []
          this.formGroup.get("cost").setValue(0)
        }
      })
    )

    this.productList$ = !this.sale ? this.dbs.getProductsOrdered() : of(this.sale.requestedProducts.map(el => el.product))

    this.productListValue$ = combineLatest([
      this.productList$,
      <Observable<string | Product>>this.formGroup.get("productList").valueChanges
    ]).pipe(
      map(([productList, productValue]) => {
        if(this.formGroup.get("productList").status != "VALID"){
          return productValue ? productList.filter(el => el.description.toLowerCase().includes((<string>productValue).toLowerCase())) : productList
        } else {
          return []
        }
      })
    )

    this.productListStatus$ = this.formGroup.get("productList").statusChanges.pipe(
      tap((status: string) => {
        if(status == "VALID"){
          this.formGroup.get("colorList").reset((<Product>this.formGroup.get("productList").value).products[0].sku)
          this.formGroup.get("colorList").enable()
          this.formGroup.get("seriesList").reset()
          this.formGroup.get("seriesList").enable()
          this.seriesList = []
          this.formGroup.get("cost").setValue(0)

        } else {
          this.formGroup.get("colorList").reset()
          this.formGroup.get("colorList").disable()
          this.formGroup.get("seriesList").reset()
          this.formGroup.get("seriesList").disable()
          this.seriesList = []
          this.formGroup.get("cost").setValue(0)

        }
      })
    )

    this.colorList$ = this.formGroup.get("productList").valueChanges.pipe(
      map((product: Product) => {
        if(product){
          if(product.products){
            return product.products.map(el => el.sku)
          }
        }
        return <string[]>[]
      })
    )

    this.seriesList$ = combineLatest([
      combineLatest([
        this.warehouseListStatus$,
        this.productListStatus$
      ]).pipe(
        filter(([wareStat, prodStat]) => (wareStat == "VALID") && (prodStat == "VALID")),
        switchMap(([wareStat, prodStat]) => (
          this.dbs.getSeriesStoredOfProductInWarehouse(this.formGroup.get("productList").value.id, this.formGroup.get("warehouseList").value.id)
          )),
        tap(list => {
          if(!list.length){
            this.snackbar.open("Sin unidades disponibles!", "Aceptar")
          }
        })
        ), 
      this.formGroup.get("seriesList").valueChanges])
    .pipe(
      map(([seriesList, seriesValue]) => {
        if(this.formGroup.get("seriesList").status != "VALID"){
          let filteredSeries = seriesList
          if(typeof seriesValue == "string"){
            filteredSeries = seriesValue ? seriesList.filter(el => el.barcode.toLowerCase().includes((<string>seriesValue).toLowerCase())) : seriesList
          } 
          if(filteredSeries.length == 1){
            if(filteredSeries[0].barcode == seriesValue){
              this.formGroup.get("seriesList").setValue(filteredSeries[0])
              this.formGroup.get("seriesList").setValue("")
              return seriesList
            }
          }
          return filteredSeries
        } else {
          return seriesList
        }
      })
    )

  }

  //Only used for entry of series. Will be executed only when seriesList is string
  addSerie(){
    //console.log("adding serie")
    let barcode = (<string>this.formGroup.get("seriesList").value).trim()

    // let sku = barcode.split("-")[0]
    // let code = barcode.split("-")[1]
    let product = <Product>this.formGroup.get("productList").value
    let warehouse = <Warehouse>this.formGroup.get("warehouseList").value

    let foundColor = product.products.find(el => el.sku == (<string>this.formGroup.get("colorList").value))

    //Case when reentering?
    //let foundSeries = this.seriesList.find(el => el.barcode.toUpperCase() == (foundSku.sku+"-"+code).toUpperCase())

    this.seriesList.push({
      id: this.dbs.getFirebaseId(),
      productId: product.id,
      warehouseId: warehouse.id,
      barcode: barcode,     
      sku: foundColor.sku,      //codigo de color
      color: foundColor.color,
      status: "stored",

      createdAt: null,
      createdBy: null,
      editedAt: null,
      editedBy: null,
    })

    this.formGroup.get("seriesList").setValue(null)
        
  }

  removeSerie(barcode: string){
    this.seriesList = this.seriesList.filter(el => el.barcode != barcode)
  }

  addSerieList() {
    let product = <Product>this.formGroup.get("productList").value
    let warehouse = <Warehouse>this.formGroup.get("warehouseList").value
    let cost = 0

    if(this.sale){
      if(this.sale.user.mayoristUser){
        cost = product.priceMay
      } else {
        cost = product.priceMin
      }
    } else {
      if(this.entry){
        cost = this.formGroup.get("cost").value
      } else {
        cost = product.priceMin
      }
    }

    let found = this.cumSeriesList.find(el => (el.product.id == product.id) && (el.warehouse.id == warehouse.id))

    if(found){
      this.snackbar.open("Este registro ya existe!", "Aceptar")
    } else {
      this.cumSeriesList.push({
        list: this.seriesList,
        cost: cost,
        product: product,
        warehouse: warehouse,
      })
      this.seriesList = []
      this.formGroup.get("productList").setValue(null)
      this.formGroup.get("warehouseList").setValue(null)
      this.formGroup.get("cost").setValue(0)
    }
  }

  remSerieList(element: SerialNumberWithPrice) {
    let aux = this.cumSeriesList.findIndex(el => ((el.product.id == element.product.id) && (el.warehouse.id == element.warehouse.id)))
    this.cumSeriesList.splice(aux, 1)
  }

  objectValidator() {
    return (control: AbstractControl): ValidationErrors => {

      let series = control.value
      if(series){
        if(typeof series == 'string'){
          return {noObject: true}
        } else {
          return null
        }
      } else {
        return null
      }
      
    }
  }

  //Only used when taking out
  objectValidator2() {
    return (control: AbstractControl): ValidationErrors => {

      let value = <SerialNumber | string>control.value
      if(value){
        if(typeof value == 'string'){
          return {noObject: true}
        } else {
          let series = <SerialNumber>value
          
          //We now check if this code is already on the list
          let foundSeries = this.seriesList.find(el => el.barcode.toUpperCase() == series.barcode.toUpperCase())
          let foundSeries2 = this.cumSeriesList/*.filter(el => el.product.id == series.productId)*/.find(el=> {
            let serialList = <SerialNumber[]>el.list
            return !!serialList.find(el2 => el2.barcode.toUpperCase() == series.barcode.toUpperCase())
          })

          if(foundSeries || foundSeries2){
            return {repeatedBarcode: true}
          } else {
            //We also have to update the status
            this.seriesList.push({...series, status: "sold"})
            return null
          }
          
        }
      } else {
        return null
      }
      
    }
  }
  deb(){
    console.log(this.formGroup.get("serialList"))
  }

  seriesEntryValidator(){
    return (control: AbstractControl): Observable<ValidationErrors> => {

      let value = control.value

      return of(value).pipe(
        debounceTime(500),
        switchMap(val => {
          if(value){
            let barcode = value.trim()
        
            //We first validate if it is a valid barcode
            // if(barcode.split("-").length != 2){
            //   control.markAsTouched()
            //   return of({invalidCode: true})
            // } else {
              // let sku = barcode.split("-")[0]
              // let code = barcode.split("-")[1].toUpperCase()
              // let product = <Product>this.formGroup.get("productList").value
              // let warehouse = <Warehouse>this.formGroup.get("warehouseList").value
        
              // let foundSku = product.products.find(el => el.sku.toUpperCase() == sku.toUpperCase())
        
              // //We check if this code is available on the product
              // if(!foundSku){
              //   control.markAsTouched()
              //   return of({invalidColor: true})
              // } else {
        
                //We now check if this code is already on the list
                // let foundSeries = this.seriesList.find(el => el.barcode.toUpperCase() == (foundSku.sku+"-"+code).toUpperCase())
                // let foundSeries2 = this.cumSeriesList.filter(el => el.product.id == product.id).find(el=> {
                //   let serialList = <SerialNumber[]>el.list
                //   return !!serialList.find(el2 => el2.barcode.toUpperCase() == (foundSku.sku+"-"+code).toUpperCase())
                // })

                let foundSeries = this.seriesList.find(el => el.barcode == barcode)
                let foundSeries2 = this.cumSeriesList.find(el=> {
                  let serialList = <SerialNumber[]>el.list
                  return !!serialList.find(el2 => el2.barcode.toUpperCase() == barcode)
                })

                if(foundSeries || foundSeries2){
                  control.markAsTouched()
                  return of({repeatedBarcode: true})
                } else {
                  //console.log("checking code db")
                  //We now check if code was already registered
                  return this.dbs.validateSeriesOfProduct(barcode).pipe(
                    map(seriesList => {
                      //console.log(seriesList)
                      if(seriesList.length){
                        control.markAsTouched()
                        return {repeatedBarcodeDB: true}
                      } else {
                        return null
                      }
                    })
                  )
                }
        
              // }
        
            // }
    
          } else {
            return of(null)
          }
        })
      )

      
      
    }
  }

  showWarehouse(ware: Warehouse | string): string {
    if(ware){
      if(typeof ware != "string"){
        return ware.name;
      } else {
        return ware
      }
    } else {
      return null
    }
  }

  showProduct(prod: Product | string): string {
    if(prod){
      if(typeof prod != "string"){
        return prod.description;
      } else {
        return prod
      }
    } else {
      return null
    }
  }

  showSeries(series: SerialNumber | string): string {
    if(series){
      if(typeof series != "string"){
        return series.barcode;
      } else {
        return series
      }
    } else {
      return null
    }
  }

}
