import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  socialForm: FormGroup;

  emailForm: FormControl = new FormControl(['',[Validators.required, Validators.email]]);

  latitud: number = -12.046301;
  longitud: number = -77.031027;

  center = { lat: -12.046301, lng: -77.031027 };
  zoom = 15;

  init$:Observable<any>

  constructor(
    private fb: FormBuilder,
    private afs: AngularFirestore,
    private snackBar: MatSnackBar
  ) {}

  loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      email: null,
      address: null,
      coords: this.center,
      phone: null,
    });

    this.socialForm = this.fb.group({
      facebook: null,
      instagram: null,
      twitter: null,
      whatsapp: null,
    });

    this.getData()
  }

  mapClicked(event: google.maps.MouseEvent) {
    this.center = event.latLng.toJSON();
    this.contactForm.get('coords').setValue(this.center);
  }

  getData(){
    this.init$ = this.afs.collection(`/db/aitec/config`).doc('generalConfig').get().pipe(
      map((snap) => {
      return snap.data()
    }),
    tap(res=>{
      this.loading.next(false)
      if(res.social){
        this.socialForm.setValue(res.social)
      }
      if(res.contact){
        this.contactForm.setValue(res.contact)
        this.center = res.contact.coords
      }

      if(res.emailContact){
        this.emailForm.setValue(res.emailContact)
      }
    }));
  }

  saveContact() {
    this.contactForm.disable();
    this.loading.next(true);

    const ref = this.afs.firestore
      .collection(`/db/aitec/config`)
      .doc('generalConfig');
    const batch = this.afs.firestore.batch();

    batch.update(ref, {
      contact: this.contactForm.value,
    });

    batch.commit().then(() => {
      this.contactForm.enable();
      this.loading.next(false);
      this.snackBar.open('Cambios guardados', 'Aceptar', {
        duration: 6000,
      });
    });
  }

  saveSocial() {
    this.socialForm.disable();
    this.loading.next(true);

    const ref = this.afs.firestore
      .collection(`/db/aitec/config`)
      .doc('generalConfig');
    const batch = this.afs.firestore.batch();

    batch.update(ref, {
      social: this.socialForm.value,
    });

    batch.commit().then(() => {
      this.socialForm.enable();
      this.loading.next(false);
      this.snackBar.open('Cambios guardados', 'Aceptar', {
        duration: 6000,
      });
    });
  }

  saveEmail(){
    this.emailForm.markAsPristine();
    this.emailForm.disable();
    this.loading.next(true);

    const ref = this.afs.firestore
      .collection(`/db/aitec/config`)
      .doc('generalConfig');
    const batch = this.afs.firestore.batch();

    batch.update(ref, {
      emailContact: this.emailForm.value,
    });

    batch.commit().then(() => {
      this.emailForm.enable();
      this.loading.next(false);
      this.snackBar.open('Cambios guardados', 'Aceptar', {
        duration: 6000,
      });
    });
  }
}
