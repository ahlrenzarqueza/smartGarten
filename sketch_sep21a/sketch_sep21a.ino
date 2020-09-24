#define ledPin 7
int state = 0;
String stringstate = "";
// Generally, you should use "unsigned long" for variables that hold time
// The value will quickly become too large for an int to store
unsigned long previousMillis = 0;        // will store last time LED was updated

// constants won't change:
const long interval = 5000;           // interval at which to blink (milliseconds)

float at = 20; // air temp
float h = 50; // humidity
float ph = 7; // ph value
float ec = 12.5; // ec value
float wl = 50; // water level
float wt = 25; // water temp


void setup() {
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);
  Serial1.begin(9600); // Default communication rate of the Bluetooth module

  Serial.begin(9600);
  Serial.println("Hello, world!");
  Serial1.println("Hello, bt!");
}

void loop() {
  if(Serial1.available() > 0){ // Checks whether data is comming from the serial port

      stringstate = Serial1.readString(); // Reads the data from the serial port
      Serial.print("String read: ");
      Serial.println(stringstate);

      if(stringstate == "p") {
        String hstr = "h=" + String(h);
        String atstr = "at=" + String(at);
        String phstr = "ph=" + String(ph);
        String ecstr = "ec=" + String(ec);
        String wlstr = "wl=" + String(wl);
        String wtstr = "wt=" + String(wt);
        Serial1.println(hstr); 
        delay(1000);
        Serial1.println(atstr); 
        delay(1000);
        Serial1.println(phstr); 
        delay(1000);
        Serial1.println(ecstr); 
        delay(1000);
        Serial1.println(wlstr); 
        delay(1000);
        Serial1.println(wtstr); 
        delay(1000);
      }
      else {
        int indequal = stringstate.indexOf("=");
        if(indequal != -1) {
          String setkey = stringstate.substring(0, indequal);
          String setvalue = stringstate.substring(indequal + 1);
          Serial.print("Set key: ");
          Serial.println(setkey);
          Serial.print("Set value: ");
          Serial.println(setvalue);
        }
      }
    }
}
// unsigned long currentMillis = millis();
//
//  if (currentMillis - previousMillis >= interval) {
//    // save the last time you blinked the LED
//    previousMillis = currentMillis;
//    String hstr = "h=" + String(h);
//    String atstr = "at=" + String(at);
//    String phstr = "ph=" + String(ph);
//    String ecstr = "ec=" + String(ec);
//    String wlstr = "wl=" + String(wl);
//    String wtstr = "wt=" + String(wt);
//    Serial1.println(hstr); 
//    delay(1000);
//    Serial1.println(atstr); 
//    delay(1000);
//    Serial1.println(phstr); 
//    delay(1000);
//    Serial1.println(ecstr); 
//    delay(1000);
//    Serial1.println(wlstr); 
//    delay(1000);
//    Serial1.println(wtstr); 
//    delay(1000);
//  }
