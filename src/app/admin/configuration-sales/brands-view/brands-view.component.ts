import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { DatabaseService } from 'src/app/core/services/database.service';
import { DeleteConfiDialogComponent } from '../../delete-confi-dialog/delete-confi-dialog.component';
import { BrandComponent } from '../dialogs/brand/brand.component';

@Component({
  selector: 'app-brands-view',
  templateUrl: './brands-view.component.html',
  styleUrls: ['./brands-view.component.scss'],
})
export class BrandsViewComponent implements OnInit {
  init$: Observable<any>;

  defaultImage = "../../../../assets/images/logo-black.png";

  constructor(private dialog: MatDialog, private dbs: DatabaseService) { }

  ngOnInit(): void {
    this.init$ = this.dbs.getBrands();
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
