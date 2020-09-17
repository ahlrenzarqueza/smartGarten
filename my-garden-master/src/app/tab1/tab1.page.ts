import { Component } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx'
import { HttpClient } from "@angular/common/http";
import { Platform } from "@ionic/angular";
import { NetworkInterface } from '@ionic-native/network-interface/ngx';
import { Router } from '@angular/router'
import { TabsPageModule } from '../tabs/tabs.module'
import { Events } from '@ionic/angular';
import { Zeroconf } from "@ionic-native/zeroconf/ngx";
import { Storage } from '@ionic/storage'
// import {NavController ,Tabs} from 'ionic-angular';

// declare var WifiWizard2;
// declare var WifiWizard2: any;
// @Page({
//     templateUrl :  'build/pages/tab/tab1/tab1.html'
// })
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  public get tabs(): TabsPageModule {
    return this._tabs;
  }
  public set tabs(value: TabsPageModule) {
    this._tabs = value;
  }

  constructor(private iab: InAppBrowser,
    private http: HttpClient,
    private platform: Platform,
    private storage: Storage,
    public networkInt: NetworkInterface,
    public router: Router,
    private _tabs: TabsPageModule,
    private events: Events,
    private zeroconf: Zeroconf
  ) {

    // this.zeroconf.registerAddressFamily = 'ipv4';
    // this.zeroconf.watchAddressFamily = 'ipv4'; 
    console.log('below is zeroconf');
    if (this.wifi_ip == null) {
      if (this.platform.is('ios')) {
        this.wifi_ip = "simpleplant.local";
        this.storage.set('global_wifi_ip', this.wifi_ip);
      } else {
        this.zeroconf.watch('_http._tcp.', 'local.').subscribe(result => {
          console.log(result);
          var service = result.service;
          if (result.action == 'resolved') {
            if(service.name === "simpleplant"){
              alert(result.service.ipv4Addresses[0]);
              console.log(result);
              this.wifi_ip = result.service.ipv4Addresses[0];
              this.storage.set('global_wifi_ip', this.wifi_ip);
            }            
          } else {
            console.log('service removed', result.service);
          }
        });
      }
    }
  }
  temp;
  humid;
  water;
  ph;
  wifi_ip = null;
  apiUrl;
  moist;

  ionViewDidLeave() {
    // alert("Tab1 left");
    clearInterval(this.loopResult);
  }
  ngOnDestroy() {
    clearInterval(this.loopResult);
    // alert('page destroyed');
  }

  ionViewWillEnter() {


    if (this.loopResult != null) {
      clearInterval(this.loopResult);
    }

    if (this.wifi_ip == null) {
      if (this.platform.is('ios')) {
        this.wifi_ip = "simpleplant.local";
      } else {
        this.zeroconf.watch('_http._tcp.', 'local.').subscribe(result => {
          console.log(result);
          var service = result.service;
          if (result.action == 'resolved') {
            if(service.name === "simpleplant"){
              // alert(result.service.ipv4Addresses[0]);
              console.log(result);
              this.wifi_ip = result.service.ipv4Addresses[0];
              this.storage.set('global_wifi_ip', this.wifi_ip);
            }            
          } else {
            console.log('service removed', result.service);
          }
        });
      }
    }

    // this.wifi_ip = "simplePlant.local";
    // if(this.platform.is('ios'))
    // {
    //   this.wifi_ip = "192.168.43.189";
    //   // this.networkInt.getWiFiIPAddress().then(ip=>{this.wifi_ip = ip;}).catch((err)=>{alert(err);})
    // }else{
    //   this.wifi_ip = "192.168.43.189";
    //   // WifiWizard2.getWifiRouterIP().then((ip)=>{this.wifi_ip = ip;}).catch((err)=>{alert(err);});
    // }

    this.getResults();
    this.loopGetResults();
  }



  getResults() {
    console.log('http://' + this.wifi_ip + "/getData");
    this.apiUrl = 'http://' + this.wifi_ip + "/getData";
    // this.apiUrl ="http://192.168.4.1/getData";
    // alert(this.apiUrl);
    if (this.wifi_ip) {
      this.http.get(this.apiUrl).subscribe(data => {
        // alert(data)
        console.log("data", data)
        this.temp = data["temparature"];
        this.moist = data["humidity"];
        this.water = data["waterlevel"];
        this.ph = data["phvalue"];
      });
    }
  }
  loopResult;
  async loopGetResults() {
    this.loopResult = setInterval(() => { this.getResults(); }, 5000);
  }

  redirectToSettings() {
    this.events.publish('change-tab', 'tab2');
    this.router.navigateByUrl('tabs/tab2');

  }
  redirect() {
    
    // CHANGE THE LINK BELOW TO REDIRECT USER TO COMPANY WEBSITE
    this.iab.create('https://www.simpleplant.de/', '_self');
  }

  facebook() {
    // CHANGE THE LINK BELOW TO YOUR FACEBOOK HOME PAGE URL
    this.iab.create('https://m.facebook.com', '_self');
  }


  instagram() {
        // CHANGE THE LINK BELOW TO YOUR INSTAGRAM HOME PAGE URL
    this.iab.create('https://instagram.com', '_self');
  }



}
