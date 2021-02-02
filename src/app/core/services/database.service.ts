import { Sale, saleStatusOptions } from './../models/sale.model';
import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';
import { Brand, Product } from '../models/product.model';
import {
  shareReplay,
  map,
  takeLast,
  switchMap,
  take,
  mapTo,
  tap,
} from 'rxjs/operators';
import { GeneralConfig } from '../models/generalConfig.model';
import { Observable, concat, of, interval, BehaviorSubject, from, forkJoin } from 'rxjs';
import { User } from '../models/user.model';
import { AngularFireStorage } from '@angular/fire/storage';
import { Recipe } from '../models/recipe.model';
import { Unit, PackageUnit } from '../models/unit.model';
import { Buy, BuyRequestedProduct } from '../models/buy.model';
import * as firebase from 'firebase';
import { Package } from '../models/package.model';
import { AngularFireAuth } from '@angular/fire/auth';
import { Warehouse } from '../models/warehouse.model';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  public version: string = 'V0.0.2r';
  public isOpen: boolean = false;
  public isAdmin: boolean = false;

  public order: {
    product: any;
    quantity: number;
    chosenProduct: any;
    color: boolean;
    price: number;
  }[] = [];

  public orderObs = new BehaviorSubject<
    {
      product: any;
      quantity: number;
      chosenProduct: any;
      color: boolean;
      price: number;
    }[]
  >([]);
  public orderObs$ = this.orderObs.asObservable();

  public uidUser: string = ''
  public isMayUser = new BehaviorSubject<boolean>(false);
  public isMayUser$ = this.isMayUser.asObservable();

  public changeStock = new BehaviorSubject<any>([]);
  public changeStock$ = this.changeStock.asObservable();

  public sum = new BehaviorSubject<number>(0);
  public sum$ = this.sum.asObservable();

  public productView;

  public total: number = 0;
  public delivery = new BehaviorSubject<number>(0);
  public delivery$ = this.delivery.asObservable();

  // public opening = new BehaviorSubject<Array<{ opening: string, closing: string }>>([]);
  public opening$: Observable<Array<{ opening: string; closing: string }>>;

  public openConfi: boolean = true

  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private afAuth: AngularFireAuth
  ) {
    //this.opening$ = this.getOpening();
  }

  productsListRef: `db/aitec/productsList` = `db/aitec/productsList`;
  packagesListRef: `db/aitec/packagesList` = `db/aitec/packagesList`;
  recipesRef: `db/aitec/recipes` = `db/aitec/recipes`;
  buysRef: `db/aitec/buys` = `db/aitec/buys`;
  salesRef: `db/aitec/sales` = `db/aitec/sales`;
  configRef: `db/aitec/config` = `db/aitec/config`;
  userRef: `users` = `users`;

  generalConfigDoc = this.afs
    .collection(this.configRef)
    .doc<GeneralConfig>('generalConfig');

  changeOpenSide() {
    this.openConfi = !this.openConfi
  }

  getOpening(): Observable<Array<{ opening: string; closing: string }>> {
    return this.afs
      .collection(this.configRef)
      .doc('generalConfig')
      .valueChanges()
      .pipe(
        map((res) => res['opening']),
        shareReplay(1)
      );
  }
/*
  saveAll(products) {
    const batch = this.afs.firestore.batch();

    products.forEach(el => {
      let productRef = this.afs.firestore
        .collection(`db/aitec/searchProducts`)
        .doc(el.id);
      batch.set(productRef, {
        id:el.id,
        searchNumber: el.searchNumber
      });

    })

    batch.commit().then(() => {
      console.log('all');

    })
  }*/

  getCurrentMonthOfViewDate(): { from: Date; to: Date } {
    const date = new Date();
    const fromMonth = date.getMonth();
    const fromYear = date.getFullYear();

    const actualFromDate = new Date(fromYear, fromMonth, 1);

    const toMonth = (fromMonth + 1) % 12;
    let toYear = fromYear;

    if (fromMonth + 1 >= 12) {
      toYear++;
    }

    const toDate = new Date(toYear, toMonth, 1);

    return { from: actualFromDate, to: toDate };
  }

  //users

  getUsers(): Observable<User[]> {
    return this.afs
      .collection<User>(`/users`, (ref) => ref.orderBy('email', 'asc'))
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getUsersStatic(): Observable<User[]> {
    return this.afs
      .collection<User>(`/users`)
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => <User>el.data());
        })
      );
  }

  getGeneralConfigDoc(): Observable<GeneralConfig> {
    return this.generalConfigDoc.valueChanges().pipe(shareReplay(1));
  }

  getStaticConfigDoc(): Observable<GeneralConfig> {
    return this.afs
      .collection(this.configRef)
      .doc('generalConfig')
      .get()
      .pipe(
        map((snap) => {
          return <GeneralConfig>snap.data();
        })
      );
  }



  getProvidersDoc(): Observable<any> {
    return this.generalConfigDoc.get().pipe(
      map((snap) => {
        return snap.data()['providers'];
      })
    );
  }

  /*configuration */

  getCategories() {
    return this.afs
      .collection(`/db/aitec/config/generalConfig/categories`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getCategoriesDoc(): Observable<any> {
    return this.afs
      .collection<Brand>(`/db/aitec/config/generalConfig/categories`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      ).get().pipe(
        map((snap) => {
          return snap.docs.map((el) => el.data());
        })
      );
  }

  getBrands() {
    return this.afs
      .collection(`/db/aitec/config/generalConfig/brands`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getBrandsDoc(): Observable<any> {
    return this.afs
      .collection(`/db/aitec/config/generalConfig/brands`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      ).get().pipe(
        map((snap) => {
          return snap.docs.map((el) => el.data());
        })
      );
  }

  getDelivery() {
    return this.afs
      .collection(`/db/aitec/config/generalConfig/delivery`, (ref) =>
        ref.orderBy('createdAt', 'asc')
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }


  getStores() {
    return this.afs
      .collection(`/db/aitec/config/generalConfig/stores`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getCoupons() {
    return this.afs
      .collection(`/db/aitec/coupons`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getCouponsDoc(): Observable<any> {
    return this.afs
      .collection(`/db/aitec/coupons`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      ).get().pipe(
        map((snap) => {
          return snap.docs.map((el) => el.data());
        })
      );
  }

  getAdvisers() {
    return this.afs
      .collection(`/db/aitec/config/generalConfig/adviser`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getAdvisersDoc(): Observable<any> {
    return this.afs
      .collection(`/db/aitec/config/generalConfig/adviser`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      ).get().pipe(
        map((snap) => {
          return snap.docs.map((el) => el.data());
        })
      );
  }

  getPaymentsChanges() {
    return this.afs
      .collection(`/db/aitec/config/generalConfig/payments`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getPaymentsDoc(): Observable<any> {
    return this.afs
      .collection(`/db/aitec/config/generalConfig/payments`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      ).get().pipe(
        map((snap) => {
          return snap.docs.map((el) => el.data());
        })
      );
  }

  ////////////////////////////////////////////////////////////////////////////////
  //Products list/////////////////////////////////////////////////////////////////
  getProductsList(): Observable<Product[]> {
    return this.afs
      .collection<Product>(this.productsListRef, (ref) =>
        ref.orderBy('priority', 'desc')
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => <Product>el.data());
        })
      );
  }

  getLastProducts(): Observable<Product[]> {
    return this.afs
      .collection<Product>(this.productsListRef, (ref) =>
        ref.orderBy('createdAt', 'desc')
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => <Product>el.data());
        })
      );
  }

  getSearchsProducts(): Observable<Product[]> {
    return this.afs
      .collection<Product>(`db/aitec/searchProducts`, (ref) =>
        ref.orderBy('searchNumber', 'desc')
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => <Product>el.data());
        })
      );
  }

  getProductsListValueChanges(): Observable<Product[]> {
    return this.afs
      .collection<Product>(this.productsListRef, (ref) =>
        ref.orderBy('priority', 'desc')
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getProductsListByCategory(category: string): Observable<Product[]> {
    return this.afs
      .collection<Product>(this.productsListRef, (ref) =>
        ref.where('category', '==', category)
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => <Product>el.data());
        })
      );
  }

  getWarehouseListValueChanges(): Observable<Product[]> {
    return this.afs
      .collection<Product>(`/db/aitec/warehouse/`, (ref) =>
        ref.orderBy('warehouse', 'desc')
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getWarehouseList(): Observable<Warehouse[]> {
    return this.afs
      .collection<Warehouse>(`/db/aitec/warehouses/`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getWarehousesObservable(): Observable<Warehouse[]> {
    return this.afs
      .collection<Warehouse>(`/db/aitec/warehouses/`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      )
      .valueChanges();
  }

  getWarehouseSeriesValueChanges(id): Observable<Product[]> {
    return this.afs
      .collection<Product>(`/db/aitec/warehouse/${id}/series`)
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getWarehouseByProduct(id) {
    return this.afs
      .collection<Product>(`/db/aitec/warehouse/`, (ref) =>
        ref.where('idProduct', '==', id)
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getSeriesByProduct(id) {
    return this.afs
      .collectionGroup('series', (ref) => ref.where('idProduct', '==', id))
      .valueChanges();
  }


  getProductsListCategoriesValueChanges(): Observable<any[]> {
    return this.getGeneralConfigDoc().pipe(
      map((res) => {
        if (res) {
          if (res.hasOwnProperty('categories')) {
            return res.categories;
          } else {
            return [];
          }
        } else {
          return [];
        }
      })
    );
  }

  getProductsListUnitsValueChanges(): Observable<Unit[]> {
    return this.getGeneralConfigDoc().pipe(
      map((res) => {
        if (res) {
          if (res.hasOwnProperty('units')) {
            return res.units;
          } else {
            return [];
          }
        } else {
          return [];
        }
      }),
      shareReplay(1)
    );
  }


  /*
    createEditProduct(
      edit: boolean,
      product: Product,
      oldProduct?: Product,
      photo?: File
    ): Observable<firebase.default.firestore.WriteBatch> {
      let productRef: DocumentReference;
      let productData: Product;
      let batch = this.afs.firestore.batch();
  
      //Editting
      if (edit) {
        productRef = this.afs.firestore
          .collection(this.productsListRef)
          .doc(oldProduct.id);
        productData = product;
        productData.id = productRef.id;
        productData.photoURL = oldProduct.photoURL;
        productData.promo = oldProduct.promo;
      }
      //creating
      else {
        productRef = this.afs.firestore.collection(this.productsListRef).doc();
        productData = product;
        productData.id = productRef.id;
        productData.photoURL = null;
      }
  
      //With or without photo
      if (photo) {
        if (edit) {
          return concat(
            this.deletePhotoProduct(oldProduct.photoPath).pipe(takeLast(1)),
            this.uploadPhotoProduct(productRef.id, photo).pipe(takeLast(1))
          ).pipe(
            takeLast(1),
            map((res: string) => {
              productData.photoURL = res;
              productData.photoPath = `/productsList/pictures/${productRef.id}-${photo.name}`;
              batch.set(productRef, productData, { merge: true });
              return batch;
            })
          );
        } else {
          return this.uploadPhotoProduct(productRef.id, photo).pipe(
            takeLast(1),
            map((res: string) => {
              productData.photoURL = res;
              productData.photoPath = `/productsList/pictures/${productRef.id}-${photo.name}`;
              batch.set(productRef, productData, { merge: true });
              return batch;
            })
          );
        }
      } else {
        batch.set(productRef, productData, { merge: true });
        return of(batch);
      }
    }*/


  publishProduct(
    published: boolean,
    product: Product,
    user: User
  ): firebase.default.firestore.WriteBatch {
    let productRef: DocumentReference = this.afs.firestore
      .collection(this.productsListRef)
      .doc(product.id);
    let batch = this.afs.firestore.batch();
    batch.update(productRef, { published: published });
    return batch;
  }

  increasePriority(
    product: Product | Package
  ): firebase.default.firestore.WriteBatch {
    // works with both products and packages
    let productRef: DocumentReference = product.package
      ? this.afs.firestore.collection(this.packagesListRef).doc(product.id)
      : this.afs.firestore.collection(this.productsListRef).doc(product.id);
    let batch = this.afs.firestore.batch();
    batch.update(productRef, { priority: product.priority });
    return batch;
  }

  decreasePriority(
    product: Product | Package
  ): firebase.default.firestore.WriteBatch {
    // works with both products and packages
    let productRef: DocumentReference = product.package
      ? this.afs.firestore.collection(this.packagesListRef).doc(product.id)
      : this.afs.firestore.collection(this.productsListRef).doc(product.id);
    let batch = this.afs.firestore.batch();
    batch.update(productRef, { priority: product.priority });
    return batch;
  }


  deletePhoto(path: string): Observable<any> {
    let st = this.storage.ref(path);
    return st.delete().pipe(takeLast(1));
  }

  editProductPromo(
    productId: string,
    promo: boolean,
    promoData: Product['promoData']
  ): firebase.default.firestore.WriteBatch {
    let productRef: DocumentReference;
    let batch = this.afs.firestore.batch();

    //Editting
    productRef = this.afs.firestore
      .collection(this.productsListRef)
      .doc(productId);
    batch.update(productRef, {
      promo,
      promoData: {
        promoPrice: promoData.promoPrice,
        quantity: promoData.quantity,
        offer: promoData.offer,
        type: promoData.type
      },
    });
    return batch;
  }
  ////////////////////////////////////////////////////////////////////////////////
  //Packages list/////////////////////////////////////////////////////////////////
  getPackagesList(): Observable<Package[]> {
    return this.afs
      .collection<Package>(this.packagesListRef, (ref) =>
        ref.orderBy('priority', 'desc')
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => <Package>el.data());
        })
      );
  }

  getPackagesListValueChanges(): Observable<Package[]> {
    return this.afs
      .collection<Package>(this.packagesListRef, (ref) =>
        ref.orderBy('priority', 'desc')
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getPackagesListUnitsValueChanges(): Observable<PackageUnit[]> {
    return this.getGeneralConfigDoc().pipe(
      map((res) => {
        if (res) {
          if (res.hasOwnProperty('packagesUnits')) {
            return res.packagesUnits;
          } else {
            return [];
          }
        } else {
          return [];
        }
      }),
      shareReplay(1)
    );
  }

  createEditPackage(
    edit: boolean,
    pack: Package,
    oldPackage?: Package,
    photo?: File
  ): Observable<firebase.default.firestore.WriteBatch> {
    let packageRef: DocumentReference;
    let packageData: Package;
    let batch = this.afs.firestore.batch();

    //Editting
    if (edit) {
      packageRef = this.afs.firestore
        .collection(this.packagesListRef)
        .doc(oldPackage.id);
      packageData = pack;
      packageData.id = packageRef.id;
      packageData.photoURL = oldPackage.photoURL;
      packageData.promo = oldPackage.promo;
    }
    //creating
    else {
      packageRef = this.afs.firestore.collection(this.packagesListRef).doc();
      packageData = pack;
      packageData.id = packageRef.id;
      packageData.photoURL = null;
    }

    //With or without photo
    if (photo) {
      if (edit) {
        return concat(
          this.deletePhotoPackage(oldPackage.photoPath).pipe(takeLast(1)),
          this.uploadPhotoPackage(packageRef.id, photo).pipe(takeLast(1))
        ).pipe(
          takeLast(1),
          map((res: string) => {
            packageData.photoURL = res;
            packageData.photoPath = `/packagesList/pictures/${packageRef.id}-${photo.name}`;
            batch.set(packageRef, packageData, { merge: true });
            return batch;
          })
        );
      } else {
        return this.uploadPhotoPackage(packageRef.id, photo).pipe(
          takeLast(1),
          map((res: string) => {
            packageData.photoURL = res;
            packageData.photoPath = `/packagesList/pictures/${packageRef.id}-${photo.name}`;
            batch.set(packageRef, packageData, { merge: true });
            return batch;
          })
        );
      }
    } else {
      batch.set(packageRef, packageData, { merge: true });
      return of(batch);
    }
  }

  publishPackage(
    published: boolean,
    pack: Package,
    user: User
  ): firebase.default.firestore.WriteBatch {
    let packageRef: DocumentReference = this.afs.firestore
      .collection(this.packagesListRef)
      .doc(pack.id);
    let batch = this.afs.firestore.batch();
    batch.update(packageRef, { published: published });
    return batch;
  }

  deletePackage(
    pack: Package
  ): Observable<firebase.default.firestore.WriteBatch> {
    let packageRef: DocumentReference = this.afs.firestore
      .collection(this.packagesListRef)
      .doc(pack.id);
    let batch = this.afs.firestore.batch();
    batch.delete(packageRef);
    return this.deletePhotoPackage(pack.photoPath).pipe(
      takeLast(1),
      mapTo(batch)
    );
  }

  uploadPhotoPackage(id: string, file: File): Observable<string | number> {
    const path = `/packagesList/pictures/${id}-${file.name}`;

    // Reference to storage bucket
    const ref = this.storage.ref(path);

    // The main task
    let uploadingTask = this.storage.upload(path, file);

    let snapshot$ = uploadingTask.percentageChanges();
    let url$ = of('url!').pipe(
      switchMap((res) => {
        return <Observable<string>>ref.getDownloadURL();
      })
    );

    let upload$ = concat(snapshot$, interval(1000).pipe(take(2)), url$);
    return upload$;
  }

  deletePhotoPackage(path: string): Observable<any> {
    let st = this.storage.ref(path);
    return st.delete().pipe(takeLast(1));
  }

  ////////////////////////////////////////////////////////////////////////////////
  //Products//////////////////////////////////////////////////////////////////////
  createEditRecipe(
    recipe: Recipe,
    edit: boolean
  ): firebase.default.firestore.WriteBatch {
    let recipeRef: DocumentReference;
    let recipeData: Recipe = recipe;
    let batch = this.afs.firestore.batch();
    if (edit) {
      recipeRef = this.afs.firestore.collection(this.recipesRef).doc(recipe.id);
    } else {
      recipeRef = this.afs.firestore.collection(this.recipesRef).doc();
      recipeData.id = recipeRef.id;
    }
    batch.set(recipeRef, recipeData);
    return batch;
  }

  getRecipes(): Observable<Recipe[]> {
    return this.afs
      .collection<Recipe>(this.recipesRef, (ref) => ref.orderBy('name', 'asc'))
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => <Recipe>el.data());
        })
      );
  }

  /*sales*/

  uploadPhotoVoucher(id: string, file: File): Observable<string | number> {
    const path = `/sales/vouchers/${id}-${file.name}`;

    // Reference to storage bucket
    const ref = this.storage.ref(path);

    // The main task
    let uploadingTask = this.storage.upload(path, file);

    let snapshot$ = uploadingTask.percentageChanges();
    let url$ = of('url!').pipe(
      switchMap((res) => {
        return <Observable<string>>ref.getDownloadURL();
      })
    );

    let upload$ = concat(snapshot$, url$);
    return upload$;
  }

  getSalesUser(user: string): Observable<Sale[]> {
    return this.afs
      .collection<Sale>(`/db/aitec/sales`, (ref) =>
        ref.where('user.uid', '==', user)
      )
      .valueChanges();
  }


  getSales(date: { begin: Date; end: Date }): Observable<Sale[]> {
    let real = {
      begin: new Date(date.begin),
      end: new Date(date.end)
    }
    return this.afs
      .collection<Sale>(this.salesRef, (ref) =>
        ref
          .where('createdAt', '<=', real.end)
          .where('createdAt', '>=', real.begin)
      )
      .valueChanges();
  }

  onSaveSale(sale: Sale): Observable<firebase.default.firestore.WriteBatch> {
    let saleRef: DocumentReference = this.afs.firestore
      .collection(this.salesRef)
      .doc(sale.id);
    let saleData: Sale = sale;
    let batch = this.afs.firestore.batch();

    batch.set(saleRef, saleData);
    return of(batch);
  }

  onSaveRate(saleid: string, sale: Sale["rateData"]): Promise<void> {
    let saleRef: DocumentReference = this.afs.firestore
      .collection(this.salesRef)
      .doc(saleid);
    let rateData: Sale["rateData"] = sale;

    return saleRef.update({ rateData });
  }


  onUpdateSaleVoucher(
    saleId: string,
    voucher: boolean,
    user: User,
    photos?: Sale['voucher']
  ): firebase.default.firestore.WriteBatch {
    let saleRef: DocumentReference = this.afs.firestore
      .collection(this.salesRef)
      .doc(saleId);
    let batch = this.afs.firestore.batch();
    if (photos) {
      if (photos.length) {
        batch.update(saleRef, {
          voucherActionAt: new Date(),
          voucherActionBy: user,
          voucherChecked: voucher,
          voucher: photos,
          editedAt: new Date(),
          editedBy: user,
        });
      }
    } else {
      batch.update(saleRef, {
        voucherActionAt: new Date(),
        voucherActionBy: user,
        voucherChecked: voucher,
      });
    }
    return batch;
  }

  /*onUpdateStock(
    requestedProducts: Sale["requestedProducts"],
    batch: firebase.default.firestore.WriteBatch,
    decrease: boolean
  ) {
    let dec = decrease ? -1 : 1;
    let requestedProductRef: DocumentReference;

    requestedProducts.forEach((product) => {
      if (!product.product.package) {
        requestedProductRef = this.afs.firestore
          .collection(this.productsListRef)
          .doc(product.product.id);
        batch.update(requestedProductRef, {
          realStock: firebase.default.firestore.FieldValue.increment(
            dec * product.quantity
          ),
        });
      } else {
        product.chosenOptions.forEach((opt) => {
          requestedProductRef = this.afs.firestore
            .collection(this.productsListRef)
            .doc(opt.id);
          batch.update(requestedProductRef, {
            realStock: firebase.default.firestore.FieldValue.increment(
              dec * product.quantity
            ),
          });
        });
      }
    });

    return batch;
  }*/

  /*onDoubleUpdateStock(requestedProductsToDecrease: Sale['requestedProducts'],
    requestedProductsToIncrease: Sale['requestedProducts'],
    batch: firebase.default.firestore.WriteBatch
  ) {
    let requestedProductRef: DocumentReference;

    let productList: { productId: string; amount: number }[] = [];
    let foundProduct: { productId: string; amount: number } = null;

    let productId: string = null;

    [
      ...requestedProductsToDecrease.map((el) => ({ ...el, decrease: true })),
      ...requestedProductsToIncrease.map((el) => ({ ...el, decrease: false })),
    ].forEach((product) => {
      if (!product.product.package) {
        productId = product.product.id;
        foundProduct = productList.find((el) => el.productId == productId);

        if (foundProduct) {
          foundProduct.amount += product.decrease
            ? -1 * product.quantity
            : product.quantity;
        } else {
          productList.push({
            productId: productId,
            amount: product.decrease ? -1 * product.quantity : product.quantity,
          });
        }
      } else {
        product.chosenOptions.forEach((opt, index) => {
          productId = opt.id;
          foundProduct = productList.find((el) => el.productId == productId);

          if (foundProduct) {
            foundProduct.amount += product.decrease
              ? -1 * product.quantity
              : product.quantity;
          } else {
            productList.push({
              productId: productId,
              amount: product.decrease
                ? -1 * product.quantity
                : product.quantity,
            });
          }
        });
      }
    });

        } else {
          product.chosenOptions.forEach((opt, index) => {
            
            productId = opt.id
            foundProduct = productList.find(el => el.productId == productId)

            if(foundProduct){
              foundProduct.amount += product.decrease ? (-1)*product.quantity : product.quantity
            } else {
              productList.push({productId: productId, 
                amount: product.decrease ? (-1)*product.quantity : product.quantity})
            }

          })
        }
      })

      productList.forEach(el => {
        requestedProductRef = this.afs.firestore.collection(this.productsListRef).doc(el.productId)
        batch.update(requestedProductRef, { realStock: firebase.default.firestore.FieldValue.increment(el.amount) });
      })
      console.log(productList);
      return batch
  }*/


  getConfiUsers(): Observable<User[]> {
    return this.afs
      .collection<User>(`/users`, (ref) => ref.where('role', '>=', ''))
      .valueChanges()
      .pipe(shareReplay(1));
  }

  //NUEVO

  getProduct(id: string): Observable<Product> {
    return this.afs
      .collection<Product>(this.productsListRef, (ref) =>
        ref.where('sku', '==', id)
      )
      .valueChanges()
      .pipe(
        map((snap) => {
          return snap[0]
        })
      );
  }

  getProductObs(id: string): Observable<Product> {
    return this.afs
      .doc<Product>(`${this.productsListRef}/${id}`)
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getUserFinishedSales(user: User): Observable<Sale[]> {
    return this.afs.collection<Sale>(this.salesRef,
      ref => ref.where("user.uid", "==", user.uid)
        .where("status", "==", (new saleStatusOptions()).finished)
        .orderBy("createdAt", "desc").limit(5))
      .get().pipe(map((snap) => {
        return snap.docs
          .map(el => <Sale>el.data())
          .filter(el => (((el.rateData === undefined))))
      }));
  }

  getRecommendedProducts(number: number): Observable<Product[]> {
    return this.afs.collection<Product>(this.productsListRef,
      ref => ref.orderBy("purchaseNumber", "desc").limit(number)).valueChanges();
  }

  /*purchase*/

  reduceStock(user, newSale, phot) {
    return this.afs.firestore.runTransaction((transaction) => {
      let promises = []
      this.order.forEach((order, ind) => {
        console.log(order);

        const ref = this.afs.firestore.collection(`/db/aitec/productsList`).doc(order.product.id);

        promises.push(transaction.get(ref).then((prodDoc) => {
          //let products = prodDoc.data().products
          let purchase = prodDoc.data().purchaseNumber ? prodDoc.data().purchaseNumber + order.quantity : order.quantity;
          //let newStock = prodDoc.data().virtualStock - order.quantity;

          transaction.update(ref, {
            //virtualStock: newStock,
            purchaseNumber: purchase
          });


        }).catch((error) => {
          console.log("Transaction failed: ", error);


        }));


      })
      return Promise.all(promises);
    }).then(res => {
      console.log(res);

      //localStorage.removeItem(this.uidUser)
      return this.saveSale(user, newSale, phot)



    }).catch((error) => {
      //this.snackBar.open('Error de conexión, no se completo la compra, intentelo de nuevo', 'cerrar')
      console.log("Transaction failed: ", error);

    })

  }

  saveSale(user: User, newSale, phot?: any) {
    console.log('here');

    const saleCount = this.afs.firestore.collection(`/db/aitec/config/`).doc('generalConfig');
    const saleRef = this.afs.firestore.collection(`/db/aitec/sales`).doc();
    const emailRef = this.afs.firestore.collection(`/mail`).doc();

    newSale.id = saleRef.id
    let newOrder = [...this.order].map(ord => {
      ord['subtotal'] = ord.price * ord.quantity
      return ord
    })



    let mess = {
      order: newOrder,
      correlative: '#R',
      date: `${('0' + newSale.createdAt.getDate()).slice(-2)}-${('0' + (newSale.createdAt.getMonth() + 1)).slice(-2)}-${newSale.createdAt.getFullYear()}`, /*string date*/
      payment: newSale.payType.name,/*metodo de pago*/
      document: newSale.document,/*boleta/facturacion*/
      boleta: newSale.idDocument == 1,
      factura: newSale.idDocument == 2,
      info: newSale.documentInfo,/*document info*/
      subtotal: (newSale.total * 0.82).toFixed(2),
      igv: (newSale.total * 0.18).toFixed(2),
      envio: newSale.deliveryPrice.toFixed(2),
      total: newSale.total.toFixed(2),
      asesor: newSale.adviser,
      deliveryType: newSale.deliveryType,
      location: newSale.deliveryInfo,
      isDelivery: newSale.idDelivery == 1,
      isStore: newSale.idDelivery == 2,
      store: newSale.deliveryInfo
    }

    if (phot) {
      let photos = [...phot.data.map(el => this.uploadPhotoVoucher(newSale.id, el))]

      forkJoin(photos).pipe(
        takeLast(1),
      ).subscribe((res: string[]) => {
        newSale.voucher = [...phot.data.map((el, i) => {
          return {
            voucherPhoto: res[i],
            voucherPath: `/sales/vouchers/${newSale.id}-${el.name}`
          }
        })]
        return this.afs.firestore.runTransaction((transaction) => {
          return transaction.get(saleCount).then((sfDoc) => {
            if (!sfDoc.exists) {
              transaction.set(saleCount, { salesCounter: 0 });
            }

            //sales
            ////generalCounter
            let newCorr = 1
            if (sfDoc.data().salesCounter) {
              newCorr = sfDoc.data().salesCounter + 1;
            }

            transaction.update(saleCount, { salesCounter: newCorr });

            newSale.correlative = newCorr
            mess.correlative = '#R' + ("000" + newCorr).slice(-4)
            let message = {
              to: [user.email],
              template: {
                name: 'pedidoUser',
                data: mess
              }
            }

            transaction.set(saleRef, newSale);

            transaction.set(emailRef, message);

          });

        })

      })
    } else {
      return this.afs.firestore.runTransaction((transaction) => {
        return transaction.get(saleCount).then((sfDoc) => {
          if (!sfDoc.exists) {
            transaction.set(saleCount, { salesCounter: 0 });
          }

          //sales
          ////generalCounter
          let newCorr = 1
          if (sfDoc.data().salesCounter) {
            newCorr = sfDoc.data().salesCounter + 1;
          }

          transaction.update(saleCount, { salesCounter: newCorr });

          newSale.correlative = newCorr
          mess.correlative = '#R' + ("000" + newCorr).slice(-4)

          let message = {
            to: ['mocharan@meraki-s.com'],
            template: {
              name: 'pedidoUser',
              data: mess
            }
          }

          transaction.set(saleRef, newSale);

          transaction.set(emailRef, message);

        });

      })

    }

  }

  //products

  uploadPhotoProduct(id: string, file: File): Observable<string | number> {
    const path = `/productsList/${id}/${file.name}`;

    // Reference to storage bucket
    const ref = this.storage.ref(path);

    // The main task
    let uploadingTask = this.storage.upload(path, file);

    let snapshot$ = uploadingTask.percentageChanges();
    let url$ = of('url!').pipe(
      switchMap((res) => {
        return <Observable<string>>ref.getDownloadURL();
      })
    );

    let upload$ = concat(snapshot$, interval(1000).pipe(take(2)), url$);
    return upload$;
  }



  // User
  getUserDisplayName(userId: string): Observable<string> {
    return this.afs
      .collection(`/users`)
      .doc(userId)
      .valueChanges()
      .pipe(
        take<User>(1),
        map((user) => {
          if (user.name && user.lastName) {
            return user.name.split(" ")[0] + " " + user.lastName.split(" ")[0];
          }
          if (user.personData) {
            return user.personData.name.split(" ")[0] + user.personData['lastName'].split(" ")[0];
          }
          return "Sin nombre";
        })
      );
  }

  getUserListValueChanges(): Observable<User[]> {
    return this.afs
      .collection<User>(`/users/`)
      .valueChanges()
      .pipe(shareReplay(1));
  }

  editCustomerType(user: User, customerType: string) {
    const userRef = this.afs.firestore.collection(`/users/`).doc(user.uid);
    const batch = this.afs.firestore.batch();

    user.customerType = customerType;

    batch.update(userRef, user);

    batch.commit().then(
      ref => {

      }
    );
  }

  getOneCoupon(id) {
    return this.afs
      .doc(`/db/aitec/coupons/${id}`)
      .valueChanges()
      .pipe(shareReplay(1));
  }

  // WAREHOUSE
  createEditWarehouse(edit: boolean, user: User, data: any, id?: string): firebase.default.firestore.WriteBatch {
    let batch = this.afs.firestore.batch();
    let warehouseRef = this.afs.firestore.collection('db/aitec/warehouses').doc();

    let newData: Warehouse = {
      id: warehouseRef.id,
      department: data.department,
      providence: data.providence,
      district: data.district,
      address: data.address,
      name: data.name,
      createdAt: new Date(),
      createdBy: user,
      editedAt: null,
      editedBy: null
    }

    if (edit) {
      warehouseRef = this.afs.firestore.doc(`db/aitec/warehouses/${id}`);
      batch.update(warehouseRef, newData);
    } else {
      batch.set(warehouseRef, newData);
    }

    return batch
  }

  deleteWarehouse(id: string): firebase.default.firestore.WriteBatch {
    let batch = this.afs.firestore.batch();
    let warehouseRef = this.afs.firestore.doc(`db/aitec/warehouses/${id}`);

    batch.delete(warehouseRef);

    return batch;
  }

}
