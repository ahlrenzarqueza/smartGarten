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
import { AlertController, ActionSheetController, ToastController } from "@ionic/angular";
import * as AWS from 'aws-sdk';
import {injectStyles} from 'shadow-dom-inject-styles';
import creds from '../../assets/env.json';

declare var ble: any;

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

  }
  awsiotdata:any = null; // AWS SDK IoT Data Class
  awsiotEndpoint = null;  // AWS IoT Thing Base Endpoint

  activeDevice = null; // Active Device ID (Garden IoT Thing Name || Bluetooth device MAC Address)
  activeDeviceName = null; // Active Device Name (Garden IoT Thing Name || Bluetooth device Name)
  activeConnectionMode = 'wifi'; // Active Connection Mode
  bt_peripheral = null; // Active Bluetooth Peripheral Object (from successful connection)
  bt_notif_initialized:boolean = false; // Bluetooth Notification Subscription is Initialized (Boolean)
  
  toastDismissSnooze:boolean = false; // Toast Dismiss Snooze (if true, toast warnings will be disabled temporarily)
  gardenNameSettings:any = {}; // Garden Name Settings (that is being saved in storage)

  toastInstances = {};
  airtemp = 0; // Air Temperature Measurement Value
  watertemp = 0; // Water Temperature Measurement Value
  humid = 0; // Humidity Measurement Value
  waterlevel = 0; // Water Level (distance) Measurement Value
  phValue = 7; // pH Level Measurement Value
  ecValue = 0; // TDS EC Measurement Value

  ionViewDidLeave() {
    clearInterval(this.loopResultInterval);
    if(!this.bt_peripheral) return;

    // Unsubscribe to Bluetooth notification
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
    clearInterval(this.loopResultInterval);
    if(!this.bt_peripheral) return;

    // Unsubscribe to Bluetooth notification
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

    if (this.loopResultInterval != null) {
      clearInterval(this.loopResultInterval);
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

    this.getResults();
    this.loopGetResults();
  }

  // Function that gets Measurement values
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
          me.airtemp = me.parseToFloatTwoFixed(state.reported.airTemperature);
          me.humid = me.parseToFloatTwoFixed(state.reported.humidity);
          me.phValue = me.parseToFloatTwoFixed(state.reported.phValue);
          let ecValue = (state.reported.tdsValue * 2) / 1000;
          me.ecValue = me.parseToFloatTwoFixed(ecValue);
          me.waterlevel = me.parseToFloatTwoFixed(state.reported.waterLevel);
          me.watertemp = me.parseToFloatTwoFixed(state.reported.waterTemperature);
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
                me.airtemp = me.parseToFloatTwoFixed(keyval[1]);
                break;
              case "h": 
                me.humid =  me.parseToFloatTwoFixed(keyval[1]);
                break;
              case "ph": 
                me.phValue = me.parseToFloatTwoFixed(keyval[1]);
                break;
              case "ec": 
                me.ecValue = me.parseToFloatTwoFixed(keyval[1]);
                break;
              case "wl": 
                me.waterlevel = me.parseToFloatTwoFixed(keyval[1]);
                break;
              case "wt": 
                me.watertemp = me.parseToFloatTwoFixed(keyval[1]);
                me.btClearTimeout(); // Clear detection for communication timeout
                break;
            }
            me.checkWarningTriggers();
          });
        }, (error) => {
          console.log('BT Read Notification Error: ', error);
        });
        me.bt_notif_initialized = true;
      }
      
      // Bluetooth send command: pollmeasure -> Will ask for garden device's measurements
      const writedata = me.stringToBytes('pollmeasure\n');
      ble.write(device_id, service_id, charac_id, writedata, () => {
        me.btInitTimeout();
        console.log('BT Successfully sent poll command.');
      }, async (error) => {
        console.log('BT Failed to send poll command.');
        await me.presentAlert("Bluetooth communication error", "Error");
        me.router.navigateByUrl('welcome');
      });
    }
  }

  // Function to instantiate interval to poll for measurement results
  loopResultInterval;
  async loopGetResults() {
    const interval = this.activeConnectionMode == 'wifi' ? 5000 : 10000;
    this.loopResultInterval = setInterval(() => { this.getResults(); }, interval);
  }

  // Function to check Warning Triggers to show toast message
  checkWarningTriggers() {
    const me = this;
    if(this.isMaxAirTemp(me.airtemp)) {
      me.presentWarningToast("airtemp", "Obergrenze erreicht!\nLufttemperatur: " + me.airtemp + "°C");
    }
    if(this.isMinAirTemp(me.airtemp)) {
      me.presentWarningToast("airtemp", "Untergrenze erreicht!\nLufttemperatur: " + me.airtemp + "°C");
    }
    if(this.isMaxHumid(me.humid)) {
      me.presentWarningToast("humid", "Obergrenze erreicht!\nLuftfeuchtigkeit: " + me.humid + "%");
    }
    if(this.isMinHumid(me.humid)) {
      me.presentWarningToast("humid", "Untergrenze erreicht!\nLuftfeuchtigkeit: " + me.humid + "%");
    }
    if(this.isMaxPhValue(me.phValue)) {
      me.presentWarningToast("phValue", "Obergrenze erreicht!\npH-Wert: " + me.phValue);
    }
    if(this.isMinPhValue(me.phValue)) {
      me.presentWarningToast("phValue", "Untergrenze erreicht!\npH-Wert: " + me.phValue);
    }
    if(this.isMaxECValue(me.ecValue)) {
      me.presentWarningToast("ecValue", "Obergrenze erreicht!\nEC-Wert: " + me.ecValue);
    }
    if(this.isMinECValue(me.ecValue)) {
      me.presentWarningToast("ecValue", "Untergrenze erreicht!\nEC-Wert: " + me.ecValue);
    }
    if(this.isMaxWaterTemp(me.watertemp)) {
      me.presentWarningToast("watertemp", "Obergrenze erreicht!\nWassertemperatur: " + me.watertemp + "°C");
    }
    if(this.isMinWaterTemp(me.watertemp)) {
      me.presentWarningToast("watertemp", "Untergrenze erreicht!\nWassertemperatur: " + me.watertemp + "°C");
    }
    if(this.isMaxWaterLevel(me.waterlevel)) {
      me.presentWarningToast("waterlevel", "Obergrenze erreicht!\nWasserstand: " + me.waterlevel + "%");
    }
    if(this.isMinWaterLevel(me.waterlevel)) {
      me.presentWarningToast("waterlevel", "Untergrenze erreicht!\nWasserstand: " + me.waterlevel + "%");
    }
  }

  redirectToSettings() {
    this.events.publish('change-tab', 'tab2');
    this.router.navigateByUrl('tabs/tab2');
  }

  // Function to convert string to bytes for Bluetooth transmission
  stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
     }
     return array.buffer;
  }

  // Function to present alert window with message and title as arguments
  async presentAlert(message:string, title:string = 'Alert') {
    const alert = await this.alertController.create({
      header: title,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
    return alert.onDidDismiss();
  }
  
  // Function to present alert prompting for new garden name
  async presentRenameGardenPrompt() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Gartengerät umbenennen',
      inputs: [
        {
          name: 'newname',
          type: 'text',
          placeholder: 'Name des Gartengeräts',
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

  // Function to present garden actions
  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: this.activeDeviceName,
      cssClass: 'my-custom-class',
      buttons: [{
        text: 'Garten umbenennen',
        icon: 'icon-edition',
        handler: () => {
          this.presentRenameGardenPrompt();
        }
      }, {
        text: 'Aktiven Garten wechseln',
        icon: 'caret-back-circle-outline',
        handler: () => {
          this.router.navigateByUrl('welcome');
        }
      }, {
        text: 'Schließen',
        icon: 'close',
        role: 'cancel',
        handler: () => {
        }
      }]
    });
    await actionSheet.present();
  }

  // Function to present warning toast message
  async presentWarningToast(toastid, message:string) {
    const me = this;
    if(me.toastDismissSnooze) return;
    if(this.toastInstances[toastid]) {
      this.toastInstances[toastid].dismiss();
    }
    const toast = await this.toastController.create({
      message: 'Warnung: ' + message,
      position: 'bottom',
      cssClass: 'warning-toast',
      buttons: [
        {
          text: 'Schließen (30 mins)',
          handler: () => {
            toast.dismiss();
            me.toastDismissSnooze = true;
            setTimeout(function () {
              me.toastDismissSnooze = false;
            }, 1800000)
          }
        }
      ]
    });
    toast.present();
    // language=CSS
    const styles = `
      .toast-container {
        flex-direction: column;
      }
      .toast-content {
        align-self: flex-start;
      }
      .toast-header {
        font-size: 16px !important;
        font-weight: 700 !important;
        padding-bottom: 2mm;
      }
      .toast-message {
        font-size: 16px !important;
        line-height: 22px;
      }
    `;

    injectStyles(toast, '.inject-toast', styles);
    this.toastInstances[toastid] = toast;
  }

  // Bluetooth Timemout Mechanism : 
  // To display error and reset to welcome page when BT communication timed out
  btTimeout;
  async btInitTimeout () {
    this.btTimeout = setTimeout(async () => {
      await this.presentAlert("Bluetooth communication timeout", "Error");
      this.router.navigateByUrl('welcome');
    }, 30000);
  }

  async btClearTimeout () {
    clearTimeout(this.btTimeout);
  }

  parseToFloatTwoFixed(str) {
    let floatnum = parseFloat(str);
    if(isNaN(floatnum)) floatnum = 0;
    return parseFloat(floatnum.toFixed(2));
  }

  // Warning function conditions
  isMaxAirTemp (num:number):boolean {
    return num > 45;
  }

  isMinAirTemp (num:number):boolean {
    return num < 10;
  }

  isMaxHumid (num:number):boolean {
    return num > 65;
  }

  isMinHumid (num:number):boolean {
    return num < 30;
  }

  isMaxPhValue (num:number):boolean {
    return num > 7;
  }

  isMinPhValue (num:number):boolean {
    return num < 5;
  }

  isMaxECValue (num:number):boolean {
    return num > 2;
  }

  isMinECValue (num:number):boolean {
    return num < 0.5;
  }

  isMaxWaterTemp (num:number):boolean {
    return num > 45;
  }

  isMinWaterTemp (num:number):boolean {
    return num < 10;
  }

  isMaxWaterLevel (num:number):boolean {
    return num > 100;
  }

  isMinWaterLevel (num:number):boolean {
    return num < 10;
  }
}
