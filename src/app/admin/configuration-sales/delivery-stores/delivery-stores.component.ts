import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { map } from 'rxjs/operators';
import { DeliveryDialogComponent } from '../dialogs/delivery-dialog/delivery-dialog.component';

@Component({
  selector: 'app-delivery-stores',
  templateUrl: './delivery-stores.component.html',
  styleUrls: ['./delivery-stores.component.scss']
})
export class DeliveryStoresComponent implements OnInit {

  
  constructor(
    private afs: AngularFirestore,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    
  }
  openDialog(movil: boolean) {
    let ind = 0
    
    this.dialog.open(DeliveryDialogComponent, {
      data: {
        edit: movil,
        data:null
      }
    })
  }


}
