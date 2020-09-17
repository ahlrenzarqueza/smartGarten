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

declare var WifiWizard2: any;
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
    private storage : Storage,
    private platform : Platform,
    private loadingController : LoadingController,
    private alertController : AlertController,
    private openNativeSettings : OpenNativeSettings
    ) 
   {
    // this.showLoader()
    // this.storage.set('name','chintan');
    // this.storage.get('test').then((val)=>{alert(val)});
  //  this.storage.get('prevWifi').then((val)=>{this.prevWifi = val});
    
    this.osCheck = !this.platform.is('ios');
   }

  ngOnInit() {
    
  }
  prevWifi:any;
  subscription: any;
  selected_wifi = null;
  networkCheck:any;
  osCheck:any;
  loaderToShow:any;


   async showLoader() {
    const loading = await this.loadingController.create({
      message: 'Please Wait'
    });
    // await loading.present();

    console.log('Loading dismissed!');
  }
 
  hideLoader() {
    this.loadingController.dismiss();    
  }



  ionViewDidLeave() {
    clearInterval(this.networkCheck);
  }
 
  ionViewWillEnter()
  {
    this.presentAlert('Please reboot your smart garden and connect to it then enter the  name and password of your Home Wifi when prompted!');
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




  iosConnect()
  {
    // this.router.navigateByUrl('/tabs');

    WifiWizard2.getConnectedSSID()
    .then( ssId => {
      this.hideLoader();
      clearInterval(this.networkCheck);
      var tab = this.iab.create('http://10.0.1.1/wifi','_blank','location=true,toolbar=no,usewkwebview=yes');
      tab.on('loadstop').subscribe(e=>{
        if(e.url.indexOf('wifisave') != -1)
        {
          tab.close();
          this.storage.set('wifiSetFlag','1');
          this.router.navigateByUrl('/tabs');
        }
      });    
    })
    .catch( err => {
        if(confirm('To connect to your garden please turn on your wifi and connect to garden wifi'))
        {
          this.openNativeSettings.open('wifi')
          .then( val => {
            console.log("Successfully opens setting");
          })
          .catch( err => {
            console.log("failed to open setting", err);
          })
        }
    })        
  }

  async iosCheckNetwork()
  {
    this.networkCheck = setInterval(()=>{this.iosConnect();},3000);

  }

 
  
  connect()
  {
    // this.router.navigateByUrl('/tabs');
    if(this.selected_wifi != null)
    {
      this.presentAlertPrompt()
    }else{
      this.presentAlert("Please select a device to connect!")
    }
  }


  async presentAlertPrompt() {
    const alert = await this.alertController.create({
      header: 'Password!',
      subHeader: 'Please provide password for '+this.selected_wifi+'. Or just press ok if this device is open',
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
          text: 'Ok',
          handler: (data) => {
            this.showLoader()
            let pass = data.password;
            console.log(pass)
            console.log(this.selected_wifi)
            if(pass.length == 0)
            {
              WifiWizard2.connect(this.selected_wifi,true).then(()=>{this.connectionSuccess();}).catch((err)=>{console.log(err);this.presentAlert("Couldn't connect to the device. Check whether wifi is enabled!");});
            }else{
                    WifiWizard2.connect(this.selected_wifi,true,pass,"WPA").then(()=>{this.connectionSuccess();}).catch((err)=>{console.log(err);this.presentAlert("Couldn't connect to the device. Check whether wifi is enabled or password provided is correct!");});
                }
            console.log(data.password)
            // this.presentAlert(data)
            console.log('Confirm Ok');
          }
        }
      ]
    });

    await alert.present();
  }


  connectionSuccess()
  {
    // alert('Connected successfully to'+this.selected_wifi);
    console.log('connected');
    this.hideLoader();
    var tab = this.iab.create('http://10.0.1.1/wifi','_slef','location=no,toolbar=no');
    tab.on('loadstop').subscribe(e=>{
      if(e.url.indexOf('wifisave') != -1)
      {
        tab.close();
        this.storage.set('wifiSetFlag','1');
        this.router.navigateByUrl('/tabs');
      }
    });    
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
      let results = await WifiWizard2.scan();
      this.devices = results;
      // this.devices.forEach(device => {
      //   console.log(device.SSID, this.prevWifi);
      //   if(device.SSID ===this.prevWifi){
      //     this.selected_wifi= this.prevWifi;
      //     this.connect();
      //   }
      // })
      console.log(this.devices);
    } catch (error) {
        // this.errorHandler(error);
        console.log(error);
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
