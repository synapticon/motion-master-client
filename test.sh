#!/usr/bin/env bash

DEBUG=* npm run motion-master-client request --device-position=0 getSystemVersion
DEBUG=* npm run motion-master-client request --device-position=0 getDeviceInfo
DEBUG=* npm run motion-master-client request --device-position=0 getDeviceParameterInfo
DEBUG=* npm run motion-master-client request --device-position=0 getDeviceParameterValues 0x607B:1 0x607B:2
DEBUG=* npm run motion-master-client request --device-position=0 getDeviceFileList
DEBUG=* npm run motion-master-client request --device-position=0 getDeviceLog
DEBUG=* npm run motion-master-client upload --device-position=0 0x607B:1 0x607B:2
DEBUG=* npm run motion-master-client download --device-position=0 0x2705=3
