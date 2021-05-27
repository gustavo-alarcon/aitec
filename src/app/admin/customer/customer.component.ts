import { tap, startWith, switchMap, shareReplay, map } from 'rxjs/operators';
import { User } from 'src/app/core/models/user.model';
import { Observable, combineLatest } from 'rxjs';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Sale, saleStatusOptions } from 'src/app/core/models/sale.model';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { DatabaseService } from 'src/app/core/services/database.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',  
  styleUrls: ['./customer.component.scss']
})
export class CustomerComponent implements OnInit {

  dataSource = new MatTableDataSource();
  displayedColumns: string[] = ['index', 'name', 'phone', 'customerType', 'deliveryUser', 'adminUser', 'type', 'document', 'address', 'contactPerson', 'actions'];

  @ViewChild("paginatorList", { static: false }) set content(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }

  list$: Observable<User[]>;
  listFiltered$: Observable<User[]>;
  listFilter: FormControl;

  statusList = new saleStatusOptions()

  //rating
  rating$: Observable<Sale[]>;
  ratingFiltered$: Observable<Sale[]>;
  date: FormGroup;
  ratingFilter: FormControl;
  ratingDataSource = new MatTableDataSource<Sale>();
  ratingDisplayedColumns: string[] = ['index', 'cliente', 'servicio', 'productos', 'delivery', 'comentario'];

  @ViewChild("ratingPaginator", { static: false }) set contentRat(paginator: MatPaginator) {
    this.ratingDataSource.paginator = paginator;
  }

  constructor(
    public dbs: DatabaseService,
    private fb: FormBuilder,
    private snackbar: MatSnackBar
  ) { }

  ngOnInit() {

    //Clientes
    this.list$ = this.dbs.getUserListValueChanges().pipe(
      tap(res => {
        this.dataSource.data = res.sort((a, b) => a.personData.name.localeCompare(b.personData.name))
        // used to update mayorist user this.dbs.updateUser(res).commit().then(res => {console.log("Yes!")})
      }),
      shareReplay(1)
    )

    this.listFilter = new FormControl("");

    this.dataSource.filterPredicate =
      (user: User, filterText: string) => {
        let filter = filterText.trim().toUpperCase();

        let dataString = user.personData.name + 
        (user.personData["lastName"] ? user.personData["lastName"] :"") + 
        String(user.personData.phone) + 
        (user.personData.type == "natural" ? user.personData.dni : user.personData.ruc)+
        (user.deliveryUser ? "Repartidor" : "") + (user.mayoristUser ? "Mayorista":"Minorista")+
        user.personData.type + (user.role == "admin" ? "Administrador" : "")
        return (dataString.toUpperCase().includes(filter))
      }

    this.listFiltered$ = combineLatest([this.list$,
      this.listFilter.valueChanges.pipe(startWith(""))]).pipe(
        tap(([userList, filterValue]) => {
          this.dataSource.filter = filterValue
        })
      )

    //rating
    this.date = this.fb.group({
      begin: [this.getCurrentMonthOfViewDate().from],
      end: [this.getCurrentMonthOfViewDate().to]
    })
    
    this.ratingFilter = new FormControl("");

    this.rating$ = this.date.valueChanges.pipe(
      startWith(this.date.value),
      switchMap((date: { begin: Date, end: Date }) => {
        let endDate = date.end;
        endDate.setHours(23, 59, 59);
        return this.dbs.getSalesRanking({begin: date.begin, end: endDate}).pipe(map(sales => {
          this.ratingDataSource.data = sales;
          return sales;
        }))
      }),
      shareReplay(1));

    this.ratingDataSource.filterPredicate =
      (data: Sale, filterText: string) => {
        let filter = filterText.trim().toUpperCase();
        let dataString = data.user.personData.name + 
          (data.user.personData["lastName"] ? data.user.personData["lastName"] :"")

        return (dataString.toUpperCase().includes(filter))
      }

    this.ratingFiltered$ = combineLatest(this.rating$,
      this.ratingFilter.valueChanges.pipe(startWith(""))).pipe(
        tap(([sales, filter]) => {
          this.ratingDataSource.filter = filter
        })
      )
  }

  onMayoristUser(user: User){
    let action = !user.mayoristUser
    this.dbs.editUserType(user.uid, "mayoristUser", action).commit().then(
      res => {
        this.snackbar.open("Edición Satisfactoria!", "Aceptar")
      },
      err => {
        console.log(err)
        this.snackbar.open("Ocurrió un error. Vuelva a intentarlo", "Aceptar")
      }
    )
  }
  onDeliveryUser(user: User){
    let action = !user.deliveryUser
    this.dbs.editUserType(user.uid, "deliveryUser", action).commit().then(
      res => {
        this.snackbar.open("Edición Satisfactoria!", "Aceptar")
      },
      err => {
        console.log(err)
        this.snackbar.open("Ocurrió un error. Vuelva a intentarlo", "Aceptar")
      }
    )
  }
  onAdminUser(user: User){
    let action = user.role == "admin"
    this.dbs.editUserType(user.uid, "role", action ? "" : "admin").commit().then(
      res => {
        this.snackbar.open("Edición Satisfactoria!", "Aceptar")
      },
      err => {
        console.log(err)
        this.snackbar.open("Ocurrió un error. Vuelva a intentarlo", "Aceptar")
      }
    )
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
