import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Ng2ImgMaxService } from 'ng2-img-max';
import { BehaviorSubject, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';


@Component({
  selector: 'app-payment-method',
  templateUrl: './payment-method.component.html',
  styleUrls: ['./payment-method.component.scss']
})
export class PaymentMethodComponent implements OnInit {
  cardForm: FormGroup;
  documentForm: FormGroup;

  document: number = 1;
  method: {
    name: string;
    value: number;
    account?: string;
  } = {name:'',value:0}

  payments: Array<any> = [
    { name: 'Efectivo', value: 1 },
    { name: 'Tarjetas credito/debito', value: 2 },
    { name: 'Trasferencias', value: 3, account: 'BCP: 215-020-221122456' },
    { name: 'Yape', value: 4, account: 'Número: 987784562' },
  ];

  months:Array<number>=[1,2,3,4,5,6,7,8,9,10,11,12]
  years:Array<number>=[2020,2021,2022,2023,2024,2025,2026,2027,2028]

  photosList: Array<any> = [];
  photos: {
    resizing$: {
      photoURL: Observable<boolean>;
    };
    data: File[];
  } = {
    resizing$: {
      photoURL: new BehaviorSubject<boolean>(false),
    },
    data: [],
  };

  constructor(private fb: FormBuilder, private ng2ImgMax: Ng2ImgMaxService,private dbs: DatabaseService) {}

  ngOnInit(): void {
    this.cardForm = this.fb.group({
      type:[null],
      numero: [null],
      month: [null],
      year: [null],
      cvv: [null],
      titular: [null],
    });
    this.documentForm = this.fb.group({
      document: [null],
      name: [null],
      address: [null],
    });
    
  }

  chooseType(type){
    this.cardForm.get('type').setValue(type)
  }

  addNewPhoto(formControlName: string, image: File[]) {
    if (image.length === 0) return;
    let reader = new FileReader();
    this.photos.resizing$[formControlName].next(true);

    this.ng2ImgMax
      .resizeImage(image[0], 10000, 426)
      .pipe(take(1))
      .subscribe(
        (result) => {
          this.photos.data.push(
            new File(
              [result],
              formControlName +
                this.photosList.length +
                result.name.match(/\..*$/)
            )
          );
          reader.readAsDataURL(image[0]);
          reader.onload = (_event) => {
            this.photosList.push({
              img: reader.result,
              show: false,
            });
            this.photos.resizing$[formControlName].next(false);
          };
        },
        (error) => {
          this.photos.resizing$[formControlName].next(false);
          //this.snackbar.open('Por favor, elija una imagen en formato JPG, o PNG', 'Aceptar');
        }
      );
  }

  eliminatedphoto(ind) {
    this.photosList.splice(ind, 1);
    this.photos.data.splice(ind, 1);
  }
}
