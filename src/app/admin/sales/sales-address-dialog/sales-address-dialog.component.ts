import { Component, OnInit, Inject } from '@angular/core';
import { Sale } from 'src/app/core/models/sale.model';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-sales-address-dialog',
  templateUrl: './sales-address-dialog.component.html',
  styleUrls: ['./sales-address-dialog.component.scss']
})
export class SalesAddressDialogComponent implements OnInit {

  adress: FormControl;
  reference: FormControl;
  district: FormControl;

  center = { lat: -12.046301, lng: -77.031027 };
  zoom = 15;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Sale
  ) { }

  ngOnInit() {
    this.initForms();
  }

  initForms(){
    this.adress = new FormControl(this.data.location.address);
    this.reference = new FormControl(this.data.location.reference);
    this.district = new FormControl(this.data.location.distrito.name);
  }
}