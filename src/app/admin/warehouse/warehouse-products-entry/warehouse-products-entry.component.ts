import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MapBaseLayer } from '@angular/google-maps';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, forkJoin, Observable, of } from 'rxjs';
import { tap, startWith, switchMap, debounceTime, distinctUntilChanged, map, filter, take, shareReplay } from 'rxjs/operators';
import { Kardex, OPERATION_TYPE, TIPO_COMPROBANTE } from 'src/app/core/models/kardex.model';
import { Product, unitProduct } from 'src/app/core/models/product.model';
import { SerialNumber, SerialNumberWithPrice } from 'src/app/core/models/SerialNumber.model';
import { Warehouse } from 'src/app/core/models/warehouse.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { ProductCategoryComponent } from 'src/app/main/product-detail/product-category/product-category.component';

@Component({
  selector: 'app-warehouse-products-entry',
  templateUrl: './warehouse-products-entry.component.html',
  styleUrls: ['./warehouse-products-entry.component.scss']
})
export class WarehouseProductsEntryComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  cumSeriesList: SerialNumberWithPrice[] = []

  invoiceType = Object.values(TIPO_COMPROBANTE)

  entryInvoiceControl: FormControl;
  entryWaybillControl: FormControl;
  entryInvoiceType: FormControl;

  constructor(
    private fb: FormBuilder,
    public snackbar: MatSnackBar,
    private dbs: DatabaseService,
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    this.initForms();
  }

  initForms() {
    this.entryInvoiceControl = this.fb.control(null, Validators.required);
    this.entryWaybillControl = this.fb.control(null, Validators.required);
    this.entryInvoiceType = this.fb.control(null, Validators.required);

  }

  save(): void {
    //console.log("saving")
    //console.log(this.cumSeriesList)
    this.loading.next(true);
    if (this.cumSeriesList.length > 0) {

      this.auth.user$
        .pipe(
          take(1),
          switchMap(user => {
            // Save serial numbers in series collection
            // Add quantity to virtual stock and real stock
            // Add entry to kardex
            return of(this.dbs.saveSerialNumbers(
                null,
                this.entryInvoiceControl.value,
                this.entryWaybillControl.value,
                this.cumSeriesList,
                user,
                "---",
                "Ingreso de Productos",
                true,
                <Kardex["type"]>Number(Object.keys(TIPO_COMPROBANTE).find(key => TIPO_COMPROBANTE[key] === this.entryInvoiceType.value)),
                2,
                null
              ))
          })
        )
        .subscribe(batch => {
          batch.commit()
            .then(() => {
              this.loading.next(false);
              this.cumSeriesList =[];
              this.entryInvoiceControl.setValue(null)
              this.entryWaybillControl.setValue(null)
              this.entryInvoiceControl.markAsUntouched()
              this.entryWaybillControl.markAsUntouched()
              this.snackbar.open('✅ Números de serie almacenados con éxito!', 'Aceptar', {
                duration: 6000
              });
            })
            .catch(err => {
              console.log(err);
              this.loading.next(false);
              this.snackbar.open('🚨 Hubo un error almacenando los números de serie!', 'Aceptar', {
                duration: 6000
              });
            })
        })

    } else {
      this.snackbar.open('🚨 No hay números de serie!', 'Aceptar', {
        duration: 6000
      });
      this.loading.next(false);
    }
  }

}

