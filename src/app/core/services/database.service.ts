import {
  Sale,
  SaleRequestedProducts,
  saleStatusOptions,
} from './../models/sale.model';
import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreDocument,
  DocumentReference,
} from '@angular/fire/firestore';
import { Brand, Product } from '../models/product.model';
import {
  shareReplay,
  map,
  takeLast,
  switchMap,
  take,
  mapTo,
  debounceTime,
  tap,
} from 'rxjs/operators';
import { GeneralConfig } from '../models/generalConfig.model';
import {
  Observable,
  concat,
  of,
  interval,
  BehaviorSubject,
  forkJoin,
  throwError,
  combineLatest,
} from 'rxjs';
import { User } from '../models/user.model';
import { AngularFireStorage } from '@angular/fire/storage';
import * as firebase from 'firebase';
import { Package } from '../models/package.model';
import { AngularFireAuth } from '@angular/fire/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Warehouse } from '../models/warehouse.model';
import {
  SerialNumber,
  SerialNumberWithPrice,
  serialProcess,
} from '../models/SerialNumber.model';
import { SerialItem } from '../models/SerialItem.model';
import { Category } from '../models/category.model';
import { Kardex } from '../models/kardex.model';
import {
  TRANSFER_REASON,
  Waybill,
  WaybillProductList,
} from '../models/waybill.model';
import { ProductsListComponent } from 'src/app/admin/products-list/products-list.component';
import { Stores } from '../models/stores.model';
import { Coupon } from '../models/coupon.model';
import { Payments } from '../models/payments.model';
import { Adviser } from '../models/adviser.model';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  public version: string = 'V0.0.6r';
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

  public uidUser: string = '';
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

  public openConfi: boolean = true;

  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private afAuth: AngularFireAuth,
    private http: HttpClient
  ) {
    //this.opening$ = this.getOpening();
    // this.updateProductListWithWarehouses();
  }

  reservedSalesRef: 'db/aitec/reservedSales' = 'db/aitec/reservedSales'; //To reserve sales
  reStockSalesRef: 'db/aitec/reStockSales' = 'db/aitec/reStockSales'; //When deleting reserving sales, we should re stock
  usersRef: 'users' = 'users';

  productsListRef: `db/aitec/productsList` = `db/aitec/productsList`;
  productsListColl = this.afs.firestore.collection(this.productsListRef);
  packagesListRef: `db/aitec/packagesList` = `db/aitec/packagesList`;
  recipesRef: `db/aitec/recipes` = `db/aitec/recipes`;
  buysRef: `db/aitec/buys` = `db/aitec/buys`;
  salesRef: `db/aitec/sales` = `db/aitec/sales`;
  cancelledSaleRef: `db/aitec/cancelledSales` = `db/aitec/cancelledSales`;
  configRef: `db/aitec/config` = `db/aitec/config`;
  userRef: `users` = `users`;
  couponRef: `db/aitec/coupons` = `db/aitec/coupons`;
  advisersRef: `/db/aitec/config/generalConfig/adviser` = `/db/aitec/config/generalConfig/adviser`;
  warehousesRef: `db/aitec/warehouses` = `db/aitec/warehouses`;
  seriesPreprocessingRef: `db/aitec/seriesPreprocessingRef` = `db/aitec/seriesPreprocessingRef`;
  salesCorrColl = this.afs.firestore
    .collection(`db/aitec/config`)
    .doc('salesCorrelative'); //Used to update and get correlative

  saleStatus = new saleStatusOptions();

  generalConfigDoc = this.afs
    .collection(this.configRef)
    .doc<GeneralConfig>('generalConfig');

  changeOpenSide() {
    this.openConfi = !this.openConfi;
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

  saveAll(products: Product[]) {
    const batch = this.afs.firestore.batch();

    products.forEach((el) => {
      let productRef = this.afs.firestore
        .collection(`db/aitec/productsList`)
        .doc(el.id);

      let prods = el.products.map((pr) => {
        pr.realStock = pr.stock;
        pr.virtualStock = pr.stock;
        return pr;
      });
      batch.update(productRef, {
        products: prods,
      });
    });

    batch.commit().then(() => {
      console.log('all');
    });
  }

  saveCategoriesAll(products: Category[]) {
    const batch = this.afs.firestore.batch();

    products.forEach((el) => {
      let productRef = this.afs.firestore
        .collection(`/db/aitec/config/generalConfig/allCategories`)
        .doc(el.id);

      batch.update(productRef, {
        name: el.name.trim(),
        completeName: el.completeName.trim(),
      });
    });

    batch.commit().then(() => {
      console.log('all');
    });
  }

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
      .collection(`/db/aitec/config/generalConfig/categories`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => el.data());
        })
      );
  }

  getAllCategories(): Observable<Category[]> {
    return this.afs
      .collection<Category>(
        `/db/aitec/config/generalConfig/allCategories`,
        (ref) => ref.orderBy('createdAt', 'desc')
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  //deph Level refers to how many fields do we have in coupon Category
  getCategoryListFromCoupon(coupon: Coupon): Observable<Category[]> {
    let dephLevel = <1 | 2 | 3>(
      (Number(!!coupon.category.id) +
        Number(!!coupon.category.idCategory) +
        Number(!!coupon.category.idSubCategory))
    );
    let catId = coupon.category.id;

    let id = this.afs
      .collection<Category>(
        `/db/aitec/config/generalConfig/allCategories`,
        (ref) => ref.where('id', '==', catId)
      )
      .get()
      .pipe(
        map((snap) =>
          snap.empty ? [] : snap.docs.map((doc) => <Category>doc.data())
        )
      );
    let idCategory = this.afs
      .collection<Category>(
        `/db/aitec/config/generalConfig/allCategories`,
        (ref) => ref.where('idCategory', '==', catId)
      )
      .get()
      .pipe(
        map((snap) =>
          snap.empty ? [] : snap.docs.map((doc) => <Category>doc.data())
        )
      );
    let idSubCategory = this.afs
      .collection<Category>(
        `/db/aitec/config/generalConfig/allCategories`,
        (ref) => ref.where('idSubCategory', '==', catId)
      )
      .get()
      .pipe(
        map((snap) =>
          snap.empty ? [] : snap.docs.map((doc) => <Category>doc.data())
        )
      );

    //For more info check coupon model Category
    switch (dephLevel) {
      case 1:
        return combineLatest([id, idCategory]).pipe(
          map(([idRes, idCatRes]) => [...idRes, ...idCatRes])
        );
      case 2:
        return combineLatest([id, idSubCategory]).pipe(
          map(([idRes, idSubCatRes]) => [...idRes, ...idSubCatRes])
        );
      case 3:
        return of([coupon.category]);
    }
  }

  getSubCategories(id): Observable<Category[]> {
    return this.afs
      .collection<Category>(
        `/db/aitec/config/generalConfig/allCategories`,
        (ref) => ref.where('idCategory', '==', id)
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getSubSubCategories(id): Observable<Category[]> {
    return this.afs
      .collection<Category>(
        `/db/aitec/config/generalConfig/allCategories`,
        (ref) => ref.where('idSubCategory', '==', id)
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getAllCategoriesDoc(): Observable<Category[]> {
    return this.afs
      .collection<Category>(
        `/db/aitec/config/generalConfig/allCategories`,
        (ref) => ref.orderBy('createdAt', 'desc')
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => <Category>el.data());
        })
      );
  }

  getOneCategory(id: string): Observable<Category> {
    return this.afs
      .collection<Category>(
        `/db/aitec/config/generalConfig/allCategories`,
        (ref) => ref.where('id', '==', id)
      )
      .valueChanges()
      .pipe(
        shareReplay(1),
        map((snap) => {
          return snap[0];
        })
      );
  }

  getListProductsByCategory(list): Observable<Product[]> {
    return this.afs
      .collection<Product>(this.productsListRef)
      .valueChanges()
      .pipe(
        map((products) => {
          return products.filter((pr) => list.includes(pr.idCategory));
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
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => el.data());
        })
      );
  }

  getStores(): Observable<Stores[]> {
    return this.afs
      .collection<Stores>(`/db/aitec/config/generalConfig/stores`, (ref) =>
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

  getCoupon(coupon: string): Observable<Coupon> {
    return this.afs
      .collection<Coupon>(`/db/aitec/coupons`, (ref) =>
        ref.where('name', '==', coupon).limit(1)
      )
      .get({ source: 'server' })
      .pipe(
        map((res) => {
          if (res.empty) {
            return null;
          } else {
            return <Coupon>res.docs[0].data();
          }
        })
      );
  }

  getCouponsDoc(): Observable<any> {
    return this.afs
      .collection(`/db/aitec/coupons`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => el.data());
        })
      );
  }

  getAdvisersStatic(): Observable<Adviser[]> {
    return this.afs
      .collection<Adviser>(this.advisersRef, (ref) =>
        ref.orderBy('displayName', 'desc')
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => <Adviser>el.data());
        })
      );
  }

  getDeliveryUserStatic(): Observable<User[]> {
    return this.afs
      .collection<User>(this.userRef, (ref) =>
        ref.orderBy('personData.name', 'desc').where('deliveryUser', '==', true)
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => <User>el.data());
        })
      );
  }

  getAdvisers(): Observable<Adviser[]> {
    return this.afs
      .collection<Adviser>(this.advisersRef, (ref) =>
        ref.orderBy('createdAt', 'desc')
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getAdvisersDoc(): Observable<Adviser[]> {
    return this.afs
      .collection(this.advisersRef, (ref) => ref.orderBy('createdAt', 'desc'))
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => <Adviser>el.data());
        })
      );
  }

  getPaymentsChanges(): Observable<Payments[]> {
    return this.afs
      .collection<Payments>(`${this.configRef}/generalConfig/payments`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      )
      .valueChanges()
      .pipe(
        map((payList) => {
          return payList.map((pay) => {
            return {
              ...pay,
              type: pay.voucher
                ? 3
                : pay.name.toLowerCase().includes('tarjeta')
                ? 2
                : 1,
            };
          });
        })
      );
  }

  getPaymentsDoc(): Observable<any> {
    return this.afs
      .collection(`/db/aitec/config/generalConfig/payments`, (ref) =>
        ref.orderBy('createdAt', 'desc')
      )
      .get()
      .pipe(
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

  getProductsList2(): Observable<Product[]> {
    return this.afs
      .collection<Product>(this.productsListRef, (ref) =>
        ref.orderBy('priority', 'desc')
      )
      .valueChanges()
      .pipe(
        map((res) => {
          return res.filter((el) => !!el.published);
        })
      );
  }

  getLastProducts(): Observable<Product[]> {
    return this.afs
      .collection<Product>(this.productsListRef, (ref) =>
        ref.orderBy('createdAt', 'desc').limit(30)
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
      .collection<{id: string, searchNumber: number}>(`db/aitec/searchProducts`, (ref) =>
        ref.orderBy('searchNumber', 'desc').limit(6)
      )
      .get()
      .pipe(
        switchMap(snap => {
          // trasnform to id list to be used in query
          const idsList = snap.docs.map(searchedProduct => searchedProduct.data().id);
          // getting the products based in id list
          return this.afs.collection(this.productsListRef, ref => ref.where('id', 'in', idsList)).get()
        }),
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

  getProductsListValueChanges2(): Observable<Product[]> {
    return this.afs
      .collection<Product>(this.productsListRef, (ref) =>
        ref.orderBy('priority', 'desc').where('published', '==', true)
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getProductsListByCategory(category: string): Observable<Product[]> {
    return this.afs
      .collection<Product>(this.productsListRef, (ref) =>
        ref.where('idCategory', '==', category)
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
      .collection<Warehouse>(this.warehousesRef, (ref) =>
        ref.orderBy('createdAt', 'desc')
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getWarehouseSeriesValueChanges(
    productId: string,
    warehouseId?: string
  ): Observable<SerialNumber[]> {
    if (warehouseId) {
      return this.afs
        .collection<SerialNumber>(
          `${this.productsListRef}/${productId}/series`,
          (ref) =>
            ref
              .where('warehouseId', '==', warehouseId)
              .where('status', '==', 'stored')
        )
        .valueChanges();
    } else {
      return this.afs
        .collection<SerialNumber>(
          `${this.productsListRef}/${productId}/series`,
          (ref) => ref.where('status', '==', 'stored')
        )
        .valueChanges();
    }
  }

  getKardex(
    productId: string,
    date: { begin: Date; end: Date },
    warehouseId: string
  ): Observable<Kardex[]> {
    if (warehouseId) {
      return this.afs
        .collection<Kardex>(
          `${this.productsListRef}/${productId}/kardex`,
          (ref) =>
            ref
              .where('warehouseId', '==', warehouseId)
              .where('createdAt', '>=', date.begin)
              .where('createdAt', '<=', date.end)
        )
        .valueChanges();
    } else {
      return this.afs
        .collection<Kardex>(`${this.productsListRef}/${productId}/kardex`)
        .valueChanges();
    }
  }

  getMovementsValueChanges(date: {
    begin: Date;
    end: Date;
  }): Observable<serialProcess[]> {
    return this.afs
      .collection<serialProcess>(`${this.seriesPreprocessingRef}`, (ref) =>
        ref
          .orderBy('createdAt', 'desc')
          .where('createdAt', '>=', date.begin)
          .where('createdAt', '<=', date.end)
      )
      .valueChanges();
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
        type: promoData.type,
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
    console.log('uploadPhotoPackage');
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

    let upload$ = concat(snapshot$, interval(250).pipe(take(1)), url$);
    return upload$;
  }

  deletePhotoPackage(path: string): Observable<any> {
    let st = this.storage.ref(path);
    return st.delete().pipe(takeLast(1));
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

  reserveSale(
    sale: Sale
  ): [firebase.default.firestore.WriteBatch, AngularFirestoreDocument<Sale>] {
    const batch = this.afs.firestore.batch();
    const saleRef = this.afs.firestore.collection(this.reservedSalesRef).doc();
    const usersRef = this.afs.firestore
      .collection(this.userRef)
      .doc(sale.user.uid);

    let newSale = { ...sale };
    newSale.id = saleRef.id;

    batch.set(saleRef, newSale);
    //clearing bakset
    batch.update(usersRef, { shoppingCar: [] });

    return [
      batch,
      this.afs.collection(this.reservedSalesRef).doc<Sale>(saleRef.id),
    ];
  }

  saveSalePayment(
    sale: Sale,
    phot?: { data: File[] }
  ): Observable<Promise<{ success: boolean; sale?: Sale }>> {
    console.log('here');

    let newSale = { ...sale };
    newSale.status = this.saleStatus.requested;

    switch (sale.payType.type) {
      case 1: //Case of contraentrega
      case 2: //Case of tarjeta
        return of(this.finishPayment(newSale));
      case 3: //Case of voucher
        let photos = [
          ...phot.data.map((el) =>
            this.uploadPhotoPackage(newSale.id, el).pipe(takeLast(1))
          ),
        ];
        return forkJoin(photos).pipe(
          takeLast(1),
          map((res: string[]) => {
            //We update voucher field
            newSale.voucher = [
              ...phot.data.map((el, i) => {
                return {
                  voucherPhoto: res[i],
                  voucherPath: `/sales/vouchers/${newSale.id}-${el.name}`,
                };
              }),
            ];

            //We now get the firestore batch
            return this.finishPayment(newSale);
          })
        );
    }
  }

  finishPayment(newSale: Sale): Promise<{ success: boolean; sale?: Sale }> {
    const saleReqRef = this.afs.firestore
      .collection(this.reservedSalesRef)
      .doc(newSale.id);
    const userColl = this.afs.firestore.collection(this.userRef);

    const batch = this.afs.firestore.batch();

    let sale = { ...newSale };
    sale.status == this.saleStatus.requested;

    batch.update(userColl.doc(sale.user.uid), {
      pendingPayment: false,
      shoppingCar: [],
    });
    batch.update(saleReqRef, sale);

    return batch.commit().then(
      (success) => {
        return { success: true, sale };
      },
      (err) => {
        return { success: false };
      }
    );
  }

  cancelSalePayment(sale: Sale): firebase.default.firestore.WriteBatch {
    const saleRef = this.afs.firestore.collection(this.salesRef).doc(sale.id);
    const userRef = this.afs.firestore
      .collection(this.userRef)
      .doc(sale.user.uid);
    const reStockRef = this.afs.firestore
      .collection(this.reStockSalesRef)
      .doc(sale.id);

    let batch = this.afs.firestore.batch();
    batch.set(reStockRef, sale);
    return batch;
  }

  // return this.afs.firestore.runTransaction((transaction) => {
  //   return transaction.get(saleCount).then((sfDoc) => {
  //     if (!sfDoc.exists) {
  //       transaction.set(saleCount, { salesCounter: 0 });
  //     }

  //     //sales
  //     ////generalCounter
  //     let newCorr = 1
  //     if (sfDoc.data().salesCounter) {
  //       newCorr = sfDoc.data().salesCounter + 1;
  //     }

  //     transaction.update(saleCount, { salesCounter: newCorr });

  //     newSale.correlative = newCorr
  //     mess.correlative = '#R' + ("000" + newCorr).slice(-4)
  //     let message = {
  //       to: [user.email],
  //       template: {
  //         name: 'pedidoUser',
  //         data: mess
  //       }
  //     }

  //     transaction.set(saleRef, newSale);

  //     transaction.set(emailRef, message);

  //   });

  // })

  getPayingSales(userId: string): Observable<Sale> {
    let status = 'Pagando';
    return this.afs
      .collection<Sale>(this.reservedSalesRef, (ref) =>
        ref
          .where('user.uid', '==', userId)
          .where('status', '==', status)
          .limit(1)
      )
      .valueChanges()
      .pipe(map((sales) => sales[0]));
  }

  getSales(date: { begin: Date; end: Date }): Observable<Sale[]> {
    let real = {
      begin: new Date(date.begin),
      end: new Date(date.end),
    };
    return this.afs
      .collection<Sale>(this.salesRef, (ref) =>
        ref
          .where('createdAt', '<=', real.end)
          .where('createdAt', '>=', real.begin)
          .orderBy('createdAt', 'asc')
      )
      .valueChanges();
  }

  getSalesUser(
    user: User,
    date: { begin: Date; end: Date }
  ): Observable<Sale[]> {
    let real = {
      begin: new Date(date.begin),
      end: new Date(date.end),
    };
    return this.afs
      .collection<Sale>(this.salesRef, (ref) =>
        ref
          .where('createdAt', '<=', real.end)
          .where('createdAt', '>=', real.begin)
          .orderBy('createdAt', 'asc')
          .where('user.uid', '==', user.uid)
      )
      .valueChanges();
  }

  getSalesRanking(date: { begin: Date; end: Date }): Observable<Sale[]> {
    let real = {
      begin: new Date(date.begin),
      end: new Date(date.end),
    };
    return this.afs
      .collection<Sale>(this.salesRef, (ref) =>
        ref
          .where('createdAt', '<=', real.end)
          .where('createdAt', '>=', real.begin)
          .orderBy('createdAt', 'asc')
      )
      .valueChanges()
      .pipe(
        map((sale) => {
          return sale.filter((el) => !!el.rateData);
        })
      );
  }

  getSalesFilteredStatus(
    date: { begin: Date; end: Date },
    statusList: Array<Sale['status']>
  ): Observable<Sale[]> {
    let real = {
      begin: new Date(date.begin),
      end: new Date(date.end),
    };
    return this.afs
      .collection<Sale>(this.salesRef, (ref) =>
        ref
          .where('createdAt', '<=', real.end)
          .where('createdAt', '>=', real.begin)
          .where('status', 'in', statusList)
          .orderBy('createdAt', 'asc')
      )
      .valueChanges();
  }

  getSaleId(saleId: string): Observable<Sale> {
    return this.afs.collection(this.salesRef).doc<Sale>(saleId).valueChanges();
  }

  onSaveSale(sale: Sale): firebase.default.firestore.WriteBatch {
    let saleRef: DocumentReference = this.afs.firestore
      .collection(this.salesRef)
      .doc(sale.id);
    let saleData: Sale = sale;
    let batch = this.afs.firestore.batch();

    batch.set(saleRef, saleData);

    if (sale.status == this.saleStatus.cancelled) {
      let cancelledSaleDoc: DocumentReference = this.afs.firestore
        .collection(this.cancelledSaleRef)
        .doc(sale.id);
      batch.set(cancelledSaleDoc, saleData);
    }
    return batch;
  }

  onSaveRate(saleid: string, sale: Sale['rateData']): Promise<void> {
    let saleRef: DocumentReference = this.afs.firestore
      .collection(this.salesRef)
      .doc(saleid);
    let rateData: Sale['rateData'] = sale;

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
          return snap[0];
        })
      );
  }

  getProduct2(id: string): Observable<Product> {
    return this.afs
      .collection<Product>(this.productsListRef, (ref) =>
        ref.where('sku', '==', id).where('published', '==', true)
      )
      .valueChanges()
      .pipe(
        map((snap) => {
          return snap[0];
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
    return this.afs
      .collection<Sale>(this.salesRef, (ref) =>
        ref
          .where('user.uid', '==', user.uid)
          .where('status', '==', new saleStatusOptions().finished)
          .orderBy('createdAt', 'desc')
          .limit(5)
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs
            .map((el) => <Sale>el.data())
            .filter((el) => el.rateData === undefined);
        })
      );
  }

  getRecommendedProducts(number: number): Observable<Product[]> {
    return this.afs
      .collection<Product>(this.productsListRef, (ref) =>
        ref.orderBy('purchaseNumber', 'desc').limit(number)
      )
      .valueChanges();
  }

  /*purchase*/
  /*
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

  }*/

  /*
  sendEmail(newSale) {
    const batch = this.afs.firestore.batch()
    const emailRef = this.afs.firestore.collection(`/mail`).doc();

    let newOrder = [...this.order].map(ord => {
      ord['subtotal'] = ord.price * ord.quantity
      return ord
    })

    let mess = {
      order: newOrder,
      correlative: '#R',
      date: `${('0' + newSale.createdAt.getDate()).slice(-2)}-${('0' + (newSale.createdAt.getMonth() + 1)).slice(-2)}-${newSale.createdAt.getFullYear()}`, //string date
      payment: newSale.payType.name,//metodo de pago
      document: newSale.document,//boleta/facturacion
      boleta: newSale.idDocument == 1,
      factura: newSale.idDocument == 2,
      info: newSale.documentInfo,//document info
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

    let message = {
      to: ['mocharan@meraki-s.com'],
      template: {
        name: 'pedidoUser',
        data: mess
      }
    }

    batch.set(emailRef, message);
    batch.commit().then(() => {
      console.log('save')
    })

  }
*/

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
            return user.name.split(' ')[0] + ' ' + user.lastName.split(' ')[0];
          }
          if (user.personData) {
            return (
              user.personData.name.split(' ')[0] +
              user.personData['lastName'].split(' ')[0]
            );
          }
          return 'Sin nombre';
        })
      );
  }

  getUserListValueChanges(): Observable<User[]> {
    return this.afs
      .collection<User>(`/users/`)
      .valueChanges()
      .pipe(shareReplay(1));
  }

  editUserType(
    userId: string,
    type: 'mayoristUser' | 'deliveryUser' | 'role',
    action: boolean | string
  ): firebase.default.firestore.WriteBatch {
    const userDoc = this.afs.firestore.collection(this.userRef).doc(userId);
    const batch = this.afs.firestore.batch();
    batch.update(userDoc, { [type]: action });
    return batch;
  }

  getOneCoupon(id) {
    return this.afs
      .doc(`/db/aitec/coupons/${id}`)
      .valueChanges()
      .pipe(shareReplay(1));
  }

  //Payment
  async methodPostAsync(data): Promise<any> {
    try {
      const username = '13421879';
      const password =
        'testpassword_MrLOJyprSofwHEEbSrJYyIwv5DZsTG76WwiOq9msFmj6L';

      var auth = 'Basic ' + btoa(username + ':' + password);
      //var url = "https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePayment";
      var url = '/api-payment/V4/Charge/CreatePayment';

      const httpOptions = {
        headers: new HttpHeaders({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
          Authorization: auth,
        }),
      };

      let res = await this.http
        .post(url, JSON.stringify(data), httpOptions)
        .toPromise();

      return res;
    } catch (error) {
      await console.log(error);
    }
  }
  // WAREHOUSE
  getWarehouses(): Observable<any> {
    return this.afs
      .collection(this.warehousesRef, (ref) => ref.orderBy('name', 'asc'))
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => el.data());
        })
      );
  }

  createEditWarehouse(
    edit: boolean,
    user: User,
    data: any,
    id?: string
  ): firebase.default.firestore.WriteBatch {
    let batch = this.afs.firestore.batch();
    let warehouseRef = this.afs.firestore
      .collection('db/aitec/warehouses')
      .doc();

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
      editedBy: null,
    };

    if (edit) {
      warehouseRef = this.afs.firestore.doc(`db/aitec/warehouses/${id}`);
      batch.update(warehouseRef, newData);
    } else {
      batch.set(warehouseRef, newData);
    }

    return batch;
  }

  deleteWarehouse(id: string): firebase.default.firestore.WriteBatch {
    let batch = this.afs.firestore.batch();
    let warehouseRef = this.afs.firestore.doc(`db/aitec/warehouses/${id}`);

    batch.delete(warehouseRef);

    return batch;
  }

  getSeriesStoredInWarehouse(
    warehouseId: string,
    productId: string
  ): Observable<SerialNumber[]> {
    return this.afs
      .collectionGroup<SerialNumber>(`series`, (ref) =>
        ref
          .where('warehouseId', '==', warehouseId)
          .where('status', '==', 'stored')
          .where('productId', '==', productId)
      )
      .valueChanges()
      .pipe(
        map((series) => {
          return series;
        })
      );
  }

  getSeriesStoredOfProductInWarehouse(
    productId: string,
    warehouseId: string
  ): Observable<SerialNumber[]> {
    return this.afs
      .collection<SerialNumber>(
        `${this.productsListRef}/${productId}/series`,
        (ref) =>
          ref
            .where('status', '==', 'stored')
            .where('warehouseId', '==', warehouseId)
      )
      .get({ source: 'server' })
      .pipe(
        map((sf) => {
          if (sf.empty) {
            return [];
          } else {
            return sf.docs.map((el) => <SerialNumber>el.data());
          }
        })
      );
  }

  //getSeriesOfProduct deprecated
  getSeriesOfProduct(
    barcode: string,
    productId: string
  ): Observable<SerialNumber[]> {
    return this.afs
      .collection<SerialNumber>(
        `${this.productsListRef}/${productId}/series`,
        (ref) => ref.where('barcode', '==', barcode)
      )
      .get({ source: 'server' })
      .pipe(
        map((doc) => {
          if (doc.empty) {
            return [];
          } else {
            return doc.docs.map((el) => <SerialNumber>el.data());
          }
        })
      );
  }

  validateSeriesOfProduct(barcode: string): Observable<SerialNumber[]> {
    return this.afs
      .collectionGroup<SerialNumber>(`series`, (ref) =>
        ref.where('status', '==', 'stored').where('barcode', '==', barcode)
      )
      .get({ source: 'server' })
      .pipe(
        map((doc) => {
          if (doc.empty) {
            return [];
          } else {
            return doc.docs.map((el) => <SerialNumber>el.data());
          }
        })
      );

    // return this.afs.collection<SerialNumber>(`${this.productsListRef}/${productId}/series`, ref =>
    //     ref.where("status", "==", "stored").where("barcode", "==", barcode)
    //   ).get({source: "server"}).pipe(
    //     map(doc => {
    //       if(doc.empty){
    //         return []
    //       } else {
    //         return doc.docs.map(el => (<SerialNumber>el.data()))
    //       }
    //     })
    //   )
  }

  getProductsOrdered(): Observable<Product[]> {
    return this.afs
      .collection<Product>(this.productsListRef, (ref) =>
        ref.orderBy('description')
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getProductsByWarehouse(warehouse: Warehouse): Observable<Product[]> {
    if (!warehouse.id) {
      return of([]);
    }

    return this.afs
      .collection<Product>(this.productsListRef, (ref) =>
        ref.where(`warehouseStock.${warehouse.id}`, '>=', 0)
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }
  getWarehouseProductSerial(
    warehouse,
    warehouseProduct
  ): Observable<SerialItem[]> {
    console.log('warehouse : ', warehouse);
    console.log('warehouseProduct : ', warehouseProduct);

    if (!warehouse.id) {
      return of([]);
    }

    return this.afs
      .collection<SerialItem>(
        `/db/aitec/warehouses/${warehouse.id}/products/${warehouseProduct.id}/series`
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }
  /*  getWarehouseProductSerial(warehouse: Warehouse,warehouseProduct:WarehouseProduct): Observable<SerialItem[]> {
     if (!warehouse.id) {
       return of([])
     }
 
     return this.afs.collection<SerialItem>(`/db/aitec/warehouses/${warehouse.id}/products/${warehouseProduct.id}/series`)
       .valueChanges()
       .pipe(
         shareReplay(1)
       )
   } */

  getProductSerialNumbers(
    warehouseId: string,
    productId: string
  ): Observable<SerialNumber[]> {
    return this.afs
      .collection<SerialNumber>(
        `/db/aitec/warehouses/${warehouseId}/products/${productId}/series`
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getStoredSerialNumbers(
    warehouseId: string,
    productId: string
  ): Observable<SerialNumber[]> {
    return this.afs
      .collection<SerialNumber>(
        `/db/aitec/warehouses/${warehouseId}/products/${productId}/series`,
        (ref) => ref.where('status', '==', 'stored')
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getFirebaseId() {
    let aux = this.afs.firestore.collection(`series`).doc();
    return aux.id;
  }

  saveSerialNumbers(
    batch0: firebase.default.firestore.WriteBatch,
    invoice: string,
    waybill: string,
    serialList: SerialNumberWithPrice[],
    user: User,
    observations: string,
    type: serialProcess['type'],
    changeVirtualStock: boolean,
    kardexType: Kardex['type'],
    kardexOperationType: Kardex['operationType'],
    sale: Sale
  ): firebase.default.firestore.WriteBatch {
    /**
     * IMPORTANT!
     * Serial numbers of different types processed
     *
     * */

    let batch = batch0 ? batch0 : this.afs.firestore.batch();
    let date = new Date();

    // Updating data from serial numbers
    serialList.forEach((serialNumberWithPrice) => {
      (<SerialNumber[]>serialNumberWithPrice.list).forEach((serialNumber) => {
        serialNumber.createdAt = date;
        serialNumber.createdBy = user;
      });
    });

    //Building serialProcess
    let serialProcessData: serialProcess = {
      id: this.getFirebaseId(),
      invoice,
      waybill,
      type: type,
      changeVirtualStock: !!changeVirtualStock,
      list: serialList,
      sale: sale,
      kardexType,
      kardexOperationType,
      observations: observations,
      createdBy: user,
      createdAt: date,
    };

    //Uploading serialProcess
    console.log('-----');
    console.log(
      'copiar lo de abajo para el soporte (hacer click en triangulo para expandir):'
    );
    console.log(serialProcessData);
    console.log('-----');
    let seriesPreprocessingRef = this.afs.firestore
      .collection(`${this.seriesPreprocessingRef}`)
      .doc(serialProcessData.id);
    batch.set(seriesPreprocessingRef, serialProcessData);

    return batch;
  }

  // saveSerialNumbers(invoice: string, waybill: string, serialList: SerialItem[], warehouse: Warehouse, product: WarehouseProduct, user: User): Observable<firebase.default.firestore.WriteBatch> {
  //   /**
  //    * IMPORTANT!
  //    * This function assumes that only serial numbers of the same type (same product) will be processed.
  //    *
  //    * */

  //   let batch = this.afs.firestore.batch();

  //   // Saving serial numbers to warehouse product
  //   serialList.forEach(serial => {
  //     let serialRef = this.afs.firestore.collection(`db/aitec/warehouses/${warehouse.id}/products/${product.id}/series`).doc();

  //     let data: SerialNumber = {
  //       id: serialRef.id,
  //       barcode: serial.barcode,
  //       color: serial.color,
  //       status: 'stored',
  //       sku: serial.sku,
  //       createdBy: user,
  //       createdAt: new Date(),
  //       editedBy: null,
  //       editedAt: null
  //     }

  //     batch.set(serialRef, data);
  //   });

  //   // Adding quantity to product
  //   let productRef = this.afs.firestore.doc(`db/aitec/productsList/${product.id}`);
  //   batch.update(productRef, { virtualStock: firebase.default.firestore.FieldValue.increment(serialList.length) });
  //   batch.update(productRef, { realStock: firebase.default.firestore.FieldValue.increment(serialList.length) });

  //   // Adding entry to product's kardex
  //   let kardexProductRef = this.afs.firestore.collection(`db/aitec/warehouses/${warehouse.id}/products/${product.id}/kardex`).doc();

  //   let kardex: Kardex = {
  //     id: kardexProductRef.id,

  //     type: 1,
  //     operationType: 1,
  //     invoice: invoice,
  //     waybill: waybill,
  //     inflow: true,
  //     quantity: serialList.length,
  //     createdBy: user,
  //     createdAt: new Date(),
  //   }

  //   batch.set(kardexProductRef, kardex);

  //   return of(batch);
  // }

  // NEWS CONFIGURATION
  uploadPhotoNews(file: File): Observable<string | number> {
    console.log(file);

    const path = `/news/${file.name}`;
    console.log(path);

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

  updateNewsVisibility(
    visible: boolean,
    photo: File
  ): Observable<firebase.default.firestore.WriteBatch> {
    if (!photo) {
      let batch = this.afs.firestore.batch();
      batch.update(this.generalConfigDoc.ref, { 'news.visible': visible });
      return of(batch);
    } else {
      return this.uploadPhotoNews(photo).pipe(
        switchMap((res) => {
          let batch = this.afs.firestore.batch();
          if (typeof res == 'string') {
            batch.update(this.generalConfigDoc.ref, {
              news: { visible: visible, imageURL: res },
            });
          } else {
            batch.update(this.generalConfigDoc.ref, {
              'news.visible': visible,
            });
          }

          return of(batch);
        })
      );
    }
  }

  //virtualStock was already updated when confirming sale
  /**
   * Creates a waybill based in the products registered
   * @param {Waybill} products - Content of the form used to generate waybills
   */
  createWaybill(
    waybill: Waybill,
    serialList: SerialNumberWithPrice[],
    user: User,
    sale?: Sale
  ): firebase.default.firestore.WriteBatch {
    let batch = this.afs.firestore.batch();
    const referralRef = this.afs.firestore
      .collection(`/db/aitec/waybills`)
      .doc();

    waybill.id = referralRef.id;
    batch.set(referralRef, waybill);

    //In the case we include a sale, we should do a kardex register.
    if (sale) {
      //We include waybill on sales data
      const saleRef = this.afs.firestore.collection(this.salesRef).doc(sale.id);
      batch.update(saleRef, {
        confirmedDeliveryData: {
          referralGuide: waybill,
        },
      });

      let auxSerialList = [...serialList];

      auxSerialList.forEach((el) => {
        (<SerialNumber[]>el.list).forEach((el2) => {
          el2.status = 'sold';
          (el2.editedBy = user), (el2.editedAt = new Date());
        });
      });

      batch = this.saveSerialNumbers(
        batch,
        sale.confirmedDocumentData.documentNumber,
        waybill.orderCode,
        serialList,
        user,
        waybill.observations,
        'Venta',
        false,
        sale.document == 'Boleta' ? 3 : 1, //BOLETA O FACTURA
        1, //VENTA
        sale
      );
    } else {
      let auxSerialList = [...serialList];

      auxSerialList.forEach((el) => {
        (<SerialNumber[]>el.list).forEach((el2) => {
          el2.status = 'sold';
          (el2.editedBy = user), (el2.editedAt = new Date());
        });
      });

      batch = this.saveSerialNumbers(
        batch,
        waybill.orderCode,
        waybill.orderCode,
        serialList,
        user,
        waybill.observations,
        'Retiro por Guía de Remisión',
        true,
        1, //Kardex type: Factura
        99, //Kardex opType: OTROS
        null
      );
    }

    return batch;
  }

  //Calculator functions
  giveProductPrice(
    item: { product: Product; quantity: number },
    mayorist: boolean
  ): number {
    if (item.product.promo) {
      if (
        (item.product.promoData.type == 1 && !mayorist) ||
        (item.product.promoData.type == 2 && mayorist) ||
        item.product.promoData.type == 3
      ) {
        let promTotalQuantity = Math.floor(
          item.quantity / item.product.promoData.quantity
        );
        let promTotalPrice =
          promTotalQuantity * item.product.promoData.promoPrice;
        let noPromTotalQuantity =
          item.quantity % item.product.promoData.quantity;
        let noPromTotalPrice =
          noPromTotalQuantity *
          (mayorist ? item.product.priceMay : item.product.priceMin);

        return promTotalPrice + noPromTotalPrice;
      }
    }
    return (
      item.quantity * (mayorist ? item.product.priceMay : item.product.priceMin)
    );
  }

  giveProductPriceOfSale(
    requestedProducts: { product: Product; quantity: number }[],
    mayorist: boolean
  ): number {
    let sum = [...requestedProducts]
      .map((el) => this.giveProductPrice(el, mayorist))
      .reduce((a, b) => a + b, 0);

    return sum;
  }

  //Waybill printing
  printWaybillPdf(data: Waybill) {
    console.log(data);
    let doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    //Importando Plantilla
    let img = new Image(595, 842);
    img.src = '../../../assets/images/guia_rem.png';

    let itemsNumber = data.productList.length;
    let itemIndex = 0;

    for (let j = 0; j < Math.ceil(itemsNumber / 15); j++) {
      doc.addImage(img, 'PNG', 0, 11, 210, 272);

      //Setting body styles
      doc.setFontSize(10);

      //writing body
      //Header
      //N° de guia de remisión
      doc.setFontSize(16);
      doc.text(data.orderCode, 137, 57, { maxWidth: 48, align: 'left' });
      doc.setFontSize(10);
      //Nombre de destinatario
      doc.text(
        doc.splitTextToSize(data.addressee, 57).slice(0, 2).join(' '),
        55,
        76,
        { align: 'left', maxWidth: 57 }
      );
      //Destinatario RUC
      doc.text(String(data.dni), 145, 76, { align: 'left' });
      //Dirección de llegada
      doc.text(
        doc.splitTextToSize(data.arrivalPoint, 57).slice(0, 2).join(' '),
        55,
        84,
        { align: 'left', maxWidth: 57 }
      );
      //Fecha de emisión
      let emisionDate: {
        year: number;
        month: string;
        day: string;
        hours: number;
        minutes: string;
      } = null;
      if (data.createdAt instanceof Date) {
        emisionDate = this.getDateFromSec(data.createdAt.valueOf() / 1000);
      } else {
        emisionDate = this.getDateFromSec(data.createdAt['seconds']);
      }
      doc.text(
        `${emisionDate.day}/${emisionDate.month}/${emisionDate.year}`,
        145,
        84,
        { align: 'left' }
      );
      //Direccion de partida
      doc.text(
        doc.splitTextToSize(data.startingPoint, 57).slice(0, 2),
        55,
        92,
        { align: 'left' }
      );
      //Fecha de inicio de traslado
      let transferDate: {
        year: number;
        month: string;
        day: string;
        hours: number;
        minutes: string;
      } = null;
      if (data.transferDate instanceof Date) {
        transferDate = this.getDateFromSec(data.transferDate.valueOf() / 1000);
      } else {
        transferDate = this.getDateFromSec(data.transferDate['seconds']);
      }
      doc.text(
        `${transferDate.day}/${transferDate.month}/${transferDate.year}`,
        145,
        92,
        { align: 'left' }
      );
      //Item list
      for (let i = 0; i < 15 && itemIndex < itemsNumber; itemIndex++, i++) {
        //Number
        doc.text((itemIndex + 1).toString().padStart(2, '0'), 25, 114 + 6 * i, {
          align: 'center',
        });
        //code
        doc.text(data.productList[itemIndex].mainCode, 34, 114 + 6 * i, {
          align: 'left',
        });
        //description
        doc.text(
          doc.splitTextToSize(data.productList[itemIndex].description, 69)[0],
          57,
          114 + 6 * i,
          { align: 'left', maxWidth: 69 }
        );
        //cantidad
        doc.text(
          data.productList[itemIndex].quantity.toString().padStart(2, '0'),
          136,
          114 + 6 * i,
          { align: 'center' }
        );
        //unit of measurement
        doc.text(data.productList[itemIndex].unit, 165, 114 + 6 * i, {
          align: 'center',
        });
        //weight
        doc.text(
          data.productList[itemIndex].totalWeight
            ? data.productList[itemIndex].totalWeight
                .toString()
                .padStart(2, '0')
            : '--',
          185,
          114 + 6 * i,
          { align: 'center' }
        );
      }
      //Footer
      //Cross of reason
      let reasonDim = this.findWaybillTransferReason(data.transferReason);
      doc.text('X', reasonDim.x, reasonDim.y, { align: 'center' });
      //Observation
      doc.text(
        doc.splitTextToSize(data.observations, 105).slice(0, 6).join(' '),
        18,
        255,
        { align: 'left', maxWidth: 105 }
      );
      //New page
      if (itemIndex != itemsNumber) {
        doc.addPage('a4', 'portrait');
      }
    }

    let blob = doc.output('blob');

    saveAs(blob);
  }

  findWaybillTransferReason(reason: Waybill['transferReason']): {
    x: number;
    y: number;
  } {
    let i = TRANSFER_REASON.findIndex(
      (el) => el.toLowerCase() == reason.toLowerCase()
    );
    let x = 0;
    if (i < 5) {
      x = 58.5;
      switch (i) {
        case 0:
          return { x, y: 218.3 };
        case 1:
          return { x, y: 224.2 };
        case 2:
          return { x, y: 229.5 };
        case 3:
          return { x, y: 234.8 };
        case 4:
          return { x, y: 240.6 };
      }
    } else if (i < 9) {
      x = 120;
      switch (i) {
        case 5:
          return { x, y: 218.3 };
        case 6:
          return { x, y: 225 };
        case 7:
          return { x, y: 230 };
        case 8:
          return { x, y: 235.2 };
      }
    } else {
      x = 189.5;
      switch (i) {
        case 5:
          return { x, y: 220.3 };
        case 6:
          return { x, y: 226.2 };
        case 7:
          return { x, y: 231.4 };
        case 8:
          return { x, y: 236.6 };
        case 8:
          return { x, y: 242.5 };
      }
    }
  }

  getDateFromSec(seconds: number): {
    year: number;
    month: string;
    day: string;
    hours: number;
    minutes: string;
  } {
    let date = new Date(1970);
    date.setSeconds(seconds);
    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    let year = date.getFullYear();
    let hours = date.getHours();
    let minutes = '' + date.getMinutes();

    if (minutes.length < 2) minutes = '0' + minutes;
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return { year, month, day, hours, minutes };
  }

  //Used to update mayorist user. Delete
  // updateUser(user: User[]){
  //   let batch = this.afs.firestore.batch()
  //   user.forEach( el => {

  //     let coll = this.afs.firestore.collection(this.userRef).doc(el.uid)
  //     let bool = el.customerType == 'Mayorista'

  //     batch.update(coll, {mayoristUser: bool})

  //   })
  //   return batch

  // }

  resetStocks() {
    return this.afs
      .collection(this.productsListRef)
      .get({ source: 'server' })
      .pipe(
        tap((res) => {
          let batch = this.afs.firestore.batch();
          let products: Product[] = res.docs.map((el) => <Product>el.data());
          products.forEach((el) => {
            let prodDoc = this.afs.firestore
              .collection(this.productsListRef)
              .doc(el.id);
            let elNew = { ...el };
            elNew.products.forEach((el2) => {
              el2.realStock = 0;
              el2.reservedStock = 0;
              el2.virtualStock = 0;
              el2.stock = 0;
            });
            elNew.warehouseStock = null;
            batch.update(prodDoc, {
              products: elNew.products,
              warehouseStock: null,
            });
          });
          batch.commit().then(
            (res) => {
              console.log('success!');
            },
            (err) => {
              console.log('error');
            }
          );
        })
      );
  }
}
