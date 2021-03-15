import { Component, OnInit, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from 'src/app/core/models/user.model';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { PlacesService } from 'src/app/core/services/places.service';

@Component({
  selector: 'app-location-dialog',
  templateUrl: './location-dialog.component.html',
  styleUrls: ['./location-dialog.component.scss']
})
export class LocationDialogComponent implements OnInit {

  firstFormGroup: FormGroup;
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  latitud: number = -12.046301
  longitud: number = -77.031027

  center = { lat: -12.046301, lng: -77.031027 };
  zoom = 15;
  display?: google.maps.LatLngLiteral;

  departamentos: Array<any> = [];
  provincias: Array<any> = [];
  distritos: Array<any> = [];

  constructor(
    private snackbar: MatSnackBar,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<LocationDialogComponent>,
    private af: AngularFirestore,
    private pl: PlacesService,
    @Inject(MAT_DIALOG_DATA) public data: { user: User; ind: number; edit: boolean; }
  ) { }

  ngOnInit(): void {
    this.departamentos = this.pl.getDepartamentos()
    console.log(this.data)

    if (this.data.edit) {
      this.provincias = this.pl.getProvincias(this.data.user.location[this.data.ind].departamento.id)
      this.distritos = this.pl.getDistritos(this.data.user.location[this.data.ind].provincia.id)
      this.firstFormGroup = this.fb.group({
        reference: [this.data.user.location[this.data.ind].reference, [Validators.required]],
        name: [this.data.user.location[this.data.ind].address, [Validators.required]],
        departamento: [this.data.user.location[this.data.ind].departamento.id, Validators.required],
        provincia: [this.data.user.location[this.data.ind].provincia.id, Validators.required],
        distrito: [this.data.user.location[this.data.ind].distrito.id, Validators.required]
      });
      console.log(this.firstFormGroup.value)
      this.center = this.data.user.location[this.data.ind].coord
    } else {
      this.firstFormGroup = this.fb.group({
        reference: [null, [Validators.required]],
        name: [null, [Validators.required]],
        departamento: [null, Validators.required],
        provincia: [null, Validators.required],
        distrito: [null, Validators.required]
      });
      this.firstFormGroup.get('provincia').disable();
      this.firstFormGroup.get('distrito').disable();
    }
  }

  findMe() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((posicion) => {
        this.center = { lat: posicion.coords.latitude, lng: posicion.coords.longitude };
      }, function (error) {
        alert("Tenemos un problema para encontrar tu ubicación");
      });
    }
  }

  mapClicked(event: google.maps.MouseEvent) {
    this.center = event.latLng.toJSON();
  }

  selectProvincias(option) {
    this.provincias = this.pl.getProvincias(option.id);
    this.firstFormGroup.get('provincia').setValue(null);
    this.firstFormGroup.get('provincia').enable();
    this.firstFormGroup.get('distrito').setValue(null);
    this.firstFormGroup.get('distrito').disable();
  }

  selectDistritos(option) {
    this.distritos = this.pl.getDistritos(option.id);
    this.firstFormGroup.get('distrito').enable();

  }

  save() {
    console.log(this.firstFormGroup.value)
    this.firstFormGroup.disable()
    const userRef = this.af.firestore.collection(`/users`).doc(this.data.user.uid);
    const batch = this.af.firestore.batch()
    this.loading.next(true)
    let newLoacation/*: User["location"] */= {
      address: this.firstFormGroup.get('name').value,
      reference: this.firstFormGroup.get('reference').value,
      coord: this.center,
      departamento: this.departamentos.find(dep => dep.id == this.firstFormGroup.get('departamento').value),
      provincia: this.provincias.find(prov => prov.id == this.firstFormGroup.get('provincia').value),
      distrito: this.distritos.find(dis => dis.id == this.firstFormGroup.get('distrito').value),
      idDistrito: this.firstFormGroup.get('distrito').value
    }
    console.log(newLoacation)

    let savelocations = this.data.user.location ? this.data.user.location : []
    if (this.data.edit) {
      savelocations[this.data.ind] = newLoacation
    } else {
      savelocations.push(newLoacation)
    }
/*
    batch.update(userRef, {
      location: savelocations
    })

    batch.commit().then(() => {
      this.snackbar.open("Dirección guardada", "Cerrar", {
        duration: 6000
      })
      this.dialogRef.close();
      this.loading.next(false)
      this.firstFormGroup.enable()
    })*/
  }


}
