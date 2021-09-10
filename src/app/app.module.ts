import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatSnackBarModule,
  MAT_SNACK_BAR_DEFAULT_OPTIONS,
} from '@angular/material/snack-bar';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { AngularFireModule } from '@angular/fire';
import { environment } from 'src/environments/environment';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ServiceWorkerModule } from '@angular/service-worker';

import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';

import { USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/auth';
import { USE_EMULATOR as USE_FIRESTORE_EMULATOR } from '@angular/fire/firestore';
// import { USE_EMULATOR as USE_FUNCTIONS_EMULATOR } from '@angular/fire/functions';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule,
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(
      environment.firebaseConfig,
      'aitec-ecommerce'
    ),
    MatSnackBarModule,
    LazyLoadImageModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
    }),
    HttpClientModule,
    MatDialogModule,
  ],
  providers: [
    //DatePipe,
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 5000 } },
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    {
      provide: USE_AUTH_EMULATOR,
      useValue: environment.useEmulators ? ['localhost', 9099] : undefined,
    },
    {
      provide: USE_FIRESTORE_EMULATOR,
      useValue: environment.useEmulators ? ['localhost', 8080] : undefined,
    },
    // {
    //   provide: USE_FUNCTIONS_EMULATOR,
    //   useValue: environment.useEmulators ? ['localhost', 5001] : undefined,
    // },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
