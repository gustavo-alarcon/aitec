import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrls: ['./delete-dialog.component.scss']
})
export class DeleteDialogComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  constructor(
    private dialogref: MatDialogRef<DeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private af: AngularFirestore,
    public dbs: DatabaseService
  ) { }

  ngOnInit() {
  }

  save(){
    this.loading.next(true)
    let ref;
    if(this.data.type=='banner'){
      ref = this.af.firestore.collection(`/db/aitec/config/generalConfig/banners`).doc(this.data.id);
    }else{
      ref = this.af.firestore.collection(`/db/aitec/config/generalConfig/testimonies`).doc(this.data.id);
    }
    
    let batch = this.af.firestore.batch();

    batch.delete(ref)

    batch.commit().then(() => {
      this.dialogref.close(true);
      this.loading.next(false)
    })
  }
}
