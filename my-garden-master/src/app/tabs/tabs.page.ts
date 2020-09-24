import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Events } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {
  selectTab: string = 'tab1';
  subscription: any;

  constructor(private platform: Platform, private events: Events, private router: Router) {
    events.subscribe('change-tab', (tab) => {
      console.log(tab);
      this.changeTab(tab);
    });
  }

  // test()
  // {
  //   this.events.publish('test-alert',(text)=>{alert(text)})
  // }
  
  changeTab(tab){
    this.selectTab = tab;
  }

  backHome() {
    this.router.navigateByUrl('/welcome');
  }

  ionViewDidEnter(){
      this.subscription = this.platform.backButton.subscribe(()=>{
          navigator['app'].exitApp();
      });
  }

  ionViewWillLeave(){
      this.subscription.unsubscribe();
  }
}
