import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
// import {} from '@angula'
import { HttpClientModule, HttpClient } from "@angular/common/http";
import {RestService} from '../app/rest.service'
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Diagnostic } from '@ionic-native/diagnostic/ngx'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LocationAccuracy } from '@ionic-native/location-accuracy/ngx'
import { InAppBrowser} from '@ionic-native/in-app-browser/ngx'
import { IonicStorageModule } from "@ionic/storage";
import { Platform } from "@ionic/angular";
import { NetworkInterface } from '@ionic-native/network-interface/ngx';
import { OpenNativeSettings } from '@ionic-native/open-native-settings/ngx';
import { Zeroconf } from "@ionic-native/zeroconf/ngx";
@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [BrowserModule,HttpClientModule ,IonicModule.forRoot(), AppRoutingModule,IonicStorageModule.forRoot()],
  providers: [
    Diagnostic,
    StatusBar,
    SplashScreen,
    LocationAccuracy,
    InAppBrowser,
    RestService,
    Platform,
    NetworkInterface,
    Zeroconf,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    OpenNativeSettings
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
