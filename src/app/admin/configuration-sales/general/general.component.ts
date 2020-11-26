import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DatabaseService } from 'src/app/core/services/database.service';
import { AsesoresDialogComponent } from '../dialogs/asesores-dialog/asesores-dialog.component';
import { CuponDialogComponent } from '../dialogs/cupon-dialog/cupon-dialog.component';

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.scss']
})
export class GeneralComponent implements OnInit {

  constructor(
    private dialog: MatDialog,
    public dbs: DatabaseService
  ) { }

  ngOnInit(): void {
  }

  openCupon(movil: boolean,data) {
    this.dialog.open(CuponDialogComponent, {
      data: {
        edit: movil,
        data:data
      }
    })
  }

  openUser(movil: boolean,data) {
    this.dialog.open(AsesoresDialogComponent, {
      data: {
        edit: movil,
        data:data
      }
    })
  }
}
