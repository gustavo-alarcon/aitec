import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { DeleteConfiDialogComponent } from '../../delete-confi-dialog/delete-confi-dialog.component';
import { BrandComponent } from '../dialogs/brand/brand.component';

@Component({
  selector: 'app-brands-view',
  templateUrl: './brands-view.component.html',
})
export class BrandsViewComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  init$: Observable<any>;

  defaultImage = "../../../../assets/images/icono-aitec-01.png";

  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['index', 'photo', 'name', 'actions']
  @ViewChild('brandPaginator', { static: false }) set content(paginator1: MatPaginator) {
    this.dataSource.paginator = paginator1;
  }

  constructor(
    private dialog: MatDialog,
    public dbs: DatabaseService) { }

  ngOnInit(): void {
    this.init$ = this.dbs.getBrands().pipe(
      tap(res => {
        this.dataSource.data = res
        this.loading.next(false)
      })
    )

  }

  openDialog(movil: boolean, data) {
    this.dialog.open(BrandComponent, {
      data: {
        edit: movil,
        data: data
      },
    });
  }

  deleteDialog(brand) {
    this.dialog.open(DeleteConfiDialogComponent, {
      data: {
        id: brand.id,
        title: 'Marca',
        type: 'brands',
        image: true,
        path: brand.photoPath
      }
    })
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
