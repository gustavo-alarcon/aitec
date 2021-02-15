import { Component, OnInit, Inject, SimpleChanges } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { PlacesService } from '../../../core/services/places.service';
import { AuthService } from '../../../core/services/auth.service';
import { DatabaseService } from '../../../core/services/database.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { startWith, map, tap } from 'rxjs/operators';
import { Product } from '../../../core/models/product.model';
import { Warehouse } from '../../../core/models/warehouse.model';

@Component({
  selector: 'app-referral-guide-dialog',
  templateUrl: './referral-guide-dialog.component.html',
  styleUrls: ['./referral-guide-dialog.component.scss']
})
export class ReferralGuideDialogComponent implements OnInit {
  
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();
  guideFormGroup: FormGroup;

  warehouse$: Observable<string[]>
  product$: Observable<Product[]>
  entryProducts$: Observable<Product[]>;

  warehouse:Warehouse;


 
  entryWarehouseControl: FormControl;
  entryProductControl: FormControl;

  selectedProduct = new BehaviorSubject<any>(null);
  selectedProduct$ = this.selectedProduct.asObservable();

  warehouseForm: FormControl = new FormControl('lujOB8TwOHuI2EuSUr9w');

  ngOnChanges(changes: SimpleChanges) {     
    this.ngOnInit();
  }
  constructor(  
              public places: PlacesService,
              public fb: FormBuilder,
              public auth: AuthService,
              public dbs: DatabaseService,
              public snackbar: MatSnackBar,
              @Inject(MAT_DIALOG_DATA) public data: { data },
              public dialogRef: MatDialogRef<ReferralGuideDialogComponent>
  ) { }

  ngOnInit(): void {
    this.guideFormGroup = this.fb.group({
      codigo: ['', Validators.required],
      dateTranslate: ['', Validators.required],
      Addressee: ['', Validators.required],
      point: ['', Validators.required],
      dni: ['', Validators.required],
      arrivalPoint: ['', Validators.required],
      oservations: ['', Validators.required],
      warehouse: ['', Validators.required],
      product: ['', Validators.required],
      acount: ['', Validators.required],
      serie: ['', Validators.required],
      startDate: ['', Validators.required],      
    })
    
    this.entryWarehouseControl = this.fb.control('');
    this.entryProductControl = this.fb.control('');

    this.warehouse$ = this.dbs.getWarehouseValueChanges1().pipe(
      tap(res => {
        console.log('res : ',res);
        return res;
      })
    )
    


    console.log('Select warehouse 1: ',this.warehouseForm.valueChanges.pipe(startWith('')))
    console.log('Select warehouse 2: ',this.warehouseForm.value)



    this.product$ = combineLatest(
      this.guideFormGroup.get('product').valueChanges.pipe(startWith('')),
      this.dbs.getProductsListByWarehouseName(this.warehouseForm.value
      ).pipe(
        map(res => res.map(el => el['description']))
      ),
      this.warehouseForm.valueChanges.pipe(startWith('')),
    ).pipe(map(([formValue, product ,ware]) => {
      console.log('product : ',product)
      console.log('formValue : ',formValue)
      console.log('warehouse : ',this.warehouseForm.value)
      console.log('warehouse change : ',ware)

      let filter = product.filter(el => formValue ? el.toLowerCase().includes(formValue.toLowerCase()) : true);
      if (!(filter.length == 1 && filter[0] === formValue) && formValue.length) {
        this.guideFormGroup.get('product').setErrors({ invalid: true });
      }
      return filter;

    }))





  }

  showEntryProduct(product: any): string | null {
    return product.product ? product.product.description : null;
  }
  selectedEntryProduct(event: any): void {
    this.selectedProduct.next(event.option.value.product);
  }
  
  save(){

  }
}
