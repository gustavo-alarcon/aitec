import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, shareReplay, startWith, tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { CreatEditTestimonyComponent } from '../creat-edit-testimony/creat-edit-testimony.component';
import { CreateEditBannerComponent } from '../create-edit-banner/create-edit-banner.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { LandingService } from 'src/app/core/services/landing.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
  category: FormControl = new FormControl('');
  category$: Observable<string[]>;
  categories:Array<any>=[]
  selectCategories: Array<string>=[]

  dataSource = new MatTableDataSource();
  displayedColumns: string[] = [
    'index',
    'image',
    'name',
    'message',
    'rating',
    'actions',
  ];

  @ViewChild('productsPaginator', { static: false }) set content(
    paginator1: MatPaginator
  ) {
    this.dataSource.paginator = paginator1;
  }

  testimonies$: Observable<any>;

  banner$: Observable<any>;
  banner: Array<any>;
  indBanner: number = 1;

  loadingPos = new BehaviorSubject<boolean>(false);
  loadingPos$ = this.loadingPos.asObservable();

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingPos.asObservable();

  loadingFooter = new BehaviorSubject<boolean>(false);
  loadingFooter$ = this.loadingFooter.asObservable();
  footer$:Observable<any>

  linkForm: FormGroup;
  selectLink: Array<any>=[]

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    public dbs: DatabaseService,
    private ld:LandingService,
    private afs: AngularFirestore,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    
    this.banner$ = this.ld.getBanners('promo').pipe(
      tap((res) => {
        this.banner = [...res];
        this.indBanner = res.length + 1;
      })
    );


    this.testimonies$ = this.ld.getTestimonies().pipe(
      tap((res) => {
        this.dataSource.data = res;
      })
    );

    this.category$ = combineLatest(
      this.category.valueChanges.pipe(   
        startWith<any>(''),
      ),
      this.dbs.getCategories()
    ).pipe(
      map(([value,categories]) => {
        let fil = categories.map((el) => el['category']);
        this.categories = categories
        return fil.filter((el) =>
          value ? el.toLowerCase().includes(value.toLowerCase()) : true
        );
      })
    );

    this.linkForm = this.fb.group({
      name: [null,Validators.required],
      link: [null,Validators.required],
    });

    this.getFooter()
  }

  openDialog(movil: boolean) {
    this.dialog.open(CreateEditBannerComponent, {
      data: {
        edit: movil,
        index: this.indBanner,
        type: 'promo',
      },
    });
  }

  editDialog(type: string, movil: boolean, item) {
    this.dialog.open(CreateEditBannerComponent, {
      data: {
        type: type,
        edit: movil,
        data: item,
      },
    });
  }

  deleteBDialog(id: string) {
    this.dialog.open(DeleteDialogComponent, {
      data: {
        id:id,
        title:'Banner',
        type:'banner'
      }
    })
  }

  deleteDialog(id: string) {
    this.dialog.open(DeleteDialogComponent, {
      data: {
        id:id,
        title:'Testimonio',
        type:'testi'
      }
    })
  }

  openTestimony(edit: boolean, row) {
    this.dialog.open(CreatEditTestimonyComponent, {
      data: {
        edit: edit,
        data: row,
      },
    });
  }


  addCategory() {
    if (this.categories.find((el) => el.category == this.category.value)) {
      this.selectCategories.push(this.category.value);
      this.category.setValue('');
    } else {
      this.snackBar.open('Debe seleccionar una categoría', 'Cerrar', {
        duration: 6000,
      });
    }
  }

  removeProduct(item): void {
    let index = this.selectCategories.indexOf(item);
    this.selectCategories.splice(index, 1);
  }

  addLink() {
    this.selectLink.push(this.linkForm.value);
      this.linkForm.reset();
    
  }

  removeLink(item): void {
    let index = this.selectLink.indexOf(item);
    this.selectLink.splice(index, 1);
  }

  drop(array, event: CdkDragDrop<string[]>) {
    moveItemInArray(array, event.previousIndex, event.currentIndex);
  }

  getStars(number){

  }

  savePosition(array) {
    this.loadingPos.next(true);
    let batch = this.afs.firestore.batch();

    array.forEach((el, i) => {
      const ref = this.afs.firestore
        .collection(`/db/aitec/config/generalConfig/banners`)
        .doc(el['id']);
      batch.update(ref, {
        position: i,
      });
    });

    batch.commit().then(() => {
      this.loadingPos.next(false);
      this.snackBar.open('Cambios Guardados', 'Cerrar', {
        duration: 6000,
      });
      console.log('done');
    });
  }

  getFooter(){
    this.footer$ = this.afs.collection(`/db/aitec/config`).doc('generalConfig').get().pipe(
      map((snap) => {
      return snap.data()
    }),
    tap(res=>{
      this.loadingFooter.next(false)
      if(res.footer){
        this.selectCategories = res.footer.search
        this.selectLink = res.footer.links
      }
      
    }));
  }

  saveFooter(){
    this.loadingFooter.next(true);

    const ref = this.afs.firestore
      .collection(`/db/aitec/config`)
      .doc('generalConfig');
    const batch = this.afs.firestore.batch();

    batch.update(ref, {
      footer: {
        search: this.selectCategories,
        links:this.selectLink
      },
    });

    batch.commit().then(() => {
      this.loadingFooter.next(false);
      this.snackBar.open('Cambios guardados', 'Aceptar', {
        duration: 6000,
      });
    });
  }
}
