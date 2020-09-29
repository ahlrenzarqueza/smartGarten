
#include <ArduinoJson.h>

#include <OneWire.h>
#include <DS18B20.h>

#include "DHT.h"

#include <EEPROM.h>
#include "GravityTDS.h"

#include <WiFi.h>
#include <WiFiClient.h>
#include <ESPmDNS.h>

#include <DS3231.h>
#include <Wire.h>


#include "secrets.h"
#include <WiFiClientSecure.h>
#include <MQTTClient.h>

// The MQTT topics that this device should publish/subscribe
#define AWS_IOT_PUBLISH_TOPIC   "$aws/things/Test-Arduino-Garden/shadow/name/Measurements/update"
#define AWS_IOT_SUBSCRIBE_TOPIC "$aws/things/Test-Arduino-Garden/shadow/name/Settings/update/accepted"

WiFiClientSecure net = WiFiClientSecure();
MQTTClient client = MQTTClient(256);

unsigned long int AWSpublish_Timer = 0;

int AWSPublish_Interval = 3000;

#define DHTTYPE DHT11   // DHT 11

// DHT Sensor
uint8_t DHTPin = 4;   //  DHT11 PIN TEMPRATURE and Humidity

// Initialize DHT sensor.
DHT dht(DHTPin, DHTTYPE);

//Initialize DS18B20 Sensor
#define ONE_WIRE_BUS 8

OneWire oneWire(ONE_WIRE_BUS);
DS18B20 ds18b20(&oneWire);


//Initialize TDS Meter
#define TdsSensorPin 39
GravityTDS gravityTds;

//Initialize LED Driver
#include <RBDdimmer.h>
#define outputPin  34
#define zerocross  35

dimmerLamp dimmer(outputPin, zerocross);


const int trigPin = 5;
const int echoPin = 18;

#define RXD2 16
#define TXD2 17


int light_1 = 27;  //
int light_2 = 26;  //
int light_3 = 25; //     RELAY CONNECTION
int fan_1 = 33;   //
int fan_2 = 32;  //
int pump1 = 23;  //



// PH connections
const int analogInPin = 36;   // FOR PH SENSOR
int sensorValue = 0;
unsigned long int avgValue;
float b;
int buf[10], temp;

float Temperature;
float Humidity;
float Waterlevel;
float SensorValueCM;
float SensorHeight = 7;
float SensorSafetyDistance = 1;
float PHValue;

String hstr;
String atstr;
String phstr;
String ecstr;
String wlstr;
String wtstr;

float Temperature_DS18B20;
float tdsValue;


DS3231 Clock;
bool Century = false;
bool h12;
bool PM;
byte ADay, AHour, AMinute, ASecond, ABits;
bool ADy, A12h, Apm;

bool fan1 = false;
bool fan2 = false;
int fanTime = 0;

bool pump = false;
int pumpTime = 0;

bool light1 = false;
bool light2 = false;
bool light3 = false;
int sunRiseHour = 0;
int sunRiseMin = 0;
int sunSetHour = 0;
int sunSetMin = 0;
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


void bt_messageHandler() {
  byte ch;
  if (Serial2.available()) {
      ch = Serial2.read();
      Serial.print(ch);
         // Process command in sdata.
        if (ch == 'p'){ // poll for measurements
           Humidity = dht.readHumidity();
           hstr = "h=" + String(Humidity);
           Serial2.println(hstr); 
           delay(1000);
           Temperature = dht.readTemperature();
           atstr = "at=" + String(Temperature);
           Serial2.println(atstr); 
           delay(1000);
           PHValue = getPhValue();
           phstr = "at=" + String(PHValue);
           Serial2.println(phstr);
           delay(1000);
           gravityTds.setTemperature(Temperature_DS18B20);  // set the temperature and execute temperature compensation
           gravityTds.update();  //sample and calculate
           tdsValue = gravityTds.getTdsValue();  // then get the value
           ecstr = "ec=" + String(tdsValue);
           Serial2.println(ecstr);
           delay(1000);
           Waterlevel = (1 - (SensorValueCM - SensorSafetyDistance) / (SensorHeight - SensorSafetyDistance)) * 100;
           wlstr = "wl=" + String(Waterlevel);
           Serial2.println(wlstr);
           delay(1000);
           wtstr = "wt=" + String(Temperature_DS18B20);
           Serial2.println(wtstr);
        }
         
//         if (ch == 't'){
//          Serial2.print("Temperature:");
//          Temperature = dht.readTemperature(); // Gets the values of the temperature
//          Serial2.println(Temperature);
//         }
//         else if (ch == 'h'){
//          Serial2.print("Humidity:");
//          Humidity = dht.readHumidity(); // Gets the values of the humidity
//          Serial2.println(Humidity);
//         }
//         else if (ch == 'd'){
//          Serial2.print("Distance:");
//          SensorValueCM = getDistance();
//          Serial2.println(SensorValueCM);
//          }
//         else if (ch == 'w'){
//          Serial2.print("Water Level:");
//          Waterlevel = (1 - (SensorValueCM - SensorSafetyDistance) / (SensorHeight - SensorSafetyDistance)) * 100;
//          Serial2.println(Waterlevel);
//          }
//         else if (ch == 'p'){
//          Serial2.print("ph Value:");
//          PHValue = getPhValue();
//          Serial2.println(PHValue);
//          }
//         else if (ch == 'x'){
//          Serial2.print("Water Level:");
//          Waterlevel = (1 - (SensorValueCM - SensorSafetyDistance) / (SensorHeight - SensorSafetyDistance)) * 100;
//          Serial2.println(Waterlevel);
//          }
//         else if (ch == 'v'){
//          Serial2.print("TDS Value:");
//          gravityTds.setTemperature(Temperature_DS18B20);  // set the temperature and execute temperature compensation
//          gravityTds.update();  //sample and calculate
//          tdsValue = gravityTds.getTdsValue();  // then get the value
//          Serial2.println(tdsValue);
//          }
   }
}

void handleSettingsUpdate(String &topic, String &payload) {
  Serial.println("AWS IoT Incoming Settings: " + topic + " - " + payload);

   StaticJsonDocument<200> doc;
   deserializeJson(doc, payload);

   const bool fan1Doc = doc["state"]["desired"]["fan1-enabled"];
   const bool fan2Doc = doc["state"]["desired"]["fan2-enabled"];
   const bool pumpDoc = doc["state"]["desired"]["pump-enabled"];
   const bool light1Doc = doc["state"]["desired"]["light1-enabled"];
   const bool light2Doc = doc["state"]["desired"]["light2-enabled"];
   const bool light3Doc = doc["state"]["desired"]["light3-enabled"];

   // const char* sun_rise_hourDocTest = doc["sun_rise_hour"];
   // Serial.println(sun_rise_hourDocTest);
   const int sun_rise_hourDoc = doc["state"]["desired"]["sunrise-hr"];
   const int sun_rise_minDoc = doc["state"]["desired"]["sunrise-min"];
   const int sun_set_hourDoc = doc["state"]["desired"]["sunset-hr"];
   const int sun_set_minDoc = doc["state"]["desired"]["sunset-min"];

   const char* fanLevel = doc["fanLevel"];
   const char* pumpLevel = doc["pumpLevel"];

//    Serial.print(fan1Doc);
//    Serial.print(" ");
//    Serial.print(fan2Doc);
//    Serial.print(" ");
//    Serial.print(pumpDoc);
//    Serial.print(" ");
//    Serial.print(light1Doc);
//    Serial.print(" ");
//    Serial.print(light2Doc);
//    Serial.print(" ");
//    Serial.print(light3Doc);
//    Serial.print(" ");
//    Serial.print(sun_rise_hourDoc);
//    Serial.print(" ");
//    Serial.print(sun_rise_minDoc);
//    Serial.print(" ");
//    Serial.print(sun_set_hourDoc);
//    Serial.print(" ");
//    Serial.print(sun_set_minDoc);
//    Serial.print(" ");
//    Serial.print(fanLevel);
//    Serial.print(" ");
//    Serial.print(pumpLevel);
//    Serial.print(" ");
//    Serial.println();
   fan1 = fan1Doc;
   fan2 = fan2Doc;
   if (fanLevel != NULL && strcmp(fanLevel, "low") == 0) {
     fanTime = 10;                                         //  Change TIME HERE       //
   } else if (fanLevel != NULL && strcmp(fanLevel, "medium") == 0) {
     fanTime = 30;                                        //  Change TIME HERE       //     FAN CONTROL
   } else if (fanLevel != NULL && strcmp(fanLevel, "high") == 0) {
     fanTime = 60;                                       //  Change TIME HERE        //
   }

   pump = pumpDoc;
   if (pumpLevel != NULL && strcmp(pumpLevel, "low") == 0) {
     pumpTime = 10;
   } else if (pumpLevel != NULL && strcmp(pumpLevel, "medium") == 0) {
     pumpTime = 30;
   } else if (pumpLevel != NULL && strcmp(pumpLevel, "high") == 0) {
     pumpTime = 60;
   }

   light1 = light1Doc;
   light2 = light2Doc;
   light3 = light3Doc;

   sunRiseHour = sun_rise_hourDoc;
   sunRiseMin = sun_rise_minDoc;
   sunSetHour = sun_set_hourDoc;
   sunSetMin = sun_set_minDoc;
//
//    Serial.print(fan1);
//    Serial.print(" ");
//    Serial.print(fan2);
//    Serial.print(" ");
//    Serial.print(fanTime);
//    Serial.print(" ");
//    Serial.print(pump);
//    Serial.print(" ");
//    Serial.print(pumpTime);
//    Serial.print(" ");
//    Serial.print(light1);
//    Serial.print(" ");
//    Serial.print(light2);
//    Serial.print(" ");
//    Serial.print(light3);
//    Serial.print(" ");
//    Serial.print(sunRiseHour);
//    Serial.print(" ");
//    Serial.print(sunRiseMin);
//    Serial.print(" ");
//    Serial.print(sunSetHour);
//    Serial.print(" ");
//    Serial.print(sunSetMin);
//    Serial.println();
}

void connectToWiFi()
{
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Only try 15 times to connect to the WiFi
  int retries = 0;
  Serial.print("Connecting to Wi-Fi...");
  while (WiFi.status() != WL_CONNECTED && retries < 15){
    delay(500);
    Serial.print(".");
    retries++;
  }
  // If we still couldn't connect to the WiFi, go to deep sleep for a minute and try again.
  if(WiFi.status() != WL_CONNECTED){
    esp_sleep_enable_timer_wakeup(1 * 60L * 1000000L);
    esp_deep_sleep_start();
  } else {
    Serial.println("Successful!");
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

void connectAWS()
{
  // Configure WiFiClientSecure to use the AWS IoT device credentials
  net.setCACert(AWS_CERT_CA);
  net.setCertificate(AWS_CERT_CRT);
  net.setPrivateKey(AWS_CERT_PRIVATE);

  // Connect to the MQTT broker on the AWS endpoint we defined earlier
  client.begin(AWS_IOT_ENDPOINT, 8883, net);

  // Create a message handler
  client.onMessage(handleSettingsUpdate);

  Serial.print("Connecting to AWS IOT...");

  while (!client.connect(THINGNAME)) {
    Serial.print(".");
    delay(100);
  }

  if(!client.connected()){
    Serial.println("AWS IoT Timeout!");
    return;
  }

  // Subscribe to a topic
  client.subscribe(AWS_IOT_SUBSCRIBE_TOPIC);

  Serial.println("AWS IoT Connected!");
}

void publishMessage()
{
  StaticJsonDocument<512> jsonDoc;
  JsonObject stateObj = jsonDoc.createNestedObject("state");
  JsonObject reportedObj = stateObj.createNestedObject("reported");

  Temperature = dht.readTemperature(); // Gets the values of the temperature
  Humidity = dht.readHumidity(); // Gets the values of the humidity
  SensorValueCM=getDistance();
  Waterlevel=(1-(SensorValueCM-SensorSafetyDistance)/(SensorHeight-SensorSafetyDistance))*100;
  PHValue=getPhValue();

  ds18b20.requestTemperatures();
  while (!ds18b20.isConversionComplete());  // wait until sensor is ready
  Temperature_DS18B20 = ds18b20.getTempC();

  gravityTds.setTemperature(Temperature_DS18B20);  // set the temperature and execute temperature compensation
  gravityTds.update();  //sample and calculate 
  tdsValue = gravityTds.getTdsValue();  // then get the value

  reportedObj["humidity"] = Humidity,
  reportedObj["waterTemperature"] = Temperature_DS18B20;
  reportedObj["airTemperature"] = Temperature;
  reportedObj["phValue"] = PHValue;
  reportedObj["ecValue"] = tdsValue;
  reportedObj["waterLevel"] = Waterlevel;
  reportedObj["distance"] = SensorValueCM;
  
  char jsonBuffer[512];
  serializeJson(jsonDoc, jsonBuffer); // print to client

// SET DIMMER for publish indication
  for (int i = 0; i < 100; i++) {
    dimmer.setPower(i); // name.setPower(0%-100%)
  }
  for (int i = 100; i > 0; i--) {
    dimmer.setPower(i); // name.setPower(0%-100%)
  }
  client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer);
}


int getDistance(){
  long duration,distance = 0;
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  
  // Sets the trigPin on HIGH state for 10 micro seconds
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  // Reads the echoPin, returns the sound wave travel time in microseconds
  duration = pulseIn(echoPin, HIGH);
  
  // Calculating the distance
  distance= duration*0.034/2;
  return distance;
}
void setup() {

  pinMode(PIN_LED, OUTPUT);
  Serial.begin(115200);
  Serial.println("\nStarting");
  
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);

  pinMode(trigPin,OUTPUT);
  pinMode(echoPin,INPUT);
  unsigned long startedAt = millis();

  delay(100);

  Wire.begin();
  pinMode(DHTPin, INPUT);

  pinMode(light_1, OUTPUT);
  pinMode(light_2, OUTPUT);
  pinMode(light_3, OUTPUT);
  pinMode(fan_1, OUTPUT);
  pinMode(fan_2, OUTPUT);
  pinMode(pump1, OUTPUT);

  dht.begin();
  ds18b20.begin();

  gravityTds.setPin(TdsSensorPin);
  gravityTds.setAref(3.3);  //reference voltage on ADC, default 5.0V on Arduino UNO
  gravityTds.setAdcRange(1024);  //1024 for 10bit ADC;4096 for 12bit ADC
  gravityTds.begin();

  dimmer.begin(NORMAL_MODE, ON); //dimmer initialisation: name.begin(MODE, STATE)

  connectToWiFi();
  connectAWS();
  AWSpublish_Timer = millis();
}
void loop() {

  getTime();
  executeFanTimer();
  executePump();
  executeLights();
  check_status();
  if (Serial2.available()) {
    bt_messageHandler();
  }

  client.loop();
  if( (millis() - AWSpublish_Timer) > AWSPublish_Interval){
    publishMessage();
    AWSpublish_Timer = millis();
  }
}

//void handle_OnConnect() {
//
//  Temperature = dht.readTemperature(); // Gets the values of the temperature
//  Humidity = dht.readHumidity(); // Gets the values of the humidity
//  SensorValueCM = getDistance();
//  Waterlevel = (1 - (SensorValueCM - SensorSafetyDistance) / (SensorHeight - SensorSafetyDistance)) * 100;
//  PHValue = getPhValue();
//
//  ds18b20.requestTemperatures();
//  while (!ds18b20.isConversionComplete());  // wait until sensor is ready
//  Temperature_DS18B20 = ds18b20.getTempC();
//
//  gravityTds.setTemperature(Temperature_DS18B20);  // set the temperature and execute temperature compensation
//  gravityTds.update();  //sample and calculate
//  tdsValue = gravityTds.getTdsValue();  // then get the value
//
//
//  server.sendHeader("Access-Control-Allow-Origin", "*");
//  server.sendHeader("Allow", "HEAD,GET,PUT,POST,DELETE,OPTIONS");
//  server.sendHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT");
//  server.sendHeader("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Cache-Control, Accept");
//
//  server.send(200, "application/json", SendHTML(Temperature, Humidity, Waterlevel, PHValue, Temperature_DS18B20, tdsValue));
//  for (int i = 0; i < 100; i++) {
//    dimmer.setPower(i); // name.setPower(0%-100%)
//  }
//  for (int i = 100; i > 0; i--) {
//    dimmer.setPower(i); // name.setPower(0%-100%)
//  }
//
//}

//void handle_NotFound() {
//  server.send(404, "text/plain", "Not found");
//}

String SendHTML(float Temperaturestat, float Humiditystat, float Waterlevel, float PHValue, float Temp_DS18B20, float Temp_tdsValue) {  /// ALL the sensor data is send from here
  String ptr = "{\"temparature\":";
  ptr += "\"";
  ptr += (int)Temperaturestat;
  ptr += " °C\",";
  ptr += "\"humidity\":";
  ptr += "\"";
  ptr += (int)Humiditystat;
  ptr += " %\",";
  ptr += "\"phvalue\":";
  ptr += "\"";
  ptr += (int)PHValue;
  ptr += "\",";
  ptr += "\"waterlevel\":";
  //ptr +=(int)((Waterlevel/10)*100);
  ptr += "\"";
  ptr += Waterlevel;
  ptr += " %\"";

  ptr += "\",";
  ptr += "\"ds18b20\":";
  ptr += "\"";
  ptr += (int)Temp_DS18B20;
  ptr += "\"";

  ptr += "\",";
  ptr += "\"TDS\":";
  ptr += "\"";
  ptr += (int)Temp_tdsValue;
  ptr += "ppm\"";

  ptr += "}";
  return ptr;
}

float getPhValue() {
  for (int i = 0; i < 10; i++)
  {
    buf[i] = analogRead(analogInPin);
    delay(10);
  }
  for (int i = 0; i < 9; i++)
  {
    for (int j = i + 1; j < 10; j++)
    {
      if (buf[i] > buf[j])
      {
        temp = buf[i];
        buf[i] = buf[j];
        buf[j] = temp;
      }
    }
  }
  avgValue = 0;
  for (int i = 2; i < 8; i++)
    avgValue += buf[i];
  float pHVol = (float)avgValue * 5.0 / 1024 / 6;
  float phValue = -5.70 * pHVol + 21.34;
  Serial.print("sensor = ");
  Serial.println(phValue);
  return phValue;
}

void executeFanTimer() {                 ///   FAN TIMER
  int mins = Clock.getMinute();
  Serial.println(mins);
  if (mins < fanTime) {
    if (fan1) {
      Serial.println("fan1 on");
      digitalWrite(fan_1, LOW);

    } else {
      Serial.println("fan1 off");
      digitalWrite(fan_1, HIGH);

    }
    if (fan2) {
      Serial.println("fan2 on");
      digitalWrite(fan_2, LOW);

    } else {
      Serial.println("fan2 off");
      digitalWrite(fan_2, HIGH);

    }
  } else {
    Serial.println("fan1 off");
    digitalWrite(fan_1, HIGH);

    Serial.println("fan2 off");
    digitalWrite(fan_2, HIGH);

  }
}

void executePump() {                //   PUMP SETTING
  int mins = Clock.getMinute();
  Serial.println(mins);
  if (mins < pumpTime) {
    if (pump) {
      Serial.println("Pump on");
      digitalWrite(pump1, LOW);

    } else {
      Serial.println("Pump Off");
      digitalWrite(pump1, HIGH);

    }
  } else {
    Serial.println("Pump Off");
    digitalWrite(pump1, HIGH);
  }
}

void executeLights() {            //  RELAY CONTROL for PUMP and FAN
  int hours = Clock.getHour(h12, PM);
  int mins = Clock.getMinute();
  Serial.println(hours + " " + mins);
  int currentMins = (hours * 60) + mins;

  Serial.println(currentMins);
  int sunShineTime = (sunRiseHour * 60) + sunRiseMin;

  Serial.println(sunShineTime);
  int sunSetTime = (sunSetHour * 60) + sunSetMin;

  Serial.println(sunSetTime);
  if (currentMins >= sunShineTime && currentMins <= sunSetTime) {
    if (light1) {
      Serial.println("light1 on");
      digitalWrite(light_1, LOW);
    } else {
      Serial.println("light1 off");
      digitalWrite(light_1, HIGH);
    }
    if (light2) {
      Serial.println("light2 on");
      digitalWrite(light_2, LOW);
    } else {
      Serial.println("light2 off");
      digitalWrite(light_2, HIGH);
    }
    if (light3) {
      Serial.println("light3 on");
      digitalWrite(light_3, LOW);
    } else {
      Serial.println("light3 off");
      digitalWrite(light_3, HIGH);
    }
  } else {
    Serial.println("light1 off");
    digitalWrite(light_1, HIGH);
    Serial.println("light2 off");
    digitalWrite(light_2, HIGH);
    Serial.println("light3 off");
    digitalWrite(light_3, HIGH);
  }
}

void getTime() {
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
