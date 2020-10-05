#include "secrets.h"
#include <WiFiClientSecure.h>
#include <MQTTClient.h>
#include <ArduinoJson.h>
#include <WiFi.h>

#define AWS_IOT_PUBLISH_TOPIC   "$aws/things/Test-Arduino-Garden/shadow/name/Measurements/update"
#define AWS_IOT_SUBSCRIBE_TOPIC "$aws/things/Test-Arduino-Garden/shadow/name/Settings/update/delta"

WiFiClientSecure net = WiFiClientSecure();
MQTTClient client = MQTTClient(512);
unsigned long int AWSpublish_Timer = 0;
int AWSPublish_Interval = 3000;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  connectToWiFi();
  connectAWS();
  AWSpublish_Timer = millis();
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

void connectAWS()
{
  // Configure WiFiClientSecure to use the AWS IoT device credentials
  net.setCACert(AWS_CERT_CA);
  net.setCertificate(AWS_CERT_CRT);
  net.setPrivateKey(AWS_CERT_PRIVATE);

  // Connect to the MQTT broker on the AWS endpoint we defined earlier
  client.begin(AWS_IOT_ENDPOINT, 8883, net);

  // Create a message handler
  client.onMessage(messageHandler);

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

//void publishMessage()
//{
//  StaticJsonDocument<200> doc;
//
//  Temperature = dht.readTemperature(); // Gets the values of the temperature
//  Humidity = dht.readHumidity(); // Gets the values of the humidity
//  SensorValueCM=getDistance();
//  Waterlevel=(1-(SensorValueCM-SensorSafetyDistance)/(SensorHeight-SensorSafetyDistance))*100;
//  PHValue=getPhValue();
//
//  ds18b20.requestTemperatures();
//  while (!ds18b20.isConversionComplete());  // wait until sensor is ready
//  Temperature_DS18B20 = ds18b20.getTempC();
//
//  gravityTds.setTemperature(Temperature_DS18B20);  // set the temperature and execute temperature compensation
//  gravityTds.update();  //sample and calculate 
//  tdsValue = gravityTds.getTdsValue();  // then get the value
//
//  doc["Temperature"] = Temperature;
//  doc["Humidity"] = Humidity;
//  doc["Distance"] = SensorValueCM;
//  doc["Water Level"] = Waterlevel;
//  doc["pH Value"] = PHValue;
//  doc["Water Temperature"] = Temperature_DS18B20;
//  doc["TDS Value"] = tdsValue;
//  
//  char jsonBuffer[512];
//  serializeJson(doc, jsonBuffer); // print to client
//
//  client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer);
//  client.loop();
//}

void sendJsonToAWS()
{
  StaticJsonDocument<512> jsonDoc;
  JsonObject stateObj = jsonDoc.createNestedObject("state");
  JsonObject reportedObj = stateObj.createNestedObject("reported");
  
  // Write the temperature & humidity. Here you can use any C++ type (and you can refer to variables)
  reportedObj["humidity"] = 1,
  reportedObj["waterTemperature"] = 2;
  reportedObj["airTemperature"] = 3;
  reportedObj["phValue"] = 4;
  reportedObj["ecValue"] = 5;
  reportedObj["waterLevel"] = 6;
//  reportedObj["fanLevel": "low",
//  reportedObj["pumpLevel": "low",
//  reportedObj["fan1-enabled": false,
//  reportedObj["fan2-enabled": false,
//  reportedObj["light1-enabled": false,
//  reportedObj["light2-enabled": false,
//  reportedObj["light3-enabled": false,
//  reportedObj["pump-enabled": false,
//  reportedObj["sunrise-hr": 0,
//  reportedObj["sunrise-min": 0,
//  reportedObj["sunset-hr": 0,
//  reportedObj["sunset-min": 0

  char jsonBuffer[512];
  serializeJson(jsonDoc, jsonBuffer);
  client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer);
}

void messageHandler(String &topic, String &payload) {
  Serial.println("Incoming Message: " + topic + " - " + payload);
    StaticJsonDocument<512> doc;
    deserializeJson(doc, payload);
    
    bool fan1Doc = doc["state"]["fan1-enabled"];
    bool fan2Doc = doc["state"]["fan2-enabled"];
    const String pumpDoc = doc["state"]["pump-enabled"];
    const String light1Doc = doc["state"]["light1-enabled"];
    const String light2Doc = doc["state"]["light2-enabled"];
    const String light3Doc = doc["state"]["light3-enabled"];
    
    int sun_rise_hourDoc = doc["state"]["sunrise-hr"];
    int sun_rise_minDoc = doc["state"]["sunrise-min"];
    const String sun_set_hourDoc = doc["state"]["sunset-hr"];
    const String sun_set_minDoc = doc["state"]["sunset-min"];

    const String fansun_rise_hourDoc = doc["state"]["fansunrise-hr"];
    const String fansun_rise_minDoc = doc["state"]["fansunrise-min"];
    const String fansun_set_hourDoc = doc["state"]["fansunset-hr"];
    const String fansun_set_minDoc = doc["state"]["fansunset-min"];

    const String pumpsun_rise_hourDoc = doc["state"]["pumpsunrise-hr"];
    const String pumpsun_rise_minDoc = doc["state"]["pumpsunrise-min"];
    const String pumpsun_set_hourDoc = doc["state"]["pumpsunset-hr"];
    const String pumpsun_set_minDoc = doc["state"]["pumpsunset-min"];

    const String fanOnTimer = doc["state"]["desired"]["fanOnTimer"];
    const String pumpOnTimer = doc["state"]["desired"]["pumpOnTimer"];

    const String lightSnoozeRemaining = doc["state"]["desired"]["lightSnoozeRemaining"];
    const String fanSnoozeRemaining = doc["state"]["desired"]["fanSnoozeRemaining"];
    const String pumpSnoozeRemaining = doc["state"]["desired"]["pumpSnoozeRemaining"];

    const String dimmerPower = doc["state"]["desired"]["lightIntensity"];


      Serial.print("fan1Doc: ");
      Serial.println(fan1Doc ? "TRUE" : "FALSE");


      Serial.println("fan2Doc: ");
      Serial.println(fan2Doc ? "TRUE" : "FALSE");

    if(sun_rise_hourDoc != NULL) {
      Serial.print("sun_rise_hourDoc: ");
      Serial.println(sun_rise_hourDoc);
//      const int sunriseint = sun_rise_hourDoc.toInt() + 100;
//      Serial.println("parsed: " + sunriseint);
    }
    if(sun_rise_minDoc != NULL) {
      Serial.print("sun_rise_minDoc: ");
      Serial.println(sun_rise_minDoc);
//      const int sunrisemin = sun_rise_minDoc.toInt() + 100;
//      Serial.println("parsed: " + sunrisemin);
    }
    
    String test_str = "12";
    int test_int = test_str.toInt() + 100;
    Serial.println("test parsed: ");
    Serial.println(test_int);
}

void loop() {
  // put your main code here, to run repeatedly:
  client.loop();
  if( (millis() - AWSpublish_Timer) > AWSPublish_Interval){
    sendJsonToAWS();
    AWSpublish_Timer = millis();
  }
  delay(10);
}
