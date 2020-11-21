import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/core/services/database.service';

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

  constructor(
    private fb: FormBuilder,
    private dbs: DatabaseService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA)
    public data: { edit: boolean; data?: any },
    private dialogRef: MatDialogRef<DeliveryDialogComponent>,
    private afs: AngularFirestore
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      departamento: [null],
      provincia: [null],
      distrito: [null],
      delivery: [null],
    });

    this.formGroup.get('departamento').disable();
    this.formGroup.get('provincia').disable();
    this.formGroup.get('distrito').disable();

    this.init$ = this.getDepartamentos().pipe(
      tap((res) => {
        this.departamentos = res;
        this.formGroup.get('departamento').enable();
      })
    );
    this.filteredDepartamento$ = this.init$.pipe(
      switchMap((departamentos) => {
        if (departamentos) {
          return this.formGroup.get('departamento').valueChanges.pipe(
            startWith(''),
            map((value) => {
              if (departamentos) {
                return departamentos.filter((el) =>
                  value ? el['name'].toLowerCase().includes(value) : true
                );
              } else {
                return of([]);
              }
            })
          );
        } else {
          return of([]);
        }
      })
    );

    this.provincias$ = this.formGroup.get('departamento').valueChanges.pipe(
      startWith(''),
      switchMap((dept) => {
        if (dept) {
          if (typeof dept == 'object') {
            return this.getProvincia(dept.id);
          } else {
            return of(null);
          }
        } else {
          return of(null);
        }
      }),
      tap((res) => {
        if (res) {
          this.formGroup.get('provincia').enable();
        }
      })
    );

    this.distritos$ = this.provincias$.pipe(
      switchMap((all) => {
        if (all) {
          return this.formGroup.get('provincia').valueChanges.pipe(
            startWith(''),
            switchMap((prov) => {
              console.log(prov);

              if (prov) {
                if (typeof prov == 'object') {
                  return this.getDistritos(prov.id);
                } else {
                  return of(null);
                }
              } else {
                return of(null);
              }
            }),
            tap((res) => {
              if (res) {
                this.formGroup.get('distrito').enable();
              }
            })
          );
        } else {
          return of(null);
        }
      })
    );

    this.filteredProvincia$ = combineLatest(
      this.provincias$,
      this.formGroup.get('provincia').valueChanges.pipe(startWith(''))
    ).pipe(
      map(([provs, value]) => {
        if (provs) {
          return provs.filter((el) =>
            value ? el.name.toLowerCase().includes(value) : true
          );
        } else {
          return of([]);
        }
      })
    );

    this.filteredDistrito$ = combineLatest(
      this.distritos$,
      this.formGroup.get('distrito').valueChanges.pipe(startWith(''))
    ).pipe(
      map(([distritos, value]) => {
        if (distritos) {
          return distritos.filter((el) =>
            value ? el.name.toLowerCase().includes(value) : true
          );
        } else {
          return of([]);
        }
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

  getDepartamentos() {
    return this.afs
      .collection(`/db/aitec/config/generalConfig/departamentos`)
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getProvincia(id) {
    return this.afs
      .collection(`/db/aitec/config/generalConfig/provincias`, (ref) =>
        ref.where('department_id', '==', id)
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => el.data());
        })
      );
  }

  getDistritos(id) {
    return this.afs
      .collection(`/db/aitec/config/generalConfig/distritos`, (ref) =>
        ref.where('province_id', '==', id)
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => el.data());
        })
      );
  }
}
