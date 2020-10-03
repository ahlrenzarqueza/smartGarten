import { Component, OnInit } from '@angular/core';
// import { connect } from 'tls';
import { Router } from '@angular/router'
import { Diagnostic } from '@ionic-native/diagnostic/ngx'
import { LocationAccuracy} from '@ionic-native/location-accuracy/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { Storage } from '@ionic/storage'
import { Platform } from '@ionic/angular';
import {LoadingController} from "@ionic/angular"
import { AlertController } from "@ionic/angular";
import { OpenNativeSettings } from '@ionic-native/open-native-settings/ngx';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { WifiWizard2 } from '@ionic-native/wifi-wizard-2/ngx';
import { HttpClient } from '@angular/common/http';
import * as AWS from 'aws-sdk';
import creds from '../../assets/env.json';

declare var ble: any;
@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage implements OnInit {
  awsiotEndpoint:any;
  awsiot:any;
  awsiotdata:any;
  iotApi:any = 'https://1ki06byvn9.execute-api.ap-southeast-1.amazonaws.com/live/';
  prevWifi:any;
  subscription: any;
  selected_wifi = null;
  selected_bt = null;
  selected_bt_id = null;
  selected_bt_name = null;
  networkCheck:any;
  osCheck:any;
  loaderToShow:any;
  btdevice:any;
  connectionMode:'wifi'|'bluetooth';
  gardenNameSettings:any;

  constructor(private router: Router,
    private diagnostic : Diagnostic,
    private iab: InAppBrowser,
    private locationAccuracy : LocationAccuracy, 
    public storage : Storage,
    private platform : Platform,
    private loadingController : LoadingController,
    private alertController : AlertController,
    private openNativeSettings : OpenNativeSettings,
    private wifiwizard2 : WifiWizard2,
    private geolocation: Geolocation,
    private http: HttpClient
    ) 
   {
    // this.showLoader()
    // this.storage.set('name','chintan');
    // this.storage.get('test').then((val)=>{alert(val)});
    this.osCheck = !this.platform.is('ios');
    this.connectionMode = 'wifi';
   }

  ngOnInit() {

  }


  async showLoader() {
    const loading = await this.loadingController.create({
      message: 'Warten Sie mal...'
    });
    return await loading.present();
  }
 
  async hideLoader() {
    try {
      return await this.loadingController.dismiss();   
    } 
    catch(e) {
      return
    }
  }


  ionViewDidLeave() {
    clearInterval(this.networkCheck);
  }
 
  ionViewWillEnter()
  {
    // const me = this;
    // AWS.config.update(creds);
    // this.awsiot = new AWS.Iot({apiVersion: '2015-05-28'});
    // this.showLoader();
    // this.awsiot.describeEndpoint({endpointType: 'iot:Data-ATS'}, function(err, data) {
    //   if (err) {
    //     me.hideLoader();
    //     me.presentAlert('Please connect to a working internet connection.');
    //     me.openNativeSettings.open('wifi')
    //     .then( val => {
    //       console.log("Successfully opened native settings.");
    //     })
    //     .catch( err => {
    //       console.log("Failed to open native settings.", err);
    //     })
    //   }
    //   else {
    //     me.awsiotEndpoint = data.endpointAddress;
    //     me.storage.set('awsiotEndpoint', data.endpointAddress);
    //     me.awsiotdata = new AWS.IotData({
    //       endpoint: data.endpointAddress,
    //       apiVersion: '2015-05-28'
    //     }); 
    //     me.initWifiConnection();
    //     me.hideLoader();
    //   }
    // });
  }

  async ionViewDidEnter(){
    const me = this;
    this.subscription = this.platform.backButton.subscribe(()=>{
        navigator['app'].exitApp();
    });
    AWS.config.update(creds);
    this.awsiot = new AWS.Iot({apiVersion: '2015-05-28'});
    this.storage.get('gardenNameSettings').then((val)=>{
      if(val) me.gardenNameSettings = val;
      else {
        me.gardenNameSettings = {};
        me.storage.set('gardenNameSettings', {});
      }
    });
    await this.showLoader();
    this.awsiot.describeEndpoint({endpointType: 'iot:Data-ATS'}, function(err, data) {
      if (err) {
        me.hideLoader();
        me.presentAlert(err, 'Please connect to a working internet connection.');
        me.openNativeSettings.open('wifi')
        .then( val => {
          console.log("Successfully opened native settings.");
        })
        .catch( err => {
          console.log("Failed to open native settings.", err);
        })
      }
      else {
        me.awsiotEndpoint = data.endpointAddress;
        me.storage.set('awsiotEndpoint', data.endpointAddress);
        me.awsiotdata = new AWS.IotData({
          endpoint: data.endpointAddress,
          apiVersion: '2015-05-28'
        }); 
        me.initWifiConnection();
        me.hideLoader();
      }
    });
  }

  ionViewWillLeave(){
      this.subscription.unsubscribe();
  }

  ngOnDestroy()
  {
    clearInterval(this.networkCheck);
  }

  async presentAlert(message:string, title:string = 'Alert') {
    const alert = await this.alertController.create({
      header: title,
      // subHeader: subTitle,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
    this.hideLoader();
  }

  async iosConnect()
  {
    // this.router.navigateByUrl('/tabs');
    try {
      var pos = await this.geolocation.getCurrentPosition();
      if (pos) {
        this.wifiwizard2.getConnectedSSID().then( ssId => {
          this.selected_wifi = ssId; 
        })
        .catch( err => {
          throw err;
        })    
      }
      else throw new Error('Geolocation returned null');
    }
    catch (e) {
      console.log('iOS Wi-Fi Get SSID Error: ', e);
      if(confirm('To continue, please turn on your Wi-Fi and connect to Garden access point in Settings.'))
      {
        this.openNativeSettings.open('wifi')
        .then( val => {
          console.log("Successfully opened native settings.");
        })
        .catch( err => {
          console.log("Failed to open native settings.", err);
        })
      }
    }   
  }

  async iosCheckNetwork()
  {
    this.networkCheck = setInterval(()=>{this.iosConnect();},3000);
    var isNotInitStart = await this.storage.get('iOSNotInitStart');
    if(!isNotInitStart) {
      await this.storage.set('iOSNotInitStart', true);
      this.presentAlert('To select Garden via Wi-Fi, selection will depend on current connected Wi-Fi. To change, please configure in iOS Settings.',
                  'Wi-Fi Garden Selection');
    }
  }

  onConnModeChange(event)
  {
    if(!event.detail.value) return;
    this.connectionMode = event.detail.value;
    switch(this.connectionMode) {
      case "wifi":
        this.initWifiConnection();
        break;
      case "bluetooth":
        this.initBtConnection();
        break;
    }
  }

  onBtDeviceChange(event) {
    if(!event.detail.value) return;
    this.selected_bt_id = event.detail.value.id;
    this.selected_bt_name = event.detail.value.name;
  }
  
  connect()
  {
    // this.router.navigateByUrl('/tabs');
    if((this.connectionMode == 'wifi' && this.selected_wifi != null) ||
      (this.connectionMode == 'bluetooth' && this.selected_bt != null)) {
        this.presentAlertPrompt()
    } else {
      this.presentAlert("Please select a Garden device to connect.")
    }
  }

  initWifiConnection () {
    try {
      if(ble) ble.stopScan();
    } catch(e) {}
    // if(this.platform.is('android'))
    // {

      // this.enablocation();
      // this.checkNetworks();
    // }

    // if(this.platform.is('ios'))
    // {
    //   this.iosCheckNetwork()
    // }
    this.listNetworks();
  }

  btdevices = [];
  initBtConnection () {
    this.btdevices = [];
    ble.startScan([], 
      newdevice => {
        var existingDev = this.btdevices.find(dev => (dev.id == newdevice.id))
        
        if(!existingDev) this.btdevices.push(newdevice);
        else {
          existingDev.name = newdevice.name;
        }
      },
      error => {
        console.log('BT Scan devices error:', error);
      }
    )
  
  }


  async presentAlertPrompt() {
    const me = this;
    // if(this.platform.is('android') && this.connectionMode == 'wifi') {
    //   const alert = await this.alertController.create({
    //     header: 'Password!',
    //     subHeader: 'Please provide password for '+this.selected_wifi+'. Or just press OK if this device is open (public Wi-Fi)',
    //     inputs: [
    //       {
    //         name: 'password',
    //         type: 'password',
    //         placeholder: 'Password'
    //       }
    //     ],
    //     buttons: [
    //       {
    //         text: 'Cancel',
    //         role: 'cancel',
    //         cssClass: 'secondary',
    //         handler: () => {
    //           console.log('Confirm Cancel');
    //         }
    //       }, {
    //         text: 'OK',
    //         handler: (data) => {
    //           this.showLoader();
    //           let pass = data.password;
    //           // console.log(pass)
    //           // console.log(this.selected_wifi)
    //           if(pass.length == 0)
    //           {
    //             this.wifiwizard2.connect(this.selected_wifi,true).then(()=>{this.connectionSuccess();}).catch((err)=>{console.log(err);this.presentAlert("Couldn't connect to the device. Check whether wifi is enabled!");});
    //           } else{
    //             this.wifiwizard2.connect(this.selected_wifi,true,pass,"WPA").then(()=>{this.connectionSuccess();}).catch((err)=>{console.log(err);this.presentAlert("Couldn't connect to the device. Check whether wifi is enabled or password provided is correct!");});
    //           }
    //           // console.log(data.password)
    //           // this.presentAlert(data)
    //           // console.log('Confirm Ok');
    //         }
    //       }
    //     ]
    //   });
    //   await alert.present();
    // }
    if (this.connectionMode == 'bluetooth') {
      this.showLoader();
      console.log('Connecting to BT device: ', this.selected_bt);
      ble.autoConnect(this.selected_bt_id, function (peripheralObj) {
        ble.stopScan();
        me.storage.set('globalBtPeripheral', peripheralObj);
        console.log('Connected to BT device with peripheral: ', JSON.stringify(peripheralObj));
        me.connectionSuccess();
      }, function () {
        this.hideLoader();
        this.presentAlert('Connection to selected bluetooth device failed. Please try connecting again.');
      });
    }
    else {  
      this.connectionSuccess();
    }
  }


  connectionSuccess = async function ()
  {
    console.log('Connected to a Garden Device');
    this.hideLoader();
    await this.storage.set('globalConnectionMode', this.connectionMode);
    await this.storage.set('globalConnectedDevName', this.connectionMode == 'bluetooth' ? 
    this.selected_bt_name : this.selected_wifi);
    await this.storage.set('globalConnectedDevice', this.connectionMode == 'bluetooth' ? 
      this.selected_bt : this.selected_wifi);
    // var tab = this.iab.create('http://10.0.1.1/wifi','_slef','location=no,toolbar=no');
    // tab.on('loadstop').subscribe(e=>{
    //   if(e.url.indexOf('wifisave') != -1)
    //   {
    //     tab.close();
    //     this.storage.set('wifiSetFlag','1');
    //     this.router.navigateByUrl('/tabs');
    //   }
    // });
    this.router.navigateByUrl('/tabs/tab1');    
  }
  
  errorHandler(err: any){
    alert(`Problem: ${err}`);
  }

  async checkNetworks()
  {
    // this.networkCheck = setInterval(()=>{this.enablocation();this.listNetworks();},5000);
    this.enablocation();
    this.listNetworks();
  }

  devices:any = [];
  async listNetworks() {
    const me = this;
    try {
      // let results = await this.wifiwizard2.scan();
      const results:any = await this.listThingsInThingGroup();
      this.devices = results.map(function (result) {
        return {
          name: me.gardenNameSettings[result],
          id: result
        }
      });
    } catch (error) {
        // this.errorHandler(error);
        console.log('IoT Garden devices error: ', error);
    }
  }

  async listThingsInThingGroup() {
    const me = this;
    var prm = new Promise(function (resolve, reject) {
      me.http.get(me.iotApi + 'listgardendevices').subscribe(function(data:any) {
          console.log('AWS IoT List Things Response: ', data);
          if(data.things) resolve(data.things);
          else reject([]);
      }, function (error) {
          reject(error);
      });
    });
    return prm;
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
  
onRequestSuccess(success){
    console.log("Successfully requested accuracy: "+success.message);
    this.listNetworks();
    // this.checkNetworks();
}

 onRequestFailure = (error)=>{
    console.error("Accuracy request failed: error code="+error.code+"; error message="+error.message);
    if(error.code !== this.locationAccuracy.ERROR_USER_DISAGREED){
        if(confirm("Failed to automatically set Location Mode to 'High Accuracy'. Would you like to switch to the Location Settings page and do this manually?")){
            this.diagnostic.switchToLocationSettings();
        }
    }
}
  startLocation(){
    // alert('Please ');
    this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then((loc) =>{this.listNetworks()}).catch(this.onRequestFailure);
  }
  enablocation()
  {
    // alert('start');
    this.diagnostic.isLocationEnabled().then((status) =>{status?this.listNetworks():this.startLocation();});
  }
 
  
}
