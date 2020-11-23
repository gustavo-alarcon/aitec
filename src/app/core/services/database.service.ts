import { Sale, saleStatusOptions } from './../models/sale.model';
import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';
import { MermaTransfer, Product } from '../models/product.model';
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
import { Observable, concat, of, interval, BehaviorSubject, from } from 'rxjs';
import { User } from '../models/user.model';
import { AngularFireStorage } from '@angular/fire/storage';
import { Recipe } from '../models/recipe.model';
import { Unit, PackageUnit } from '../models/unit.model';
import { Buy, BuyRequestedProduct } from '../models/buy.model';
import * as firebase from 'firebase';
import { Package } from '../models/package.model';
import { AngularFireAuth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  public version: string = 'V0.0.0r';
  public isOpen: boolean = false;
  public isAdmin: boolean = false;

  public order: {
    product: any;
    quantity: number;
    chosenOptions?: Product[];
  }[] = [];

  public orderObs = new BehaviorSubject<
    {
      product: any;
      quantity: number;
      chosenOptions?: Product[];
    }[]
  >([]);
  public orderObs$ = this.orderObs.asObservable();

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

  
  public products = [
    {
      additionalDescription: 'Laptop Asus Vivobook 15 F512da Ryzen5 8gbram 512gbssd Vega 8',
      alertMinimum: 0,
      category: "PCs y laptops",
      subcategory:'Laptops',
      brand:'Asus',
      caracteristicas:['Número de modelo: F512DA-RS51','Tipo de memoria RAM DDR4','Tamaño de la pantalla 15.6 "','Velocidad de la memoria RAM 2400 MHz','Puertos de video HDMI','Tipo de batería Polímero de litio'],
      createdAt: null,
      createdBy: null,
      description: 'Laptop Asus Vivobook 15 F512da Ryzen5 8gbram 512gbssd Vega 8',
      id: 1,
      photoPath: null,
      photoURL:
        'https://http2.mlstatic.com/laptop-asus-vivobook-15-f512da-ryzen5-8gbram-512gbssd-vega-8-D_NQ_NP_899841-MPE42614169971_072020-O.webp',
      gallery:[
        'https://http2.mlstatic.com/laptop-asus-vivobook-15-f512da-ryzen5-8gbram-512gbssd-vega-8-D_NQ_NP_899841-MPE42614169971_072020-O.webp',
        'https://http2.mlstatic.com/laptop-asus-vivobook-15-f512da-ryzen5-8gbram-512gbssd-vega-8-D_NQ_NP_843375-MPE43506889729_092020-O.webp',
        'https://http2.mlstatic.com/laptop-asus-vivobook-15-f512da-ryzen5-8gbram-512gbssd-vega-8-D_NQ_NP_834858-MPE42614175882_072020-O.webp',
        'https://http2.mlstatic.com/laptop-asus-vivobook-15-f512da-ryzen5-8gbram-512gbssd-vega-8-D_NQ_NP_801753-MPE42614214209_072020-O.webp'
      ],
      price: 4305,
      priority: 1,
      promo: true,
      promoData: {price:2969,offer:31},
      published: true,
      realStock: 20,
      sku: 'AITEC-000001',
    },
    {
      additionalDescription: 'LA EMPRESA COMPUKAED EIRL AHORA TE TRAE: MINI HUB USB 3.0 DE 4 PUERTOS MARCA ACASIS COLOR NEGRO - CONECTA USB 3.0 DISCOS EXTERNOS, CELULARES Y MAS A TU PC O LAPTOP',
      category: 'Computo',
      subcategory:'Accesorios y Cables',
      brand:'ACASIS',
      caracteristicas:['Número de modelo: AB3-L42','Tipo de interfaz: USB 3.0','Certificación: CE FCC','Puertos: 4','Estándar: USB 3.0','Cable Longitud: 20 cm'],
      createdAt: null,
      createdBy: null,
      description: 'Mini Hub Usb 3.0 De 4 Puertos Acasis Negro Para Pc O Laptop',
      id: 2,
      photoPath: null,
      photoURL:
        'https://http2.mlstatic.com/mini-hub-usb-30-de-4-puertos-acasis-negro-para-pc-o-laptop-D_NQ_NP_620726-MPE31253501128_062019-F.webp',
      gallery:[
        'https://http2.mlstatic.com/mini-hub-usb-30-de-4-puertos-acasis-negro-para-pc-o-laptop-D_NQ_NP_620726-MPE31253501128_062019-F.webp',
        'https://http2.mlstatic.com/mini-hub-usb-30-de-4-puertos-acasis-negro-para-pc-o-laptop-D_NQ_NP_660861-MPE31253512199_062019-F.webp'
      ],
      price: 50,
      priority: 1,
      promo: false,
      promoData: null,
      published: true,
      realStock: 45,
      sku: 'AITEC-000002'
    },
    {
      additionalDescription: 'Azul Internet Ethernet LAN CAT5e Cable de red para computadora Router de módem Listo para conectar con los conectores rj 45 puestos',
      category: 'Computo',
      subcategory:'Accesorios y Cables',
      brand:'CAT 5E',
      caracteristicas:['Artículo: Cable Cat 5','Color: azul','Compatible con redes Base T 10, 1000 y 100'],
      createdAt: null,
      reatedBy: null,
      description: 'Cable Internet Utp Lan Red Cat 5e Ethernet 10 Metros',
      id: 3,
      photoPath: null,
      photoURL:
        'https://http2.mlstatic.com/cable-internet-utp-lan-red-cat-5e-ethernet-10-20-30-metros-D_NQ_NP_723830-MPE31255511831_062019-F.webp',
      gallery:[
        'https://http2.mlstatic.com/cable-internet-utp-lan-red-cat-5e-ethernet-10-20-30-metros-D_NQ_NP_723830-MPE31255511831_062019-F.webp',
        'https://http2.mlstatic.com/cable-internet-utp-lan-red-cat-5e-ethernet-10-20-30-metros-D_NQ_NP_616186-MPE31255528211_062019-O.webp',
        'https://http2.mlstatic.com/cable-internet-utp-lan-red-cat-5e-ethernet-10-20-30-metros-D_NQ_NP_716054-MPE31255523486_062019-O.webp'
      ],
      price: 12,
      priority: 1,
      promo: false,
      promoData: null,
      published: true,
      realStock: 15,
      sku: 'AITEC-000003'
    },
    {
      additionalDescription: 'Mando PS3 Dual Shock 3 Diseños exclusivos colores disponible: negro, azul, rojo producto nuevo sellado en caja',
      category: 'Gamer',
      subcategory:'Accesorios',
      brand:'Sony-rplik',
      caracteristicas:['Modelo: CHARCOAL','Tipo de control Gamepad','Largo 92.2 mm','Altura 215.9 mm','Ancho 141.22 mm'],
      createdAt: null,
      createdBy: null,
      description: 'Mando Ps3 Sony Dual Shock 3 Camuflado Diseño Exclusivo',
      id: 4,
      photoPath: null,
      photoURL:
        'https://http2.mlstatic.com/mando-ps3-sony-dual-shock-3-camuflado-diseno-exclusivo-D_NQ_NP_860441-MPE42901228712_072020-F.webp',
      gallery:[
        'https://http2.mlstatic.com/mando-ps3-sony-dual-shock-3-camuflado-diseno-exclusivo-D_NQ_NP_860441-MPE42901228712_072020-F.webp',
        'https://http2.mlstatic.com/mando-ps3-sony-dual-shock-3-camuflado-diseno-exclusivo-D_NQ_NP_920139-MPE42901314104_072020-O.webp'
      ],
      price: 79.99,
      priority: 1,
      promo: false,
      promoData: null,
      published: true,
      realStock: 25,
      sku: 'AITEC-000004'
    },
    {
      additionalDescription: 'Audifonos Gold Wireless Headset Playstation - Negro',
      category: 'Gamer',
      subcategory:'Audio',
      brand:'PlayStation',
      caracteristicas:['Modelo: PlayStation Gold Wireless Headset','Línea: Serie Gold'],
      createdAt: null,
      createdBy: null,
      description: 'Audifonos Gold Wireless Headset Playstation - Negro',
      id: 'owMj9QN73vPV5JE0k37a',
      photoPath: null,
      photoURL:
        'https://http2.mlstatic.com/audifonos-gold-wireless-headset-playstation-negro-D_NQ_NP_606080-MPE40419866899_012020-F.webp',
      gallery:[
        'https://http2.mlstatic.com/audifonos-gold-wireless-headset-playstation-negro-D_NQ_NP_606080-MPE40419866899_012020-F.webp',
        'https://http2.mlstatic.com/audifonos-gold-wireless-headset-playstation-negro-D_NQ_NP_973934-MPE40419866996_012020-O.webp',
        'https://http2.mlstatic.com/audifonos-gold-wireless-headset-playstation-negro-D_NQ_NP_900774-MPE40419870934_012020-O.webp'
      ],
      price: 357,
      priority: 1,
      promo: false,
      promoData: null,
      published: true,
      realStock: 40,
      sku: 'AITEC-000005'
    },
    {
      additionalDescription: 'NO COMPRE SOPORTES DE PLÁSTICO QUE PONEN EN RIESGO SU LAPTOP, COMPRE DE ALUMINIO QUE ES LUJOSO, LIVIANO, FUERTE Y DURADERO, NO SE OXIDA NI RAJA O DETERIORA. NUESTRO PRODUCTO LE DURARÁ MUCHOS AÑOS. Compre el original de aluminio grueso y estructura solida. No imitaciones de metal pintado que se despinta y oxida.',
      category: "PCs y laptops",
      subcategory:'Accesorios',
      brand:'Ivoler',
      caracteristicas:['Modelo: Ivoler Business','Color: Plateado','Tipo de soporte Portátil Plegable', 'Materiales Aluminio Aeroespacial', 'Tamaño máximo soportado 17 "'],
      createdAt: null,
      createdBy: null,
      description: 'Soporte Portátil Plegable De Aluminio Para Laptop iPad Mac',
      id: 'owMj9QN73vPV5JE0k37a',
      photoPath: null,
      photoURL:
        'https://http2.mlstatic.com/soporte-portatil-plegable-de-aluminio-para-laptop-ipad-mac-D_NQ_NP_713662-MPE43478078915_092020-O.webp',
      gallery:[
        'https://http2.mlstatic.com/soporte-portatil-plegable-de-aluminio-para-laptop-ipad-mac-D_NQ_NP_713662-MPE43478078915_092020-O.webp',
        'https://http2.mlstatic.com/para-laptop-soporte-D_NQ_NP_654877-MPE43478147398_092020-O.webp',
        'https://http2.mlstatic.com/soporte-para-laptop-D_NQ_NP_664637-MPE43477404336_092020-O.webp',
        'https://http2.mlstatic.com/soporte-para-laptop-D_NQ_NP_749227-MPE43478061987_092020-O.webp',
        'https://http2.mlstatic.com/para-laptop-soporte-D_NQ_NP_639794-MPE43478210190_092020-O.webp',
        'https://http2.mlstatic.com/soporte-portatil-plegable-de-aluminio-para-laptop-ipad-mac-D_NQ_NP_698629-MPE43478147399_092020-O.webp'
      ],
      price: 99,
      priority: 1,
      promo: false,
      promoData: null,
      published: true,
      realStock: 32,
      sku: 'AITEC-000006'
    },
    {
      additionalDescription: '',
      category: 'Computo',
      subcategory:'Procesadores',
      brand:'AMD',
      caracteristicas:['PROCESADOR AMD RYZEN 7 3700X 3.6GHZ','PLACA GIGABYTE A520M H', 'MEMORIA 16GB 3000MHZ','DISCO SOLIDO 512GB','CASE THERMALTAKE V100 450w Reales','TECLADO Y MOUSE'],
      createdAt: null,
      createdBy: null,
      description: 'Pc Ryzen 7 3700x 3.6ghz 16gb 512gb Ssd Gtx 1050 4gb 600w',
      id: 'owMj9QN73vPV5JE0k37a',
      photoPath: null,
      photoURL:
        'https://http2.mlstatic.com/pc-ryzen-7-3700x-36ghz-16gb-512gb-ssd-gtx-1050-4gb-600w-D_NQ_NP_860160-MPE43816826343_102020-O.webp',
      gallery:[
        'https://http2.mlstatic.com/pc-ryzen-7-3700x-36ghz-16gb-512gb-ssd-gtx-1050-4gb-600w-D_NQ_NP_860160-MPE43816826343_102020-O.webp',
        'https://http2.mlstatic.com/pc-ryzen-7-3700x-36ghz-16gb-512gb-ssd-gtx-1050-4gb-600w-D_NQ_NP_841031-MPE43816816782_102020-O.webp',
        'https://http2.mlstatic.com/pc-ryzen-7-3700x-36ghz-16gb-512gb-ssd-gtx-1050-4gb-600w-D_NQ_NP_817290-MPE43816816829_102020-O.webp'
      ],
      price: 3.799,
      priority: 1,
      promo: false,
      promoData: null,
      published: true,
      realStock: 14,
      sku: 'AITEC-000007'
    },
    {
      additionalDescription: 'CABLE SATA 6Gb/s para discos Sólidos, alta velocidad',
      category: 'Computo',
      subcategory:'Accesorios y Cables',
      brand:'MSI',
      caracteristicas:['Modelo: Cable SATA lll','Conector de salida: SATA', 'Conector de entrada: SATA','Color: Negro','Longitud: 40cm'],
      createdAt: null,
      createdBy: null,
      description: 'Cable Sata 6gb/s Para Discos Solidos, Pack 5u',
      id: 'owMj9QN73vPV5JE0k37a',
      photoPath: null,
      photoURL:
        'https://http2.mlstatic.com/cable-sata-6gbs-para-discos-solidos-pack-5u-D_NQ_NP_658780-MPE31499091168_072019-O.webp',
      gallery:[
        'https://http2.mlstatic.com/cable-sata-6gbs-para-discos-solidos-pack-5u-D_NQ_NP_658780-MPE31499091168_072019-O.webp'
      ],
      price: 20,
      priority: 1,
      promo: false,
      promoData: null,
      published: true,
      realStock: 65,
      sku: 'AITEC-000008'
    },
    {
      additionalDescription: 'Pc Ryzen 7 3700x 3.6ghz |16gb|1tb-ssd+1tb|rx 5500 8gb|750w',
      category: 'Computo',
      subcategory:'Procesadores',
      brand:'AMD',
      caracteristicas:['Modelo: RYZEN 7 3700X 3.6Ghz','RAM 16 GB', 'Sistema operativo Windows 10','PROCESADOR AMD RYZEN 7 3700X 3.6GHZ',' PLACA GIGABYTE A520M H','TARJETA VIDEO RADEON RX 5500 8GB GDDR5','MEMORIA 16GB 3200MHZ','DISCO SOLIDO 1TB PCIEX M.2','DISCO DURO 1TB HDD'],
      createdAt: null,
      createdBy: null,
      description: 'Pc Ryzen 7 3700x 3.6ghz |16gb|1tb-ssd+1tb|rx 5500 8gb|750w',
      id: 'owMj9QN73vPV5JE0k37a',
      photoPath: null,
      photoURL:
        'https://http2.mlstatic.com/pc-ryzen-7-3700x-36ghz-16gb1tb-ssd-1tbrx-5500-8gb750w-D_NQ_NP_864520-MPE43652725854_102020-F.webp',
      gallery:[
        'https://http2.mlstatic.com/pc-ryzen-7-3700x-36ghz-16gb1tb-ssd-1tbrx-5500-8gb750w-D_NQ_NP_864520-MPE43652725854_102020-F.webp',
        'https://http2.mlstatic.com/pc-ryzen-7-3700x-36ghz-16gb1tb-ssd-1tbrx-5500-8gb750w-D_NQ_NP_993725-MPE43652738638_102020-O.webp',
        'https://http2.mlstatic.com/pc-ryzen-7-3700x-36ghz-16gb1tb-ssd-1tbrx-5500-8gb750w-D_NQ_NP_903263-MPE43817087940_102020-O.webp'
      ],
      price: 5.060,
      priority: 1,
      promo: false,
      promoData: null,
      published: true,
      realStock: 12,
      sku: 'AITEC-000009'
    },
    {
      additionalDescription: 'APPLE IPAD AIR 2019 10.5" 64GB SOLO WIFI COLORES VARIADOS',
      category: 'Tablets y smartphones',
      subcategory:'Tablets',
      brand:'Apple',
      caracteristicas:['Modelo: iPad Air','Tamaño de la pantalla: 10.5 "', 'Nombre del sistema operativo iOS','Conectividad Bluetooth,Conector lightning,Wi-Fi','Capacidad de la batería 5124 mAh','Sensores Acelerómetro,Barómetro,Sensor-G,Sensor de luz ambiente,Touch ID'],
      createdAt: null,
      createdBy: null,
      description: 'Apple iPad Air 10.5 2019 64gb Solo Wifi Colores Variados!!!',
      id: 'owMj9QN73vPV5JE0k37a',
      photoPath: null,
      photoURL:
        'https://http2.mlstatic.com/apple-ipad-air-105-2019-64gb-solo-wifi-colores-variados-D_NQ_NP_629171-MPE41839959793_052020-O.webp',
      gallery:[
        'https://http2.mlstatic.com/apple-ipad-air-105-2019-64gb-solo-wifi-colores-variados-D_NQ_NP_629171-MPE41839959793_052020-O.webp',
        'https://http2.mlstatic.com/apple-ipad-air-105-2019-64gb-solo-wifi-colores-variados-D_NQ_NP_705010-MPE41839952954_052020-O.webp'
      ],
      price: 3508.65,
      priority: 1,
      promo: true,
      promoData:{price:2599,offer:25},
      published: true,
      realStock: 10,
      sku: 'AITEC-000010'
    },
    {
      additionalDescription: 'Ser un streamer implica estar conectado con tu audiencia desde tu propia perspectiva única. Compartas teorías sobre juegos o sueltes comentarios ingeniosos, tu voz es tu herramienta definitiva para provocar emociones, mostrar tu frustración y tener a tu público enganchado. Ahora, puedes llevar tu audio al siguiente nivel con el micrófono Razer Seiren Elite y dejar que tu personalidad brille de verdad.',
      category: 'Gamer',
      subcategory:'Microfono',
      brand:'Razer',
      caracteristicas:['Frecuencia de muestreo: min 44.1kHz / max 48kHz',' Velocidad de bits: 16 bits', 'Cápsula: cápsula dinámica única','Conectividad: solo USB','Respuesta de frecuencia: 50Hz-20kHz'],
      createdAt: null,
      createdBy: null,
      description: 'Micrófono Profesional Razer Seiren Elite',
      id: 'owMj9QN73vPV5JE0k37a',
      photoPath: null,
      photoURL:
        'https://http2.mlstatic.com/microfono-profesional-razer-seiren-elite-D_NQ_NP_971722-MPE31255505888_062019-F.webp',
      gallery:[
        'https://http2.mlstatic.com/microfono-profesional-razer-seiren-elite-D_NQ_NP_971722-MPE31255505888_062019-F.webp',
        'https://http2.mlstatic.com/microfono-profesional-razer-seiren-elite-D_NQ_NP_882408-MPE28873352427_122018-O.webp',
        'https://http2.mlstatic.com/microfono-profesional-razer-seiren-elite-D_NQ_NP_950441-MPE28873393526_122018-O.webp'
      ],
      price: 800,
      priority: 1,
      promo: true,
      promoData: {price:720,offer:10},
      published: true,
      realStock: 22,
      sku: 'AITEC-000011'
    },
    {
      additionalDescription: 'Silla Gamer X Rocker Pedestal Console Bolt 2.1 Bt',
      category: 'Gamer',
      subcategory:'Sillas Gamer',
      brand:'X Rocker',
      caracteristicas:['Modelo: Bolt','Material del tapizado: Cuero sintético'],
      createdAt: null,
      createdBy: null,
      description: 'Silla Gamer X Rocker Pedestal Console Bolt 2.1 Bt',
      id: 'owMj9QN73vPV5JE0k37a',
      photoPath: null,
      photoURL:
        'https://http2.mlstatic.com/silla-gamer-x-rocker-pedestal-console-bolt-21-bt-D_NQ_NP_826499-MPE43981616694_112020-O.webp',
      gallery:[
        'https://http2.mlstatic.com/silla-gamer-x-rocker-pedestal-console-bolt-21-bt-D_NQ_NP_826499-MPE43981616694_112020-O.webp',
        'https://http2.mlstatic.com/silla-gamer-x-rocker-pedestal-console-bolt-21-bt-D_NQ_NP_646770-MPE43981616695_112020-O.webp',
        'https://http2.mlstatic.com/silla-gamer-x-rocker-pedestal-console-bolt-21-bt-D_NQ_NP_881889-MPE43981616692_112020-O.webp',
        'https://http2.mlstatic.com/silla-gamer-x-rocker-pedestal-console-bolt-21-bt-D_NQ_NP_979143-MPE43981616691_112020-O.webp'
      ],
      price: 2599.9,
      priority: 1,
      promo: true,
      promoData: {price:2449.90,offer:5},
      published: true,
      realStock: 8,
      sku: 'AITEC-000012'
    },
    {
      additionalDescription: 'El mouse icono en la historia del gaming, con más de 10 millones de ventas a nivel mundial, además de ser uno de los más celebrados y premiados por múltiples medios especializados, AHORA SE PUSO MEJOR: Presentamos el Razer Deathadder V2.',
      category: 'Gamer',
      subcategory:'Mouse',
      brand:'RAZZER',
      caracteristicas:['Modelo: DeathAdder V2','Tipo de mouse OPTICO', 'Tipo de sensor RAZER FOCUS + SENSOR OPTICO','Resolución del sensor 20000 dpi','Cantidad de botones 8','Alcance máximo 2.1 m'],
      createdAt: null,
      createdBy: null,
      description: 'Mouse Razer Deathadder V2',
      id: 'owMj9QN73vPV5JE0k37a',
      photoPath: null,
      photoURL:
        'https://http2.mlstatic.com/mouse-razer-deathadder-v2-D_NQ_NP_948681-MPE41845732628_052020-O.webp',
      gallery:[
        'https://http2.mlstatic.com/mouse-razer-deathadder-v2-D_NQ_NP_948681-MPE41845732628_052020-O.webp',
        'https://http2.mlstatic.com/mouse-razer-deathadder-v2-D_NQ_NP_891842-MPE41845737590_052020-O.webp',
        'https://http2.mlstatic.com/mouse-razer-deathadder-v2-D_NQ_NP_750464-MPE41845732615_052020-O.webp',
        'https://http2.mlstatic.com/mouse-razer-deathadder-v2-D_NQ_NP_852646-MPE43268267077_082020-O.webp',
        'https://http2.mlstatic.com/mouse-razer-deathadder-v2-D_NQ_NP_913891-MPE41845694926_052020-O.webp'
      ],
      price: 189,
      priority: 1,
      promo: true,
      promoData: {price:168,offer:11},
      published: true,
      realStock: 55,
      sku: 'AITEC-000013'
    }
  ];

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

  getCategoriesDoc(): Observable<any> {
    return this.generalConfigDoc.get().pipe(
      map((snap) => {
        return snap.data()['categories'];
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

  getCategories(){
    return this.afs
    .collection(`/db/aitec/config/generalConfig/categories`, (ref) =>
      ref.orderBy('createdAt', 'asc')
    )
    .valueChanges()
    .pipe(shareReplay(1));
  }

  getBrands(){
    return this.afs
    .collection(`/db/aitec/config/generalConfig/brands`, (ref) =>
      ref.orderBy('createdAt', 'asc')
    )
    .valueChanges()
    .pipe(shareReplay(1));
  }
  
  getDelivery(){
    return this.afs
    .collection(`/db/aitec/config/generalConfig/delivery`, (ref) =>
      ref.orderBy('createdAt', 'asc')
    )
    .valueChanges()
    .pipe(shareReplay(1));
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

  getProductsListValueChanges(): Observable<Product[]> {
    return this.afs
      .collection<Product>(this.productsListRef, (ref) =>
        ref.orderBy('priority', 'desc')
      )
      .valueChanges()
      .pipe(shareReplay(1));
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

  editCategories(categories: string[]): firebase.default.firestore.WriteBatch {
    let categoriesRef: AngularFirestoreDocument<GeneralConfig> = this
      .generalConfigDoc;
    let batch = this.afs.firestore.batch();
    batch.set(categoriesRef.ref, { categories }, { merge: true });
    return batch;
  }

  editUnits(
    units: Unit[] | PackageUnit[],
    packageUnit: boolean
  ): firebase.default.firestore.WriteBatch {
    let unitsRef: AngularFirestoreDocument<GeneralConfig> = this
      .generalConfigDoc;
    let batch = this.afs.firestore.batch();
    batch.set(
      unitsRef.ref,
      packageUnit ? { packagesUnits: units } : { units },
      { merge: true }
    );
    return batch;
  }

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
  }

  transferStock(
    toMerma: boolean,
    quantity: number,
    observations: string,
    product: Product,
    user: User
  ): firebase.default.firestore.WriteBatch {
    let productRef: DocumentReference = this.afs.firestore
      .collection(this.productsListRef)
      .doc(product.id);
    let transferHistoryRef: DocumentReference = this.afs.firestore
      .collection(this.productsListRef + `/${product.id}/mermaTransfer`)
      .doc();

    let productData: {
      realStock: firebase.default.firestore.FieldValue;
      virtualStock: firebase.default.firestore.FieldValue;
      mermaStock: firebase.default.firestore.FieldValue;
    };
    let mermaTransferData: MermaTransfer = {
      date: new Date(),
      id: transferHistoryRef.id,
      productId: product.id,
      quantity,
      toMerma,
      user,
      observations,
    };

    let batch = this.afs.firestore.batch();

    //To Merma
    if (toMerma) {
      productData = {
        realStock: firebase.default.firestore.FieldValue.increment(
          -1 * quantity
        ),
        virtualStock: firebase.default.firestore.FieldValue.increment(
          -1 * quantity
        ),
        mermaStock: firebase.default.firestore.FieldValue.increment(quantity),
      };
    }
    //To Stock
    else {
      productData = {
        realStock: firebase.default.firestore.FieldValue.increment(quantity),
        virtualStock: firebase.default.firestore.FieldValue.increment(quantity),
        mermaStock: firebase.default.firestore.FieldValue.increment(
          -1 * quantity
        ),
      };
    }

    batch.update(productRef, productData);
    batch.set(transferHistoryRef, mermaTransferData);

    return batch;
  }

  getMermaTransferHistory(id: string): Observable<MermaTransfer[]> {
    return this.afs
      .collection<MermaTransfer>(
        this.productsListRef + `/${id}/mermaTransfer`,
        (ref) => ref.orderBy('date', 'desc')
      )
      .valueChanges();
  }

  getMermaTransferHistoryDate(date: {
    begin: Date;
    end: Date;
  }): Observable<MermaTransfer[]> {
    let end = date.end;
    end.setHours(23);
    end.setMinutes(59);
    end.setSeconds(59);

    return this.afs
      .collectionGroup<MermaTransfer>('mermaTransfer', (ref) =>
        ref
          .where('date', '<=', date.end)
          .where('date', '>=', date.begin)
          .orderBy('date', 'desc')
      )
      .valueChanges();
  }

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

  deleteProduct(
    product: Product
  ): Observable<firebase.default.firestore.WriteBatch> {
    let productRef: DocumentReference = this.afs.firestore
      .collection(this.productsListRef)
      .doc(product.id);
    let batch = this.afs.firestore.batch();
    batch.delete(productRef);
    return this.deletePhotoProduct(product.photoPath).pipe(
      takeLast(1),
      mapTo(batch)
    );
  }

  uploadPhotoProduct(id: string, file: File): Observable<string | number> {
    const path = `/productsList/pictures/${id}-${file.name}`;

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

  deletePhotoProduct(path: string): Observable<any> {
    let st = this.storage.ref(path);
    return st.delete().pipe(takeLast(1));
  }

  editProductPromo(
    productId: string,
    promo: boolean,
    promoData: Product['promoData'] | Package['promoData'],
    pack?: boolean
  ): firebase.default.firestore.WriteBatch {
    let productRef: DocumentReference;
    let batch = this.afs.firestore.batch();

    //Editting
    productRef = this.afs.firestore
      .collection(pack ? this.packagesListRef : this.productsListRef)
      .doc(productId);
    batch.update(productRef, {
      promo,
      promoData: {
        promoPrice: promoData.promoPrice,
        quantity: promoData.quantity,
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

  getProductRecipesValueChanges(productId: string): Observable<Recipe[]> {
    return this.afs
      .collection<Recipe>(this.recipesRef, (ref) =>
        ref.where('productsId', 'array-contains', productId)
      )
      .valueChanges();
  }

  getSalesUser(user: string): Observable<Sale[]> {
    return this.afs
      .collection<Sale>(`/db/distoProductos/sales`, (ref) =>
        ref.where('user.uid', '==', user)
      )
      .valueChanges();
  }

  //Logistics
  getBuysCorrelativeValueChanges(): Observable<number> {
    return this.getGeneralConfigDoc().pipe(
      map((res) => {
        if (res) {
          if (res.hasOwnProperty('buysCounter')) {
            return res.buysCounter + 1;
          } else {
            return 0;
          }
        } else {
          return 0;
        }
      }),
      shareReplay(1)
    );
  }

  getBuyRequests(date: { begin: Date; end: Date }): Observable<Buy[]> {
    return this.afs
      .collection<Buy>(this.buysRef, (ref) =>
        ref
          .where('requestedDate', '<=', date.end)
          .where('requestedDate', '>=', date.begin)
      )
      .valueChanges()
      .pipe(map((res) => res.sort((a, b) => b.correlative - a.correlative)));
  }

  createEditBuyRequest(
    request: Buy,
    requestedProducts: BuyRequestedProduct[],
    edit: boolean,
    oldBuyRequest: Buy
  ): Promise<void> {
    let configRef: DocumentReference = this.afs.firestore
      .collection(this.configRef)
      .doc('generalConfig');

    let buyRef: DocumentReference = !edit
      ? this.afs.firestore.collection(this.buysRef).doc()
      : this.afs.firestore.collection(this.buysRef).doc(oldBuyRequest.id);

    let buyData: Buy = request;
    buyData.id = buyRef.id;

    let requestedProductRef: DocumentReference;
    let requestedProductData: BuyRequestedProduct;

    let batch = this.afs.firestore.batch();

    if (edit) {
      //adding docs for requested products
      requestedProducts.forEach((product) => {
        requestedProductRef = this.afs.firestore
          .collection(this.buysRef + `/${buyRef.id}/buyRequestedProducts`)
          .doc(product.id);
        requestedProductData = product;
        requestedProductData.buyId = buyRef.id;
        batch.set(requestedProductRef, requestedProductData);
      });
      //deleting deleted products
      let deletedProducts = oldBuyRequest.requestedProducts.filter(
        (el) => !request.requestedProducts.find((el2) => el2 == el)
      );
      deletedProducts.forEach((productId) => {
        requestedProductRef = this.afs.firestore
          .collection(this.buysRef + `/${buyRef.id}/buyRequestedProducts`)
          .doc(productId);
        batch.delete(requestedProductRef);
      });
      //buy data
      batch.set(buyRef, buyData);

      return batch.commit();
    } else {
      return this.afs.firestore.runTransaction((transaction) => {
        // This code may get re-run multiple times if there are conflicts.
        return transaction.get(configRef).then((sfDoc) => {
          //adding docs for requested products
          requestedProducts.forEach((product) => {
            requestedProductRef = this.afs.firestore
              .collection(this.buysRef + `/${buyRef.id}/buyRequestedProducts`)
              .doc(product.id);
            requestedProductData = product;
            requestedProductData.buyId = buyRef.id;
            transaction.set(requestedProductRef, requestedProductData);
          });

          //counter
          if (!sfDoc.exists) {
            transaction.set(configRef, { buysCounter: 1 }, { merge: true });
          } else {
            let config = <GeneralConfig>sfDoc.data();

            if (!config.hasOwnProperty('buysCounter')) {
              transaction.set(configRef, { buysCounter: 1 }, { merge: true });
              buyData.correlative = 1;
              transaction.set(buyRef, buyData);
            } else {
              transaction.update(configRef, {
                buysCounter: config.buysCounter + 1,
              });
              buyData.correlative = config.buysCounter + 1;
              transaction.set(buyRef, buyData);
            }
          }
        });
      });
    }
  }

  getBuyRequestedProducts(request: string): Observable<BuyRequestedProduct[]> {
    return this.afs
      .collection<BuyRequestedProduct>(
        this.buysRef + `/${request}/buyRequestedProducts`,
        (ref) => ref.orderBy('productDescription')
      )
      .valueChanges();
  }

  getVirtualStock(product: Product): Observable<BuyRequestedProduct[]> {
    return this.afs
      .collectionGroup<BuyRequestedProduct>('buyRequestedProducts', (ref) =>
        ref.where('id', '==', product.id).where('validated', '==', false)
      )
      .valueChanges();
  }

  //Sales
  getSales(date: { begin: Date; end: Date }): Observable<Sale[]> {
    return this.afs
      .collection<Sale>(this.salesRef, (ref) =>
        ref
          .where('createdAt', '<=', date.end)
          .where('createdAt', '>=', date.begin)
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
    
    return saleRef.update({rateData});
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

  //configuracion
  getDistricts(): Observable<any> {
    return this.afs
      .collection(`/db/distoProductos/config`)
      .doc('generalConfig')
      .valueChanges()
      .pipe(
        map((res) => res['districts']),
        map((res) => {
          return res.sort((a, b) => {
            const nameA = a.name;
            const nameB = b.name;

            let comparison = 0;
            if (nameA > nameB) {
              comparison = 1;
            } else if (nameA < nameB) {
              comparison = -1;
            }
            return comparison;
          });
        }),
        shareReplay(1)
      );
  }

  getPayments(): Observable<any> {
    return this.afs
      .collection(`/db/distoProductos/config`)
      .doc('generalConfig')
      .valueChanges()
      .pipe(
        map((res) => res['payments']),
        map((res) => {
          return res.sort((a, b) => {
            const nameA = a.name;
            const nameB = b.name;

            let comparison = 0;
            if (nameA > nameB) {
              comparison = 1;
            } else if (nameA < nameB) {
              comparison = -1;
            }
            return comparison;
          });
        }),
        shareReplay(1)
      );
  }

  getConfiUsers(): Observable<User[]> {
    return this.afs
      .collection<User>(`/users`, (ref) => ref.where('role', '>=', ''))
      .valueChanges()
      .pipe(shareReplay(1));
  }

  //NUEVO

  getProduct(id: string): Observable<Product> {
    return this.afs
      .doc<Product>(`${this.productsListRef}/${id}`)
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getPackage(id): Observable<Package> {
    return this.afs
      .doc<Package>(`${this.packagesListRef}/${id}`)
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getItemsPackage(array) {
    return this.afs
      .collection<Product>(this.productsListRef, (ref) =>
        ref.where('id', 'in', array)
      )
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getProductsListCategory(category): Observable<Product[]> {
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

  getPackagesListCategory(category): Observable<Package[]> {
    return this.afs
      .collection<Package>(this.packagesListRef, (ref) =>
        ref.where('category', '==', category)
      )
      .get()
      .pipe(
        map((snap) => {
          return snap.docs.map((el) => <Package>el.data());
        })
      );
  }

  getneworder(ord) {
    let copy = [...ord];
    let newOrder: any = [...copy].map((order) => {
      if (order['chosenOptions']) {
        return order['chosenOptions'].map((el) => {
          return {
            product: el,
            quantity: 1 * order.quantity,
          };
        });
      } else {
        return [order];
      }
    });

    let otherorder = [...newOrder]
      .reduce((a, b) => a.concat(b), [])
      .map((el, index, array) => {
        let counter = 0;
        let others = [];
        let reduce = 0;
        array.forEach((al) => {
          if (al.product['id'] == el.product['id']) {
            counter++;
            others.push(al.quantity);
          }
        });
        if (counter > 1) {
          reduce = others.reduce((d, e) => d + e, 0);
        } else {
          reduce = el.quantity;
        }

        return {
          product: el.product,
          reduce: reduce,
        };
      })
      .filter(
        (dish, index, array) =>
          array.findIndex((el) => el.product['id'] === dish.product['id']) ===
          index
      );

    return otherorder;
  }

  saveTransaction(ord) {
    return this.afs.firestore.runTransaction((transaction) => {
      let promises = [];
      ord.forEach((order, ind) => {
        const sfDocRef = this.afs.firestore
          .collection(`/db/distoProductos/productsList`)
          .doc(order.product.id);

        promises.push(
          transaction
            .get(sfDocRef)
            .then((prodDoc) => {
              let newStock = prodDoc.data().virtualStock - order.reduce;
              if (newStock >= prodDoc.data().sellMinimum) {
                return {
                  isSave: true,
                  index: ind,
                };
              } else {
                return {
                  isSave: false,
                  stock:
                    prodDoc.data().virtualStock - prodDoc.data().sellMinimum,
                  index: ind,
                };
              }
            })
            .catch((error) => {
              console.log('Transaction failed: ', error);
              return {
                isSave: false,
                stock: null,
                index: ind,
              };
            })
        );
      });
      return Promise.all(promises);
    });
  }

  saveRealStock(ord, sum: boolean) {
    let newOrder = this.getneworder(ord);
    return this.afs.firestore.runTransaction((transaction) => {
      let promises = [];
      newOrder.forEach((order, ind) => {
        const sfDocRef = this.afs.firestore
          .collection(`/db/distoProductos/productsList`)
          .doc(order.product.id);

        promises.push(
          transaction
            .get(sfDocRef)
            .then((prodDoc) => {
              if (sum) {
                let newStock = prodDoc.data().realStock - order.reduce;
                transaction.update(sfDocRef, { realStock: newStock });
                if (newStock >= prodDoc.data().sellMinimum) {
                  return {
                    isSave: true,
                    product: prodDoc.data().description,
                  };
                } else {
                  return {
                    isSave: false,
                    product: prodDoc.data().id,
                  };
                }
              } else {
                let newStock = prodDoc.data().realStock + order.reduce;
                transaction.update(sfDocRef, { realStock: newStock });
                return {
                  isSave: true,
                  product: prodDoc.data().description,
                };
              }
            })
            .catch((error) => {
              console.log('Transaction failed: ', error);
              return {
                isSave: false,
                product: null,
              };
            })
        );
      });
      return Promise.all(promises);
    });
  }

  unsaveRealStock(ord, sum: boolean) {
    let newOrder = this.getneworder(ord);
    return this.afs.firestore.runTransaction((transaction) => {
      let promises = [];
      newOrder.forEach((order, ind) => {
        const sfDocRef = this.afs.firestore
          .collection(`/db/distoProductos/productsList`)
          .doc(order.product.id);

        promises.push(
          transaction
            .get(sfDocRef)
            .then((prodDoc) => {
              let newStock = prodDoc.data().realStock + order.reduce;
              let newVirtualStock = prodDoc.data().virtualStock + order.reduce;
              if (sum) {
                transaction.update(sfDocRef, {
                  realStock: newStock,
                  virtualStock: newVirtualStock,
                });
              } else {
                transaction.update(sfDocRef, { virtualStock: newVirtualStock });
              }
              return {
                isSave: true,
                product: prodDoc.data().description,
              };
            })
            .catch((error) => {
              console.log('Transaction failed: ', error);
              return {
                isSave: false,
                product: null,
              };
            })
        );
      });
      return Promise.all(promises);
    });
  }

  getProductsEntry(date: { begin: Date; end: Date }) {
    return this.afs
      .collectionGroup<BuyRequestedProduct>('buyRequestedProducts', (ref) =>
        ref
          .where('requestedDate', '<=', date.end)
          .where('requestedDate', '>=', date.begin)
      )
      .valueChanges();
  }

  getUserFinishedSales(user: User): Observable<Sale[]> {
    return this.afs.collection<Sale>(this.salesRef, 
      ref => ref.where("user.uid", "==", user.uid)
        .where("status","==", (new saleStatusOptions()).finished)
        .orderBy("createdAt", "desc").limit(5))
      .get().pipe(map((snap) => {
        return snap.docs
          .map(el => <Sale>el.data())
          .filter(el => (((el.rateData === undefined))))
      }));
  }

  getRecommendedProducts(number: number): Observable<Product[]>{
    return this.afs.collection<Product>(this.productsListRef, 
      ref => ref.orderBy("purchaseNumber", "desc").limit(number)).valueChanges();
  }
  
}
