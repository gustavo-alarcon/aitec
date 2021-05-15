import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { filter, map, startWith, switchMap, tap } from 'rxjs/operators';
import { SerialNumber, serialProcess } from 'src/app/core/models/SerialNumber.model';
import { DatabaseService } from 'src/app/core/services/database.service';
import * as XLSX from 'xlsx';
import { MovementsDetailDialogComponent } from '../movements-detail-dialog/movements-detail-dialog.component';

@Component({
  selector: 'app-movements',
  templateUrl: './movements.component.html',
  styleUrls: ['./movements.component.scss']
})
export class MovementsComponent implements OnInit {

  //movement
  movement$: Observable<serialProcess[]>;
  movementFiltered$: Observable<serialProcess[]>;
  dateForm: FormGroup;
  movementFilter: FormControl;
  movementDataSource = new MatTableDataSource<serialProcess>();
  movementDisplayedColumns: string[] = [
    'index', 'createdAt', 'type', 'invoice', 'waybill', 'createdBy', 'observations', 'detail'
  ];

  @ViewChild("movementPaginator", { static: false }) set contentRat(paginator: MatPaginator) {
    this.movementDataSource.paginator = paginator;
  }

  constructor(
    public dbs: DatabaseService,
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
    private datePipe: DatePipe,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    let monthBegin = new Date()
    monthBegin.setDate(1)

    this.dateForm = this.fb.group({
      begin: this.fb.control(monthBegin),
      end: this.fb.control((new Date()))
    });

    this.movementFilter = new FormControl("")

    this.movementDataSource.filterPredicate = (data: serialProcess, filterText: string) => {
      let filter = filterText.trim().toUpperCase();
      let dataString = Object.values(data).filter(res => typeof res == "string").join("")
      return (dataString.toUpperCase().includes(filter))
    }

    this.movement$ = this.dateForm.valueChanges
      .pipe(
        filter((date: {begin: Date, end: Date}) => (!!date.begin && !!date.end)),
        startWith(this.dateForm.value),
        switchMap((date: {begin: Date, end: Date}) => {
          date.begin.setHours(0, 0, 0);
          date.end.setHours(23, 59, 59);
          this.movementFilter.setValue("")
          
          return this.dbs.getMovementsValueChanges(date)
            .pipe(
              switchMap(res => {
                this.movementDataSource.data = res
                console.log(res)
                return this.movementFilter.valueChanges.pipe(
                  startWith(this.movementFilter.value),
                  map((filter: string) => {
                    if(filter){
                      this.movementDataSource.filter = filter
                    }
                    console.log(this.movementDataSource.filteredData)
                    return this.movementDataSource.filteredData
                  })
                  )
              })
            )
        })
      )

  }

  loadSeries(data: serialProcess){
    let dialogRef: MatDialogRef<MovementsDetailDialogComponent>
    dialogRef = this.dialog.open(MovementsDetailDialogComponent, {
      data: data.list
    });
  }

  downloadXls(): void {
    let data = this.movementDataSource.data

    let table_xlsx: any[] = [];

    let headersXlsx = [
      'Fecha', 'Tipo', 'Comprobante', 'GR/Documento', 'Responsable', 'Observaciones',
      'Almacén',
      'Código de producto',
      'Producto',
      'Cantidad',
      'Series'
    ] 

    table_xlsx.push(headersXlsx);

    data.forEach(trans => {
      let temp = [
        this.datePipe.transform(trans['createdAt']['seconds'] * 1000, 'dd/MM/yyyy(hh:mm:ss)'),
        trans.type,
        trans.invoice,
        trans.waybill,
        trans.createdBy.personData.name +" "+ (trans.createdBy.personData.type == "natural" ? trans.createdBy.personData["lastName"]: ""),
        trans.observations ? trans.observations : "---"
      ]

      trans.list.forEach(el => {
        let series = (<SerialNumber[]>el.list).map(el2 => el2.barcode).join("; ").slice(0, -2)
  
        let aux = [
          el.warehouse.name,
          el.product.sku,
          el.product.description,
          el.list.length,
          series
        ]
  
        table_xlsx.push([...temp, ...aux]);
      })

    })

    /* generate worksheet */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `movimientos`);

    /* save to file */
    const name = 'movimientos.xlsx';
    XLSX.writeFile(wb, name);
  }

}