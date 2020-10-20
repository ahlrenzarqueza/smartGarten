import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Router } from '@angular/router'
import {Storage} from '@ionic/storage'
// import { IonApp } from "@ionic/angular";
// import { Diagnostic } from '@ionic-native/diagnostic/ngx'

// import { welcome }  from '/welcome/welcome';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private router: Router,
    private storage:Storage,
    // private diagnostic : Diagnostic
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.hide();
      this.splashScreen.hide();
      // this.router.navigateByUrl('/tabs');
      // this.storage.get('wifiSetFlag').then(val=>{(val == null)?this.router.navigateByUrl('/welcome'):this.router.navigateByUrl('/tabs')})
      // this.router.navigateByUrl('/tabs')

      this.router.navigateByUrl('/welcome');
    });
  }
}
