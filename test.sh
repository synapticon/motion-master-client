#!/usr/bin/env bash

# DEBUG=* npm run motion-master-client -- request pingSystem
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
DEBUG=* npm run motion-master-client -- request setDeviceParameterValues 0x2705:0=5
DEBUG=* npm run motion-master-client -- request getDeviceFileList
DEBUG=* npm run motion-master-client -- request getDeviceFile config.csv
DEBUG=* npm run motion-master-client -- request deleteDeviceFile some_file.json
DEBUG=* npm run motion-master-client -- request resetDeviceFault
DEBUG=* npm run motion-master-client -- request stopDevice
DEBUG=* npm run motion-master-client -- request getDeviceLog
DEBUG=* npm run motion-master-client -- request getCoggingTorqueData
#DEBUG=* npm run motion-master-client -- request startOffsetDetection
# DEBUG=* npm run motion-master-client -- request startMonitoringDeviceParameterValues some-topic 0x6064:0 0x230A:0
DEBUG=* npm run motion-master-client -- request stopMonitoringDeviceParameterValues f02fbeda-c3e5-4d1e-a294-3f7e3b83be6b
DEBUG=* npm run motion-master-client -- upload 0x6064:0 0x230A:0
DEBUG=* npm run motion-master-client -- download 0x2705:0=1
# DEBUG=* npm run motion-master-client -- monitor some-topic 0x6064:0 0x230A:0
