import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { DatabaseService } from 'src/app/core/services/database.service';
import { BrandComponent } from '../dialogs/brand/brand.component';
import { DeleteDocComponent } from '../dialogs/delete-doc/delete-doc.component';

@Component({
  selector: 'app-brands-view',
  templateUrl: './brands-view.component.html',
  styleUrls: ['./brands-view.component.scss'],
})
export class BrandsViewComponent implements OnInit {
  init$: Observable<any>;

  constructor(private dialog: MatDialog, private dbs: DatabaseService) {}

  ngOnInit(): void {
    this.init$ = this.dbs.getBrands();
  }

  openDialog(movil: boolean,data) {
    this.dialog.open(BrandComponent, {
      data: {
        edit: movil,
        data: data
      },
    });
  }

  deleteDialog(id: string) {
    this.dialog.open(DeleteDocComponent, {
      data: {
        id:id,
        title:'Marca',
        type:'brands'
      }
    })
  }
}
