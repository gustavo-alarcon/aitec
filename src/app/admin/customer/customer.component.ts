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
  styleUrls: ['./customer.component.scss']
})
export class CustomerComponent implements OnInit {
  
  //Client
  clientDataSource = new MatTableDataSource();
  ClientDisplayedColumns: string[] = [ 'index','name','email','tipo','pedidos','actions'];

  @ViewChild("paginatorClient", { static: false }) set content(paginator: MatPaginator) {
    this.clientDataSource.paginator = paginator;
  }
  clientsList$: Observable<User[]>;


  //ranking
  rankingDataSource = new MatTableDataSource<any>();
  rankingDisplayedColumns: string[] = ['index','name','products','service','delivery','comentary','order'];

  @ViewChild("rankingPaginator", { static: false }) set contentRat(paginator: MatPaginator) {
    this.rankingDataSource.paginator = paginator;
  }
  
  

 
  rankingList$: Observable<Clients[]>;

  rankingDataSources=dataRankingClient;



  listFilter: FormControl;

  //rating
  rating$: Observable<Sale[]>;
  ratingFiltered$: Observable<Sale[]>;
  date: FormControl;
  ratingFilter: FormControl;


  //noResult
  noResult$: Observable<string>;
  noResultImage: string = ''

  constructor(
    public dbs: DatabaseService
  ) { }

  ngOnInit() {
    
    /* this.noResult$ = this.dbs.noDataImage$.pipe(
      tap(res=>{
        this.noResultImage = '../../../../assets/images/no_data/no_data_' + res + '.svg'
      })
    ) */
    //Clients
    this.clientsList$ = this.dbs.getUserListValueChanges().pipe(
      tap(res => {
        this.clientDataSource.data = res;

      }),
      shareReplay(1)
    )


    //Clients
    /* this.rankingList$ = this.dbs.getUserListValueChanges().pipe(
      tap(res => {
        this.clientDataSource.data = res;

      }),
      shareReplay(1)
    ) */
   

    /*

     this.list$ = this.dbs.getUserListValueChanges().pipe(
      tap(res => {
        this.clientDataSource.data = res.sort((a, b) => a.name.localeCompare(b.name)).map((el, i) => {
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

  changeWholesaler(user:User){
    const customerType='Mayorista';
    this.dbs.editCustomerType(user,customerType);
  }
  changeRetailer(user:User){
    const customerType='Minorista';
    this.dbs.editCustomerType(user,customerType);
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

export interface Clients{
  codigo:number;
  name:string ;
  products:number ;
  service:number ;
  delivery:number ;
  comentary:string ;
  order:string ;
}

const dataRankingClient:Clients[]=[
  {codigo:1,name:'Luis Perez',products:4,service:2,delivery:5,comentary:'comentary',order:'#123'},
  {codigo:2,name:'Luis Perez',products:4,service:3,delivery:4,comentary:'comentary',order:'#123'},
  {codigo:3,name:'Luis Perez',products:2,service:1,delivery:5,comentary:'comentary',order:'#123'},
  {codigo:4,name:'Luis Perez',products:4,service:3,delivery:2,comentary:'comentary',order:'#123'},
  {codigo:5,name:'Luis Perez',products:4,service:3,delivery:5,comentary:'comentary',order:'#123'},
  {codigo:6,name:'Luis Perez',products:3,service:5,delivery:2,comentary:'comentary',order:'#123'},
  {codigo:7,name:'Luis Perez',products:4,service:3,delivery:5,comentary:'comentary',order:'#123'},
  {codigo:8,name:'Luis Perez',products:1,service:3,delivery:2,comentary:'comentary',order:'#123'},
  {codigo:9,name:'Luis Perez',products:2,service:3,delivery:4,comentary:'comentary',order:'#123'},
  {codigo:10,name:'Luis Perez',products:4,service:2,delivery:5,comentary:'comentary',order:'#123'},
];