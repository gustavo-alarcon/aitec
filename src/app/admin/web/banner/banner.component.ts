import { Component, OnInit } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { CreateEditBannerComponent } from '../create-edit-banner/create-edit-banner.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { LandingService } from 'src/app/core/services/landing.service';
@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss']
})
export class BannerComponent implements OnInit {

  loading = new BehaviorSubject<number>(1)
  loading$ = this.loading.asObservable()

  slideConfig = {"slidesToShow": 1, "slidesToScroll": 1,"autoplay": true,
  "autoplaySpeed":5000,"lazyLoad": 'ondemand',};
  slides = [];
  

  carousel$: Observable<any>

  carousel: Array<any>

  indCarousel: number = 1

  defaultImage = "../../../assets/images/default-image.png";

  constructor(
    private dialog: MatDialog,
    private dbs: DatabaseService,
    private ld:LandingService,
    private afs: AngularFirestore,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    
    this.carousel$ =  this.ld.getBanners('carousel').pipe(
      tap(res => {
        this.carousel = [...res]
        this.indCarousel = res.length + 1

      })
    )


  }

  drop(array, event: CdkDragDrop<string[]>) {
    moveItemInArray(array, event.previousIndex, event.currentIndex);
  }

  savePosition(array, number) {
    this.loading.next(number)
    let batch = this.afs.firestore.batch();

    array.forEach((el, i) => {
      const ref: DocumentReference = this.afs.firestore.collection(this.ld.bannerRef).doc(el['id']);
      batch.update(ref, {
        position: i
      })
    })

    batch.commit().then(() => {
      this.loading.next(1)
      this.snackBar.open("Cambios Guardados", "Cerrar", {
        duration: 6000
      })
      console.log('done');

    })
  }

  openDialog(movil: boolean) {
    
    this.dialog.open(CreateEditBannerComponent, {
      data: {
        edit: movil,
        index: this.indCarousel,
        type:'carousel'
      }
    })
  }

  editDialog(type: string, movil: boolean, item) {
    this.dialog.open(CreateEditBannerComponent, {
      data: {
        type: type,
        edit: movil,
        data: item
      }
    })
  }

  deleteDialog(id: string) {
    this.dialog.open(DeleteDialogComponent, {
      data: {
        id:id,
        title:'Banner',
        type:'banner'
      }
    })
  }
}