import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';
import { PlacesService } from 'src/app/core/services/places.service';

@Component({
  selector: 'app-delivery-dialog',
  templateUrl: './delivery-dialog.component.html',
  styleUrls: ['./delivery-dialog.component.scss'],
})
export class DeliveryDialogComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  formGroup: FormGroup;

  departamentos: Array<any> = [];
  provincias: Array<any> = [];
  distritos: Array<any> = [];

  filteredDepartamento$: Observable<any> = of([])
  filteredProvincia$: Observable<any>= of([])
  filteredDistrito$: Observable<any>= of([])

  init$: Observable<any>;
  provincias$: Observable<any>;
  distritos$: Observable<any>;

  deliveryDistritos:Array<any> = [];

  constructor(
    private fb: FormBuilder,
    private pl:PlacesService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA)
    public data: { edit: boolean; data?: any },
    private dialogRef: MatDialogRef<DeliveryDialogComponent>,
    private afs: AngularFirestore
  ) {}

  ngOnInit(): void {
    this.departamentos = this.pl.getDepartamentos()
    this.formGroup = this.fb.group({
      departamento: [this.data.edit?this.data.data.departamento:null,Validators.required],
      provincia: [this.data.edit?this.data.data.provincia:null,Validators.required],
      distrito: [null],
      delivery: [this.data.edit?this.data.data.delivery:null,[Validators.required,Validators.min(0)]],
    });
    
    if(this.data.edit){
      this.deliveryDistritos=this.data.data.distritos

    }else{
      this.formGroup.get('provincia').disable();
      this.formGroup.get('distrito').disable();
    }
    
    this.filteredDepartamento$ = this.formGroup
      .get('departamento')
      .valueChanges.pipe(
        startWith(''),
        map((value) => {
          return this.departamentos.filter((el) =>
            value ? el.name.toLowerCase().includes(value) : true
          );
        })
      );

      this.provincias$ = this.formGroup.get('departamento').valueChanges.pipe(
        startWith(''),
        map(dept=>{
          
          
          if(typeof dept === 'object'){
            this.selectProvincias(dept)
            this.formGroup.get('provincias').setValue('')
          }
          return true
        })
      )

      this.distritos$ = this.formGroup.get('provincia').valueChanges.pipe(
        startWith(''),
        map(prov=>{
          if(prov && typeof prov === 'object'){
            this.selectDistritos(prov)
            
          }
          return true
        })
      )
    this.filteredProvincia$ = this.formGroup.get('provincia').valueChanges.pipe(
      startWith(''),
      map((value) => {
        return this.provincias.filter((el) =>
          value ? el.name.toLowerCase().includes(value) : true
        );
      })
    );

    this.filteredDistrito$ = this.formGroup.get('distrito').valueChanges.pipe(
      startWith(''),
      map((value) => {
        return this.distritos.filter((el) =>
          value ? el.name.toLowerCase().includes(value) : true
        );
      })
    );

    
  }

  showDepartamento(staff): string | undefined {
    return staff ? staff['name'] : undefined;
  }
  showProvincia(staff): string | undefined {
    return staff ? staff['name'] : undefined;
  }
  showDistrito(staff): string | undefined {
    return staff ? staff['name'] : undefined;
  }

  selectProvincias(option) {
    this.provincias = this.pl.getProvincias(option.id);
    this.formGroup.get('provincia').enable();
    
  }

  selectDistritos(option) {
    this.distritos = this.pl.getDistritos(option.id);
    this.formGroup.get('distrito').enable();
    
  }

  selectDelivery(option) {
    if(option=='all'){
      this.deliveryDistritos = this.distritos
    }else{
      if (!this.deliveryDistritos.find(el=>el.id==option.id)) {
        this.deliveryDistritos.push(option)
      }
    }

    this.formGroup.get('distrito').setValue('')
    
  }

  onSubmitForm(){
    this.formGroup.markAsPending();
    this.formGroup.disable()
    this.loading.next(true)
    let newDelivery={
      id:this.data.edit?this.data.data.id:'',
      departamento:this.formGroup.get('departamento').value,
      provincia:this.formGroup.get('provincia').value,
      distritos:this.deliveryDistritos,
      delivery:this.formGroup.get('delivery').value,
      createdAt: this.data.edit?this.data.data.createdAt:new Date()
    }
    console.log(newDelivery);
    if(this.data.edit){
      this.edit(newDelivery)
    }else{
      this.create(newDelivery)
    }

  }
  
  create(newCategory) {
    let productRef = this.afs.firestore
      .collection(`/db/aitec/config/generalConfig/delivery`)
      .doc();

    let batch = this.afs.firestore.batch();

    newCategory.id = productRef.id;

    batch.set(productRef, newCategory);

    batch.commit().then(() => {
      this.dialogRef.close(true);
      this.loading.next(false);
      this.snackBar.open('Delivery creado', 'Cerrar', {
        duration: 6000,
      });
    });
  }

  edit(newCategory) {
    let productRef = this.afs.firestore
      .collection(`/db/aitec/config/generalConfig/delivery`)
      .doc();

    let batch = this.afs.firestore.batch();

    batch.update(productRef, newCategory);

    batch.commit().then(() => {
      this.dialogRef.close(true);
      this.loading.next(false);
      this.snackBar.open('Delivery creado', 'Cerrar', {
        duration: 6000,
      });
    });
  }
}
