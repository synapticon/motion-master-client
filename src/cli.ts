#!/usr/bin/env node
import program, { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { interval, Subject } from 'rxjs';
import { first, map, timeout } from 'rxjs/operators';
import { StringDecoder } from 'string_decoder';
import util from 'util';
import { v4 } from 'uuid';
import YAML from 'yaml';
import zmq from 'zeromq';

import {
  ComputeAutoTuningGainsType,
  decodeMotionMasterMessage,
  DeviceAddressType,
  encodeMotionMasterMessage,
  IMotionMasterMessage,
  MotionMasterClient,
  MotionMasterMessage,
  RequestType,
  SignalGeneratorType,
  StatusType,
} from './motion-master-client';

type OutputFormat = 'inspect' | 'json' | 'yaml';

// tslint:disable: no-var-requires
const debug = require('debug')('motion-master-client');
const version = require('../package.json')['version'];
// tslint:enable-next-line: no-var-requires

process.on('uncaughtException', (err) => {
  console.error('Caught exception: ' + err);
  process.exit(-2);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection reason: ', reason);
  process.exit(-3);
});

const inspectOptions: util.InspectOptions = {
  showHidden: false,
  depth: null,
  colors: true,
  maxArrayLength: null,
  compact: false,
};

// map to cache device parameter info per device
const deviceParameterInfoMap: Map<number, MotionMasterMessage.Status.IDeviceParameterInfo | null | undefined> = new Map();

const input$ = new Subject<IMotionMasterMessage>();
const output$ = new Subject<IMotionMasterMessage>();
const notification$ = new Subject<[string, IMotionMasterMessage]>();
const motionMasterClient = new MotionMasterClient(input$, output$, notification$);

const config = {
  pingSystemInterval: 150, // ping Motion Master at regular intervals
  motionMasterHeartbeatTimeoutDue: 1000, // exit process when Motion Master doesn't send a heartbeat message in time specified
  serverEndpoint: 'tcp://127.0.0.1:62524', // request and receive status messages (response)
  notificationEndpoint: 'tcp://127.0.0.1:62525', // subscribe to a topic and receive published status messages (heartbeat and monitoring)
  identity: v4(), // ZeroMQ DEALER socket identity
};

//
// program and commands
//

program
  .version(version)
  .option('-c, --config <path>', 'path to JSON config file to read and replace the default values with')
  .option('-d, --device-address <address>', 'device address (uint32) generated by Motion Master - takes precedence over device position', parseOptionValueAsInt)
  .option('-f, --output-format <json|yaml>', 'if left unspecified the output format is the default colored message inspect')
  .option('-p, --device-position <position>', 'used when device address is not specified', parseOptionValueAsInt, 0);

program
  .command('request <type> [args...]')
  .option('-i, --interval <value>', 'sending interval in microseconds', parseOptionValueAsInt, 1 * 1000 * 1000)
  .on('--help', () => {
    const types = Object.keys(MotionMasterMessage.Request).slice(8).map((type) => type.charAt(0).toLowerCase() + type.slice(1));
    console.log('');
    console.log('Request <type>s:');
    console.log('  ' + types.join('\n  '));
  })
  .action(requestAction);

program
  .command('upload [params...]')
  .action(uploadAction);

program
  .command('download [paramValues...]')
  .action(downloadAction);

program
  .command('getDeviceFileContent <filename>')
  .action(getDeviceFileContentAction);

program
  .command('getDeviceLogContent')
  .action(getDeviceLogContentAction);

program
  .command('getCoggingTorqueDataContent')
  .action(getCoggingTorqueDataContent);

program
  .command('startCoggingTorqueRecording')
  .option('-s, --skip-auto-tuning')
  .action(startCoggingTorqueRecordingAction);

program
  .command('startOffsetDetection')
  .action(startOffsetDetectionAction);

program
  .command('startPlantIdentification <durationSeconds> <torqueAmplitude> <startFrequency> <endFrequency> <cutoffFrequency>')
  .action(startPlantIdentificationAction);

program
  .command('monitor <topic> [params...]')
  .option('-i, --interval <value>', 'sending interval in microseconds', parseOptionValueAsInt, 1 * 1000 * 1000)
  .action(monitorAction);

// parse command line arguments and execute the command action
program.parse(process.argv);

//
// command action functions
//

async function requestAction(type: RequestType, args: string[], cmd: Command) {
  connectToMotionMaster(cmd.parent);
  const deviceAddress = await getCommandDeviceAddressAsync(cmd.parent);

  const messageId = v4();
  printOnMessageReceived(messageId, cmd.parent.outputFormat as OutputFormat);

  switch (type) {
    case 'pingSystem': {
      motionMasterClient.requestPingSystem(messageId);

      process.exit(0);
      break;
    }
    case 'getSystemVersion': {
      exitOnMessageReceived(messageId);

      motionMasterClient.requestGetSystemVersion(messageId);

      break;
    }
    case 'getDeviceInfo': {
      exitOnMessageReceived(messageId);

      motionMasterClient.requestGetDeviceInfo(messageId);

      break;
    }
    case 'getDeviceParameterInfo': {
      exitOnMessageReceived(messageId);

      motionMasterClient.requestGetDeviceParameterInfo(deviceAddress, messageId);

      break;
    }
    case 'getDeviceParameterValues': {
      exitOnMessageReceived(messageId);

      const parameters: MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[] = args.map(paramToIndexSubindex);
      validateParameters(parameters);
      motionMasterClient.requestGetDeviceParameterValues(deviceAddress, parameters, messageId);

      break;
    }
    case 'getMultiDeviceParameterValues': {
      throw new Error(`Request "${type}" is not yet implemented`);
    }
    case 'setDeviceParameterValues': {
      exitOnMessageReceived(messageId);

      const deviceParameterInfo = await getDeviceParameterInfoAsync(deviceAddress);
      const parameterValues = args.map((paramValue) => paramToIndexSubIndexValue(paramValue, deviceParameterInfo));
      motionMasterClient.requestSetDeviceParameterValues(deviceAddress, parameterValues, messageId);

      break;
    }
    case 'setMultiDeviceParameterValues': {
      throw new Error(`Request "${type}" is not yet implemented`);
    }
    case 'getDeviceFileList': {
      exitOnMessageReceived(messageId);

      motionMasterClient.requestGetDeviceFileList(deviceAddress, messageId);

      break;
    }
    case 'getDeviceFile': {
      exitOnMessageReceived(messageId);

      const name = args[0];
      motionMasterClient.requestGetDeviceFile(deviceAddress, name, messageId);

      break;
    }
    case 'setDeviceFile': {
      exitOnMessageReceived(messageId);

      const filepath = args[0];
      const name = path.basename(filepath);
      const content = fs.readFileSync(filepath);
      const overwrite = true;
      motionMasterClient.requestSetDeviceFile(deviceAddress, name, content, overwrite, messageId);

      break;
    }
    case 'deleteDeviceFile': {
      exitOnMessageReceived(messageId);

      const name = args[0];
      motionMasterClient.requestDeleteDeviceFile(deviceAddress, name, messageId);

      break;
    }
    case 'resetDeviceFault': {
      exitOnMessageReceived(messageId);

      motionMasterClient.requestResetDeviceFault(deviceAddress, messageId);

      break;
    }
    case 'stopDevice': {
      motionMasterClient.requestStopDevice(deviceAddress, messageId);

      process.exit(0);
      break;
    }
    case 'startDeviceFirmwareInstallation': {
      exitOnMessageReceived(messageId, 120000, MotionMasterMessage.Status.DeviceFirmwareInstallation.Success.Code.DONE);

      const filepath = args[0];
      const firmwarePackageContent = fs.readFileSync(filepath);

      motionMasterClient.requestStartDeviceFirmwareInstallation(deviceAddress, firmwarePackageContent, messageId);

      break;
    }
    case 'getDeviceLog': {
      exitOnMessageReceived(messageId);

      const getDeviceLog: MotionMasterMessage.Request.IGetDeviceLog = { deviceAddress };

      motionMasterClient.sendRequest({ getDeviceLog }, messageId);
      break;
    }
    case 'startCoggingTorqueRecording': {
      exitOnMessageReceived(messageId, 300000, MotionMasterMessage.Status.CoggingTorqueRecording.Success.Code.DONE);

      const skipAutoTuning = parseInt(args[0], 10) !== 0;

      motionMasterClient.requestStartCoggingTorqueRecording(deviceAddress, skipAutoTuning, messageId);

      break;
    }
    case 'getCoggingTorqueData': {
      exitOnMessageReceived(messageId);

      motionMasterClient.requestGetCoggingTorqueData(deviceAddress, messageId);

      break;
    }
    case 'startOffsetDetection': {
      exitOnMessageReceived(messageId, 180000, MotionMasterMessage.Status.OffsetDetection.Success.Code.DONE);

      motionMasterClient.requestStartOffsetDetection(deviceAddress, messageId);

      break;
    }
    case 'startPlantIdentification': {
      exitOnMessageReceived(messageId, 60000, MotionMasterMessage.Status.PlantIdentification.Success.Code.DONE);

      const durationSeconds = parseFloat(args[0]);
      const torqueAmplitude = parseInt(args[1], 10);
      const startFrequency = parseInt(args[2], 10);
      const endFrequency = parseInt(args[3], 10);
      const cutoffFrequency = parseInt(args[4], 10);

      motionMasterClient.requestStartPlantIdentification(deviceAddress, durationSeconds, torqueAmplitude, startFrequency, endFrequency, cutoffFrequency, messageId);

      break;
    }
    case 'computeAutoTuningGains': {
      const computeAutoTuningGainsType = args[0] as ComputeAutoTuningGainsType;
      switch (computeAutoTuningGainsType) {
        case 'positionParameters': {
          exitOnMessageReceived(messageId, 10000, MotionMasterMessage.Status.AutoTuning.Success.Code.POSITION_DONE);

          const controllerType = parseInt(args[1], 10);
          const settlingTime = parseFloat(args[2]);
          const positionDamping = parseFloat(args[3]);
          const alphaMult = parseInt(args[4], 10);
          const order = parseInt(args[5], 10);
          const lb = parseFloat(args[6]);
          const ub = parseFloat(args[7]);

          const computeAutoTuningGains: MotionMasterMessage.Request.IComputeAutoTuningGains = {
            deviceAddress,
            positionParameters: {
              controllerType,
              settlingTime,
              positionDamping,
              alphaMult,
              order,
              lb,
              ub,
            },
          };

          motionMasterClient.sendRequest({ computeAutoTuningGains }, messageId);
          break;
        }
        case 'velocityParameters': {
          exitOnMessageReceived(messageId, 10000, MotionMasterMessage.Status.AutoTuning.Success.Code.VELOCITY_DONE);

          const velocityLoopBandwidth = parseFloat(args[1]);
          const velocityDamping = parseFloat(args[2]);

          const computeAutoTuningGains: MotionMasterMessage.Request.IComputeAutoTuningGains = {
            deviceAddress,
            velocityParameters: {
              velocityLoopBandwidth,
              velocityDamping,
            },
          };

          motionMasterClient.sendRequest({ computeAutoTuningGains }, messageId);
          break;
        }
        default: {
          throw new Error(`Unknown compute auto-tuning gains type: ${computeAutoTuningGainsType}`);
        }
      }
      break;
    }
    case 'setMotionControllerParameters': {
      const target = parseInt(args[0], 10);

      const setMotionControllerParameters: MotionMasterMessage.Request.ISetMotionControllerParameters = {
        deviceAddress,
        target,
      };

      motionMasterClient.sendRequest({ setMotionControllerParameters }, messageId);
      process.exit(0);
      break;
    }
    case 'enableMotionController': {
      exitOnMessageReceived(messageId);

      const controllerType = parseInt(args[0], 10);
      const filter = parseInt(args[1], 10) !== 0;

      motionMasterClient.requestEnableMotionController(deviceAddress, controllerType, filter, messageId);

      break;
    }
    case 'disableMotionController': {
      motionMasterClient.requestDisableMotionController(deviceAddress, messageId);
      process.exit(0);
      break;
    }
    case 'setSignalGeneratorParameters': {
      const signalGeneratorType = args[0] as SignalGeneratorType;

      const setSignalGeneratorParameters: MotionMasterMessage.Request.ISetSignalGeneratorParameters = { deviceAddress };

      switch (signalGeneratorType) {
        case 'positionStepResponse': {
          const target = parseInt(args[1], 10);
          const sustainTime = parseInt(args[2], 10);

          setSignalGeneratorParameters.positionStepResponse = {
            target,
            sustainTime,
          };
          break;
        }
        case 'positionAdvancedStepResponse': {
          const target = parseInt(args[1], 10);
          const sustainTime = parseInt(args[2], 10);
          const repeat = parseInt(args[3], 10) !== 0;

          setSignalGeneratorParameters.positionAdvancedStepResponse = {
            target,
            sustainTime,
            repeat,
          };
          break;
        }
        case 'positionRamp': {
          const target = parseInt(args[1], 10);
          const profileVelocity = parseInt(args[2], 10);
          const profileAcceleration = parseInt(args[3], 10);
          const profileDeceleration = parseInt(args[4], 10);
          const sustainTime = parseInt(args[5], 10);

          setSignalGeneratorParameters.positionRamp = {
            target,
            profileVelocity,
            profileAcceleration,
            profileDeceleration,
            sustainTime,
          };
          break;
        }
        case 'positionTrapezoidal': {
          const target = parseInt(args[1], 10);
          const profileVelocity = parseInt(args[2], 10);
          const profileAcceleration = parseInt(args[3], 10);
          const profileDeceleration = parseInt(args[4], 10);
          const sustainTime = parseInt(args[5], 10);
          const repeat = parseInt(args[6], 10) !== 0;

          setSignalGeneratorParameters.positionTrapezoidal = {
            target,
            profileVelocity,
            profileAcceleration,
            profileDeceleration,
            sustainTime,
            repeat,
          };
          break;
        }
        case 'positionBidirectional': {
          const target = parseInt(args[1], 10);
          const profileVelocity = parseInt(args[2], 10);
          const profileAcceleration = parseInt(args[3], 10);
          const profileDeceleration = parseInt(args[4], 10);
          const sustainTime = parseInt(args[5], 10);
          const repeat = parseInt(args[6], 10) !== 0;

          setSignalGeneratorParameters.positionBidirectional = {
            target,
            profileVelocity,
            profileAcceleration,
            profileDeceleration,
            sustainTime,
            repeat,
          };
          break;
        }
        case 'positionSineWave': {
          const amplitude = parseInt(args[1], 10);
          const frequency = parseFloat(args[2]);
          const repeat = parseInt(args[3], 10) !== 0;

          setSignalGeneratorParameters.positionSineWave = {
            amplitude,
            frequency,
            repeat,
          };
          break;
        }
        case 'velocityStepResponse': {
          const target = parseInt(args[1], 10);
          const sustainTime = parseInt(args[2], 10);

          setSignalGeneratorParameters.velocityStepResponse = {
            target,
            sustainTime,
          };
          break;
        }
        case 'velocityAdvancedStepResponse': {
          const target = parseInt(args[1], 10);
          const sustainTime = parseInt(args[2], 10);
          const repeat = parseInt(args[3], 10) !== 0;

          setSignalGeneratorParameters.velocityAdvancedStepResponse = {
            target,
            sustainTime,
            repeat,
          };
          break;
        }
        case 'velocityRamp': {
          const target = parseInt(args[1], 10);
          const profileAcceleration = parseInt(args[2], 10);
          const profileDeceleration = parseInt(args[3], 10);
          const sustainTime = parseInt(args[4], 10);

          setSignalGeneratorParameters.velocityRamp = {
            target,
            profileAcceleration,
            profileDeceleration,
            sustainTime,
          };
          break;
        }
        case 'velocityTrapezoidal': {
          const target = parseInt(args[1], 10);
          const profileAcceleration = parseInt(args[2], 10);
          const profileDeceleration = parseInt(args[3], 10);
          const sustainTime = parseInt(args[4], 10);
          const repeat = parseInt(args[5], 10) !== 0;

          setSignalGeneratorParameters.velocityTrapezoidal = {
            target,
            profileAcceleration,
            profileDeceleration,
            sustainTime,
            repeat,
          };
          break;
        }
        case 'velocityBidirectional': {
          const target = parseInt(args[1], 10);
          const profileAcceleration = parseInt(args[2], 10);
          const profileDeceleration = parseInt(args[3], 10);
          const sustainTime = parseInt(args[4], 10);
          const repeat = parseInt(args[5], 10) !== 0;

          setSignalGeneratorParameters.velocityBidirectional = {
            target,
            profileAcceleration,
            profileDeceleration,
            sustainTime,
            repeat,
          };
          break;
        }
        case 'velocitySineWave': {
          const amplitude = parseInt(args[1], 10);
          const frequency = parseFloat(args[2]);
          const repeat = parseInt(args[3], 10) !== 0;

          setSignalGeneratorParameters.velocitySineWave = {
            amplitude,
            frequency,
            repeat,
          };
          break;
        }
        case 'torqueStepResponse': {
          const target = parseInt(args[1], 10);
          const sustainTime = parseInt(args[2], 10);

          setSignalGeneratorParameters.torqueStepResponse = {
            target,
            sustainTime,
          };
          break;
        }
        case 'torqueAdvancedStepResponse': {
          const target = parseInt(args[1], 10);
          const sustainTime = parseInt(args[2], 10);
          const repeat = parseInt(args[3], 10) !== 0;

          setSignalGeneratorParameters.torqueAdvancedStepResponse = {
            target,
            sustainTime,
            repeat,
          };
          break;
        }
        case 'torqueRamp': {
          const target = parseInt(args[1], 10);
          const torqueSlope = parseInt(args[2], 10);
          const sustainTime = parseInt(args[3], 10);

          setSignalGeneratorParameters.torqueRamp = {
            target,
            torqueSlope,
            sustainTime,
          };
          break;
        }
        case 'torqueTrapezoidal': {
          const target = parseInt(args[1], 10);
          const torqueSlope = parseInt(args[2], 10);
          const sustainTime = parseInt(args[3], 10);
          const repeat = parseInt(args[4], 10) !== 0;

          setSignalGeneratorParameters.torqueTrapezoidal = {
            target,
            torqueSlope,
            sustainTime,
            repeat,
          };
          break;
        }
        case 'torqueBidirectional': {
          const target = parseInt(args[1], 10);
          const torqueSlope = parseInt(args[2], 10);
          const sustainTime = parseInt(args[3], 10);
          const repeat = parseInt(args[4], 10) !== 0;

          setSignalGeneratorParameters.torqueBidirectional = {
            target,
            torqueSlope,
            sustainTime,
            repeat,
          };
          break;
        }
        case 'torqueSineWave': {
          const amplitude = parseInt(args[1], 10);
          const frequency = parseFloat(args[2]);
          const repeat = parseInt(args[3], 10) !== 0;

          setSignalGeneratorParameters.torqueSineWave = {
            amplitude,
            frequency,
            repeat,
          };
          break;
        }
        default: {
          throw new Error(`Unknown set signal generator parameters type: ${signalGeneratorType}`);
        }
      }

      motionMasterClient.sendRequest({ setSignalGeneratorParameters }, messageId);
      process.exit(0);
      break;
    }
    case 'startSignalGenerator': {
      exitOnMessageReceived(messageId, 2147483647, MotionMasterMessage.Status.SignalGenerator.Success.Code.DONE);

      motionMasterClient.requestStartSignalGenerator(deviceAddress, messageId);

      break;
    }
    case 'stopSignalGenerator': {
      motionMasterClient.requestStopSignalGenerator(deviceAddress, messageId);
      process.exit(0);
      break;
    }
    case 'startMonitoringDeviceParameterValues': {
      const parameters = args.slice(1).map(paramToIndexSubindex) as MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[];
      validateParameters(parameters);
      const getDeviceParameterValues = { deviceAddress, parameters };
      const topic = args[0];

      requestStartMonitoringDeviceParameterValues({ getDeviceParameterValues, interval: cmd.interval, topic });
      break;
    }
    case 'stopMonitoringDeviceParameterValues': {
      const startMonitoringRequestId = args[0];

      motionMasterClient.requestStopMonitoringDeviceParameterValues(startMonitoringRequestId, messageId);

      process.exit(0);
      break;
    }
    default: {
      throw new Error(`Request "${type}" doesn\'t exist`);
    }
  }
}

async function uploadAction(params: string[], cmd: Command) {
  connectToMotionMaster(cmd.parent);
  const deviceAddress = await getCommandDeviceAddressAsync(cmd.parent);

  const messageId = v4();
  printOnMessageReceived(messageId, cmd.parent.outputFormat as OutputFormat);
  exitOnMessageReceived(messageId);

  const parameters: MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[] = params.map(paramToIndexSubindex);
  validateParameters(parameters);
  const getDeviceParameterValues: MotionMasterMessage.Request.IGetDeviceParameterValues = { deviceAddress, parameters };

  motionMasterClient.sendRequest({ getDeviceParameterValues }, messageId);
}

async function downloadAction(paramValues: string[], cmd: Command) {
  connectToMotionMaster(cmd.parent);
  const deviceAddress = await getCommandDeviceAddressAsync(cmd.parent);

  const messageId = v4();
  printOnMessageReceived(messageId, cmd.parent.outputFormat as OutputFormat);
  exitOnMessageReceived(messageId);

  const deviceParameterInfo = await getDeviceParameterInfoAsync(deviceAddress);
  const parameterValues = paramValues.map((paramValue) => paramToIndexSubIndexValue(paramValue, deviceParameterInfo));
  const setDeviceParameterValues: MotionMasterMessage.Request.ISetDeviceParameterValues = { deviceAddress, parameterValues };

  motionMasterClient.sendRequest({ setDeviceParameterValues }, messageId);
}

async function getDeviceFileContentAction(name: string, cmd: Command) {
  connectToMotionMaster(cmd.parent);
  const deviceAddress = await getCommandDeviceAddressAsync(cmd.parent);

  const messageId = v4();

  motionMasterClient.selectMessage(messageId).pipe(
    first(),
  ).subscribe((message) => {
    if (message && message.status && message.status.deviceFile) {
      const error = message.status.deviceFile.error;
      if (error) {
        throw new Error(`${error.code}: ${error.message}`);
      } else {
        const content = message.status.deviceFile.content;
        if (content) {
          const contentDecoded = new StringDecoder('utf-8').write(Buffer.from(content));
          console.log(contentDecoded);
          process.exit(0);
        } else {
          throw new Error('Device file content is empty');
        }
      }
    } else {
      throw new Error('The received message is not "deviceFile"');
    }
  });

  const getDeviceFile: MotionMasterMessage.Request.IGetDeviceFile = { deviceAddress, name };

  motionMasterClient.sendRequest({ getDeviceFile }, messageId);
}

async function getDeviceLogContentAction(cmd: Command) {
  connectToMotionMaster(cmd.parent);
  const deviceAddress = await getCommandDeviceAddressAsync(cmd.parent);

  const messageId = v4();

  motionMasterClient.selectMessage(messageId).pipe(
    first(),
  ).subscribe((message) => {
    if (message && message.status && message.status.deviceLog) {
      const error = message.status.deviceLog.error;
      if (error) {
        throw new Error(`${error.code}: ${error.message}`);
      } else {
        const content = message.status.deviceLog.content;
        if (content) {
          const contentDecoded = new StringDecoder('utf-8').write(Buffer.from(content));
          console.log(contentDecoded);
          process.exit(0);
        } else {
          throw new Error('Device log content is empty');
        }
      }
    } else {
      throw new Error('The received message is not "deviceLog"');
    }
  });

  const getDeviceLog: MotionMasterMessage.Request.IGetDeviceLog = { deviceAddress };

  motionMasterClient.sendRequest({ getDeviceLog }, messageId);
}

async function getCoggingTorqueDataContent(cmd: Command) {
  connectToMotionMaster(cmd.parent);
  const deviceAddress = await getCommandDeviceAddressAsync(cmd.parent);

  const messageId = v4();

  motionMasterClient.selectMessage(messageId).pipe(
    first(),
  ).subscribe((message) => {
    if (message && message.status && message.status.coggingTorqueData) {
      const error = message.status.coggingTorqueData.error;
      if (error) {
        throw new Error(`${error.code}: ${error.message}`);
      } else {
        const table = message.status.coggingTorqueData.table;
        if (table && table.data) {
          console.log(table.data.join(', '));
          process.exit(0);
        } else {
          throw new Error('Cogging torque table content data is empty');
        }
      }
    } else {
      throw new Error('The received message is not "coggingTorqueData"');
    }
  });

  const getCoggingTorqueData: MotionMasterMessage.Request.IGetCoggingTorqueData = { deviceAddress };

  motionMasterClient.sendRequest({ getCoggingTorqueData }, messageId);
}

async function startOffsetDetectionAction(cmd: Command) {
  connectToMotionMaster(cmd.parent);

  const messageId = v4();
  printOnMessageReceived(messageId, cmd.parent.outputFormat as OutputFormat);
  exitOnMessageReceived(messageId, 180000, MotionMasterMessage.Status.OffsetDetection.Success.Code.DONE);

  const deviceAddress = await getCommandDeviceAddressAsync(cmd.parent);
  const startOffsetDetection: MotionMasterMessage.Request.IStartOffsetDetection = { deviceAddress };

  motionMasterClient.sendRequest({ startOffsetDetection }, messageId);
}

async function startCoggingTorqueRecordingAction(cmd: Command) {
  connectToMotionMaster(cmd.parent);

  const messageId = v4();
  printOnMessageReceived(messageId, cmd.parent.outputFormat as OutputFormat);
  exitOnMessageReceived(messageId, 300000, MotionMasterMessage.Status.CoggingTorqueRecording.Success.Code.DONE);

  const deviceAddress = await getCommandDeviceAddressAsync(cmd.parent);
  const skipAutoTuning = cmd.skipAutoTuning;
  const startCoggingTorqueRecording: MotionMasterMessage.Request.IStartCoggingTorqueRecording = { deviceAddress, skipAutoTuning };

  motionMasterClient.sendRequest({ startCoggingTorqueRecording }, messageId);
}

async function startPlantIdentificationAction(
  durationSeconds: number,
  torqueAmplitude: number,
  startFrequency: number,
  endFrequency: number,
  cutoffFrequency: number,
  cmd: Command,
) {
  connectToMotionMaster(cmd.parent);
  const deviceAddress = await getCommandDeviceAddressAsync(cmd.parent);

  const messageId = v4();
  printOnMessageReceived(messageId, cmd.parent.outputFormat as OutputFormat);
  exitOnMessageReceived(messageId, 60000, MotionMasterMessage.Status.PlantIdentification.Success.Code.DONE);

  const startPlantIdentification: MotionMasterMessage.Request.IStartPlantIdentification = {
    deviceAddress,
    durationSeconds,
    torqueAmplitude,
    startFrequency,
    endFrequency,
    cutoffFrequency,
  };

  motionMasterClient.sendRequest({ startPlantIdentification }, messageId);
}

async function monitorAction(topic: string, params: string[], cmd: Command) {
  connectToMotionMaster(cmd.parent);
  const deviceAddress = await getCommandDeviceAddressAsync(cmd.parent);

  const parameters = params.map(paramToIndexSubindex);
  const getDeviceParameterValues = { deviceAddress, parameters };

  requestStartMonitoringDeviceParameterValues({ getDeviceParameterValues, interval: cmd.interval, topic });
}

//
// helper functions
//

function connectToMotionMaster(cmd: Command) {

  if (cmd.config) {
    const contents = fs.readFileSync(cmd.config, { encoding: 'utf8' });
    const json = JSON.parse(contents);
    Object.assign(config, json);
  }

  // ping Motion Master in regular intervals
  const pingSystemInterval = interval(config.pingSystemInterval);
  pingSystemInterval.subscribe(() => motionMasterClient.sendRequest({ pingSystem: {} }));

  // connect to server endpoint
  const serverSocket = zmq.socket('dealer');
  debug(`Identity: ${config.identity}`);
  serverSocket.identity = config.identity;
  serverSocket.connect(config.serverEndpoint);
  debug(`ZeroMQ DEALER socket is connected to server endpoint: ${config.serverEndpoint}`);

  // feed data coming from Motion Master to MotionMasterClient
  serverSocket.on('message', (data) => {
    input$.next(decodeMotionMasterMessage(data));
  });

  // send data fed from MotionMasterClient to Motion Master
  output$.subscribe((message) => {
    // log outgoing messages and skip ping messages
    if (!(message && message.request && message.request.pingSystem)) {
      debug(
        util.inspect(message, inspectOptions),
      );
    }
    serverSocket.send(Buffer.from(encodeMotionMasterMessage(message)));
  });

  // connnect to notification endpoint
  const notificationSocket = zmq.socket('sub').connect(config.notificationEndpoint);
  debug(`ZeroMQ SUB socket connected to notification endpoint: ${config.notificationEndpoint}`);

  // subscribe to all topics
  notificationSocket.subscribe('');

  // exit process when a heartbeat message is not received for more than the time specified
  motionMasterClient.selectMessageStatus('systemPong').pipe(
    timeout(config.motionMasterHeartbeatTimeoutDue),
  ).subscribe({
    error: (err) => {
      console.error(`${err.name}: Heartbeat message not received for more than ${config.motionMasterHeartbeatTimeoutDue} ms. Check if Motion Master process is running.`);
      process.exit(-1);
    },
  });

  // feed notification data coming from Motion Master to MotionMasterClient
  notificationSocket.on('message', (topic: Uint8Array, message: Uint8Array) => {
    notification$.next([topic.toString(), decodeMotionMasterMessage(message)]);
  });
}

function requestStartMonitoringDeviceParameterValues(startMonitoringDeviceParameterValues: MotionMasterMessage.Request.IStartMonitoringDeviceParameterValues) {
  const messageId = v4();

  motionMasterClient.selectNotification(startMonitoringDeviceParameterValues.topic).subscribe((notif) => {
    const timestamp = Date.now();
    const topic = startMonitoringDeviceParameterValues.topic;
    const message = notif.message;
    console.log(
      util.inspect({ timestamp, topic, message }, inspectOptions),
    );
  });

  motionMasterClient.sendRequest({ startMonitoringDeviceParameterValues }, messageId);
}

async function getDeviceParameterInfoAsync(deviceAddress: DeviceAddressType) {
  if (!deviceAddress) {
    return null;
  }

  if (deviceParameterInfoMap.has(deviceAddress)) {
    return deviceParameterInfoMap.get(deviceAddress); // retrieve from cache
  }

  const getDeviceParameterInfo = { deviceAddress };
  const messageId = v4();
  motionMasterClient.sendRequest({ getDeviceParameterInfo }, messageId);

  const deviceParameterInfo = await motionMasterClient.selectMessage(messageId).pipe(
    first(),
    map((message) => message && message.status ? message.status.deviceParameterInfo : null),
  ).toPromise();

  deviceParameterInfoMap.set(deviceAddress, deviceParameterInfo); // cache

  return deviceParameterInfo;
}

function paramToIndexSubindex(paramValue: string) {
  const [indexStr, subindexStr] = paramValue.split(':');
  const index = parseInt(indexStr, 16);
  const subindex = parseInt(subindexStr, 10) || 0;
  return { index, subindex };
}

function paramToIndexSubIndexValue(paramValue: string, deviceParameterInfo: MotionMasterMessage.Status.IDeviceParameterInfo | null | undefined) {
  const [param, value] = paramValue.split('=');
  const { index, subindex } = paramToIndexSubindex(param);

  const parameterValue: MotionMasterMessage.Status.DeviceParameterValues.IParameterValue = { index, subindex };

  if (deviceParameterInfo) {
    if (deviceParameterInfo.parameters) {
      const parameter = deviceParameterInfo.parameters.find((p) => p.index === index && p.subindex === subindex);
      if (parameter) {
        const VT = MotionMasterMessage.Status.DeviceParameterInfo.Parameter.ValueType;
        switch (parameter.valueType) {
          case VT.UNSPECIFIED:
          case VT.INTEGER8:
          case VT.INTEGER16:
          case VT.INTEGER32: {
            parameterValue.intValue = parseInt(value, 10);
            break;
          }
          case VT.BOOLEAN:
          case VT.UNSIGNED8:
          case VT.UNSIGNED16:
          case VT.UNSIGNED32: {
            parameterValue.uintValue = parseInt(value, 10);
            break;
          }
          case VT.REAL32: {
            parameterValue.floatValue = parseFloat(value);
            break;
          }
          case VT.VISIBLE_STRING:
          case VT.OCTET_STRING:
          case VT.UNICODE_STRING:
          case VT.TIME_OF_DAY: {
            parameterValue.stringValue = value;
            break;
          }
        }
      }
    }
  }

  return parameterValue;
}

function validateParameters(parameters: MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[]) {
  let error = null;

  if (parameters.some((p) => p.index === 0)) {
    error = new Error('Parameter with index 0 is requested.');
  }

  if (parameters.some((p) => isNaN(p.index as number) || isNaN(p.subindex as number))) {
    error = new Error('Parameter with unparsable index or subindex is requested.');
  }

  if (error) {
    error.message += '\nExample of correct syntax: "0x2002 0x100A:0 0x2003:4".';
    console.error(`${error.name}: ${error.message}`);
    console.error(util.inspect(parameters, inspectOptions));
    process.exit(-4);
  }
}

async function getCommandDeviceAddressAsync(cmd: Command): Promise<DeviceAddressType> {
  if (cmd.deviceAddress) {
    return cmd.deviceAddress;
  } else if (Number.isInteger(cmd.devicePosition)) {
    const device = await motionMasterClient.selectDeviceAtPosition(cmd.devicePosition).toPromise();
    if (device) {
      return device.deviceAddress;
    } else {
      throw new Error(`There is no device at position ${cmd.devicePosition}`);
    }
  } else {
    return null;
  }
}

function exitOnMessageReceived(messageId: string, due = 10000, exitOnSuccessCode?: number) {
  motionMasterClient.selectMessage(messageId).pipe(
    first((message) => {
      if (exitOnSuccessCode === undefined) {
        return true;
      } else {
        if (message && message.status) {
          const key = Object.keys(message.status)[0] as StatusType;
          const status = message.status[key] as { success: any, error: any };
          if (status && ((status.success && status.success.code === exitOnSuccessCode) || status.error)) {
            return true;
          }
        }
        return false;
      }
    }),
    timeout(due),
  ).subscribe({
    next: () => {
      debug(`Exit on message received ${messageId}`);
      process.exit(0);
    },
    error: (err) => {
      console.error(`${err.name}: Status message ${messageId} not received for more than ${due} ms.`);
      process.exit(-1);
    },
  });
}

function printOnMessageReceived(messageId: string, outputFormat: OutputFormat = 'inspect') {
  motionMasterClient.selectMessage(messageId).subscribe((message) => {
    const timestamp = Date.now();
    const outputObj = { timestamp, message };

    switch (outputFormat) {
      case 'json': {
        console.log(JSON.stringify(outputObj));
        break;
      }
      case 'yaml': {
        console.log(YAML.stringify(outputObj));
        break;
      }
      default: {
        console.log(
          util.inspect(outputObj, inspectOptions),
        );
      }
    }
  });
}

function parseOptionValueAsInt(value: string) {
  return parseInt(value, 10);
}
