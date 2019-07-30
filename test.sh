#!/usr/bin/env bash

DEBUG=* npx node ./dist/cli.js request pingSystem
DEBUG=* npx node ./dist/cli.js request getSystemVersion
DEBUG=* npx node ./dist/cli.js -f json request getSystemVersion
DEBUG=* npx node ./dist/cli.js -f yaml request getSystemVersion
DEBUG=* npx node ./dist/cli.js --output-format json request getSystemVersion
DEBUG=* npx node ./dist/cli.js --output-format yaml request getSystemVersion
DEBUG=* npx node ./dist/cli.js -c ./motion-master-client.config.json request getSystemVersion # using custom config
DEBUG=* npx node ./dist/cli.js request getDeviceInfo
DEBUG=* npx node ./dist/cli.js request getDeviceParameterInfo # default device at position 0
DEBUG=* npx node ./dist/cli.js -p 1 request getDeviceParameterInfo # device at position 1 short flag
DEBUG=* npx node ./dist/cli.js --device-position=1 request getDeviceParameterInfo # device at position 1 multi-word option
DEBUG=* npx node ./dist/cli.js -d 4020155199 request getDeviceParameterInfo # device serial number short flag
DEBUG=* npx node ./dist/cli.js --device-address=4020155199 request getDeviceParameterInfo # device serial number multi-word option
DEBUG=* npx node ./dist/cli.js request getDeviceParameterValues 0x607B:1 0x607B:2
DEBUG=* npx node ./dist/cli.js request setDeviceParameterValues 0x2705:0=5
DEBUG=* npx node ./dist/cli.js request getDeviceFileList
DEBUG=* npx node ./dist/cli.js request getDeviceFile config.csv
DEBUG=* npx node ./dist/cli.js request setDeviceFile tmp/heroes.json
DEBUG=* npx node ./dist/cli.js request deleteDeviceFile heroes.json
DEBUG=* npx node ./dist/cli.js request resetDeviceFault
DEBUG=* npx node ./dist/cli.js request stopDevice
DEBUG=* npx node ./dist/cli.js request getDeviceLog
DEBUG=* npx node ./dist/cli.js request startCoggingTorqueRecording true # skipAutoTuning
DEBUG=* npx node ./dist/cli.js request getCoggingTorqueData
DEBUG=* npx node ./dist/cli.js request startOffsetDetection
DEBUG=* npx node ./dist/cli.js request startPlantIdentification 3 300 2 60 30 # durationSeconds, torqueAmplitude, startFrequency, endFrequency, cutoffFrequency
DEBUG=* npx node ./dist/cli.js request computeAutoTuningGains position 2 0.2 2.0 1 4 2 314 # controllerType, settlingTime, positionDamping, alphaMult, order, lb, ub
DEBUG=* npx node ./dist/cli.js request computeAutoTuningGains velocity 100 100 # controllerType, velocityLoopBandwidth, velocityDamping
DEBUG=* npx node ./dist/cli.js request startMonitoringDeviceParameterValues some-topic 0x6064:0 0x230A:0
DEBUG=* npx node ./dist/cli.js request stopMonitoringDeviceParameterValues f02fbeda-c3e5-4d1e-a294-3f7e3b83be6b
DEBUG=* npx node ./dist/cli.js upload 0x6064:0 0x230A:0
DEBUG=* npx node ./dist/cli.js download 0x2705:0=1
DEBUG=* npx node ./dist/cli.js monitor some-topic 0x6064:0 0x230A:0
