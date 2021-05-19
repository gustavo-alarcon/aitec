import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-delete-confi-dialog',
  templateUrl: './delete-confi-dialog.component.html'
})
export class DeleteConfiDialogComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  constructor(
    private dialogref: MatDialogRef<DeleteConfiDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, type: string, id: string, image: boolean, path?: string },
    private af: AngularFirestore,
    private dbs: DatabaseService
  ) { }

  ngOnInit() {
    //console.log(this.data);

  }

  save() {
    this.loading.next(true)
    let ref;
    if (this.data.type == 'coupons') {
      ref = this.af.firestore.collection(`/db/aitec/coupons`).doc(this.data.id);
    } else {

      ref = this.af.firestore.collection(`/db/aitec/config/generalConfig/${this.data.type}`).doc(this.data.id);
    }

    const batch = this.af.firestore.batch();
    if (this.data.image) {
      this.dbs.deletePhoto(this.data.path).subscribe(res => {
        batch.delete(ref)

        batch.commit().then(() => {
          this.dialogref.close(true);
          this.loading.next(false)

        })
      })
    } else {
      batch.delete(ref)
      batch.commit().then(() => {
        this.dialogref.close(true);
        this.loading.next(false)

      })
    }

  }
}
