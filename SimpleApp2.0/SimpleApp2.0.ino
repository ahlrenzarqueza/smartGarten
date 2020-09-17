
#include <ArduinoJson.h>

#include "DHT.h"
#include<UltraDistSensor.h>


#include <WiFi.h>
#include <WebServer.h>
#include <WiFiClient.h>
#include <ESPmDNS.h>

#include <DS3231.h>
#include <Wire.h>


#define DHTTYPE DHT11   // DHT 11

WebServer server(80);

// DHT Sensor
uint8_t DHTPin = 4;   //  DHT11 PIN TEMPRATURE and Humidity 
               
// Initialize DHT sensor.
DHT dht(DHTPin, DHTTYPE);                
UltraDistSensor mysensor1;

int light_1 = 27;  //
int light_2 = 26;  //
int light_3 = 25; //     RELAY CONNECTION
int fan_1 = 33;   //
int fan_2 = 32;  //
int pump1 = 23;  //



// PH connections
const int analogInPin = A0;   // FOR PH SENSOR
int sensorValue = 0; 
unsigned long int avgValue; 
float b;
int buf[10],temp;

float Temperature;
float Humidity;
float Waterlevel;
float SensorValueCM;
float SensorHeight=7;
float SensorSafetyDistance=1;
float PHValue;


DS3231 Clock;
bool Century=false;
bool h12;
bool PM;
byte ADay, AHour, AMinute, ASecond, ABits;
bool ADy, A12h, Apm;

bool fan1=false;
bool fan2=false;
int fanTime=0;

bool pump=false;
int pumpTime=0;

bool light1=false;
bool light2=false;
bool light3=false;
int sunRiseHour=0;
int sunRiseMin=0;
int sunSetHour=0;
int sunSetMin=0;
///////////////////////////////////////////////////////////////////////////////////////////////////////////
#ifdef ESP32
  #include <esp_wifi.h>
  #include <WiFi.h>
  #include <WiFiClient.h>

  #define ESP_getChipId()   ((uint32_t)ESP.getEfuseMac())

  #define LED_ON      HIGH
  #define LED_OFF     LOW  
#else
  #include <ESP8266WiFi.h>          //https://github.com/esp8266/Arduino
  //needed for library
  #include <DNSServer.h>
  #include <ESP8266WebServer.h>  

  #define ESP_getChipId()   (ESP.getChipId())

  #define LED_ON      LOW
  #define LED_OFF     HIGH
#endif

// SSID and PW for Config Portal
String ssid = "SmartGarden_" + String(ESP_getChipId(), HEX);   /// ADD YOUR SSID here
const char* password = "";                            /// ADD PASSWORD here

// SSID and PW for your Router
String Router_SSID;
String Router_Pass;

#include <ESP_WiFiManager.h>              //https://github.com/khoih-prog/ESP_WiFiManager

// Onboard LED I/O pin on NodeMCU board
const int PIN_LED = 2; // D4 on NodeMCU and WeMos. GPIO2/ADC12 of ESP32. Controls the onboard LED.

void heartBeatPrint(void)
{
  static int num = 1;

  if (WiFi.status() == WL_CONNECTED)
    Serial.print("H");        // H means connected to WiFi
  else
    Serial.print("F");        // F means not connected to WiFi
  
  if (num == 80) 
  {
    Serial.println();
    num = 1;
  }
  else if (num++ % 10 == 0) 
  {
    Serial.print(" ");
  }
} 

void check_status()
{
  static ulong checkstatus_timeout = 0;

  //KH
  #define HEARTBEAT_INTERVAL    10000L
  // Print hearbeat every HEARTBEAT_INTERVAL (10) seconds.
  if ((millis() > checkstatus_timeout) || (checkstatus_timeout == 0))
  {
    heartBeatPrint();
    checkstatus_timeout = millis() + HEARTBEAT_INTERVAL;
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

void setup() {

  pinMode(PIN_LED, OUTPUT);
  Serial.begin(115200);
  Serial.println("\nStarting");
  
  unsigned long startedAt = millis();
  
 digitalWrite(PIN_LED, LED_ON); // turn the LED on by making the voltage LOW to tell us we are in configuration mode.
  
  //Local intialization. Once its business is done, there is no need to keep it around
  ESP_WiFiManager ESP_wifiManager;
  ESP_wifiManager.setAPStaticIPConfig(IPAddress(10,0,1,1), IPAddress(10,0,1,1), IPAddress(255,255,255,0));
//  ESP_wifiManager.setSTAStaticIPConfig(IPAddress(192,168,4,1), IPAddress(192,168,0,1), IPAddress(255,255,255,0));
 // ESP_wifiManager.setSTAStaticIPConfig(IPAddress(192,168,2,114), IPAddress(192,168,2,1), IPAddress(255,255,255,0)); 
                                        //IPAddress(192,168,2,1), IPAddress(8,8,8,8));
  // We can't use WiFi.SSID() in ESP32as it's only valid after connected. 
  // SSID and Password stored in ESP32 wifi_ap_record_t and wifi_config_t are also cleared in reboot
  // Have to create a new function to store in EEPROM/SPIFFS for this purpose
  Router_SSID = ESP_wifiManager.WiFi_SSID();
  Router_Pass = ESP_wifiManager.WiFi_Pass();
  
  //Remove this line if you do not want to see WiFi password printed
  Serial.println("Stored: SSID = " + Router_SSID + ", Pass = " + Router_Pass);
  
  //Check if there is stored WiFi router/passeord credentials.
  //If not found, device will remain in configuration mode until switched off via  webserver.
  Serial.print("Opening configuration portal.");
  
  if (Router_SSID != "")
  {
    ESP_wifiManager.setConfigPortalTimeout(60); //If no access point name has been previously entered disable timeout.
    Serial.println("Timeout 60s");
  }
  else
    Serial.println("No timeout");

  // SSID to uppercase 
  ssid.toUpperCase();  

  //it starts an access point 
  //and goes into a blocking loop awaiting configuration
  if (!ESP_wifiManager.startConfigPortal((const char *) ssid.c_str(), password)) 
    Serial.println("Not connected to WiFi but continuing anyway.");
  else 
    Serial.println("WiFi connected...yeey :)");

  digitalWrite(PIN_LED, LED_OFF); // Turn led off as we are not in configuration mode.
 
  // For some unknown reason webserver can only be started once per boot up 
  // so webserver can not be used again in the sketch.
  #define WIFI_CONNECT_TIMEOUT        30000L
  #define WHILE_LOOP_DELAY            200L
  #define WHILE_LOOP_STEPS            (WIFI_CONNECT_TIMEOUT / ( 3 * WHILE_LOOP_DELAY ))
  
  startedAt = millis();
  
  while ( (WiFi.status() != WL_CONNECTED) && (millis() - startedAt < WIFI_CONNECT_TIMEOUT ) )
  {   
    #ifdef ESP32
      WiFi.mode(WIFI_STA);
      WiFi.persistent (true);
      // We start by connecting to a WiFi network
    
      Serial.print("Connecting to ");
      Serial.println(Router_SSID);
    
      WiFi.begin(Router_SSID.c_str(), Router_Pass.c_str());
    #endif

    int i = 0;
    while((!WiFi.status() || WiFi.status() >= WL_DISCONNECTED) && i++ < WHILE_LOOP_STEPS)
    {
      delay(WHILE_LOOP_DELAY);
    }    
  }

  Serial.print("After waiting ");
  Serial.print((millis()- startedAt) / 1000);
  Serial.print(" secs more in setup(), connection result is ");

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.print("connected. Local IP: ");
    Serial.println(WiFi.localIP());
    if (!MDNS.begin("simpleplant")) {
        Serial.println("Error setting up MDNS responder!");
        while(1) {
            delay(1000);
        }
    }
    Serial.println("mDNS responder started");
    // Start TCP (HTTP) server
    server.begin();
    Serial.println("TCP server started");
    // Add service to MDNS-SD
    MDNS.addService("http", "tcp", 80);
  }
  else
    Serial.println(ESP_wifiManager.getStatus(WiFi.status()));
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  
  //Serial.begin(115200);
  delay(100);
 
  Wire.begin();
  pinMode(DHTPin, INPUT);
  mysensor1.attach(5,18);//Trigger pin , Echo pin     Ultasonic sensor pins

  pinMode(light_1, OUTPUT);
  pinMode(light_2, OUTPUT);
  pinMode(light_3, OUTPUT);
  pinMode(fan_1, OUTPUT);
  pinMode(fan_2, OUTPUT);
  pinMode(pump1, OUTPUT);

  dht.begin();              

  Serial.println("Connecting to ");
  Serial.println(ssid);

  //connect to your local wi-fi network
// WiFi.softAP(ssid, password);

  IPAddress myIP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(myIP);
  //server.on("/", handleRoot);
  
  server.on("/getData", handle_OnConnect);
  server.on("/setData", HTTP_POST, [](){
    StaticJsonDocument<1000> doc;
    DeserializationError err = deserializeJson(doc, server.arg("plain"));
    if (err) {
        Serial.print(F("deserializeJson() failed with code "));
        Serial.println(err.c_str());
    }
    Serial.println("plain: " + server.arg("plain"));
    const bool fan1Doc = doc["fan1"];
    const bool fan2Doc = doc["fan2"];
    const bool pumpDoc = doc["pump"];
    const bool light1Doc = doc["light1"];
    const bool light2Doc = doc["light2"];
    const bool light3Doc = doc["light3"];
    
    const char* sun_rise_hourDocTest = doc["sun_rise_hour"];
    Serial.println(sun_rise_hourDocTest);
    const int sun_rise_hourDoc = doc["sun_rise_hour"];
    const int sun_rise_minDoc = doc["sun_rise_min"];
    const int sun_set_hourDoc = doc["sun_set_hour"];
    const int sun_set_minDoc = doc["sun_set_min"];

    const char* fanLevel = doc["fan_level"];
    const char* pumpLevel = doc["pump_level"];
    
    Serial.print(fan1Doc);
    Serial.print(" ");
    Serial.print(fan2Doc);
    Serial.print(" ");
    Serial.print(pumpDoc);
    Serial.print(" ");
    Serial.print(light1Doc);
    Serial.print(" ");
    Serial.print(light2Doc);
    Serial.print(" ");
    Serial.print(light3Doc);
    Serial.print(" ");
    Serial.print(sun_rise_hourDoc);
    Serial.print(" ");
    Serial.print(sun_rise_minDoc);
    Serial.print(" ");
    Serial.print(sun_set_hourDoc);
    Serial.print(" ");
    Serial.print(sun_set_minDoc);
    Serial.print(" ");
    Serial.print(fanLevel);
    Serial.print(" ");
    Serial.print(pumpLevel);
    Serial.print(" ");
    Serial.println();
    fan1=fan1Doc;
    fan2=fan2Doc;
    if(fanLevel != NULL && strcmp(fanLevel, "low") == 0){
      fanTime=10;                                           //  Change TIME HERE       //
    }else if(fanLevel != NULL && strcmp(fanLevel, "medium") == 0){ 
      fanTime=30;                                          //  Change TIME HERE       //     FAN CONTROL
    }else if(fanLevel != NULL && strcmp(fanLevel, "high") == 0){
      fanTime=60;                                         //  Change TIME HERE        //
    }

    pump=pumpDoc;
    if(pumpLevel != NULL && strcmp(pumpLevel, "low") == 0){
      pumpTime=10;
    }else if(pumpLevel != NULL && strcmp(pumpLevel, "medium") == 0){
      pumpTime=30;
    }else if(pumpLevel != NULL && strcmp(pumpLevel, "high") == 0){
      pumpTime=60;
    }

    light1=light1Doc;
    light2=light2Doc;
    light3=light3Doc;

    sunRiseHour=sun_rise_hourDoc;
    sunRiseMin=sun_rise_minDoc;
    sunSetHour=sun_set_hourDoc;
    sunSetMin=sun_set_minDoc;

    Serial.print(fan1);
    Serial.print(" ");
    Serial.print(fan2);
    Serial.print(" ");
    Serial.print(fanTime);
    Serial.print(" ");
    Serial.print(pump);
    Serial.print(" ");
    Serial.print(pumpTime);
    Serial.print(" ");
    Serial.print(light1);
    Serial.print(" ");
    Serial.print(light2);
    Serial.print(" ");
    Serial.print(light3);
    Serial.print(" ");
    Serial.print(sunRiseHour);
    Serial.print(" ");
    Serial.print(sunRiseMin);
    Serial.print(" ");
    Serial.print(sunSetHour);
    Serial.print(" ");
    Serial.print(sunSetMin);
    Serial.println();
    server.send ( 200, "application/json", "{\"status\":\"success\"}" );
  });
  server.onNotFound(handle_NotFound);

  server.begin();
  Serial.println("HTTP server started");
///////////////////////////////////////////////////////////////////////////////////////////////////////////
  
///////////////////////////////////////////////////////////////////////////////////////////////////////////
  

}
void loop() {
 
  server.handleClient();
  getTime();
  executeFanTimer();
  executePump();
  executeLights();
  check_status();
}

void handle_OnConnect() {

  Temperature = dht.readTemperature(); // Gets the values of the temperature
  Humidity = dht.readHumidity(); // Gets the values of the humidity
  SensorValueCM=mysensor1.distanceInCm();
  Waterlevel=(1-(SensorValueCM-SensorSafetyDistance)/(SensorHeight-SensorSafetyDistance))*100;
  PHValue=getPhValue();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Allow", "HEAD,GET,PUT,POST,DELETE,OPTIONS");
  server.sendHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT");
  server.sendHeader("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Cache-Control, Accept");
  
  server.send(200, "application/json", SendHTML(Temperature,Humidity, Waterlevel, PHValue));
}

void handle_NotFound(){
  server.send(404, "text/plain", "Not found");
}

String SendHTML(float Temperaturestat,float Humiditystat, float Waterlevel, float PHValue){    /// ALL the sensor data is send from here
   String ptr = "{\"temparature\":";
  ptr +="\"";
  ptr +=(int)Temperaturestat;
  ptr +=" °C\",";
  ptr +="\"humidity\":";
  ptr +="\"";
  ptr +=(int)Humiditystat;
  ptr +=" %\",";
  ptr +="\"phvalue\":";
  ptr +="\"";
  ptr +=(int)PHValue;
  ptr +="\",";
  ptr +="\"waterlevel\":";
  //ptr +=(int)((Waterlevel/10)*100);
  ptr +="\"";
  ptr +=Waterlevel;
  ptr +=" %\"";
  ptr +="}";
  return ptr;
}

float getPhValue() {
 for(int i=0;i<10;i++) 
 { 
  buf[i]=analogRead(analogInPin);
  delay(10);
 }
 for(int i=0;i<9;i++)
 {
  for(int j=i+1;j<10;j++)
  {
   if(buf[i]>buf[j])
   {
    temp=buf[i];
    buf[i]=buf[j];
    buf[j]=temp;
   }
  }
 }
 avgValue=0;
 for(int i=2;i<8;i++)
 avgValue+=buf[i];
 float pHVol=(float)avgValue*5.0/1024/6;
 float phValue = -5.70 * pHVol + 21.34;
 Serial.print("sensor = ");
 Serial.println(phValue);
 return phValue;
}

void executeFanTimer(){                  ///   FAN TIMER
  int mins = Clock.getMinute();               
  Serial.println(mins);                      
  if(mins < fanTime){                        
    if(fan1){
      Serial.println("fan1 on");
      digitalWrite(fan_1, LOW);

    }else{
      Serial.println("fan1 off");
      digitalWrite(fan_1, HIGH);

    }
    if(fan2){
      Serial.println("fan2 on");
      digitalWrite(fan_2, LOW);

    }else{
      Serial.println("fan2 off");
      digitalWrite(fan_2, HIGH);

    }
  }else{
      Serial.println("fan1 off");
      digitalWrite(fan_1, HIGH);

      Serial.println("fan2 off");
      digitalWrite(fan_2, HIGH);

   }
}

void executePump(){                 //   PUMP SETTING
  int mins = Clock.getMinute();
  Serial.println(mins);
  if(mins < pumpTime){
    if(pump){
      Serial.println("Pump on");
      digitalWrite(pump1, LOW);
      
    }else{
      Serial.println("Pump Off");
      digitalWrite(pump1, HIGH);
      
    }
  }else{
    Serial.println("Pump Off");
    digitalWrite(pump1, HIGH);
  }
}

void executeLights(){             //  RELAY CONTROL for PUMP and FAN
  int hours = Clock.getHour(h12, PM);
  int mins = Clock.getMinute();
  Serial.println(hours+" "+mins);
  int currentMins = (hours*60)+mins;
  
  Serial.println(currentMins);
  int sunShineTime = (sunRiseHour*60)+sunRiseMin;
  
  Serial.println(sunShineTime);
  int sunSetTime = (sunSetHour*60)+sunSetMin;
  
  Serial.println(sunSetTime);
  if(currentMins >= sunShineTime && currentMins <= sunSetTime){
      if(light1){
        Serial.println("light1 on");
        digitalWrite(light_1, LOW);
      }else{
        Serial.println("light1 off");
        digitalWrite(light_1, HIGH);
      }
      if(light2){
        Serial.println("light2 on");
        digitalWrite(light_2, LOW);
      }else{
        Serial.println("light2 off");
        digitalWrite(light_2, HIGH);
      }
      if(light3){
        Serial.println("light3 on");
        digitalWrite(light_3, LOW);
      }else{
        Serial.println("light3 off");
        digitalWrite(light_3, HIGH);
      }
  }else{
    Serial.println("light1 off");
    digitalWrite(light_1, HIGH);
    Serial.println("light2 off");
    digitalWrite(light_2, HIGH);
    Serial.println("light3 off");
    digitalWrite(light_3, HIGH);
  }
}

void getTime(){
  // send what's going on to the serial monitor.
  // Start with the year
  Serial.print("2");
  if (Century) {      // Won't need this for 89 years.
    Serial.print("1");
  } else {
    Serial.print("0");
  }
  Serial.print(Clock.getYear(), DEC);
  Serial.print(' ');
  // then the month
  Serial.print(Clock.getMonth(Century), DEC);
  Serial.print(' ');
  // then the date
  Serial.print(Clock.getDate(), DEC);
  Serial.print(' ');
  // and the day of the week
  Serial.print(Clock.getDoW(), DEC);
  Serial.print(' ');
  // Finally the hour, minute, and second
  Serial.print(Clock.getHour(h12, PM), DEC);
  Serial.print(' ');
  Serial.print(Clock.getMinute(), DEC);
  Serial.print(' ');
  Serial.print(Clock.getSecond(), DEC);
  // Add AM/PM indicator
  if (h12) {
    if (PM) {
      Serial.print(" PM ");
    } else {
      Serial.print(" AM ");
    }
  } else {
    Serial.print(" 24h ");
  }
  // Display the temperature
  Serial.print("T=");
  Serial.print(Clock.getTemperature(), 2);
  // Tell whether the time is (likely to be) valid
  if (Clock.oscillatorCheck()) {
    Serial.print(" O+");
  } else {
    Serial.print(" O-");
  }
  // Indicate whether an alarm went off
  if (Clock.checkIfAlarm(1)) {
    Serial.print(" A1!");
  }
  if (Clock.checkIfAlarm(2)) {
    Serial.print(" A2!");
  }
  // New line on display
  Serial.print('\n');
  // Display Alarm 1 information
  Serial.print("Alarm 1: ");
  Clock.getA1Time(ADay, AHour, AMinute, ASecond, ABits, ADy, A12h, Apm);
  Serial.print(ADay, DEC);
  if (ADy) {
    Serial.print(" DoW");
  } else {
    Serial.print(" Date");
  }
  Serial.print(' ');
  Serial.print(AHour, DEC);
  Serial.print(' ');
  Serial.print(AMinute, DEC);
  Serial.print(' ');
  Serial.print(ASecond, DEC);
  Serial.print(' ');
  if (A12h) {
    if (Apm) {
      Serial.print('pm ');
    } else {
      Serial.print('am ');
    }
  }
  if (Clock.checkAlarmEnabled(1)) {
    Serial.print("enabled");
  }
  Serial.print('\n');
  // Display Alarm 2 information
  Serial.print("Alarm 2: ");
  Clock.getA2Time(ADay, AHour, AMinute, ABits, ADy, A12h, Apm);
  Serial.print(ADay, DEC);
  if (ADy) {
    Serial.print(" DoW");
  } else {
    Serial.print(" Date");
  }
  Serial.print(' ');
  Serial.print(AHour, DEC);
  Serial.print(' ');
  Serial.print(AMinute, DEC);
  Serial.print(' ');
  if (A12h) {
    if (Apm) {
      Serial.print('pm');
    } else {
      Serial.print('am');
    }
  }
  if (Clock.checkAlarmEnabled(2)) {
    Serial.print("enabled");
  }
  // display alarm bits
  Serial.print('\nAlarm bits: ');
  Serial.print(ABits, BIN);

  Serial.print('\n');
  Serial.print('\n');
  delay(1000);
}
