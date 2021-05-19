import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { BehaviorSubject, concat, Observable, of } from 'rxjs';
import { switchMap, take, takeLast } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-creat-edit-testimony',
  templateUrl: './creat-edit-testimony.component.html',
  styleUrls: ['./creat-edit-testimony.component.scss']
})
export class CreatEditTestimonyComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(false)
  loading$ = this.loading.asObservable()

  createForm: FormGroup
  //variables
  noImage = '../../../../assets/images/no-image.png';
  photos: {
    resizing$: {
      photoURL: Observable<boolean>
    },
    data: {
      photoURL: File
    }
  } = {
      resizing$: {
        photoURL: new BehaviorSubject<boolean>(false)
      },
      data: {
        photoURL: null
      }
    }
  constructor(
    private fb: FormBuilder,
    private dbs: DatabaseService,
    private snackBar: MatSnackBar,
    private ng2ImgMax: Ng2ImgMaxService,
    @Inject(MAT_DIALOG_DATA) public data: { edit: boolean, data?: any },
    private dialogRef: MatDialogRef<CreatEditTestimonyComponent>,
    private afs: AngularFirestore,
    private storage: AngularFireStorage
  ) { }

  ngOnInit() {
    //console.log(this.data);

    this.createForm = this.fb.group({
      photoURL: [this.data.edit ? this.data.data.photoURL : null, Validators.required],
      name: [this.data.edit ? this.data.data.name : null, Validators.required],
      message: [this.data.edit ? this.data.data.message : null, Validators.required],
      rating: [this.data.edit ? this.data.data.rating : null, [Validators.required, Validators.max(5)]]
    })


  }


  addNewPhoto(formControlName: string, image: File[]) {
    this.createForm.get(formControlName).setValue(null);
    if (image.length === 0)
      return;
    let reader = new FileReader();
    this.photos.resizing$[formControlName].next(true);

    this.ng2ImgMax.resizeImage(image[0], 10000, 426)
      .pipe(
        take(1)
      ).subscribe(result => {
        this.photos.data[formControlName] = new File([result], formControlName + result.name.match(/\..*$/));
        reader.readAsDataURL(image[0]);
        reader.onload = (_event) => {
          this.createForm.get(formControlName).setValue(reader.result);
          this.photos.resizing$[formControlName].next(false);
        }
      },
        error => {
          this.photos.resizing$[formControlName].next(false);
          this.snackBar.open('Por favor, elija una imagen en formato JPG, o PNG', 'Aceptar');
          this.createForm.get(formControlName).setValue(null);

        }
      );
  }


  uploadPhoto(id: string, file: File): Observable<string | number> {
    const path = `/user/pictures/${id}-${file.name}`;

    // Reference to storage bucket
    const ref = this.storage.ref(path);

    // The main task
    let uploadingTask = this.storage.upload(path, file);

    let snapshot$ = uploadingTask.percentageChanges()
    let url$ = of('url!').pipe(
      switchMap((res) => {
        return <Observable<string>>ref.getDownloadURL();
      }))

    let upload$ = concat(
      snapshot$,
      url$)

    return upload$;
  }

  create(data, photo?: File) {
    let dataRef = this.afs.firestore.collection(`/db/aitec/config/generalConfig/testimonies`).doc();
    let productData = data;
    let batch = this.afs.firestore.batch();

    productData.id = dataRef.id;
    productData.photoURL = null;

    this.uploadPhoto(dataRef.id, photo).pipe(
      takeLast(1),
    ).subscribe((photoUrl) => {
      productData.photoURL = <string>photoUrl
      productData.photoPath = `/user/pictures/${dataRef.id}-${photo.name}`;


      batch.set(dataRef, productData);

      batch.commit().then(() => {
        this.dialogRef.close(true);
        this.loading.next(false)
        this.snackBar.open("Banner creado", "Cerrar", {
          duration: 6000
        })
      })
    })


  }

  edit(product: any, type: string, photo?: File, photomovil?: File) {
    let productRef = this.afs.firestore.collection(`/db/aitec/config/generalConfig/testimonies`).doc(product.id);
    let productData = product;
    let batch = this.afs.firestore.batch();

    if (photo) {

      this.uploadPhoto(productRef.id, photo).pipe(
        takeLast(1),
      ).subscribe((res: string) => {
        if (type == 'photo') {
          productData.photoURL = res;
          productData.photoPath = `/user/pictures/${productRef.id}-${photo.name}`;
        } else {
          productData.photomovilURL = res;
          productData.photomovilPath = `/user/pictures/${productRef.id}-${photo.name}`;
        }
        batch.update(productRef, productData);

        batch.commit().then(() => {
          this.dialogRef.close(true);
          this.loading.next(false)
          this.snackBar.open("Cambios Guardados", "Cerrar", {
            duration: 6000
          })
        })
      })
    } else {
      batch.update(productRef, productData);

      batch.commit().then(() => {
        this.dialogRef.close(true);
        this.loading.next(false)
        this.snackBar.open("Cambios Guardados", "Cerrar", {
          duration: 6000
        })
      })
    }


  }
  onSubmitForm() {
    //(this.createForm.value);

    this.createForm.markAsPending();
    this.createForm.disable()
    this.loading.next(true)

    let newDoc;
    newDoc = {
      id: '',
      name: this.createForm.get('name').value,
      message: this.createForm.get('message').value,
      rating: this.createForm.get('rating').value,
      photoURL: '',
      photoPath: '',
      createdAt: new Date()
    }

    this.create(newDoc, this.photos.data.photoURL)
  }

  editSubmit() {
    this.createForm.markAsPending();
    this.createForm.disable()
    this.loading.next(true)

    let update: object = {}
    update['id'] = this.data.data.id
    let photo: boolean = false

    if (this.createForm.get('photoURL').value != this.data.data.photoURL) {
      update['photoURL'] = ''
      update['photoPath'] = ''
      photo = true
    }
    if (this.createForm.get('name').value != this.data.data.name) {
      update['name'] = this.createForm.get('name').value
    }

    if (this.createForm.get('message').value != this.data.data.message) {
      update['message'] = this.createForm.get('message').value
    }

    if (this.createForm.get('rating').value != this.data.data.message) {
      update['rating'] = this.createForm.get('rating').value
    }

    if (photo) {
      this.edit(update, 'photo', this.photos.data.photoURL)
    } else {
      this.edit(update, 'any')
    }
  }

  onKeydown(event) {

    let permit =
      event.keyCode === 8 ||
      event.keyCode === 46 ||
      event.keyCode === 37 ||
      event.keyCode === 39;
    return permit ? true : !isNaN(Number(event.key));
  }

}
