import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MapBaseLayer } from '@angular/google-maps';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
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
import { TakeOutConfirmDialogComponent } from '../take-out-confirm-dialog/take-out-confirm-dialog.component';

@Component({
  selector: 'app-warehouse-products-take-out',
  templateUrl: './warehouse-products-take-out.component.html',
  styleUrls: ['./warehouse-products-take-out.component.scss']
})
export class WarehouseProductsTakeOutComponent implements OnInit {
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
    public auth: AuthService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.initForms();
  }

  initForms() {
    this.entryInvoiceControl = this.fb.control(null, Validators.required);
    this.entryWaybillControl = this.fb.control("---", Validators.required);
    this.entryInvoiceType = this.fb.control(null, Validators.required);
  }

  save(): void {
    //console.log("saving")
    //console.log(this.cumSeriesList)
    this.loading.next(true);
    if (this.cumSeriesList.length > 0) {

    let dialogRef: MatDialogRef<TakeOutConfirmDialogComponent>;

    dialogRef = this.dialog.open(TakeOutConfirmDialogComponent, {
      closeOnNavigation: false,
      disableClose: true,
      width: '360px',
      maxWidth: '360px',
      data: {
        warning: `Se retiraran los números de serie.`,
        content: `¿Está seguro de retirar?
        Con esta acción, se descontará el stock correspondiente.`,
        noObservation: false,
        observation: "",
        title: 'Retirar',
        titleIcon: 'warning'
      }
    })

    dialogRef.afterClosed().pipe(
      switchMap((res: {action: string, lastObservation: string}) => {
        if(!res){
          return of(null)
        } else {
          return this.auth.user$
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
                    res.lastObservation,
                    "Retiro de Productos",
                    true,
                    <Kardex["type"]>Number(Object.keys(TIPO_COMPROBANTE).find(key => TIPO_COMPROBANTE[key] === this.entryInvoiceType.value)),
                    12,
                    null
                  ))
              })
            )
        }
      })
    ).subscribe(batch => {
      if(batch){
        batch.commit()
          .then(() => {
            this.loading.next(false);
            this.cumSeriesList =[];
            this.entryInvoiceControl.setValue(null);
            this.entryInvoiceControl.markAsUntouched();
            this.snackbar.open('✅ Números de serie retirados con éxito!', 'Aceptar', {
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
      } else {
        this.loading.next(false);
      }
    })

    } else {
      this.snackbar.open('🚨 No hay números de serie!', 'Aceptar', {
        duration: 6000
      });
    }
  }

}


