#!/usr/bin/env bash

DEBUG=* npm run motion-master-client -- request getSystemVersion
DEBUG=* npm run motion-master-client -- -c ./motion-master-client.config.json request getSystemVersion
DEBUG=* npm run motion-master-client -- request getSystemVersion
DEBUG=* npm run motion-master-client -- request getDeviceInfo
DEBUG=* npm run motion-master-client -- request getDeviceParameterInfo # default device position 0
DEBUG=* npm run motion-master-client -- -p 1 request getDeviceParameterInfo
DEBUG=* npm run motion-master-client -- --device-position=1 request getDeviceParameterInfo
DEBUG=* npm run motion-master-client -- -d 4020155199 request getDeviceParameterInfo
DEBUG=* npm run motion-master-client -- --device-address=4020155199 request getDeviceParameterInfo
DEBUG=* npm run motion-master-client -- request getDeviceParameterValues 0x607B:1 0x607B:2
DEBUG=* npm run motion-master-client -- request getDeviceFileList
DEBUG=* npm run motion-master-client -- request getDeviceLog
DEBUG=* npm run motion-master-client -- upload 0x607B:1 0x607B:2
DEBUG=* npm run motion-master-client -- request getSystemVersion
DEBUG=* npm run motion-master-client -- download 0x2705:0=1
