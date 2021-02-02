import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, map, take } from 'rxjs/operators';
import { Warehouse } from 'src/app/core/models/warehouse.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';
import { PlacesService } from 'src/app/core/services/places.service';

@Component({
  selector: 'app-warehouse-create-edit',
  templateUrl: './warehouse-create-edit.component.html',
  styleUrls: ['./warehouse-create-edit.component.scss']
})
export class WarehouseCreateEditComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  placeFormGroup: FormGroup;

  departmentList: Array<any>;
  providenceList: Array<any>;
  districtList: Array<any>;

  constructor(
    public places: PlacesService,
    public fb: FormBuilder,
    public auth: AuthService,
    public dbs: DatabaseService,
    public snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { edit: boolean, warehouse?: Warehouse },
    public dialogRef: MatDialogRef<WarehouseCreateEditComponent>
  ) {
    this.departmentList = this.places.getDepartamentos();
  }

  ngOnInit(): void {


    this.initForms();

    this.setOnEdit();
  }

  initForms(): void {
    this.placeFormGroup = this.fb.group({
      department: [this.data.edit ? this.data.warehouse.department : null, Validators.required],
      providence: [this.data.edit ? this.data.warehouse.providence : null, Validators.required],
      district: [this.data.edit ? this.data.warehouse.district : null, Validators.required],
      address: [this.data.edit ? this.data.warehouse.address : null, Validators.required],
      name: [this.data.edit ? this.data.warehouse.name : null, Validators.required, customValidator.warehouseNameRepeatedValidator(this.dbs)],
    });
  }

  setOnEdit(): void {
    if (this.data.edit) {
      this.selectedDepartment(this.data.warehouse.department);
      this.selectedProvidence(this.data.warehouse.providence);
      this.placeFormGroup.updateValueAndValidity();
    }
  }

  selectedProvidence(item): void {
    this.districtList = this.places.getDistritos(item.id)
  }

  selectedDepartment(item): void {
    this.providenceList = this.places.getProvincias(item.id)
  }

  save(): void {
    if (this.placeFormGroup.valid) {
      this.loading.next(true);
      this.auth.user$
        .pipe(
          take(1)
        ).subscribe(user => {
          this.dbs.createEditWarehouse(this.data.edit, user, this.placeFormGroup.value, this.data.warehouse?.id)
            .commit()
            .then(() => {
              this.loading.next(false);
              if (this.data.edit) {
                this.snackbar.open(`${this.placeFormGroup.value['name']} , editado satisfactoriamente!`, "Aceptar", {
                  duration: 6000
                });
              } else {
                this.snackbar.open(`${this.placeFormGroup.value['name']} , creado satisfactoriamente!`, "Aceptar", {
                  duration: 6000
                });
              }

              this.dialogRef.close(true);
            })
            .catch(err => {
              this.loading.next(false);
              console.log(err);
              if (this.data.edit) {
                this.snackbar.open(`Parece que hubo un error editando el almacén`, "Aceptar", {
                  duration: 6000
                })
              } else {
                this.snackbar.open(`Parece que hubo un error creando el almacén`, "Aceptar", {
                  duration: 6000
                })
              }
            })
        })
    } else {
      this.snackbar.open("Debe completar todo el formulario para poder crear un nuevo almacén", "Aceptar", {
        duration: 6000
      })
    }
  }

}

export class customValidator {

  static warehouseNameRepeatedValidator(dbs: DatabaseService) {
    return (control: AbstractControl) => {
      const value = control.value.toLowerCase();
      return dbs.getWarehousesObservable().pipe(
        debounceTime(500),
        map(warehouses => !!warehouses.find(whs => whs.name.toLowerCase() === value) ? { warehouseNameRepeatedValidator: true } : null),
        take(1)
      )
    }
  }
}
