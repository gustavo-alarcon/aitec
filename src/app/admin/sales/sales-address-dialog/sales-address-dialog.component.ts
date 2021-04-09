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

  center: { lat: number, lng: number };
  zoom = 15;
  department: FormControl;
  province: FormControl;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Sale
  ) { }

  ngOnInit() {
    this.initForms();
  }

  initForms(){
    this.center = this.data.location.coord
    this.adress = new FormControl(this.data.location.address);
    this.reference = new FormControl(this.data.location.reference);
    this.department = new FormControl(this.data.location.departamento.name);
    this.province = new FormControl(this.data.location.provincia.name);
    this.district = new FormControl(this.data.location.distrito.name);
  }
}