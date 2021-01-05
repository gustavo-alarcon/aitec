import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { DeleteConfiDialogComponent } from '../../delete-confi-dialog/delete-confi-dialog.component';
import { CreateEditCategoriesComponent } from '../dialogs/create-edit-categories/create-edit-categories.component';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  panelOpenState: boolean[] = [];

  init$:Observable<any>
  constructor(
    private dialog: MatDialog,
    public dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.init$ = this.dbs.getCategories().pipe(
      tap(res => {
        this.loading.next(false)
        res.forEach(el => {
          this.panelOpenState.push(false);
        })
      })
    )
    
  }
  
  openDialog(movil: boolean,data) {
    this.dialog.open(CreateEditCategoriesComponent, {
      data: {
        edit: movil,
        data:data
      }
    })
  }

  deleteDialog(id: string) {
    this.dialog.open(DeleteConfiDialogComponent, {
      data: {
        id:id,
        title:'Categoría',
        type:'categories',
        image:false
      }
    })
  }

}
