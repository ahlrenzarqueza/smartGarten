import { Component, ElementRef, ViewChild } from '@angular/core';
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
import { AlertController, ActionSheetController, ToastController } from "@ionic/angular";
import * as AWS from 'aws-sdk';
import creds from '../../assets/env.json';

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
    private zone: NgZone,
    private alertController : AlertController,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController
  ) {
    // this.zeroconf.registerAddressFamily = 'ipv4';
    // this.zeroconf.watchAddressFamily = 'ipv4'; 

    // TODO: What is the purpose of this. To remove for the meantime
    // console.log('below is zeroconf');
    // if (this.wifi_ip == null) {
    //   if (this.platform.is('ios')) {
    //     this.wifi_ip = "simpleplant.local";
    //     this.storage.set('global_wifi_ip', this.wifi_ip);
    //   } else {
    //     this.zeroconf.watch('_http._tcp.', 'local.').subscribe(result => {
    //       console.log(result);
    //       var service = result.service;
    //       if (result.action == 'resolved') {
    //         if(service.name === "simpleplant"){
    //           alert(result.service.ipv4Addresses[0]);
    //           console.log(result);
    //           this.wifi_ip = result.service.ipv4Addresses[0];
    //           this.storage.set('global_wifi_ip', this.wifi_ip);
    //         }            
    //       } else {
    //         console.log('service removed', result.service);
    //       }
    //     });
    //   }
    // }
  }
  awsiotdata:any = null;
  awsiotEndpoint = null;
  activeDevice = null;
  activeDeviceName = null;
  activeConnectionMode = 'wifi';
  wifi_ip = null;
  apiUrl;
  bt_peripheral = null;
  bt_notif_initialized = false;
  toastDismissSnooze = false;
  gardenNameSettings:any = {};

  toastInstances = [];
  airtemp = 0;
  watertemp = 0;
  humid = 0;
  waterlevel = 0;
  phValue = 7;
  ecValue = 0;

  ionViewDidLeave() {
    clearInterval(this.loopResult);
    if(!this.bt_peripheral) return;
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
    if(!this.bt_peripheral) return;
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
    this.gardenNameSettings = await this.storage.get('gardenNameSettings');

    if(this.activeConnectionMode == 'wifi') {
      this.awsiotEndpoint = await this.storage.get('awsiotEndpoint');
      this.awsiotdata = new AWS.IotData({
        endpoint: this.awsiotEndpoint,
        apiVersion: '2015-05-28'
      }); 
    }

    // TODO : Deprecated code
    // if(this.activeConnectionMode == 'wifi') {
    //   if (this.wifi_ip == null) {
    //     if (this.platform.is('ios')) {
    //       this.wifi_ip = "simpleplant.local";
    //     } else {
    //       this.zeroconf.watch('_http._tcp.', 'local.').subscribe(result => {
    //         console.log(result);
    //         var service = result.service;
    //         if (result.action == 'resolved') {
    //           if(service.name === "simpleplant"){
    //             // alert(result.service.ipv4Addresses[0]);
    //             console.log(result);
    //             this.wifi_ip = result.service.ipv4Addresses[0];
    //             this.storage.set('global_wifi_ip', this.wifi_ip);
    //           }            
    //         } else {
    //           console.log('service removed', result.service);
    //         }
    //       });
    //     }
    //   }
    // }

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
      //AWS IOT DATA
      var params = {
        thingName: this.activeDevice, /* required */
        shadowName: 'Measurements'
      };
      me.awsiotdata.getThingShadow(params, async function(err, data) {
        if (err) {
          console.log('AWS IOT Connection Error:', err);
          await this.presentAlert('Error in getting measurements. Please reconnect to a device again.', 'AWS IOT Connection Error');
          this.router.navigateByUrl('welcome');
        }
        else {
          const shadowdt = JSON.parse(data.payload);
          console.log('AWS IoT State', shadowdt);
          const state = shadowdt.state;
          me.airtemp = parseFloat(state.reported.airTemperature);
          me.humid = parseFloat(state.reported.humidity);
          me.phValue = parseFloat(state.reported.phValue);
          me.ecValue = (parseFloat(state.reported.tdsValue) * 2) / 1000;
          me.waterlevel = parseFloat(state.reported.waterLevel);
          me.watertemp = parseFloat(state.reported.waterTemperature);
          me.checkWarningTriggers();
        }
      });
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
            me.checkWarningTriggers();
          });
        }, (error) => {
          console.log('BT Read Notification Error: ', error);
        });
        me.bt_notif_initialized = true;
      }
      
      const writedata = me.stringToBytes('pollmeasure\n');
      ble.write(device_id, service_id, charac_id, writedata, () => {
        console.log('BT Successfully sent poll command.');
      }, (error) => {
        console.log('BT Failed to send poll command.');
      });
    }
  }

  loopResult;
  async loopGetResults() {
    const interval = this.activeConnectionMode == 'wifi' ? 5000 : 10000;
    this.loopResult = setInterval(() => { this.getResults(); }, interval);
  }

  checkWarningTriggers() {
    const me = this;
    if(me.airtemp > 45) {
      me.presentWarningToast("airtemp", "Threshold reached: Air Temperature is now at " + me.airtemp + "°C");
    }
    if(me.airtemp < 10) {
      me.presentWarningToast("airtemp", "Threshold reached: Air Temperature is now at " + me.airtemp + "°C");
    }
    if(me.humid > 65) {
      me.presentWarningToast("humid", "High Humidity: Humidity is now at " + me.humid + "%");
    }
    if(me.humid < 30) {
      me.presentWarningToast("humid", "Low Humidity: Humidity is now at " + me.humid + "%");
    }
    if(me.phValue > 7) {
      me.presentWarningToast("phValue", "High pH concentration: Now at " + me.phValue);
    }
    if(me.phValue < 5) {
      me.presentWarningToast("phValue", "Low pH concentration: Now at " + me.phValue);
    }
    if(me.ecValue > 2) {
      me.presentWarningToast("ecValue", "High EC Value: Now at " + me.ecValue);
    }
    if(me.ecValue < 0.5) {
      me.presentWarningToast("ecValue", "High EC Value: Now at " + me.ecValue);
    }
    if(me.watertemp > 45) {
      me.presentWarningToast("watertemp", "Max Threshold reached: Water Temperature is now at " + me.watertemp + "°C");
    }
    if(me.watertemp < 10) {
      me.presentWarningToast("watertemp", "Min Threshold reached: Water Temperature is now at " + me.watertemp + "°C");
    }
    if(me.waterlevel > 100) {
      me.presentWarningToast("waterlevel", "Maximum Level threshold: Water Level is now at " + me.waterlevel + "%");
    }
    if(me.waterlevel < 10) {
      me.presentWarningToast("waterlevel", "Minimum Level threshold: Water Level is now at " + me.waterlevel + "%");
    }
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

  async presentAlert(message:string, title:string = 'Alert') {
    const alert = await this.alertController.create({
      header: title,
      // subHeader: subTitle,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
    return alert.onDidDismiss();
  }
  
  async presentRenameGardenPrompt() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Rename Garden Device',
      inputs: [
        {
          name: 'newname',
          type: 'text',
          placeholder: 'Garden Device Name',
          value: this.gardenNameSettings[this.activeDevice] || this.activeDeviceName
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            
          }
        }, {
          text: 'OK',
          handler: (inputData) => {
            this.gardenNameSettings[this.activeDevice] = inputData.newname;
            this.storage.set('gardenNameSettings', this.gardenNameSettings);
          }
        }
      ]
    });

    await alert.present();
  }

  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: this.activeDeviceName,
      cssClass: 'my-custom-class',
      buttons: [{
        text: 'Rename Garden',
        icon: 'icon-edition',
        handler: () => {
          this.presentRenameGardenPrompt();
        }
      }, {
        text: 'Change active garden',
        icon: 'caret-back-circle-outline',
        handler: () => {
          this.router.navigateByUrl('welcome');
        }
      }, {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel',
        handler: () => {
        }
      }]
    });
    await actionSheet.present();
  }

  async presentWarningToast(toastid, message:string) {
    const me = this;
    if(me.toastDismissSnooze) return;
    if(this.toastInstances[toastid]) {
      this.toastInstances[toastid].dismiss();
    }
    const toast = await this.toastController.create({
      header: 'Warning',
      message: message,
      position: 'bottom',
      cssClass: 'warning-toast',
      buttons: [
        {
          text: 'Dismiss  (5 mins)',
          handler: () => {
            toast.dismiss();
            me.toastDismissSnooze = true;
            setTimeout(function () {
              me.toastDismissSnooze = false;
            }, 300000)
          }
        }
      ]
    });
    toast.present();
    this.toastInstances[toastid] = toast;
  }
}
