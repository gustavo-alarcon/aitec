import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { DeleteConfiDialogComponent } from '../../delete-confi-dialog/delete-confi-dialog.component';
import { BrandComponent } from '../dialogs/brand/brand.component';

@Component({
  selector: 'app-brands-view',
  templateUrl: './brands-view.component.html',
  styleUrls: ['./brands-view.component.scss'],
})
export class BrandsViewComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  init$: Observable<any>;

  defaultImage = "../../../../assets/images/icono-aitec-01.png";

  constructor(private dialog: MatDialog, private dbs: DatabaseService) { }

  ngOnInit(): void {
    this.init$ = this.dbs.getBrands().pipe(
      tap(()=>{
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
}
