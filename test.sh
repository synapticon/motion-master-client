#!/usr/bin/env bash

#
# Requests
#

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
DEBUG=* npx node ./dist/cli.js request getMultiDeviceParameterValues
DEBUG=* npx node ./dist/cli.js request setDeviceParameterValues 0x2705:0=5
DEBUG=* npx node ./dist/cli.js request setMultiDeviceParameterValues
DEBUG=* npx node ./dist/cli.js request getDeviceFileList
DEBUG=* npx node ./dist/cli.js request getDeviceFile config.csv
DEBUG=* npx node ./dist/cli.js request setDeviceFile tmp/heroes.json
DEBUG=* npx node ./dist/cli.js request deleteDeviceFile heroes.json
DEBUG=* npx node ./dist/cli.js request resetDeviceFault
DEBUG=* npx node ./dist/cli.js request stopDevice
DEBUG=* npx node ./dist/cli.js request startDeviceFirmwareInstallation
DEBUG=* npx node ./dist/cli.js request getDeviceLog
DEBUG=* npx node ./dist/cli.js request startCoggingTorqueRecording 1 # skipAutoTuning
DEBUG=* npx node ./dist/cli.js request getCoggingTorqueData
DEBUG=* npx node ./dist/cli.js request startOffsetDetection
DEBUG=* npx node ./dist/cli.js request startPlantIdentification 3 300 2 60 30 # durationSeconds, torqueAmplitude, startFrequency, endFrequency, cutoffFrequency
DEBUG=* npx node ./dist/cli.js request startSystemIdentification 3 300 2 60 # durationSeconds, torqueAmplitude, startFrequency, endFrequency
DEBUG=* npx node ./dist/cli.js request computeAutoTuningGains positionParameters 2 0.2 2.0 1 4 2 314 # controllerType, settlingTime, positionDamping, alphaMult, order, lb, ub
DEBUG=* npx node ./dist/cli.js request computeAutoTuningGains velocityParameters 100 100 # controllerType, velocityLoopBandwidth, velocityDamping
DEBUG=* npx node ./dist/cli.js request setMotionControllerParameters 1000
DEBUG=* npx node ./dist/cli.js request setMotionControllerParameters -- -1000
DEBUG=* npx node ./dist/cli.js request enableMotionController 0 0 # controllerType, filter
DEBUG=* npx node ./dist/cli.js request disableMotionController
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters velocitySineWave 500 1 0 # amplitude, frequency, repeat
DEBUG=* npx node ./dist/cli.js request startSignalGenerator
DEBUG=* npx node ./dist/cli.js request stopSignalGenerator
DEBUG=* npx node ./dist/cli.js request startMonitoringDeviceParameterValues some-topic 0x6064:0 0x230A:0
DEBUG=* npx node ./dist/cli.js request stopMonitoringDeviceParameterValues f02fbeda-c3e5-4d1e-a294-3f7e3b83be6b
DEBUG=* npx node ./dist/cli.js request getEthercatNetworkState
DEBUG=* npx node ./dist/cli.js request setEthercatNetworkState 1 # EtherCAT state
DEBUG=* npx node ./dist/cli.js request startNarrowAngleCalibration
DEBUG=* npx node ./dist/cli.js request setSystemClientTimeout 2000 # ms
DEBUG=* npx node ./dist/cli.js request getCirculoEncoderMagnetDistance 1 1
DEBUG=* npx node ./dist/cli.js request startCirculoEncoderNarrowAngleCalibrationProcedure 1 # encoderOrdinal
DEBUG=* npx node ./dist/cli.js request getDeviceCia402State
DEBUG=* npx node ./dist/cli.js request setDeviceCia402State 2
DEBUG=* npx node ./dist/cli.js request getSystemLog
DEBUG=* npx node ./dist/cli.js request startDeviceSiiRestore
DEBUG=* npx node ./dist/cli.js request startOpenLoopFieldControl 180 200 10000 50 100 # angle, velocity, acceleration, torque, torqueSpeed
DEBUG=* npx node ./dist/cli.js request computeFullAutoTuningGains 0 1 # tuningType, controllerType
DEBUG=* npx node ./dist/cli.js request startFullAutoTuning 0 1
DEBUG=* npx node ./dist/cli.js request stopFullAutoTuning
DEBUG=* npx node ./dist/cli.js request startCirculoEncoderConfiguration 1 # encoderOrdinal
DEBUG=* npx node ./dist/cli.js request stopCirculoEncoderNarrowAngleCalibrationProcedure 1 # encoderOrdinal

#
# Requests: Position Signal Generator
#

DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters positionStepResponse 1334 500 # target, sustainTime
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters positionAdvancedStepResponse 1334 500 0 # target, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters positionAdvancedStepResponse 1334 500 1 # target, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters positionRamp 1000 500 1000 1000 500 # target, profileVelocity, profileAcceleration, profileDeceleration, sustainTime
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters positionTrapezoidal 1000 500 1000 1000 500 0 # target, profileVelocity, profileAcceleration, profileDeceleration, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters positionTrapezoidal 1000 500 1000 1000 500 1 # target, profileVelocity, profileAcceleration, profileDeceleration, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters positionBidirectional 1000 500 1000 1000 500 0 # target, profileVelocity, profileAcceleration, profileDeceleration, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters positionBidirectional 1000 500 1000 1000 500 1 # target, profileVelocity, profileAcceleration, profileDeceleration, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters positionSineWave 1000 1 0 # amplitude, frequency, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters positionSineWave 1000 1 1 # amplitude, frequency, repeat

#
# Requests: Velocity Signal Generator
#

DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters velocityStepResponse 1000 500 # target, sustainTime
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters velocityAdvancedStepResponse 1000 500 0 # target, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters velocityAdvancedStepResponse 1000 500 1 # target, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters velocityRamp 1000 500 1000 1000 # target, profileVelocity, profileAcceleration, profileDeceleration, sustainTime
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters velocityTrapezoidal 1000 1000 1000 500 0 # target, profileAcceleration, profileDeceleration, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters velocityTrapezoidal 1000 1000 1000 500 1 # target, profileAcceleration, profileDeceleration, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters velocityBidirectional 1000 1000 1000 500 0 # target, profileAcceleration, profileDeceleration, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters velocityBidirectional 1000 1000 1000 500 1 # target, profileAcceleration, profileDeceleration, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters velocitySineWave 1000 1 0 # amplitude, frequency, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters velocitySineWave 1000 1 1 # amplitude, frequency, repeat

#
# Requests: Torque Signal Generator
#

DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters torqueStepResponse 500 500 # target, sustainTime
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters torqueAdvancedStepResponse 500 500 0 # target, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters torqueAdvancedStepResponse 500 500 1 # target, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters torqueRamp 500 500 500 # target, torqueSlope, sustainTime
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters torqueTrapezoidal 500 500 500 0 # target, torqueSlope, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters torqueTrapezoidal 500 500 500 1 # target, torqueSlope, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters torqueBidirectional 500 500 500 0 # target, torqueSlope, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters torqueBidirectional 500 500 500 1 # target, torqueSlope, sustainTime, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters torqueSineWave 500 1 0 # amplitude, frequency, repeat
DEBUG=* npx node ./dist/cli.js request setSignalGeneratorParameters torqueSineWave 500 1 1 # amplitude, frequency, repeat

#
# Commands
#

DEBUG=* npx node ./dist/cli.js upload 0x6064:0 0x230A:0
DEBUG=* npx node ./dist/cli.js download 0x2705:0=1
DEBUG=* npx node ./dist/cli.js getDeviceFileContent config.csv
DEBUG=* npx node ./dist/cli.js getDeviceLogContent
DEBUG=* npx node ./dist/cli.js getCoggingTorqueData
DEBUG=* npx node ./dist/cli.js startCoggingTorqueRecording --skip-auto-tuning
DEBUG=* npx node ./dist/cli.js startOffsetDetection
DEBUG=* npx node ./dist/cli.js startPlantIdentification 3 300 2 60 30
DEBUG=* npx node ./dist/cli.js monitor some-topic 0x6064:0 0x230A:0
