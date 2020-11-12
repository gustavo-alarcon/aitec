import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  formGroup: FormGroup;
  
  latitud: number = -12.046301
  longitud: number = -77.031027

  center = {lat: -12.046301, lng: -77.031027};
  zoom = 15;
  constructor(
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      email: [null, [Validators.required, Validators.email]],
      message: [null, [Validators.required]],
      name: [null, [Validators.required]],
      phone: [null, [Validators.required]],
    });
  }

}
