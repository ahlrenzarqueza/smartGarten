import { Component } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx'
import { Storage } from '@ionic/storage'
import { HttpClient } from "@angular/common/http";
import { Platform } from '@ionic/angular';
import { NetworkInterface } from '@ionic-native/network-interface/ngx';
import { Router } from "@angular/router";
// declare var WifiWizard2: any;
import { Zeroconf } from "@ionic-native/zeroconf/ngx";
import { NgZone } from '@angular/core';
import {LoadingController} from "@ionic/angular";
import { AlertController } from "@ionic/angular";
import * as AWS from 'aws-sdk';
import creds from '../../assets/env.json';

declare var ble: any;

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  constructor( private iab: InAppBrowser ,
                private storage: Storage ,
                private platform : Platform,
                public networkInt:NetworkInterface,
                private http:HttpClient,
                private router:Router,
                private zeroconf:Zeroconf,
                private loadingController : LoadingController,
                private alertController : AlertController,
                private zone: NgZone
                ) {
    // var sunset = "12:00 am";
    
        // console.log(this.sunset);
        // this.storage.get('timeToggle').then((val)=>{this.timeToggle = val});
        // this.storage.get('fanToggle').then((val)=>{this.fanToggle = val});
        // this.storage.get('pumpToggle').then((val)=>{this.pumpToggle = val});
        // this.storage.get('fanSelect').then((val)=>{this.fanSelect = val});
        // this.storage.get('pumpSelect').then((val)=>{this.pumpSelect = val});
        // this.storage.get('sunrise').then((val)=>{if(val != null){this.sunrise = val;}});
        // this.storage.get('sunset').then((val)=>{if(val != null){this.sunset = val;}});
        // console.log('sunrise = '+this.sunrise);
        // console.log('sunset = '+this.sunset);
        // this.storage.get('timeToggle-1').then((val)=>{console.log('timeToggle-1',val);this.timeStatusArray[1] = val});
        // this.storage.get('timeToggle-2').then((val)=>{console.log('timeToggle-2',val);this.timeStatusArray[2] = val});
        // this.storage.get('timeToggle-3').then((val)=>{console.log('timeToggle-3',val);this.timeStatusArray[3] = val});
        
        // this.storage.get('fanToggle-1').then((val)=>{console.log('fanToggle-1',val);this.fanStatusArray[1] = val});        
        // this.storage.get('fanToggle-2').then((val)=>{console.log('fanToggle-2',val);this.fanStatusArray[2] = val});
        // console.log('below is zeroconf');
        // if(this.wifi_ip == null)
        // {
        //   this.storage.get('global_wifi_ip').then( val => {this.wifi_ip = val});
        // }

  }

  bt_notif_initialized = false;
  sunset:any = new Date().toISOString();
  sunrise:any = new Date().toISOString();
  fansunset:any = new Date().toISOString();
  fansunrise:any = new Date().toISOString();
  pumpsunset:any = new Date().toISOString();
  pumpsunrise:any = new Date().toISOString();
  
  awsiotdata:any = null;
  awsiotEndpoint = null;
  activeDevice = null;
  activeDeviceName = null;
  activeConnectionMode = 'wifi';
  bt_peripheral = null;
  pendingBtWritePrm = null;
  snoozeTimeCheck = null;
  clockCheck = null;

  datetimertc = new Date(0);
  timeToggle;
  fanToggle;
  timeStatusArray:any = [null, false, false, false];
  fanStatusArray:any = [null, false, false];
  pumpToggle;
  fanSelect;
  pumpSelect;
  fan1;
  fan2 = 1;
  fan3;
  timerFlag:any = 1;
  fanFlag:any = 1;
  lightSnooze = false;
  lightSnoozeRemaining = 0;
  lightIntensity = 100;
  fanSnooze = false;
  fanSnoozeRemaining = 0;
  fanOnTimer = 30;
  pumpSnooze = false;
  pumpSnoozeRemaining = 0;
  pumpOnTimer = 30;

  testRadio1:boolean;
  wifi_ip = null;
  apiUrl: string;
  postJsonObj :any = {};
  initializedSetting = {};

  async ionViewDidEnter()
  {
    const me = this;
    this.activeConnectionMode = await this.storage.get('globalConnectionMode');
    this.activeDeviceName = await this.storage.get('globalConnectedDevName');
    this.activeDevice = await this.storage.get('globalConnectedDevice');
    this.bt_peripheral = await this.storage.get('globalBtPeripheral');

    if(this.activeConnectionMode == 'wifi') {
      this.awsiotEndpoint = await this.storage.get('awsiotEndpoint');
      this.awsiotdata = new AWS.IotData({
        endpoint: this.awsiotEndpoint,
        apiVersion: '2015-05-28'
      }); 
      let params = {
        thingName: this.activeDevice, /* required */
        shadowName: 'Settings'
      };
      this.awsiotdata.getThingShadow(params, function(err, data) {
        if (err) {
          console.log('AWS IOT Connection Error:', err);
          me.presentAlert('Error in getting settings. Please reconnect to a device again.', 'AWS IOT Connection Error');
          me.router.navigateByUrl('welcome');
        }
        else {
          const shadowdt = JSON.parse(data.payload);
          console.log('AWS IoT State', shadowdt);
          const state = shadowdt.state;
          me.fanSelect = state.reported.fanLevel;
          me.pumpSelect = state.reported.pumpLevel;
          me.fanOnTimer = state.reported.fanOnTimer;
          me.pumpOnTimer = state.reported.pumpOnTimer;
          me.fanStatusArray[1] = state.reported['fan1-enabled'];
          me.fanStatusArray[2] = state.reported['fan2-enabled'];
          me.timeStatusArray[1] = state.reported['light1-enabled'];
          me.timeStatusArray[2] = state.reported['light2-enabled'];
          me.timeStatusArray[3] = state.reported['light3-enabled'];
          console.log(me.timeStatusArray);
          me.pumpToggle = state.reported['pump-enabled'];
          me.fanSnooze = state.reported['fanSnooze'] == false ? false : true;
          me.lightSnooze = state.reported['lightSnooze'] == false ? false : true;
          me.pumpSnooze = state.reported['pumpSnooze'] == false ? false : true;
          me.fanSnoozeRemaining = state.reported['fanSnoozeRemaining'];
          me.lightSnoozeRemaining = state.reported['lightSnoozeRemaining'];
          me.pumpSnoozeRemaining = state.reported['pumpSnoozeRemaining'];
          me.lightIntensity = state.reported['lightIntensity'];
          me.datetimertc = new Date(parseInt(state.reported['datetimertc']));
          var sunrisetime = new Date();
          sunrisetime.setHours(state.reported['sunrise-hr']);
          sunrisetime.setMinutes(state.reported['sunrise-min']);
          var sunsettime = new Date();
          sunsettime.setHours(state.reported['sunset-hr']);
          sunsettime.setMinutes(state.reported['sunset-min']);

          var fansunrisetime = new Date();
          fansunrisetime.setHours(state.reported['fansunrise-hr']);
          fansunrisetime.setMinutes(state.reported['fansunrise-min']);
          var fansunsettime = new Date();
          fansunsettime.setHours(state.reported['fansunset-hr']);
          fansunsettime.setMinutes(state.reported['fansunset-min']);

          var pumpsunrisetime = new Date();
          pumpsunrisetime.setHours(state.reported['pumpsunrise-hr']);
          pumpsunrisetime.setMinutes(state.reported['pumpsunrise-min']);
          var pumpsunsettime = new Date();
          pumpsunsettime.setHours(state.reported['pumpsunset-hr']);
          pumpsunsettime.setMinutes(state.reported['pumpsunset-min']);

          me.sunrise = sunrisetime.toISOString();
          me.sunset = sunsettime.toISOString();
          me.fansunrise = fansunrisetime.toISOString();
          me.fansunset = fansunsettime.toISOString();
          me.pumpsunrise = pumpsunrisetime.toISOString();
          me.pumpsunset = pumpsunsettime.toISOString();
        }

        me.snoozeCheckInterval();
        me.clockCheckInterval();
      
      });
    }
    else {
      this.getCurrentStateFromBt();
    }
  }

  ionViewWillEnter() {

  }

  ionViewDidLeave() {
    if(this.snoozeTimeCheck) clearInterval(this.snoozeTimeCheck);
    if(this.clockCheck) clearInterval(this.clockCheck);
  }

  ngOnDestroy() {
    if(this.snoozeTimeCheck) clearInterval(this.snoozeTimeCheck);
    if(this.clockCheck) clearInterval(this.clockCheck);
  }

  async showLoader() {
    const loading = await this.loadingController.create({
      message: 'Warten Sie mal...'
    });
    await loading.present();
  }
 
  hideLoader() {
    this.loadingController.dismiss();    
  }

  getCurrentStateFromBt () {
    const me = this;
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
            // switch(keyval[0]){
            //   case "at": 
            //     me.airtemp = parseFloat(keyval[1]);
            //     break;
            //   case "h": 
            //     me.humid = parseFloat(keyval[1]);
            //     break;
            //   case "ph": 
            //     me.phValue = parseFloat(keyval[1]);
            //     break;
            //   case "ec": 
            //     me.ecValue = parseFloat(keyval[1]);
            //     break;
            //   case "wl": 
            //     me.waterlevel = parseFloat(keyval[1]);
            //     break;
            //   case "wt": 
            //     me.watertemp = parseFloat(keyval[1]);
            //     break;
            // }
            // me.checkWarningTriggers();
          });
        }, (error) => {
          console.log('BT Read Notification Error: ', error);
        });
        me.bt_notif_initialized = true;
      }
      
      const writedata = me.stringToBytes('s');
      ble.write(device_id, service_id, charac_id, writedata, () => {
        console.log('BT Successfully sent request settings command.');
      }, (error) => {
        console.log('BT Failed to send request settings command.');
      });
  }


  handleDataChangeApi (btdata = null){
    const me = this;
    if(this.activeConnectionMode == 'wifi') {
      if(!this.awsiotdata) return;
      const sunrisedate = new Date(this.sunrise);
      const sunsetdate = new Date(this.sunset);
      const fansunrisedate = new Date(this.fansunrise);
      const fansunsetdate = new Date(this.fansunset);
      const pumpsunrisedate = new Date(this.pumpsunrise);
      const pumpsunsetdate = new Date(this.pumpsunset);
      const state = {
        state: {
          desired: {
            // "fanLevel": this.fanSelect,
            // "pumpLevel": this.pumpSelect,
            "fanOnTimer": this.fanOnTimer,
            "pumpOnTimer": this.pumpOnTimer,
            "fan1-enabled": this.fanStatusArray[1],
            "fan2-enabled": this.fanStatusArray[2],
            "light1-enabled": this.timeStatusArray[1],
            "light2-enabled": this.timeStatusArray[2],
            "light3-enabled": this.timeStatusArray[3],
            "pump-enabled": this.pumpToggle,
            "sunrise-hr": sunrisedate.getHours(),
            "sunrise-min": sunrisedate.getMinutes(),
            "sunset-hr": sunsetdate.getHours(),
            "sunset-min": sunsetdate.getMinutes(),
            "fansunrise-hr": fansunrisedate.getHours(),
            "fansunrise-min": fansunrisedate.getMinutes(),
            "fansunset-hr": fansunsetdate.getHours(),
            "fansunset-min": fansunsetdate.getMinutes(),
            "pumpsunrise-hr": pumpsunrisedate.getHours(),
            "pumpsunrise-min": pumpsunrisedate.getMinutes(),
            "pumpsunset-hr": pumpsunsetdate.getHours(),
            "pumpsunset-min": pumpsunsetdate.getMinutes(),
            "lightIntensity": this.lightIntensity,
            "fanSnooze": btdata && btdata['fs'] != undefined ? btdata['fs'] : undefined,
            "lightSnooze": btdata && btdata['ls'] != undefined ? btdata['ls'] : undefined,
            "pumpSnooze": btdata && btdata['ps'] != undefined ? btdata['ps'] : undefined
          }
        }
      }
      var params = {
        payload: JSON.stringify(state),
        thingName: this.activeDevice,
        shadowName: 'Settings'
      };
      this.awsiotdata.updateThingShadow(params, function(err, data) {
        if(err) {
          console.log('AWS IOT Connection Error:', err);
          me.presentAlert('Error in publishing garden set-up. Please reconnect to a device again.', 'AWS IOT Connection Error');
          me.router.navigateByUrl('welcome');
        }
        else {
          console.log('AWS IOT Updated State:', state);
        }
      });
    }
    else {
      if(!btdata) return console.log('BT Data Change Error : No data to write.');
      const {id : device_id} = this.bt_peripheral;
      const charObj = this.bt_peripheral.characteristics.find(function (e) {
        return e.characteristic == "FFE1";
      });
      const {characteristic : charac_id, service : service_id} = charObj;
      this.writeObjToBt(device_id, service_id, charac_id, btdata);
    }
  }

  test()
  {
    this.testRadio1 = true;
    this.fan2 = 0;
    console.log(this.fan1);
  }

  writeObjToBt (device_id, service_id, charac_id, btdata) {
    const me = this;
    var resolvePrm = null;
    this.pendingBtWritePrm = new Promise(function (resolve) {
      resolvePrm = resolve;
    });
    this.showLoader();
    const datakeys = Object.keys(btdata);
    const btWrite = function (index) {
      const datakey = datakeys[index];
      const writedata = me.stringToBytes(datakey + '=' + btdata[datakey].toString());
      ble.write(device_id, service_id, charac_id, writedata, () => {
        if(datakeys[index + 1]) 
          setTimeout(function (e) { return btWrite(index + 1); }, 1000);
        else setTimeout(function (e) { 
          me.hideLoader(); 
          resolvePrm();
        }, 1000);
      }, (error) => {
        console.log('BT Write Data Error: ', error);
        if(datakeys[index + 1]) 
          setTimeout(function (e) { return btWrite(index + 1); }, 1000);
        else setTimeout(function (e) { 
          me.hideLoader(); 
          resolvePrm();
        }, 1000);
      });
    }

    if(datakeys[0]) btWrite(0);
  }

  sunsetFunc()
  {
    if(!this.initializedSetting['sunset']) {
      this.initializedSetting['sunset'] = true;
      return;
    }
    let dateObj = new Date(this.sunset.toString());
    console.log(this.sunset, dateObj.getHours(), dateObj.getMinutes());
    this.postJsonObj["sun_set_hour"]=dateObj.getHours();
    this.postJsonObj["sun_set_min"]=dateObj.getMinutes();
    this.storage.set('sunset',this.sunset);
    const bt_set_obj = {
      sshr: dateObj.getHours(),
      ssmm: dateObj.getMinutes()
    }
    this.handleDataChangeApi(bt_set_obj);
  }

  fansunsetFunc()
  {
    if(!this.initializedSetting['fansunset']) {
      this.initializedSetting['fansunset'] = true;
      return;
    }
    let dateObj = new Date(this.fansunset.toString());
    console.log(this.fansunset, dateObj.getHours(), dateObj.getMinutes());
    this.postJsonObj["fansun_set_hour"]=dateObj.getHours();
    this.postJsonObj["fansun_set_min"]=dateObj.getMinutes();
    this.storage.set('fansunset',this.fansunset);
    const bt_set_obj = {
      fsshr: dateObj.getHours(),
      fssmm: dateObj.getMinutes()
    }
    this.handleDataChangeApi(bt_set_obj);
  }

  pumpsunsetFunc()
  {
    if(!this.initializedSetting['pumpsunset']) {
      this.initializedSetting['pumpsunset'] = true;
      return;
    }
    let dateObj = new Date(this.pumpsunset.toString());
    console.log(this.pumpsunset, dateObj.getHours(), dateObj.getMinutes());
    this.postJsonObj["pumpsun_set_hour"]=dateObj.getHours();
    this.postJsonObj["pumpsun_set_min"]=dateObj.getMinutes();
    this.storage.set('pumpsunset',this.pumpsunset);
    const bt_set_obj = {
      psshr: dateObj.getHours(),
      pssmm: dateObj.getMinutes()
    }
    this.handleDataChangeApi(bt_set_obj);
  }

  sunriseFunc()
  {
    if(!this.initializedSetting['sunrise']) {
      this.initializedSetting['sunrise'] = true;
      return;
    }
    let dateObj = new Date(this.sunrise.toString());
    console.log(this.sunrise, dateObj.getHours(), dateObj.getMinutes());
    this.postJsonObj["sun_rise_hour"]=dateObj.getHours();
    this.postJsonObj["sun_rise_min"]=dateObj.getMinutes();
    console.log(this.sunrise);
    this.storage.set('sunrise',this.sunrise);
    const bt_set_obj = {
      srhr: dateObj.getHours(),
      srmm: dateObj.getMinutes()
    }
    this.handleDataChangeApi(bt_set_obj);
  }

  fansunriseFunc()
  {
    if(!this.initializedSetting['fansunrise']) {
      this.initializedSetting['fansunrise'] = true;
      return;
    }
    let dateObj = new Date(this.fansunrise.toString());
    console.log(this.fansunrise, dateObj.getHours(), dateObj.getMinutes());
    this.postJsonObj["fansun_rise_hour"]=dateObj.getHours();
    this.postJsonObj["fansun_rise_min"]=dateObj.getMinutes();
    console.log(this.fansunrise);
    this.storage.set('fansunrise',this.fansunrise);
    const bt_set_obj = {
      fsrhr: dateObj.getHours(),
      fsrmm: dateObj.getMinutes()
    }
    this.handleDataChangeApi(bt_set_obj);
  }

  pumpsunriseFunc()
  {
    if(!this.initializedSetting['pumpsunrise']) {
      this.initializedSetting['pumpsunrise'] = true;
      return;
    }
    let dateObj = new Date(this.pumpsunrise.toString());
    console.log(this.pumpsunrise, dateObj.getHours(), dateObj.getMinutes());
    this.postJsonObj["pumpsun_rise_hour"]=dateObj.getHours();
    this.postJsonObj["pumpsun_rise_min"]=dateObj.getMinutes();
    console.log(this.pumpsunrise);
    this.storage.set('pumpsunrise',this.pumpsunrise);
    const bt_set_obj = {
      psrhr: dateObj.getHours(),
      psrmm: dateObj.getMinutes()
    }
    this.handleDataChangeApi(bt_set_obj);
  }

  fanSelectFunc(data: String)
  {
    console.log(data);
    this.fanSelect = data;
    this.storage.set('fanSelect',this.fanSelect);
    this.postJsonObj["fan_level"] = data;
    // alert(this.fanSelect);
    const bt_set_obj = {
      fl: data
    }
    this.handleDataChangeApi(bt_set_obj);
  }

  pumpSelectFunc(data: String)
  {
    this.pumpSelect = data;
    this.storage.set('pumpSelect',this.pumpSelect);
    this.postJsonObj["pump_level"] = data;
    // alert(this.pumpSelect);
    const bt_set_obj = {
      pl: data
    }
    this.handleDataChangeApi(bt_set_obj);
  }

  sunTimer()
  {
    // alert('called');
    // console.log(event.checked)
    console.log(this.timeToggle);
    this.storage.set('timeToggle',this.timeToggle);
    const bt_set_obj = {};
    for(var i=1; i<=3; i++){
      this.storage.set('timeToggle-'+i, this.timeToggle);
      this.timeStatusArray[i] = this.timeToggle;
      this.postJsonObj["light"+i] = this.timeToggle;
      bt_set_obj['lt'+i] = this.timeToggle;
    }
    
    // alert(this.timeToggle);
    this.handleDataChangeApi(bt_set_obj);
  }

  checkSunTimer(){
    let counter = 0;
    for(var i=1; i<=3; i++){
      if(this.timeStatusArray[i]){
        counter++;
      }
    }
    if(counter === 1){
      this.timeToggle = true;
    }else if(counter === 0){
      this.timeToggle = false;
    }
    this.storage.set('timeToggle',this.timeToggle);
  }

  checkFanTimer(){
    let counter = 0;
    for(var i=1; i<=2; i++){
      if(this.fanStatusArray[i]){
        counter++;
      }
    }
    if(counter === 2){
      this.fanToggle = true;
    }else if(counter === 0){
      this.fanToggle = false;
    }
    this.storage.set('fanToggle',this.fanToggle);
  }

  fanToggleFunc()
  {
    this.storage.set('fanToggle',this.fanToggle);
    const bt_set_obj = {};
    for(var i=1; i<=2; i++){
      this.storage.set('fanToggle-'+i, this.fanToggle);
      this.fanStatusArray[i] = this.fanToggle;
      this.postJsonObj["fan"+i] = this.fanToggle;
      bt_set_obj['ft'+i] = this.fanToggle;
    }
    // alert(this.timeToggle);
    this.handleDataChangeApi(bt_set_obj);

  }
  
  pumpToggleFunc()
  {
    this.storage.set('pumpToggle',this.pumpToggle);
    this.postJsonObj["pump"] = this.pumpToggle;
    // alert(this.timeToggle);
    const bt_set_obj = {
      pt: this.pumpToggle
    };
    this.handleDataChangeApi(bt_set_obj);

  }

  timerFunc(index:any)
  {
    // this.storage.get('timeToggle-'+index).then((currentState)=>{ 
      let currentState = this.timeStatusArray[index];
      this.storage.set('timeToggle-'+index, !currentState);
      this.timeStatusArray[index] = !currentState;
      this.postJsonObj["light"+index] = !currentState;
      this.checkSunTimer();
      const bt_set_obj = {
        ['lt'+index]: !currentState
      };
      this.handleDataChangeApi(bt_set_obj);
    // });
    
  }

  setTimeRTC()
  {
    const me = this;
    this.datetimertc = new Date();
    const state = {
      state: {
        desired: {
          "year": parseInt(this.datetimertc.getFullYear().toString().substr(2)),
          "month": this.datetimertc.getMonth() + 1,
          "date": this.datetimertc.getDate(),
          "hour": this.datetimertc.getHours(),
          "minute": this.datetimertc.getMinutes(),
          "second": this.datetimertc.getSeconds(),
          "dow": this.datetimertc.getDay(),
        }
      }
    }
    var params = {
      payload: JSON.stringify(state),
      thingName: this.activeDevice,
      shadowName: 'Clock'
    };

    this.awsiotdata.updateThingShadow(params, function(err, data) {
      if(err) {
        console.log('AWS IOT Connection Error:', err);
        me.presentAlert('Error in publishing garden set-up. Please reconnect to a device again.', 'AWS IOT Connection Error');
        me.router.navigateByUrl('welcome');
      }
      else {
        console.log('AWS IOT Updated Time RTC:', state);
      }
    });
  }

  fanFunc(index:any)
  {
    // this.storage.get('fanToggle-'+index).then((currentState)=>{ 
      let currentState = this.fanStatusArray[index];
      this.storage.set('fanToggle-'+index, !currentState);
      this.fanStatusArray[index] = !currentState;
      this.postJsonObj["fan"+index] = !currentState;
      this.checkFanTimer();
      const bt_set_obj = {
        ['ft'+index]: !currentState
      };
      this.handleDataChangeApi(bt_set_obj);
    // });
  }

  lightSnoozeSet() {
    this.lightSnoozeRemaining = this.lightSnooze ? 30 : 0;
    const bt_set_obj = {
      'ls': this.lightSnooze
    };
    if(this.lightSnooze) {
      this.timeToggle = false;
      for(var i=1; i<=3; i++){
        this.storage.set('timeToggle-'+i, false);
        this.timeStatusArray[i] = false;
        bt_set_obj['lt'+i] = false;
      }
    }
    this.handleDataChangeApi(bt_set_obj);
  }

  fanSnoozeSet() {
    this.fanSnoozeRemaining = this.fanSnooze ? 30 : 0;
    const bt_set_obj = {
      'fs':  this.fanSnooze
    };
    if(this.fanSnooze) {
      this.fanToggle = false;
      for(var i=1; i<=2; i++){
        this.storage.set('fanToggle-'+i, false);
        this.fanStatusArray[i] = false;
        this.postJsonObj["fan"+i] = false;
        bt_set_obj['ft'+i] = false;
      }
    }
    this.handleDataChangeApi(bt_set_obj);
  }

  pumpSnoozeSet() {
    this.pumpSnoozeRemaining = this.pumpSnooze ? 30 : 0
    const bt_set_obj = {
      'ps': this.pumpSnooze
    };
    if(this.pumpSnooze) {
      this.pumpToggle = false;
      this.storage.set('pumpToggle', false);
      this.postJsonObj["pump"] = false;
      bt_set_obj['pt'] = false;
    }
    this.handleDataChangeApi(bt_set_obj);
  }

  fanOnTimerSet() {
    const bt_set_obj = {
      ['fanOnTimer']: this.fanOnTimer
    };
    this.handleDataChangeApi(bt_set_obj);
  }

  pumpOnTimerSet() {
    const bt_set_obj = {
      ['pumpOnTimer']: this.pumpOnTimer
    };
    this.handleDataChangeApi(bt_set_obj);
  }

  lightIntensitySet() {
    const bt_set_obj = {
      ['lightIntensity']: this.lightIntensity
    };
    this.handleDataChangeApi(bt_set_obj);
  }

  snoozeCheckInterval () {
    const me = this;
    let params = {
      thingName: this.activeDevice, /* required */
      shadowName: 'Settings'
    };
    let checkFunction = function () {
      me.awsiotdata.getThingShadow(params, function(err, data) {
        if (err) {
          console.log('AWS IOT Connection Error:', err);
          me.presentAlert('Error in getting snooze data. Please reconnect to a device again.', 'AWS IOT Connection Error');
          me.router.navigateByUrl('welcome');
        }
        else {
          const shadowdt = JSON.parse(data.payload);
          console.log('Snooze Check:', shadowdt);
          const state = shadowdt.state;
          const {fanSnooze, lightSnooze, pumpSnooze} = state.reported;

          if(fanSnooze == false) {
            // me.fanSnooze = false;
            me.fanStatusArray[1] = state.reported['fan1-enabled'];
            me.fanStatusArray[2] = state.reported['fan2-enabled'];
          }
          else {
            me.fanSnooze = true;
            me.fanToggle = false;
            me.fanStatusArray[1] = false
            me.fanStatusArray[2] = false
          }
          // me.fanSnoozeRemaining = fanSnoozeRemaining;

          if(lightSnooze == false) {
            // me.lightSnooze = false;
            // me.timeToggle = true;
            me.timeStatusArray[1] = state.reported['light1-enabled'];
            me.timeStatusArray[2] = state.reported['light2-enabled'];
            me.timeStatusArray[3] = state.reported['light3-enabled'];
          }
          else {
            me.lightSnooze = true;
            me.timeToggle = false;
            me.timeStatusArray[1] = false;
            me.timeStatusArray[2] = false;
            me.timeStatusArray[3] = false;
          }
          // me.lightSnoozeRemaining = lightSNooze;

          // me.pumpToggle = state.reported['pump-enabled'];
          if(pumpSnooze == false) {
            // me.pumpSnooze = false;
            me.pumpToggle = state.reported['pump-enabled'];
          }
          else {
            me.pumpSnooze = true;
            me.pumpToggle = false;
          }
          // me.pumpSnoozeRemaining = pumpSnooze;
        }
      });
    }
    checkFunction();
    this.snoozeTimeCheck = setInterval(()=>{
      checkFunction();
    }, 30000);
  }

  clockCheckInterval () {
    const me = this;
    let clockparams = {
      thingName: me.activeDevice, /* required */
      shadowName: 'Clock'
    };
    let checkFunction = function () {
      me.awsiotdata.getThingShadow(clockparams, function(err, data) {
        if (err) {
          console.log('AWS IOT Connection Error:', err);
          me.presentAlert('Error in getting clock data. Please reconnect to a device again.', 'AWS IOT Connection Error');
          me.router.navigateByUrl('welcome');
        }
        else {
          const shadowdt = JSON.parse(data.payload);
          const state = shadowdt.state;
          const {year, month, date, dow, hour, minute, second} = state.reported;
          const dateObj = new Date();
          dateObj.setFullYear(year, month - 1, date);
          dateObj.setHours(hour);
          dateObj.setMinutes(minute);
          dateObj.setSeconds(second);
          me.datetimertc = dateObj;
        }
      });
    }
    checkFunction();
    me.clockCheck = setInterval(()=>{
      checkFunction();
    }, 30000);
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
  }

}
