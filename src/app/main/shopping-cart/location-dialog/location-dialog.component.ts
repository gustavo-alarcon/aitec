import { Component, OnInit, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from 'src/app/core/models/user.model';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

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

  constructor(
    private snackbar: MatSnackBar,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<LocationDialogComponent>,
    private af: AngularFirestore,
    @Inject(MAT_DIALOG_DATA) public data: { user: User, ind: number, edit: boolean, ditrito: string; departamento: string; provicia: string }
  ) { }

  ngOnInit(): void {
    if (this.data.edit) {
      this.firstFormGroup = this.fb.group({
        reference: [this.data.user.location[this.data.ind].reference, [Validators.required]],
        name: [this.data.user.location[this.data.ind].address, [Validators.required]],
      });
      this.center = this.data.user.location[this.data.ind].coord
    } else {
      this.firstFormGroup = this.fb.group({
        reference: [null, [Validators.required]],
        name: [null, [Validators.required]],
      });

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

  save() {
    this.firstFormGroup.disable()
    const userRef = this.af.firestore.collection(`/users`).doc(this.data.user.uid);
    const batch = this.af.firestore.batch()
    this.loading.next(true)
    let newLoacation = {
      address: this.firstFormGroup.get('name').value,
      reference: this.firstFormGroup.get('reference').value,
      coord: this.center,
      distrito:this.data.ditrito,
      departamento:this.data.departamento,
      provincia:this.data.provicia
    }

    let savelocations = this.data.user.location ? this.data.user.location : []
    if (this.data.edit) {
      savelocations[this.data.ind] = newLoacation
    } else {
      savelocations.push(newLoacation)
    }
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
    })
  }


}
