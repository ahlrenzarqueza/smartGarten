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

// declare var WifiWizard2: any;
declare var ble: any;
// declare var networkCheck: any;
@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage implements OnInit {

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
    private geolocation: Geolocation
    ) 
   {
    // this.showLoader()
    // this.storage.set('name','chintan');
    // this.storage.get('test').then((val)=>{alert(val)});
  //  this.storage.get('prevWifi').then((val)=>{this.prevWifi = val});
    
    this.osCheck = !this.platform.is('ios');
    this.connectionMode = 'wifi';
   }

  ngOnInit() {
    
  }

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


   async showLoader() {
    const loading = await this.loadingController.create({
      message: 'Please Wait'
    });
    await loading.present();
  }
 
  hideLoader() {
    this.loadingController.dismiss();    
  }


  ionViewDidLeave() {
    clearInterval(this.networkCheck);
  }
 
  ionViewWillEnter()
  {
    // this.presentAlert('Please reboot your smart garden and connect to it then enter the  name and password of your Home Wifi when prompted!');
    this.initWifiConnection();
  }

  ionViewDidEnter(){
    this.subscription = this.platform.backButton.subscribe(()=>{
        navigator['app'].exitApp();
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
    ble.stopScan();
    if(this.platform.is('android'))
    {
      this.enablocation();
      this.checkNetworks();
    }

    if(this.platform.is('ios'))
    {
      this.iosCheckNetwork()
    }
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
    if(this.platform.is('android') && this.connectionMode == 'wifi') {
      const alert = await this.alertController.create({
        header: 'Password!',
        subHeader: 'Please provide password for '+this.selected_wifi+'. Or just press OK if this device is open (public Wi-Fi)',
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
              // console.log(pass)
              // console.log(this.selected_wifi)
              if(pass.length == 0)
              {
                this.wifiwizard2.connect(this.selected_wifi,true).then(()=>{this.connectionSuccess();}).catch((err)=>{console.log(err);this.presentAlert("Couldn't connect to the device. Check whether wifi is enabled!");});
              } else{
                this.wifiwizard2.connect(this.selected_wifi,true,pass,"WPA").then(()=>{this.connectionSuccess();}).catch((err)=>{console.log(err);this.presentAlert("Couldn't connect to the device. Check whether wifi is enabled or password provided is correct!");});
              }
              // console.log(data.password)
              // this.presentAlert(data)
              // console.log('Confirm Ok');
            }
          }
        ]
      });
      await alert.present();
    }
    else if (this.connectionMode == 'bluetooth') {
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
    this.router.navigateByUrl('/tabs');    
  }
  
  errorHandler(err: any){
    alert(`Problem: ${err}`);
  }

  async checkNetworks()
  {
    this.networkCheck = setInterval(()=>{this.enablocation();this.listNetworks();},5000);
  }

  devices = [];
  async listNetworks() {
    try {
      let results = await this.wifiwizard2.scan();
      this.devices = results;
      // this.devices.forEach(device => {
      //   console.log(device.SSID, this.prevWifi);
      //   if(device.SSID ===this.prevWifi){
      //     this.selected_wifi= this.prevWifi;
      //     this.connect();
      //   }
      // })
    } catch (error) {
        // this.errorHandler(error);
        console.log('Wi-Fi scan devices error: ', error);
    }
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
    this.checkNetworks();
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
