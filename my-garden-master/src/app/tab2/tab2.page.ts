import { Component } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx'
import { Storage } from '@ionic/storage'
import { HttpClient } from "@angular/common/http";
import { Platform } from '@ionic/angular';
import { NetworkInterface } from '@ionic-native/network-interface/ngx';
import { Router } from "@angular/router";
// declare var WifiWizard2: any;
import { Zeroconf } from "@ionic-native/zeroconf/ngx";
import {LoadingController} from "@ionic/angular";

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
                private loadingController : LoadingController
                ) {
    // var sunset = "12:00 am";
    
        console.log(this.sunset);
        this.storage.get('timeToggle').then((val)=>{this.timeToggle = val});
        this.storage.get('fanToggle').then((val)=>{this.fanToggle = val});
        this.storage.get('pumpToggle').then((val)=>{this.pumpToggle = val});
        this.storage.get('fanSelect').then((val)=>{this.fanSelect = val});
        this.storage.get('pumpSelect').then((val)=>{this.pumpSelect = val});
        this.storage.get('sunrise').then((val)=>{if(val != null){this.sunrise = val;}});
        this.storage.get('sunset').then((val)=>{if(val != null){this.sunset = val;}});
        console.log('sunrise = '+this.sunrise);
        console.log('sunset = '+this.sunset);
        this.storage.get('timeToggle-1').then((val)=>{console.log('timeToggle-1',val);this.timeStatusArray[1] = val});
        this.storage.get('timeToggle-2').then((val)=>{console.log('timeToggle-2',val);this.timeStatusArray[2] = val});
        this.storage.get('timeToggle-3').then((val)=>{console.log('timeToggle-3',val);this.timeStatusArray[3] = val});
        
        this.storage.get('fanToggle-1').then((val)=>{console.log('fanToggle-1',val);this.fanStatusArray[1] = val});        
        this.storage.get('fanToggle-2').then((val)=>{console.log('fanToggle-2',val);this.fanStatusArray[2] = val});
        console.log('below is zeroconf');
        if(this.wifi_ip == null)
        {
          this.storage.get('global_wifi_ip').then( val => {this.wifi_ip = val});
        }

  }

  
  sunset:String = new Date().toISOString();

  sunrise:String = new Date().toISOString();
  
  activeDevice = null;
  activeDeviceName = null;
  activeConnectionMode = 'wifi';
  bt_peripheral = null;
  pendingBtWritePrm = null;

  timeToggle;
  fanToggle;
  timeStatusArray:any = [];
  fanStatusArray:any = [];
  pumpToggle;
  fanSelect;
  pumpSelect;
  fan1;
  fan2 = 1;
  fan3;
  timerFlag:any = 1;
  fanFlag:any = 1;
  testRadio1:boolean;
  wifi_ip = null;
  apiUrl: string;
  postJsonObj :any = {};

  async ionViewWillEnter()
  {
    // this.wifi_ip = "simplePlant.local";
    // if(this.platform.is('ios'))
    // {
    //   this.wifi_ip = "192.168.43.189";
    //   // this.networkInt.getWiFiIPAddress().then(ip=>{this.wifi_ip = ip;}).catch((err)=>{alert(err);})
    // }else{
    //   this.wifi_ip = "192.168.43.189";
    //   // WifiWizard2.getWifiRouterIP().then((ip)=>{this.wifi_ip = ip;}).catch((err)=>{alert(err);});
    // }
    if(this.wifi_ip == null)
    {
      this.storage.get('global_wifi_ip').then( val => {this.wifi_ip = val});
    }
    this.activeConnectionMode = await this.storage.get('globalConnectionMode');
    this.activeDeviceName = await this.storage.get('globalConnectedDevName');
    this.activeDevice = await this.storage.get('globalConnectedDevice');
    this.bt_peripheral = await this.storage.get('globalBtPeripheral');
  }


  async showLoader() {
    const loading = await this.loadingController.create({
      message: 'Please Wait'
    });
    await loading.present();
  }
 
  hideLoader() {
    this.loadingController.dismiss();    
  }


  handleDataChangeApi (btdata = null){
    if(this.activeConnectionMode == 'wifi') {
      this.apiUrl = 'http://'+ this.wifi_ip + "/setData";
      console.log("handleDataChangeApi",this.postJsonObj);
      this.http.post(this.apiUrl, JSON.stringify(this.postJsonObj)).subscribe(data=>{
        // alert(data)
        console.log("data",data)
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

  sunriseFunc()
  {
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
    this.storage.get('timeToggle-'+index).then((currentState)=>{ 
      console.log(currentState);
      this.storage.set('timeToggle-'+index, !currentState);
      this.timeStatusArray[index] = !currentState;
      this.postJsonObj["light"+index] = !currentState;
      this.checkSunTimer();
      const bt_set_obj = {
        ['lt'+index]: !currentState
      };
      this.handleDataChangeApi(bt_set_obj);
    });
    
  }

  setWifi()
  {
    this.router.navigateByUrl('/welcome');
  }

  fanFunc(index:any)
  {
    this.storage.get('fanToggle-'+index).then((currentState)=>{ 
      console.log(currentState);
      this.storage.set('fanToggle-'+index, !currentState);
      this.fanStatusArray[index] = !currentState;
      this.postJsonObj["fan"+index] = !currentState;
      this.checkFanTimer();
      const bt_set_obj = {
        ['ft'+index]: !currentState
      };
      this.handleDataChangeApi(bt_set_obj);
    });
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
