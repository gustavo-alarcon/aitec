import { Component, OnInit, Inject } from '@angular/core';
import { Product } from 'src/app/core/models/product.model';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable, combineLatest } from 'rxjs';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatabaseService } from 'src/app/core/services/database.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { startWith, tap } from 'rxjs/operators';
import { Package } from 'src/app/core/models/package.model';

@Component({
  selector: 'app-product-edit-promo',
  templateUrl: './product-edit-promo.component.html',
  styleUrls: ['./product-edit-promo.component.scss']
})
export class ProductEditPromoComponent implements OnInit {
  productForm: FormGroup

  promoState$: Observable<boolean>;
  discountsCalc$: Observable<number[]>;

  constructor(
    private dialogRef: MatDialogRef<ProductEditPromoComponent>,
    private dialog: MatDialog,
    private fb: FormBuilder,
    public dbs: DatabaseService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { data: Product, pack: boolean }
  ) { }

  ngOnInit() {
    this.initForm();
    this.initObservables();
  }

  initForm() {
    this.productForm = this.fb.group({
      promo: [this.data.data.promo, Validators.required],
      quantity: [this.data.data.promo ? this.data.data.promoData.quantity : 0, Validators.required],
      promoPrice: [this.data.data.promo ? this.data.data.promoData.promoPrice : 0, Validators.required],
      type: [this.data.data.promo ? this.data.data.promoData.type ? this.data.data.promoData.type : 1 : 1, Validators.required],
      percentageDisccount: [0, Validators.required],
      moneyDisccount: [0, Validators.required],
    })
  }

  initObservables() {
    this.promoState$ = this.productForm.get('promo').valueChanges.pipe(
      startWith(this.data.data.promo ? this.data.data.promo : null),
      tap((res: boolean) => {
        if (res) {
          this.productForm.get('quantity').enable()
          this.productForm.get('percentageDisccount').enable()
          this.productForm.get('moneyDisccount').enable()
          this.productForm.get('promoPrice').enable()
        }
        else {
          this.productForm.get('quantity').disable()
          this.productForm.get('percentageDisccount').disable()
          this.productForm.get('moneyDisccount').disable()
          this.productForm.get('promoPrice').disable()
        }
      }),
    )

    this.discountsCalc$ = combineLatest(
      this.productForm.get('type').valueChanges.pipe(
        startWith(this.data.data.promoData ? this.data.data.promoData.type ? this.data.data.promoData.type : 1 : 1)),
      this.productForm.get('promoPrice').valueChanges.pipe(
        startWith(this.data.data.promoData ? this.data.data.promoData.promoPrice : null)),
      this.productForm.get('quantity').valueChanges.pipe(
        startWith(this.data.data.promoData ? this.data.data.promoData.quantity : null))
    ).pipe(
      tap(([type, promoPrice, quantity]: [number, number, number]) => {
        if (promoPrice && quantity) {
          let moneyDisccount: number = 0
          let percentageDisccount: number = 0
          let price = type == 1 ? this.data.data.priceMin : this.data.data.priceMay
          moneyDisccount = (price * quantity - promoPrice);
          percentageDisccount = (moneyDisccount / (price * quantity)) * 100.0;

          this.productForm.get('percentageDisccount').setValue(percentageDisccount.toFixed(2));
          this.productForm.get('moneyDisccount').setValue("S/. " + moneyDisccount.toFixed(2));
        }
        else {
          this.productForm.get('percentageDisccount').setValue(0);
          this.productForm.get('moneyDisccount').setValue(0);
        }
      })
    )
  }

  onSubmitForm() {
    this.productForm.markAsPending();
    let promoData = this.productForm.get('promo').value ? {
      promoPrice: Number(this.productForm.get('promoPrice').value),
      quantity: Number(this.productForm.get('quantity').value),
      offer: Number(this.productForm.get('percentageDisccount').value),
      type: this.productForm.get('type').value
    } : {
        promoPrice: 0,
        quantity: 0,
        offer: 0,
        type: null
      };


    this.dbs.editProductPromo(this.data.data.id, this.productForm.get('promo').value, promoData)
      .commit().then(
        res => {
          this.dialogRef.close(true);
        },
        err => {
          this.dialogRef.close(false);
        })
      ;
  }
}
