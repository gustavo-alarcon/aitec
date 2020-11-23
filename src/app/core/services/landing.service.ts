import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LandingService {

  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private afAuth: AngularFireAuth
  ) { }

  bannerRef: `/db/aitec/config/generalConfig/banners` = `/db/aitec/config/generalConfig/banners`;
  configRef: `db/aitec/config` = `db/aitec/config`;
  generalConfigDoc = this.afs.collection(this.configRef).doc('generalConfig');

  getBanners(type: string){
    return this.afs.collection(this.bannerRef, ref => ref.where('type', '==', type))
      .valueChanges().pipe(
        shareReplay(1),
        map(items => {
        
          return items.sort((a, b) => a['position'] - b['position'])
        }),
      );
  }

  getConfig(){
    return this.generalConfigDoc.valueChanges().pipe(
      shareReplay(1)
    )
  }

  getTestimonies(){
    return this.afs
    .collection(`/db/aitec/config/generalConfig/testimonies`, (ref) =>
      ref.orderBy('createdAt', 'asc')
    )
    .valueChanges()
    .pipe(shareReplay(1));
  }

  

}

