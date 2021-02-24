import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Category } from 'src/app/core/models/category.model';
import { DatabaseService } from 'src/app/core/services/database.service';
import { CategoryDialogComponent } from '../dialogs/category-dialog/category-dialog.component';
import { CreateCategoryGeneralComponent } from '../dialogs/create-category-general/create-category-general.component';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { BrandsCategoryComponent } from '../dialogs/brands-category/brands-category.component';
import { DeleteCategoryComponent } from '../dialogs/delete-category/delete-category.component';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class CategoriesComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  panelOpenState: boolean[] = [];
  categories: Category[] = [];
  init$: Observable<any>

  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['index', 'name', 'delete']
  expandedElement: Category | null;

  @ViewChild('categoryPaginator', { static: false }) set content(paginator1: MatPaginator) {
    this.dataSource.paginator = paginator1;
  }


  constructor(
    private dialog: MatDialog,
    public dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.init$ = this.dbs.getAllCategories().pipe(
      map((categories) => {
        this.categories = categories
        let onlyCategory = categories.filter(ct => !ct.idCategory)
        return onlyCategory.map(ct => {
          let subcategories = categories.filter(ct => !ct.idSubCategory).filter(sb => sb.idCategory == ct.id).map(sub => {
            return {
              name: sub.name,
              category: sub,
              categories: categories.filter(sbb => sbb.idSubCategory == sub.id)
            }
          })
          return {
            name: ct.name,
            category: ct,
            subcategories: subcategories,
            brands: ct.brands
          }
        })
      }),
      tap(res => {
        this.loading.next(false)
        this.dataSource.data = res.map((ct, ind) => {
          ct.id = ind + 1
          return ct
        })
      })
    )

  }

  openEditDialog(movil, data, edit) {
    this.dialog.open(CategoryDialogComponent, {
      data: {
        type: movil,
        data: data,
        edit: edit
      }
    })
  }

  openDialog(movil: boolean, data) {
    this.dialog.open(CreateCategoryGeneralComponent, {
      data: {
        edit: movil,
        data: data
      }
    })
  }

  openBrandDialog(category) {
    this.dialog.open(BrandsCategoryComponent, {
      data: category
    })
  }

  deleteDialog(type, category) {
    this.dialog.open(DeleteCategoryComponent, {
      data: {
        type: type,
        data: category
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
