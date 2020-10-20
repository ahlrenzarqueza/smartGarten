# Smart Garden
IOT based gardening system

## General

### Redirects
To change redirect links of the Company website and social media icons at the footer of the app change the link in the **this.iab.create('link','_self')** in **facebook()**, **redirect()** and **instagram()** at *src/app/tab1/tab1.page.ts , src/app/tab2/tab2.page.ts, src/app/tab3/tab3.page.ts and  src/app/welcome/welcome.page.ts*

```typescript
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
```

### Footer facebook and instagram logo
To change social media icons at the footer of the app change the *src*  of <ion-icon> in the **FOOTER CODE** at *src/app/tab1/tab1.page.html , src/app/tab2/tab2.page.html, src/app/tab3/tab3.page.html and  src/app/welcome/welcome.page.html*. Or use ionic provided icons,refer the following [site](https://ionicons.com/) for the icons and how to use them. Refer the below snippet.

```html
<!-- CHNAGE THE name AND REPLACE WITH ICON NAME FROM https://ionicons.com/ OR ADD A src TAG TO THE FOLLOWING CODE -->
<ion-icon size="large" (click) = "facebook()" name="logo-facebook"></ion-icon> 
<ion-icon size="large" (click) = "instagram()" name="logo-instagram"></ion-icon>
```



### Logo
To change logo of the Welcome page replace the **logo.png** at *src/assets/icon* with the new logo and name it as logo.png


### Tab Images
To change the images displayed on the tabs ,first save the new image names at *src/assets/icon*. For each tab you should have 2 images ,one image which is to be displayed when that tab is active ad 1 image when that tab isn't active. Second change src of the **<ion-img>** for each tab in *src/app/tabs/tabs.page.html* as show in the snippet below

```html
 <ion-tab-bar slot="top" class='upper-nav' >
    <ion-tab-button tab="tab1"  (click)="changeTab('tab1')">
      <!-- CHANGE THE src OF THE BELOW ion-img TO THE IMAGE TO BE DISPLAYED ON THE TAB WHEN TAB1 IS UNSELECTED -->
      <ion-img *ngIf = "selectTab !=='tab1'" class='icon-img' src="assets/icon/Cube1.png"></ion-img>
      
      <!-- CHANGE THE src OF THE BELOW ion-img TO THE IMAGE TO BE DISPLAYED ON THE TAB WHEN TAB1 IS SELECTED -->
      <ion-img *ngIf = "selectTab ==='tab1'" class='icon-img' src="assets/icon/Cube2.png"></ion-img>
    </ion-tab-button>


    <ion-tab-button tab="tab2" (click)="changeTab('tab2')"> 
      <!-- CHANGE THE src OF THE BELOW ion-img TO THE IMAGE TO BE DISPLAYED ON THE TAB WHEN TAB2 IS UNSELECTED -->
      <ion-img *ngIf = "selectTab !=='tab2'" class='icon-img' src="assets/icon/Settings1.png"></ion-img>

      <!-- CHANGE THE src OF THE BELOW ion-img TO THE IMAGE TO BE DISPLAYED ON THE TAB WHEN TAB2 IS SELECTED -->
      <ion-img *ngIf = "selectTab ==='tab2'" class='icon-img' src="assets/icon/Settings2.png"></ion-img>
    </ion-tab-button>
 
    
    <ion-tab-button tab="tab3" (click)="changeTab('tab3')">
      <!-- CHANGE THE src OF THE BELOW ion-img TO THE IMAGE TO BE DISPLAYED ON THE TAB WHEN TAB3 IS UNSELECTED -->
      <ion-img *ngIf = "selectTab !=='tab3'" style="margin-right: 2vw; margin-top: 2vh;width: 20vw;" class='icon-img' src="assets/icon/Info1.png"></ion-img>

      <!-- CHANGE THE src OF THE BELOW ion-img TO THE IMAGE TO BE DISPLAYED ON THE TAB WHEN TAB3 IS SELECTED -->
      <ion-img *ngIf = "selectTab ==='tab3'" style="margin-right: 2vw; margin-top: 2vh;width: 20vw;" class='icon-img' src="assets/icon/Info2.png"></ion-img>
    </ion-tab-button>
  </ion-tab-bar>

</ion-tabs>
```


## WELCOME PAGE

### Change color of connect button

Go to *src/app/welcome/welcome.page.scss* and make changes to the **.ion-color-custgreen** as shown in the below snippet

```scss
// CUSTOME GREEN COLOR OF CONNECT BUTTON
.ion-color-custgreen {
    --ion-color-base: #5A9558;  //change base color of the button
    --ion-color-base-rgb: 255,255,0;  //change base color of the button
    --ion-color-contrast: white;  //change contrast of the button
    --ion-color-contrast-rgb: 0,0,0; //change contrast of the button
    --ion-color-shade: #5A9558;
    --ion-color-tint: #5A9558;
}
```

## TAB1 PAGE

### Change images of the measurement icons
Go to *src/app/tab1/tab1.page.html* and change the **src** of **<ion-img>** as specified in the snippet below. The images must be stored in *src/assets/icon*

```html
<!-- line no-13 replace thermometer.png with the name of the new image name  --> 
<ion-img (click)="redirectToSettings()" class="body-img" src='assets/icon/thermometer.png'></ion-img> 

<!-- line no-25 replace drop.png with the name of the new image name  --> 
<ion-img (click)="redirectToSettings()" class="body-img" src='assets/icon/drop.png'></ion-img> 

<!-- line no-37 replace water-glass.png with the name of the new image name  --> 
<ion-img (click)="redirectToSettings()" class="body-img" src='assets/icon/water-glass.png'></ion-img> 

<!-- line no-49 replace ph.png with the name of the new image name  --> 
<ion-img (click)="redirectToSettings()" class="body-img" src='assets/icon/ph.png'></ion-img> 
```

## TAB2 PAGE 

### Change images of the settings icons
Go to *src/app/tab1/tab2.page.html* and change the **src** of **<ion-img>** as specified in the snippet below. The images must be stored in *src/assets/icon*

```html
<!-- line no-12 replace sun.png with the name of the new image name  --> 
 <ion-img class='tab2-body-img' src="assets/icon/sun.png"></ion-img> 

<!-- line no-51 replace wind.png with the name of the new image name  --> 
<ion-img class='tab2-body-img' src="assets/icon/wind.png"></ion-img>

<!-- line no-90 replace vintage-water-pump.png with the name of the new image name  --> 
<ion-img class='tab2-body-img' src="assets/icon/vintage-water-pump.png"></ion-img> 

<!-- line no-49 replace ph.png with the name of the new image name  --> 
<ion-img (click)="redirectToSettings()" class="body-img" src='assets/icon/ph.png'></ion-img> 
```

### Change color of on/off  buttons and toggles
Go to *src/app/tab1/tab2.page.scss* and 
1. Change **.ion-color-custgreen** at **line no 24** to change colors of buttons/toggles when switched on
2. Change **.ion-color-custgrey** to **line no 37** change colors of buttons/toggles when switched on

```scss
// CODE FOR THE SWITCH-ON  BUTTONS AND TOGGLES COLORS on line no 24
.ion-color-custgreen {
    // Change ion-color-base and  ion-color-base-rgb to change button and toggle on colors
    --ion-color-base: #5A9558 !important; //change base color of the button
    --ion-color-base-rgb: var(--ion-color-custgreen-rgb, 90, 149, 88) !important;  //change base color of the button
    --ion-color-contrast: white !important; //change contrast of the button
    --ion-color-contrast-rgb: 0,0,0 !important; //change contrast of the button
    --ion-color-shade: #5A9558 !important;
    --ion-color-tint: #5A9558 !important;
    --background: rgba(var(--ion-text-color-rgb,0,0,0),0.3);
    --handle-background: #fff;
}

// CODE FOR THE SWITCH-OFF  BUTTONS AND TOGGLES COLORS on line no 37
.ion-color-custgrey {
    // Change ion-color-base and  ion-color-base-rgb to change button and toggle on colors
    --ion-color-base: grey; //change base color of the button
    --ion-color-base-rgb:white;  //change base color of the button
    --ion-color-contrast: white; //change contrast of the button
    --ion-color-contrast-rgb: 0,0,0; //change contrast of the button
    --ion-color-shade: grey;
    --ion-color-tint: grey;
}
```


### TAB3 PAGE 
Go to *src/app/tab3.page.html* 

```html
    <!-- CHANGE background-color TO CHANGE COLOR OF THE BULLET POINT CIRCLES  change background-color to the color u need-->

    <!-- line no 13  -->
    <div class='circle' style="background-color:#a8d2af"> 
        1 
    </div>

    <!-- line no 26  -->
    <div class='circle' style="background-color:#a8d2af"> 
        2 
    </div>

    <!-- line no 37  -->
    <div class='circle' style="background-color:#a8d2af"> 
        3 
    </div>

    <!--CHANGE LEAF IMAGE -->
    <!-- page no 54 replace leaf.png with the name of the new image name  -->
    <ion-img class="tab3-body-img" src='assets/icon/leaf.png'></ion-img>

```
