#!/usr/bin/env bash

DEBUG=* node dist/cli request --device-position=0 getSystemVersion
DEBUG=* node dist/cli request --device-position=0 getDeviceInfo
DEBUG=* node dist/cli request --device-position=0 getDeviceParameterInfo
DEBUG=* node dist/cli request --device-position=0 getDeviceParameterValues 0x607B:1 0x607B:2
DEBUG=* node dist/cli request --device-position=0 getDeviceFileList
DEBUG=* node dist/cli request --device-position=0 getDeviceLog
DEBUG=* node dist/cli upload --device-position=0 0x607B:1 0x607B:2
DEBUG=* node dist/cli download --device-position=0 0x2705=3
