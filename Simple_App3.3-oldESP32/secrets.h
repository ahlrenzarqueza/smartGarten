#include <pgmspace.h>

#define SECRET
#define THINGNAME "Test-Arduino-Garden"

const char WIFI_SSID[] = "RatedAAA";
const char WIFI_PASSWORD[] = "GODprovides987";
const char AWS_IOT_ENDPOINT[] = "a35dihqqydbbpb-ats.iot.ap-southeast-1.amazonaws.com";

// Amazon Root CA 1
static const char AWS_CERT_CA[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE-----
)EOF";

// Device Certificate
static const char AWS_CERT_CRT[] PROGMEM = R"KEY(
-----BEGIN CERTIFICATE-----
MIIDWjCCAkKgAwIBAgIVALNDtjS+uFls7IyctecGZF8eZqqKMA0GCSqGSIb3DQEB
CwUAME0xSzBJBgNVBAsMQkFtYXpvbiBXZWIgU2VydmljZXMgTz1BbWF6b24uY29t
IEluYy4gTD1TZWF0dGxlIFNUPVdhc2hpbmd0b24gQz1VUzAeFw0yMDA5MjMwODAw
MjlaFw00OTEyMzEyMzU5NTlaMB4xHDAaBgNVBAMME0FXUyBJb1QgQ2VydGlmaWNh
dGUwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCTwTGObzxSo4m4PEtq
v7vBVTg5ri+6JRPHTCT1B68IyOKl7gkOB8RfqLVyqhVwp6kDYBYlcgiQVb93ezq+
DARCi6qh6g4TOo0QnJgskjJHmZ7FSL7a+cY1/5YU6oiwSqLoSa2C+3dqMZMBEunR
hoDYfnn6MWg/JYgkSmKvoC98/n9S0FvRCfUVe6vBTzz/Pyj+KysPy1IlqvJ8r9MN
wxtCLPvU63DIG9LVqMpU4NW0R3aFhc42v7Su60EwTEuCyGsoeRL7vwy2wu8d83EQ
WbYKnWk1OwY26zuqgG8Wwp5i9ZOWf1IEPhmh9zYyrHcYa/HSQe7sHH8shimP+cOo
JAV3AgMBAAGjYDBeMB8GA1UdIwQYMBaAFAnFwMeBG52jnh0Mhd7TXZnh70dTMB0G
A1UdDgQWBBRcxO2W1ZSiTJAfFS7IKsPJTi6AKTAMBgNVHRMBAf8EAjAAMA4GA1Ud
DwEB/wQEAwIHgDANBgkqhkiG9w0BAQsFAAOCAQEAt8aSr1UgDSMm2P2OHvS1iyFo
gWEoBk6T1xXyOhMNfBFMOkms9yXcjKmy1BK217Mjrf0OYwAFztITDXwz9sKDC1tC
HqjM3xvSbOFTY15TlNp3EQYGNAngp77zbdRUNpSJ+1Exhl9nfPZ+sWhGNNP5TXJm
fXPVAnCuDTXc0Kp5t595KbXrE4g5k3l98GR5PUpnbtWakK4bsS1VZclLEZZj3IvK
o3b34NjsLqGS0IIdeCrvyxcZPtqshphI1IglQVlQFPP8cL8BLWglse7Z/v4Y8+31
hAMNSaDb3WlA+/QPl0/H9fk8NUIlrAflqJIcpqhrKp9qCYhUWKvRKSbnvPnAgQ==
-----END CERTIFICATE-----
)KEY";

// Device Private Key
static const char AWS_CERT_PRIVATE[] PROGMEM = R"KEY(
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAk8Exjm88UqOJuDxLar+7wVU4Oa4vuiUTx0wk9QevCMjipe4J
DgfEX6i1cqoVcKepA2AWJXIIkFW/d3s6vgwEQouqoeoOEzqNEJyYLJIyR5mexUi+
2vnGNf+WFOqIsEqi6Emtgvt3ajGTARLp0YaA2H55+jFoPyWIJEpir6AvfP5/UtBb
0Qn1FXurwU88/z8o/isrD8tSJaryfK/TDcMbQiz71OtwyBvS1ajKVODVtEd2hYXO
Nr+0rutBMExLgshrKHkS+78MtsLvHfNxEFm2Cp1pNTsGNus7qoBvFsKeYvWTln9S
BD4Zofc2Mqx3GGvx0kHu7Bx/LIYpj/nDqCQFdwIDAQABAoIBAGWyb52NyoNGtJ/u
QCp1VZG4Sj7JOWhx5K8kJbvRUhRF0FpNAEZ76hm9UUZe8urbO2VrWVLkrihKHMLs
On5cXwI+h29yXcW2Yymv3r2u0pSdk75OV674hAjepjo3Q2WzuXUQYTDqTEL3ZCs1
DWJ9pWldhC9Emm/8MTxpRouDQaxRoym9MhMXNJ1dZ453AnVsaNxc9ihXSi6ackW1
7iF8J2UZofcdTQF+g0rfodT/3JDckXH7HGEGRrCR7bn8ANkQZsLgN0QDpFnQo1uj
yW1KPPWYDoS4MTHHr3RnKVlkNTjVhYfh54noMFkUuTj92Ax63b+Mi1YqfL9UONLx
M1pvKEECgYEAxNjdOr/Pc7wuzbjBRpW1xM8iIFwmldTQm/a+VKF3xZjryIaGNmic
JWxOePpnR/YlajbXXhYjuyXyaUI+ZTCcz13VwX29Z9E2/f1+NSF++uZ3BA2KQbqS
GW6v+cNj3SLd4167dGEumdf9SG+KUY0fEIBuizfFlDmlpb4+dtW5v48CgYEAwCe5
cmGD1NcTUJtBy5Knnb/P+s24BGdYmKxaNvxu4Sbx17+h7hTiDzMr49zQlKmVBBM5
YLw7lm2//Kklj5L5jb5im62SRUV/m8q4iWfaYLN6kfCaMRljoycM+CvoJk9DlCyN
0VtToo9PhXyJ0QmdgHDBGUZjS8f9OxzK58gSZ5kCgYBV3GoS+Bta1hhsL0xOp3qT
j+3Iw6ko7ZzYirXWYF/H1r3xx4u/K74ALM/FwSNPpjQHskgah/mp5hFojDZ/GMct
RDa6oUf+gqlD/FASiLvEYMZFBErsBJ85bKhhfzKOAGlchbOqPcF/5VBbShvBGpcU
MZEGNJt/3e088FB6sRrGTQKBgQCyrf2+w7i/2QMH6GclMokUokF2eYcM6UC0L0hw
awl76ifmtDaSWe7frXi5mSKHqq17rZikQES0m/dzraHUwRm3WXr+QkeKjJadusMg
WmbxltN6E55925sQIobn2oQz4272wPta2y6JMfQDL4xDykogHjkhFJfO5vet2RdA
soWSuQKBgQCFIKU9yUDTErQamhbEIATTUgWcaRbQLLYhgp2NM2pjkfm83nH69vcu
J7g86R/5Qf18sa5Nmj1f1+HB1YlCEeJoWLDlKqCMuVLkpELX42p8ajDuXuKsC61B
kbKnxKhaxG5c0fX5SGY+sLtV3BoTfHEmHyEhmsNL5z+ZPNhd94NATw==
-----END RSA PRIVATE KEY-----
)KEY";
