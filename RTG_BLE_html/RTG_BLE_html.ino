#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#include <driver/adc.h>//このヘッダファイルを忘れないように！！https://qiita.com/norippy_i/items/0ed46e06427a1d574625
long value = 0;
const int analogInPin = A18;
#define TestPin 34

BLECharacteristic *pCharacteristic;
bool deviceConnected = false;

int j = 0;
int len = 0;
char buf[100];
char buf_serialinput[100];

//****************************************
int random_num = 20;
//****************************************

// See the following for generating UUIDs:
// https://www.uuidgenerator.net/

#define SERVICE_UUID        "d5875408-fa51-4763-a75d-7d33cecebc31"
#define CHARACTERISTIC_UUID "a4f01d8c-a037-43b6-9050-1876a8c23584"

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
    }
};

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      std::string j = pCharacteristic->getValue();
      int len = j.length();
      Serial.println(len);
      Serial.println(j.c_str());
    }
};
MyCallbacks myCallbacks;

void setup() {
  Serial.begin(115200);

  // put your setup code here, to run once:
  adc1_config_width(ADC_WIDTH_BIT_12);
  //何ビットのADCを使うか設定する。今回は12bitにします。
  //adc1の場合はこのように使うチャンネル全体の設定をするコマンドが用意されている。
  
//  analogSetAttenuation(ADC_0db);        // アッテネーターを設定
//    analogSetAttenuation(ADC_2_5db);
//    analogSetAttenuation(ADC_6db);
  //  analogSetAttenuation(ADC_11db);

  adc1_config_channel_atten(ADC1_CHANNEL_6, ADC_ATTEN_DB_11);
  //AD1のチャンネルの設定をする。
  //ここでどのチャンネルを使うか、0 V　~xx Vの値で変換するかを設定する。
  //引数は(設定したいGPIO,AD変換する電圧範囲)を示している。
  //ADC_ATTEN_DB_0 -> 0~1.1VでAD変換する
// pinMode(analogInPin, INPUT);

  // Create the BLE Device
  BLEDevice::init("ESP32B");

  // Create the BLE Server
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create a BLE Characteristic
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY |
                      BLECharacteristic::PROPERTY_INDICATE
                    );

  // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.descriptor.gatt.client_characteristic_configuration.xml
  // Create a BLE Descriptor
  pCharacteristic->setCallbacks(&myCallbacks);
  pCharacteristic->addDescriptor(new BLE2902());

  // Start the service
  pService->start();

  // Start advertising
  pServer->getAdvertising()->start();
  Serial.println("Waiting a client connection to notify...");
  
}

void loop() {
  int index = 0;
  bool hasData = false;
  char buffer[32];

  dacWrite(25,5);
//  // put your main code here, to run repeatedly:
//  value = adc1_get_raw(ADC1_CHANNEL_6);
////  value = round(value * 0.025 *10);
  long d = 0;
  for (int i = 0; i < 100; i++) {  // 100回測定して
    d += adc1_get_raw(ADC1_CHANNEL_6);
  }

  value = d/100;
  
//  Serial.println(d / 1000);         // 平均値をシリアルに出力
  if (deviceConnected) {
        char buffer[32];
    //    int random_num = random(255);
    sprintf(buffer, "%d", value);
//    Serial.printf("%d\n", value);
    pCharacteristic->setValue(buffer);
    pCharacteristic->notify();
    //pCharacteristic->indicate();
//    value++;
//    random_num++;
  }
  delay(100);
  Serial.println(value);  
}
