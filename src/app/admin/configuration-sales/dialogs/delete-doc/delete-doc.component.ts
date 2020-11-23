import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-delete-doc',
  templateUrl: './delete-doc.component.html',
  styleUrls: ['./delete-doc.component.scss']
})
export class DeleteDocComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  constructor(
    private dialogref: MatDialogRef<DeleteDocComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private af: AngularFirestore
  ) { }

  ngOnInit() {
  }

  save(){
    this.loading.next(true)
    let ref= this.af.firestore.collection(`/db/aitec/config/generalConfig/${this.data.type}`).doc(this.data.id);
    
    let batch = this.af.firestore.batch();

    batch.delete(ref)

    batch.commit().then(() => {
      this.dialogref.close(true);
      this.loading.next(false)
    })
  }

}
