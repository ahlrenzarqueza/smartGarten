import { Component } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx'
import { HttpClient } from "@angular/common/http";
import { Platform } from "@ionic/angular";
import { NetworkInterface } from '@ionic-native/network-interface/ngx';
import { Router } from '@angular/router'
import { TabsPageModule } from '../tabs/tabs.module'
import { Events } from '@ionic/angular';
import { Zeroconf } from "@ionic-native/zeroconf/ngx";
import { Storage } from '@ionic/storage';
import { NgZone } from '@angular/core';

declare var WifiWizard2: any, ble: any;

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
    private zeroconf: Zeroconf,
    private zone: NgZone
  ) {
    // this.zeroconf.registerAddressFamily = 'ipv4';
    // this.zeroconf.watchAddressFamily = 'ipv4'; 

    // TODO: What is the purpose of this. To remove for the meantime
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

  activeDevice = null;
  activeDeviceName = null;
  activeConnectionMode = 'wifi';
  wifi_ip = null;
  apiUrl;
  bt_peripheral = null;
  bt_notif_initialized = false;

  airtemp = 0;
  watertemp = 0;
  humid = 0;
  waterlevel = 0;
  phValue = 7;
  ecValue = 0;

  ionViewDidLeave() {
    clearInterval(this.loopResult);
    const {id : device_id} = this.bt_peripheral;
    const charObj = this.bt_peripheral.characteristics.find(function (e) {
      return e.characteristic == "FFE1";
    });
    const {characteristic : charac_id, service : service_id} = charObj;
    ble.stopNotification(device_id, service_id, charac_id, function () {
      console.log('BT successfully stopped notification system.');
    }, function () {
      console.log('BT failed to stop notification system.');
    });
  }
  ngOnDestroy() {
    clearInterval(this.loopResult);
    // alert('page destroyed');
    const {id : device_id} = this.bt_peripheral;
    const charObj = this.bt_peripheral.characteristics.find(function (e) {
      return e.characteristic == "FFE1";
    });
    const {characteristic : charac_id, service : service_id} = charObj;
    ble.stopNotification(device_id, service_id, charac_id, function () {
      console.log('BT successfully stopped notification system.');
    }, function () {
      console.log('BT failed to stop notification system.');
    });
  }

  async ionViewWillEnter() {


    if (this.loopResult != null) {
      clearInterval(this.loopResult);
    }

    this.activeConnectionMode = await this.storage.get('globalConnectionMode');
    this.activeDeviceName = await this.storage.get('globalConnectedDevName');
    this.activeDevice = await this.storage.get('globalConnectedDevice');
    this.bt_peripheral = await this.storage.get('globalBtPeripheral');

    if(this.activeConnectionMode == 'wifi') {
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

  async getResults() {
    const me = this;
    if(this.activeConnectionMode == 'wifi') {
      // TODO: For Wi-Fi Get Results
      console.log('http://' + this.wifi_ip + "/getData");
      this.apiUrl = 'http://' + this.wifi_ip + "/getData";
      // this.apiUrl ="http://192.168.4.1/getData";
      // alert(this.apiUrl);
      if (this.wifi_ip) {
        this.http.get(this.apiUrl).subscribe(data => {
          // alert(data)
          console.log("data", data)
          this.airtemp = data["temparature"];
          this.humid = data["humidity"];
          this.waterlevel = data["waterlevel"];
          this.phValue = data["phvalue"];
        });
      }
    }
    else {
      const {id : device_id} = this.bt_peripheral;
      const charObj = this.bt_peripheral.characteristics.find(function (e) {
        return e.characteristic == "FFE1";
      });
      const {characteristic : charac_id, service : service_id} = charObj;
      
      // BT Start Notification on init
      if(!this.bt_notif_initialized) {
        ble.startNotification(device_id, service_id, charac_id, (buffer) => {
          var res = String.fromCharCode.apply(null, new Uint8Array(buffer));
          me.zone.run( () => {
            var keyval = res.split('=');
            console.log('BT Set value on ' + keyval[0] + ' : ' + keyval[1]);
            switch(keyval[0]){
              case "at": 
                me.airtemp = parseFloat(keyval[1]);
                break;
              case "h": 
                me.humid = parseFloat(keyval[1]);
                break;
              case "ph": 
                me.phValue = parseFloat(keyval[1]);
                break;
              case "ec": 
                me.ecValue = parseFloat(keyval[1]);
                break;
              case "wl": 
                me.waterlevel = parseFloat(keyval[1]);
                break;
              case "wt": 
                me.watertemp = parseFloat(keyval[1]);
                break;
            }
          });
        }, (error) => {
          console.log('BT Read Notification Error: ', error);
          });
      }
      
      const writedata = me.stringToBytes('p');
      ble.write(device_id, service_id, charac_id, writedata, () => {
        console.log('BT Successfully sent poll command.');
      }, (error) => {
        console.log('BT Failed to send poll command.');
      });
    }
  }

  loopResult;
  async loopGetResults() {
    const interval = this.activeConnectionMode == 'wifi' ? 5000 : 7000;
    this.loopResult = setInterval(() => { this.getResults(); }, interval);
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

  stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
     }
     return array.buffer;
  }


}
