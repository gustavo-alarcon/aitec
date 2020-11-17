import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit {
  formGroup: FormGroup;

  latitud: number = -12.046301;
  longitud: number = -77.031027;

  center = { lat: -12.046301, lng: -77.031027 };
  zoom = 15;
  constructor(private fb: FormBuilder, private afs: AngularFirestore) {}

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      email: [null, [Validators.required, Validators.email]],
      message: [null, [Validators.required]],
      name: [null, [Validators.required]],
      phone: [null, [Validators.required]],
    });
  }

  sendEmail() {
    this.formGroup.markAsPristine();
    this.formGroup.markAsUntouched();
    this.formGroup.disable();
    this.loading.next(true)

    let mess = this.formGroup.value['message'].split('\n').filter((el) => el);

    const emailRef = this.afs.firestore.collection(`/mail`).doc();
    const batch = this.afs.firestore.batch();

    let message = {
      to: ['mocharan@meraki-s.com'],
      from: this.formGroup.value['email'],
      template: {
        name: 'info',
        data: {
          message: mess,
          name: this.formGroup.value['name'],
          number: this.formGroup.value['phone'],
        },
      },
    };

    batch.set(emailRef, message);

    batch.commit().then(() => {
      this.formGroup.reset()
      this.formGroup.enable()
      this.loading.next(false)
    });
  }
}
