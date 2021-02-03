import { Component, OnInit } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { FormControl, FormControlName } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { BehaviorSubject, concat, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, first, switchMap, take, tap } from 'rxjs/operators';
import { GeneralConfig } from 'src/app/core/models/generalConfig.model';
import { DatabaseService } from 'src/app/core/services/database.service';


@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss']
})
export class NewsComponent implements OnInit {

  loading = new BehaviorSubject<boolean>(false)
  loading$ = this.loading.asObservable();

  resizing = new BehaviorSubject<boolean>(false)
  resizing$ = this.resizing.asObservable();

  noImage = '../../../../assets/images/no-image.png';
  photoFile: File;

  config$: Observable<GeneralConfig>;

  photoFormControl = new FormControl(null);
  visibilityFormControl = new FormControl(false);

  constructor(
    private ng2ImgMax: Ng2ImgMaxService,
    private snackbar: MatSnackBar,
    public dbs: DatabaseService,
    private storage: AngularFireStorage
  ) { }

  ngOnInit(): void {
    this.config$ = this.dbs.getGeneralConfigDoc()
      .pipe(
        tap(generalConfig => {
          if (generalConfig) {
            this.visibilityFormControl.setValue(generalConfig.news.visible);
            this.photoFormControl.setValue(generalConfig.news.imageURL);
          }
        })
      )

    this.visibilityFormControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(res => {
        if (this.photoFormControl.value) {
          

          this.dbs.updateNewsVisibility(res, this.photoFile)
            .pipe(
            )
            .subscribe(batch => {
              batch.commit()
                .then(() => {
                  this.snackbar.open('Configuración actualizada!', 'Aceptar', {
                    duration: 6000
                  });
                })
                .catch(err => {
                  console.log(err);
                  this.snackbar.open('Parace que hubo un error actualizando la configuración', 'Aceptar', {
                    duration: 6000
                  });
                })
            })

        } else {
          this.snackbar.open('Primero, debe agregar una imagen', 'Aceptar', {
            duration: 6000
          });
        }
      })
  }

  addNewPhoto(image: File[]) {
    this.photoFormControl.setValue(null);

    if (image.length === 0)
      return;

    let reader = new FileReader();
    this.resizing.next(true);

    this.ng2ImgMax.resizeImage(image[0], 1000, 426)
      .pipe(
        take(1)
      ).subscribe(result => {
        this.photoFile = new File([result], 'news' + result.name.match(/\..*$/));

        reader.readAsDataURL(image[0]);
        reader.onload = (_event) => {
          this.photoFormControl.setValue(reader.result);
          this.resizing.next(false);
        }
      },
        error => {
          this.resizing.next(false);
          this.snackbar.open('Por favor, elija una imagen en formato JPG, o PNG', 'Aceptar');
          this.photoFormControl.setValue(null);
        }
      );
  }

}
