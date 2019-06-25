#!/usr/bin/env bash

DEBUG=* node dist/cli request getSystemVersion
DEBUG=* node dist/cli request getDeviceInfo
DEBUG=* node dist/cli --device-position=0 request getDeviceParameterInfo
DEBUG=* node dist/cli --device-position=0 request getDeviceParameterValues 0x607B:1 0x607B:2
DEBUG=* node dist/cli --device-position=0 request getDeviceFileList
DEBUG=* node dist/cli --device-position=0 request getDeviceLog
