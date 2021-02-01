import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Warehouse } from 'src/app/core/models/warehouse.model';
import { PlacesService } from 'src/app/core/services/places.service';

@Component({
  selector: 'app-warehouse-create-edit',
  templateUrl: './warehouse-create-edit.component.html',
  styleUrls: ['./warehouse-create-edit.component.scss']
})
export class WarehouseCreateEditComponent implements OnInit {

  placeFormGroup: FormGroup;

  departmentList: Array<any>;
  providenceList: Array<any>;
  districtList: Array<any>;

  constructor(
    private places : PlacesService,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: {edit: boolean, warehouse?: Warehouse}
  ) { }

  ngOnInit(): void {
    this.initForms();

    this.departmentList = this.places.getDepartamentos();
  }

  initForms(): void {
    this.placeFormGroup = this.fb.group({
      department: [(this.data.edit ? this.data.warehouse.department : null), Validators.required],
      providence: [(this.data.edit ? this.data.warehouse.providence : null), Validators.required],
      district: [(this.data.edit ? this.data.warehouse.city : null), Validators.required],
      address: [(this.data.edit ? this.data.warehouse.address : null), Validators.required],
    })
  }

  selectProvidence(item): void {
    this.districtList = this.places.getDistritos(item.id)
  }

  selectDepartment(item): void {
    this.providenceList = this.places.getProvincias(item.id)
  }

}
