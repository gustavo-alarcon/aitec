import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { DatabaseService } from 'src/app/core/services/database.service';
import { Product } from 'src/app/core/models/product.model';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { filter, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import * as XLSX from 'xlsx';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Kardex } from 'src/app/core/models/kardex.model';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-kardex-dialog',
  templateUrl: './kardex-dialog.component.html',
  styleUrls: ['./kardex-dialog.component.scss']
})
export class KardexDialogComponent implements OnInit {

  loadingHistory = new BehaviorSubject<boolean>(false);
  loadingHistory$ = this.loadingHistory.asObservable();

  thirdColumns: string[] = [
    'index', 'document', 'operationType', 'movement', 'createdBy'
  ]

  secondColumnsValued: string[] = [
    'createdAt', 'type', 'invoice', 'inQuantity', 'inPrice', 'inTotal', 
    'outQuantity', 'outPrice', 'outTotal', 'finalQuantity', 'finalUnitPrice', 'finalTotalPrice'];

  secondColumnsNoValued: string[] = [
    'createdAt', 'type', 'invoice', 'inQuantity', 'outQuantity', 'finalQuantity'];

  rowColumnsNoValued: string[] = [
    'index', 'createdAt', 'type', 'invoice', 'operationType', 'inQuantity', 'outQuantity', 'finalQuantity', 'createdBy'
  ]

  rowColumnsValued: string[] = [
    'index', 'createdAt', 'type', 'invoice', 'operationType', 'inQuantity', 'inPrice', 'inTotal', 
    'outQuantity', 'outPrice', 'outTotal', 'finalQuantity', 'finalUnitPrice', 'finalTotalPrice', 'createdBy'
  ]

  dataSource = new MatTableDataSource<Kardex>();
  valuedKardexForm$: Observable<string[]>;
  lastRowSpan$: Observable<3 | 9>;
  valuedKardexColumn$: Observable<string[]>;
  valuedKardexRow$: Observable<string[]>;
  
  @ViewChild(MatPaginator, { static: false }) set content(paginator1: MatPaginator) {
    this.dataSource.paginator = paginator1;
  }


  init$: Observable<any>;
  dateForm: FormGroup;
  valuedKardexForm: FormControl;

  constructor(
    private dialogRef: MatDialogRef<KardexDialogComponent>,
    private dbs: DatabaseService,
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private auth: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: { product: Product, warehouseId: string }
  ) { }

  ngOnInit(): void {
    let monthBegin = new Date()
    monthBegin.setDate(1)

    this.dateForm = this.fb.group({
      begin: this.fb.control(monthBegin),
      end: this.fb.control((new Date()))
    });

    this.valuedKardexForm = new FormControl(false)

    this.init$ = this.dateForm.valueChanges
        .pipe(
          filter((date: {begin: Date, end: Date}) => (!!date.begin && !!date.end)),
          startWith(this.dateForm.value),
          switchMap((date: {begin: Date, end: Date}) => {
            date.begin.setHours(0, 0, 0);
            date.end.setHours(23, 59, 59);
            
            return this.dbs.getKardex(this.data.product.id, date, this.data.warehouseId)
              .pipe(
                tap((res) => {
                  //console.log(res);
                  this.dataSource.data = res
                  this.loadingHistory.next(false)
                })
              )
          })
        )

    this.valuedKardexColumn$ = this.valuedKardexForm.valueChanges.pipe(
      startWith(this.valuedKardexForm.value),
      map(valuedKardex => {
        if(valuedKardex){
          return this.secondColumnsValued
        } else {
          return this.secondColumnsNoValued
        }
      }),
      shareReplay(1)
    )

    this.valuedKardexRow$ = this.valuedKardexForm.valueChanges.pipe(
      startWith(this.valuedKardexForm.value),
      map(valuedKardex => {
        if(valuedKardex){
          return this.rowColumnsValued
        } else {
          return this.rowColumnsNoValued
        }
      }),
      shareReplay(1)
    )

    this.lastRowSpan$ = this.valuedKardexColumn$.pipe(
      map(res => {
        return res == this.secondColumnsNoValued ? 3 : 9
      })
    )
  }

  downloadXls(): void {
    let data = this.dataSource.data

    let table_xlsx: any[] = [];

    let headersXlsx = this.valuedKardexForm.value ? [
      'Fecha/hora de movimiento', 'Tipo', 'Documento', 'Tipo de Operación', 'Ingreso', 'S/.', 'Total',
      'Salida', 'S/.', 'Total', 'Saldo Final', 'S/.', 'Saldo Total', 'Creado Por:'
    ] : [
      'Fecha/hora de movimiento', 'Tipo', 'Documento', 'Tipo de Operación', 'Ingreso',
      'Salida', 'Saldo Final', 'Creado Por:'
    ]

    table_xlsx.push(headersXlsx);

    data.forEach(trans => {
      let temp = this.valuedKardexForm.value ? [
        this.datePipe.transform(trans['createdAt']['seconds'] * 1000, 'dd/MM/yyyy(hh:mm:ss)'),
        trans.type,
        trans.invoice,
        trans.operationType,
        trans.inflow ? trans.quantity : 0,
        trans.inflow ? trans.unitPrice : 0,
        trans.inflow ? trans.totalPrice : 0,
        !trans.inflow ? trans.quantity : 0,
        !trans.inflow ? trans.unitPrice : 0,
        !trans.inflow ? trans.totalPrice : 0,
        trans.finalUpdated ? trans.finalQuantity : 0,
        trans.finalUpdated ? trans.finalUnitPrice : 0,
        trans.finalUpdated ? trans.finalTotalPrice : 0,
        trans.createdBy.personData.name+ " " + trans.createdBy.personData["lastName"] ? trans.createdBy.personData["lastName"] : ""
      ] : [
        this.datePipe.transform(trans['createdAt']['seconds'] * 1000, 'dd/MM/yyyy(hh:mm:ss)'),
        trans.type,
        trans.invoice,
        trans.operationType,
        trans.inflow ? trans.quantity : 0,
        !trans.inflow ? trans.quantity : 0,
        trans.finalUpdated ? trans.finalQuantity : 0,
        trans.createdBy.personData.name+ " " + trans.createdBy.personData["lastName"] ? trans.createdBy.personData["lastName"] : ""
      ];

      table_xlsx.push(temp);
    })

    /* generate worksheet */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `kardex`);

    /* save to file */
    const name = 'kardex_de_producto_' + this.data.product.sku + '.xlsx';
    XLSX.writeFile(wb, name);
  }


}
