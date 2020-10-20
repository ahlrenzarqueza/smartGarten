import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router'
import { Diagnostic } from '@ionic-native/diagnostic/ngx'
import { LocationAccuracy} from '@ionic-native/location-accuracy/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { Storage } from '@ionic/storage'
import { Platform, IonSelect } from '@ionic/angular';
import {LoadingController, PopoverController} from "@ionic/angular"
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
  @ViewChild("localgardenselect", {static: false}) localGardenSelect: IonSelect;
  // AWS IoT Variables
  awsiotEndpoint:string; // AWS IoT Thing Base Endpoint
  awsiot:any; // AWS SDK IoT Class
  awsiotdata:any; // AWS SDK IoT Data Class
  awsiotListApi:any = 'https://g8s2hbjvd5.execute-api.ap-southeast-1.amazonaws.com/smartGartenAPI/'; // AWS API Gateway for List Things
  
  subscription: any;

  selected_wifi = null; // Active Garden Device from AWS IoT over Wi-Fi
  selected_bt = null; // Active Garde Device over Bluetooth
  selected_local_device = null; // Active Garden Device selected for configuration (change Wi-Fi)
  osIsAndroid:boolean; // Boolean value if Android (not iOS)
  connectionMode:'wifi'|'bluetooth'; // Connection mode
  gardenNameSettings:any; // Garden Name Settings (that is being saved in storage)

  customAlertOptions: any = {
    header: 'Select Local Device to configure',
    subHeader: '',
    message: '',
    translucent: true
  };

  constructor(private router: Router,
    private diagnostic : Diagnostic,
    private iab: InAppBrowser,
    private locationAccuracy : LocationAccuracy, 
    public storage : Storage,
    private platform : Platform,
    private loadingController : LoadingController,
    private alertController : AlertController,
    private popoverController : PopoverController,
    private openNativeSettings : OpenNativeSettings,
    private wifiwizard2 : WifiWizard2,
    private geolocation: Geolocation,
    private http: HttpClient
    ) 
   {
    this.osIsAndroid = !this.platform.is('ios');
    this.connectionMode = 'wifi';
   }

  ngOnInit() {

  }


  // Show Loading modal (to block user interactions)
  async showLoader() {
    const loading = await this.loadingController.create({
      message: 'Warten Sie mal...'
    });
    return await loading.present();
  }
 
  // Hide Loading modal (caused by showLoader function)
  async hideLoader() {
    try {
      return await this.loadingController.dismiss();   
    } 
    catch(e) {
      return
    }
  }

  async ionViewDidEnter(){
    const me = this;
    console.log('Local Garden Select: ', this.localGardenSelect);
    this.subscription = this.platform.backButton.subscribe(()=>{
        navigator['app'].exitApp();
    });

    // Get Garden Name Settings from Storage (to check if user has previous settings saved)
    this.storage.get('gardenNameSettings').then((val)=>{
      if(val) me.gardenNameSettings = val;
      else {
        me.gardenNameSettings = {};
        me.storage.set('gardenNameSettings', {});
      }
    });

    // Initialize AWS IoT Variables
    AWS.config.update(creds);
    this.awsiot = new AWS.Iot({apiVersion: '2015-05-28'});

    await this.showLoader();
    this.awsiot.describeEndpoint({endpointType: 'iot:Data-ATS'}, async function(err, data) {
      if (err) {
        me.hideLoader();
        await me.presentAlert(err, 'Error occurred in initializing IoT Cloud. Please check if you have a valid internet connection.');
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

  }

  // Present Native Alert Window with Message and Title
  async presentAlert(message:string, title:string = 'Alert') {
    const alert = await this.alertController.create({
      header: title,
      message: message,
      buttons: ['OK']
    });
    
    await alert.present().then(() => {
      this.hideLoader();
    });
    return alert.onDidDismiss();
  }

  // iOS Connect and Get SSID of current Wi-Fi network
  async iosConnect(successCallback)
  {
    console.log('iOS Connecting to Wi-Fi with callback:', successCallback);
    try {
      var pos = await this.geolocation.getCurrentPosition();
      console.log('Connection to Wi-Fi log, Position: ', pos);
      if (pos) {
        this.wifiwizard2.getConnectedSSID().then( ssId => {
          console.log('Connected to Wi-Fi SSID', ssId);
          this.selected_local_device = ssId; 
          if(successCallback) successCallback.call(this);
        })
        .catch( err => {
          throw err;
        })    
      }
      else throw new Error('Geolocation returned null');
    }
    catch (e) {
      console.log('iOS Wi-Fi Get SSID Error: ' + e);
      await this.presentAlert('Error occurred. Please make sure to turn on your Wi-Fi and connect to a Garden device network in iOS Settings.',
          'Garden Configuration Error');
      this.openNativeSettings.open('wifi')
      .then( val => {
        console.log("Successfully opened native settings.");
      })
      .catch( err => {
        console.log("Failed to open native settings.", err);
      });
    }   
  }

  // On change of connection mode (Wi-Fi or Bluetooth)
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

  // On change of local Wi-Fi network for use in setting up Garden Wi-Fi connection (applies to Android OS only)
  async onLocalDeviceChange(event) {
    if(!event.detail.value) return;
    if(this.platform.is('android') && this.connectionMode == 'wifi') {
      const ssid = this.selected_local_device.SSID ? this.selected_local_device.SSID : this.selected_local_device.BSSID;
      const alert = await this.alertController.create({
        header: 'Password!',
        subHeader: 'Please provide password for '+ ssid +'; or just press OK if this device is open (public Wi-Fi)',
        inputs: [
          {
            name: 'password',
            type: 'password',
            placeholder: 'Password'
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary',
            handler: () => {
              console.log('Confirm Cancel');
            }
          }, {
            text: 'OK',
            handler: (data) => {
              this.showLoader();
              let pass = data.password;
              if(pass.length == 0)
              {
                this.wifiwizard2.connect(ssid, true).then(()=>{
                  this.localConnectionSuccess();
                }).catch((err)=>{
                  console.log(err);
                  this.presentAlert("Couldn't connect to the device. Check whether Wi-Fi is enabled!");
                });
              } else{
                this.wifiwizard2.connect(ssid,true,pass,"WPA").then(()=>{
                  this.localConnectionSuccess();
                }).catch((err)=>{
                  console.log(err);
                  this.presentAlert("Couldn't connect to the device. Check whether Wi-Fi is enabled or password provided is correct!");
                });
              }
            }
          }
        ]
      });
      await alert.present();
    }
  }
  
  // Connect to Garden Device (as fired by clicking Verbinden button)
  connectToGarden()
  {
    const me = this;
    if((this.connectionMode == 'wifi' && this.selected_wifi != null) ||
      (this.connectionMode == 'bluetooth' && this.selected_bt != null)) {
        if (this.connectionMode == 'bluetooth') {
          this.showLoader();
          console.log('Connecting to BT device: ', this.selected_bt);
          ble.autoConnect(this.selected_bt.id, function (peripheralObj) {
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
    } else {
      this.presentAlert("Please select a Garden device to connect.")
    }
  }

  // Function call when connection mode changes to Wi-Fi
  initWifiConnection () {
    try {
      if(ble) ble.stopScan();
    } catch(e) {}
    this.listNetworks();
  }

  // Function call when connection mode changes to Bluetooth
  btdevices = [];
  initBtConnection () {
    this.btdevices = [];
    ble.startScan([], 
      newdevice => {
        let existingDev = this.btdevices.find(dev => (dev.id == newdevice.id))
        
        if(!existingDev) {
          if(this.gardenNameSettings[newdevice.id]) 
            newdevice.name = this.gardenNameSettings[newdevice.id];
          this.btdevices.push(newdevice);
        }
        else {
          existingDev.name = this.gardenNameSettings[newdevice.id] ? this.gardenNameSettings[newdevice.id] : newdevice.name;
        }
        // Sort to list devices with names on top of the list
        this.btdevices = this.btdevices.sort((a, b)=> a.name ? a.name.localeCompare(b.name) : 1);
      },
      error => {
        console.log('BT Scan devices error:', error);
      }
    )
  
  }

  // Function call when garden connection is successful
  connectionSuccess = async function ()
  {
    console.log('Connected to a Garden Device');
    this.hideLoader();
    await this.storage.set('globalConnectionMode', this.connectionMode);
    await this.storage.set('globalConnectedDevName', this.connectionMode == 'bluetooth' ? 
    this.selected_bt.name : this.selected_wifi);
    await this.storage.set('globalConnectedDevice', this.connectionMode == 'bluetooth' ? 
      this.selected_bt.id : this.selected_wifi);
    this.router.navigateByUrl('/tabs/tab1');    
  }

   // Function call when local Wi-Fi garden connection is successful (to open tab to setup ESP32 Wi-Fi)
  localConnectionSuccess = async () => {
    console.log('Opening IAB tab with local device: ', this.selected_local_device);
    var tab = this.iab.create('http://10.0.1.1/wifi','_self','location=no,toolbar=no');
    tab.on('loadstop').subscribe(e=>{
      console.log('A specific page was loaded', e.url);
      if(e.url.indexOf('wifisave') != -1)
      {
        tab.close();
        this.storage.set('wifiSetFlag','1');
        this.presentAlert("Garden device successfully set-up Wi-Fi connection. You can now connect to the device via Cloud IoT mode",
                          "Setup successful");
        this.selected_local_device = null;
      }
    });
    tab.show();
  }

  // List AWS IoT Devices in Garden device dropdown
  devices:any = [];
  async listNetworks() {
    const me = this;
    try {
      const results:any = await this.listThingsInThingGroup();
      this.devices = results.map(function (result) {
        return {
          name: me.gardenNameSettings[result],
          id: result
        }
      }).sort((a,b) => {
        let aname = a.name || a.id;
        let bname = b.name || b.id;
        return aname.localeCompare(bname);
      });
    } catch (error) {
        this.errorHandler(error);
        console.log('IoT Garden devices error: ', error);
    }
  }

  // List Bluetooth Devices in Garden device dropdown
  localdevices:any = [];
  async listLocalWifiNetworks() {
    const me = this;
    try {
      this.localdevices = await this.wifiwizard2.scan();
    } catch (error) {
        this.errorHandler(error);
    }
  }

  // API function to List Things in AWS IoT
  async listThingsInThingGroup() {
    const me = this;
    var prm = new Promise(function (resolve, reject) {
      me.http.get(me.awsiotListApi + 'listgardendevices').subscribe(function(data:any) {
          console.log('AWS IoT List Things Response: ', data);
          if(data.things) resolve(data.things);
          else reject([]);
      }, function (error) {
          reject(error);
      });
    });
    return prm;
  }
 
  // On click of configure local device button
  async configurelocal (evt) {
    if(this.platform.is('android'))
    {
      this.localGardenSelect.open();
      this.checkEnabledLocation();
    }

    if(this.platform.is('ios'))
    {
      await this.presentAlert('Um fortzufahren musst du mit dem Garten direkt verbunden sein!', 'Wi-Fi Konfiguration');
      this.iosConnect(this.localConnectionSuccess);
    }
  }

  // Check for Geolocation access if enabled 
  checkEnabledLocation()
  {
    this.diagnostic.isLocationEnabled().then((status) =>{status?this.listLocalWifiNetworks():this.startLocation();});
  }

  // Start Geolocation Request (user should accept Geolocation access)
  startLocation(){
    this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then((loc) =>{this.listLocalWifiNetworks()}).catch(this.onRequestFailure);
  }
  
  // Geolocation on request failure callback function
  onRequestFailure = (error)=>{
    console.error("Accuracy request failed: error code="+error.code+"; error message="+error.message);
    if(error.code !== this.locationAccuracy.ERROR_USER_DISAGREED){
        if(confirm("Failed to automatically set Location Mode to 'High Accuracy'. Would you like to switch to the Location Settings page and do this manually?")){
            this.diagnostic.switchToLocationSettings();
        }
    }
  }

  // Generic Error Handler to show alert prompt with error message
  errorHandler(err: any){
    this.presentAlert(err, 'Error occurred');
  }
  
}
