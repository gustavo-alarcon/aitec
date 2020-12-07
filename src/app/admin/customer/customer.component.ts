import { tap, startWith, switchMap, shareReplay, map } from 'rxjs/operators';
import { User } from 'src/app/core/models/user.model';
import { Observable, combineLatest } from 'rxjs';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Sale } from 'src/app/core/models/sale.model';
import { FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {

  dataSource = new MatTableDataSource();
  displayedColumns: string[] = ['index', 'name', 'phone', 'address', 'sales'];

  @ViewChild("paginatorList", { static: false }) set content(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }

  list$: Observable<User[]>;
  listFiltered$: Observable<User[]>;
  listFilter: FormControl;

  //rating
  rating$: Observable<Sale[]>;
  ratingFiltered$: Observable<Sale[]>;
  date: FormControl;
  ratingFilter: FormControl;
  ratingDataSource = new MatTableDataSource<Sale>();
  ratingDisplayedColumns: string[] = ['nroMandadito', 'cliente', 'servicio', 'productos', 'comentario'];

  @ViewChild("ratingPaginator", { static: false }) set contentRat(paginator: MatPaginator) {
    this.ratingDataSource.paginator = paginator;
  }

  //noResult
  noResult$: Observable<string>;
  noResultImage: string = ''

  constructor(
    public dbs: DatabaseService
  ) { }

  ngOnInit() {
    /*
    this.noResult$ = this.dbs.noDataImage$.pipe(
      tap(res=>{
        this.noResultImage = '../../../../assets/images/no_data/no_data_' + res + '.svg'
      })
    )
    //Clientes
    this.list$ = this.dbs.getCustomers().pipe(
      tap(res => {
        this.dataSource.data = res.sort((a, b) => a.displayName.localeCompare(b.displayName)).map((el, i) => {
          return {
            ...el,
            index: i + 1
          }
        })
      }),
      shareReplay(1)
    )

    this.listFilter = new FormControl("");

    this.dataSource.filterPredicate =
      (data: User, filterText: string) => {
        let filter = filterText.trim().toUpperCase();
        let val: boolean = false;
        if (data.contact) {
          val = (
            data.contact.address.toUpperCase().includes(filter) ||
            data.contact.number.toString().includes(filter))
        } else {
          val = false;
        }
        return (data.displayName.toUpperCase().includes(filter) || val)
      }

    this.listFiltered$ = combineLatest(this.list$,
      this.listFilter.valueChanges.pipe(startWith(""))).pipe(
        tap(([userList, filterValue]) => {
          this.dataSource.filter = filterValue
        })
      )

    //rating
    this.date = new FormControl({
      begin: this.getCurrentMonthOfViewDate().from,
      end: this.getCurrentMonthOfViewDate().to
    });

    this.ratingFilter = new FormControl("");

    this.rating$ = this.date.valueChanges.pipe(
      startWith(this.date.value),
      switchMap((date: { begin: Date, end: Date }) => {
        let endDate = date.end;
        endDate.setHours(23, 59, 59);
        return this.dbs.getSales(date.begin, endDate).pipe(map(sales => {
          let aux = sales.filter(sale => (sale.status == 'Entregado' && !!sale.rateData))
          this.ratingDataSource.data = aux;
          return aux;
        }))
      }),
      shareReplay(1));

    this.ratingDataSource.filterPredicate =
      (data: Sale, filterText: string) => {
        let filter = filterText.trim().toUpperCase();
        return (data.createdBy.displayName.toUpperCase().includes(filter)
          || data.rateData.observation.toUpperCase().includes(filter))
      }

    this.ratingFiltered$ = combineLatest(this.rating$,
      this.ratingFilter.valueChanges.pipe(startWith(""))).pipe(
        tap(([sales, filter]) => {
          this.ratingDataSource.filter = filter
        })
      )*/
  }

  getCurrentMonthOfViewDate(): { from: Date, to: Date } {
    const date = new Date();
    const fromMonth = date.getMonth();
    const fromYear = date.getFullYear();

    const actualFromDate = new Date(fromYear, fromMonth, 1);

    const toMonth = (fromMonth + 1) % 12;
    let toYear = fromYear;

    if (fromMonth + 1 >= 12) {
      toYear++;
    }

    const toDate = new Date(toYear, toMonth, 1);

    return { from: actualFromDate, to: toDate };
  }
}