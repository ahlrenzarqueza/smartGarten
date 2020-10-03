import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { FooterbrandModule } from '../footerbrand/footerbrand.module';
import { ModalListdevicesModule } from '../modal-listdevices/modal-listdevices.module';
// import { Diagnostic } from '@ionic-native/'
// import { Diagnostic } from '@ionic-native/diagnostic/ngx'

// import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
// import { Geolocation } from '@ionic-native/geolocation/ngx';
// import { LocationAccuracy } from '@ionic-native/location-accuracy/ngx';

import { IonicModule } from '@ionic/angular';

import { WelcomePage } from './welcome.page';

const routes: Routes = [
  {
    path: '',
    component: WelcomePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FooterbrandModule,
    ModalListdevicesModule,
    // Diagnostic,
    // AndroidPermissions,
    // Geolocation,
    // LocationAccuracy,
    RouterModule.forChild(routes)
  ],
  declarations: [WelcomePage]
})
export class WelcomePageModule {}
