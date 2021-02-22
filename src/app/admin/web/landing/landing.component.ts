import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, combineLatest, concat, Observable, of } from 'rxjs';
import { map, shareReplay, startWith, switchMap, take, takeLast, tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { CreatEditTestimonyComponent } from '../creat-edit-testimony/creat-edit-testimony.component';
import { CreateEditBannerComponent } from '../create-edit-banner/create-edit-banner.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { LandingService } from 'src/app/core/services/landing.service';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { AngularFireStorage } from '@angular/fire/storage';
import { DeleteConfiDialogComponent } from '../../delete-confi-dialog/delete-confi-dialog.component';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
  category: FormControl = new FormControl('');
  category$: Observable<string[]>;
  categories: Array<any> = []
  selectCategories: Array<string> = []

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
  footer$: Observable<any>

  linkForm: FormGroup;
  selectLink: Array<any> = []

  //middle
  loadingMid = new BehaviorSubject<boolean>(false)
  loadingMid$ = this.loadingMid.asObservable()

  createForm: FormGroup
  //variables
  noImage = '../../../../assets/images/no-image.png';
  photos: {
    resizing$: {
      photoURL: Observable<boolean>
    },
    data: {
      photoURL: File
    }
  } = {
      resizing$: {
        photoURL: new BehaviorSubject<boolean>(false)
      },
      data: {
        photoURL: null
      }
    }

  defaultImage = "../../../../assets/images/logo-black.png";

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    public dbs: DatabaseService,
    private ld: LandingService,
    private afs: AngularFirestore,
    private snackBar: MatSnackBar,
    private ng2ImgMax: Ng2ImgMaxService,
    private storage: AngularFireStorage
  ) { }

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
      this.dbs.getAllCategories()
    ).pipe(
      map(([value, categories]) => {
        let fil = categories.filter(ct => !ct.idCategory).map((el) => el.completeName);
        this.categories = categories
        return fil.filter((el) =>
          value ? el.toLowerCase().includes(value.toLowerCase()) : true
        );
      })
    );

    this.linkForm = this.fb.group({
      name: [null, Validators.required],
      link: [null, Validators.required],
    });

    this.getFooter()

    this.createForm = this.fb.group({
      photoURL: [null, Validators.required],
      title: [null, Validators.required],
      descrip: [null, Validators.required]
    })
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

  deleteBDialog(banner) {
    this.dialog.open(DeleteConfiDialogComponent, {
      data: {
        id: banner.id,
        title: 'Banner',
        type: 'banners',
        image: true,
        path: banner.photoPath
      }
    })
  }

  deleteDialog(testimony) {
    this.dialog.open(DeleteConfiDialogComponent, {
      data: {
        id: testimony.id,
        title: 'Testimonio',
        type: 'testi',
        image: true,
        path: testimony.photoPath
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

  getStars(number) {
    let star = [false, false, false, false, false]
    for (let i = 0; i < number; i++) {
      star[i] = true
    }
    return star
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

  getFooter() {
    this.footer$ = this.afs.collection(`/db/aitec/config`).doc('generalConfig').get().pipe(
      map((snap) => {
        return snap.data()
      }),
      tap(res => {
        this.loadingFooter.next(false)
        if (res.footer) {
          this.selectCategories = res.footer.search
          this.selectLink = res.footer.links
        }

        if (res.middle) {
          this.createForm.setValue(res.middle)
        }

      }));
  }

  saveFooter() {
    this.loadingFooter.next(true);

    const ref = this.afs.firestore.collection(`/db/aitec/config`).doc('generalConfig');
    const batch = this.afs.firestore.batch();

    batch.update(ref, {
      footer: {
        search: this.selectCategories,
        links: this.selectLink
      },
    });

    batch.commit().then(() => {
      this.loadingFooter.next(false);
      this.snackBar.open('Cambios guardados', 'Aceptar', {
        duration: 6000,
      });
    });
  }

  addNewPhoto(formControlName: string, image: File[]) {
    this.createForm.get(formControlName).setValue(null);
    if (image.length === 0)
      return;
    let reader = new FileReader();
    this.photos.resizing$[formControlName].next(true);

    this.ng2ImgMax.resizeImage(image[0], 10000, 426)
      .pipe(
        take(1)
      ).subscribe(result => {
        this.photos.data[formControlName] = new File([result], formControlName + result.name.match(/\..*$/));
        reader.readAsDataURL(image[0]);
        reader.onload = (_event) => {
          this.createForm.get(formControlName).setValue(reader.result);
          this.photos.resizing$[formControlName].next(false);
        }
      },
        error => {
          this.photos.resizing$[formControlName].next(false);
          this.snackBar.open('Por favor, elija una imagen en formato JPG, o PNG', 'Aceptar');
          this.createForm.get(formControlName).setValue(null);

        }
      );
  }


  uploadPhoto(id: string, file: File): Observable<string | number> {
    const path = `/user/pictures/${id}-${file.name}`;

    // Reference to storage bucket
    const ref = this.storage.ref(path);

    // The main task
    let uploadingTask = this.storage.upload(path, file);

    let snapshot$ = uploadingTask.percentageChanges()
    let url$ = of('url!').pipe(
      switchMap((res) => {
        return <Observable<string>>ref.getDownloadURL();
      }))

    let upload$ = concat(
      snapshot$,
      url$)

    return upload$;
  }

  create() {
    this.loadingMid.next(true)
    const ref = this.afs.firestore.collection(`/db/aitec/config`).doc('generalConfig');
    let productData = this.createForm.value
    let batch = this.afs.firestore.batch();

    if (this.photos.data.photoURL) {
      productData.photoURL = null;
      this.uploadPhoto(ref.id, this.photos.data.photoURL).pipe(
        takeLast(1),
      ).subscribe((photoUrl) => {
        productData.photoURL = <string>photoUrl
        batch.update(ref, {
          middle: productData
        });

        batch.commit().then(() => {

          this.loadingMid.next(false)
          this.snackBar.open("Cambios Guardados", "Cerrar", {
            duration: 6000
          })
        })
      })
    } else {
      batch.update(ref, {
        middle: productData
      });

      batch.commit().then(() => {

        this.loadingMid.next(false)
        this.snackBar.open("Cambios Guardados", "Cerrar", {
          duration: 6000
        })
      })
    }



  }

}
