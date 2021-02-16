import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { tap } from 'rxjs/operators';
import { FormControl, Validators } from '@angular/forms';
import { DatabaseService } from 'src/app/core/services/database.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LandingService } from 'src/app/core/services/landing.service';

@Component({
  selector: 'app-contact-sale',
  templateUrl: './contact-sale.component.html',
  styleUrls: ['./contact-sale.component.scss']
})
export class ContactSaleComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  init$: Observable<any>;

  numberList: Array<string> = []
  emailList: Array<string> = []

  numberForm: FormControl = new FormControl('');
  emailForm: FormControl = new FormControl('');

  constructor(
    private afs: AngularFirestore,
    private snackBar: MatSnackBar,
    public dbs: DatabaseService,
    private ld:LandingService
  ) { }

  ngOnInit(): void {
    this.init$ = this.ld.getConfig().pipe(
      tap(res=>{
        this.loading.next(false)
        if(res.contactSale){
          this.numberList = res.contactSale.numbers
          this.emailList = res.contactSale.emails
        }
        
      }));
    
  }


  addNumber() {
    let number = this.numberForm.value
    if (number) {
      let index = this.numberList.indexOf(number)
      if (index >= 0) {
        this.snackBar.open('El número ya está en la lista', 'Aceptar', {
          duration: 6000,
        });
      } else {
        this.numberList.push(number)
      }
    }
    this.numberForm.setValue('')
  }

  addEmail() {
    let email = this.emailForm.value
    if (email) {
      let index = this.emailList.indexOf(email)
      if (index >= 0) {
        this.snackBar.open('El correo ya está en la lista', 'Aceptar', {
          duration: 6000,
        });
      } else {
        this.emailList.push(email)
      }
    }
    this.emailForm.setValue('')
  }

  removeNumber(i) {
    this.numberList.splice(i, 1)
  }

  removeEmail(i) {
    this.emailList.splice(i, 1)
  }

  saveContact() {
    this.loading.next(true);

    const ref = this.afs.firestore
      .collection(`/db/aitec/config`)
      .doc('generalConfig');
    const batch = this.afs.firestore.batch();

    batch.update(ref, {
      contactSale: {
        numbers: this.numberList,
        emails: this.emailList
      }
    });

    batch.commit().then(() => {
      this.loading.next(false);
      this.snackBar.open('Cambios guardados', 'Aceptar', {
        duration: 6000,
      });
    });
  }

}
