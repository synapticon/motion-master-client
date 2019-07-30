#!/usr/bin/env node
import program, { Command } from 'commander';
import fs from 'fs';
import { motionmaster } from 'motion-master-proto';
import path from 'path';
import * as rxjs from 'rxjs';
import { first, map, timeout } from 'rxjs/operators';
import util from 'util';
import { v4 } from 'uuid';
import YAML from 'yaml';
import zmq from 'zeromq';

import {
  decodeMotionMasterMessage,
  MotionMasterClient,
  RequestType,
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
const deviceParameterInfoMap: Map<number, motionmaster.MotionMasterMessage.Status.IDeviceParameterInfo | null | undefined> = new Map();

const input = new rxjs.Subject<Buffer>();
const output = new rxjs.Subject<Buffer>();
const notification = new rxjs.Subject<[Buffer, Buffer]>();
const motionMasterClient = new MotionMasterClient(input, output, notification);

const config = {
  pingSystemInterval: 200, // ping Motion Master at regular intervals
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
  .option('-f, --output-format <json|yaml>', 'if left unspecified the output is colored inspect of the received message')
  .option('-p, --device-position <position>', 'used when device address is not specified', parseOptionValueAsInt, 0);

program
  .command('request <type> [args...]')
  .option('-i, --interval <value>', 'sending interval in microseconds', parseOptionValueAsInt, 1 * 1000 * 1000)
  .on('--help', () => {
    const types = Object.keys(motionmaster.MotionMasterMessage.Request).slice(8).map((type) => type.charAt(0).toLowerCase() + type.slice(1));
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
      const pingSystem: motionmaster.MotionMasterMessage.Request.IPingSystem = {};

      motionMasterClient.sendRequest({ pingSystem }, messageId);
      process.exit(0);
      break;
    }
    case 'getSystemVersion': {
      exitOnMessageReceived(messageId);

      const getSystemVersion: motionmaster.MotionMasterMessage.Request.IGetSystemVersion = {};

      motionMasterClient.sendRequest({ getSystemVersion }, messageId);
      break;
    }
    case 'getDeviceInfo': {
      exitOnMessageReceived(messageId);

      const getDeviceInfo: motionmaster.MotionMasterMessage.Request.IGetDeviceInfo = {};

      motionMasterClient.sendRequest({ getDeviceInfo }, messageId);
      break;
    }
    case 'getDeviceParameterInfo': {
      exitOnMessageReceived(messageId);

      const getDeviceParameterInfo: motionmaster.MotionMasterMessage.Request.IGetDeviceParameterInfo = { deviceAddress };

      motionMasterClient.sendRequest({ getDeviceParameterInfo }, messageId);
      break;
    }
    case 'getDeviceParameterValues': {
      exitOnMessageReceived(messageId);

      const parameters: motionmaster.MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[] = args.map(paramToIndexSubindex);
      const getDeviceParameterValues: motionmaster.MotionMasterMessage.Request.IGetDeviceParameterValues = { deviceAddress, parameters };

      motionMasterClient.sendRequest({ getDeviceParameterValues }, messageId);
      break;
    }
    case 'getMultiDeviceParameterValues': {
      throw new Error(`Request "${type}" is not yet implemented`);
    }
    case 'setDeviceParameterValues': {
      exitOnMessageReceived(messageId);

      const deviceParameterInfo = await getDeviceParameterInfoAsync(deviceAddress);
      const parameterValues = args.map((paramValue) => paramToIndexSubIndexValue(paramValue, deviceParameterInfo));
      const setDeviceParameterValues: motionmaster.MotionMasterMessage.Request.ISetDeviceParameterValues = { deviceAddress, parameterValues };

      motionMasterClient.sendRequest({ setDeviceParameterValues }, messageId);
      break;
    }
    case 'setMultiDeviceParameterValues': {
      throw new Error(`Request "${type}" is not yet implemented`);
    }
    case 'getDeviceFileList': {
      exitOnMessageReceived(messageId);

      const getDeviceFileList: motionmaster.MotionMasterMessage.Request.IGetDeviceFileList = { deviceAddress };

      motionMasterClient.sendRequest({ getDeviceFileList }, messageId);
      break;
    }
    case 'getDeviceFile': {
      exitOnMessageReceived(messageId);

      const name = args[0];
      const getDeviceFile: motionmaster.MotionMasterMessage.Request.IGetDeviceFile = { deviceAddress, name };

      motionMasterClient.sendRequest({ getDeviceFile }, messageId);
      break;
    }
    case 'setDeviceFile': {
      exitOnMessageReceived(messageId);

      const filepath = args[0];
      const content = fs.readFileSync(filepath);
      const name = path.basename(filepath);
      const overwrite = true;
      const setDeviceFile: motionmaster.MotionMasterMessage.Request.ISetDeviceFile = { deviceAddress, name, content, overwrite };

      motionMasterClient.sendRequest({ setDeviceFile }, messageId);
      break;
    }
    case 'deleteDeviceFile': {
      exitOnMessageReceived(messageId);

      const name = args[0];
      const deleteDeviceFile: motionmaster.MotionMasterMessage.Request.IDeleteDeviceFile = { deviceAddress, name };

      motionMasterClient.sendRequest({ deleteDeviceFile }, messageId);
      break;
    }
    case 'resetDeviceFault': {
      exitOnMessageReceived(messageId);

      const resetDeviceFault: motionmaster.MotionMasterMessage.Request.IResetDeviceFault = { deviceAddress };

      motionMasterClient.sendRequest({ resetDeviceFault }, messageId);
      break;
    }
    case 'stopDevice': {
      const stopDevice: motionmaster.MotionMasterMessage.Request.IStopDevice = { deviceAddress };

      motionMasterClient.sendRequest({ stopDevice }, messageId);
      process.exit(0);
      break;
    }
    case 'startDeviceFirmwareInstallation': {
      exitOnMessageReceived(messageId, 120000, motionmaster.MotionMasterMessage.Status.DeviceFirmwareInstallation.Success.Code.DONE);

      const filepath = args[0];
      const firmwarePackageContent = fs.readFileSync(filepath);
      const startDeviceFirmwareInstallation: motionmaster.MotionMasterMessage.Request.IStartDeviceFirmwareInstallation = { deviceAddress, firmwarePackageContent };

      motionMasterClient.sendRequest({ startDeviceFirmwareInstallation }, messageId);
      break;
    }
    case 'getDeviceLog': {
      exitOnMessageReceived(messageId);

      const getDeviceLog: motionmaster.MotionMasterMessage.Request.IGetDeviceLog = { deviceAddress };

      motionMasterClient.sendRequest({ getDeviceLog }, messageId);
      break;
    }
    case 'startCoggingTorqueRecording': {
      exitOnMessageReceived(messageId, 300000, motionmaster.MotionMasterMessage.Status.CoggingTorqueRecording.Success.Code.DONE);

      const skipAutoTuning = args[0] === 'true' || false;
      const startCoggingTorqueRecording: motionmaster.MotionMasterMessage.Request.IStartCoggingTorqueRecording = { deviceAddress, skipAutoTuning };

      motionMasterClient.sendRequest({ startCoggingTorqueRecording }, messageId);
      break;
    }
    case 'getCoggingTorqueData': {
      exitOnMessageReceived(messageId);

      const getCoggingTorqueData: motionmaster.MotionMasterMessage.Request.IGetCoggingTorqueData = { deviceAddress };

      motionMasterClient.sendRequest({ getCoggingTorqueData }, messageId);
      break;
    }
    case 'startOffsetDetection': {
      exitOnMessageReceived(messageId, 180000, motionmaster.MotionMasterMessage.Status.OffsetDetection.Success.Code.DONE);

      const startOffsetDetection: motionmaster.MotionMasterMessage.Request.IStartOffsetDetection = { deviceAddress };

      motionMasterClient.sendRequest({ startOffsetDetection }, messageId);
      break;
    }
    case 'startPlantIdentification': {
      exitOnMessageReceived(messageId, 60000, motionmaster.MotionMasterMessage.Status.PlantIdentification.Success.Code.DONE);

      const durationSeconds = parseFloat(args[0]);
      const torqueAmplitude = parseInt(args[1], 10);
      const startFrequency = parseInt(args[2], 10);
      const endFrequency = parseInt(args[3], 10);
      const cutoffFrequency = parseInt(args[4], 10);

      const startPlantIdentification: motionmaster.MotionMasterMessage.Request.IStartPlantIdentification = {
        deviceAddress,
        durationSeconds,
        torqueAmplitude,
        startFrequency,
        endFrequency,
        cutoffFrequency,
      };

      motionMasterClient.sendRequest({ startPlantIdentification }, messageId);
      break;
    }
    case 'computeAutoTuningGains': {
      if (args[0] === 'position') {
        exitOnMessageReceived(messageId, 10000, motionmaster.MotionMasterMessage.Status.AutoTuning.Success.Code.POSITION_DONE);

        const controllerType = parseInt(args[1], 10);
        const settlingTime = parseFloat(args[2]);
        const positionDamping = parseFloat(args[3]);
        const alphaMult = parseInt(args[4], 10);
        const order = parseInt(args[5], 10);
        const lb = parseFloat(args[6]);
        const ub = parseFloat(args[7]);

        const computeAutoTuningGains: motionmaster.MotionMasterMessage.Request.IComputeAutoTuningGains = {
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
      } else if (args[0] === 'velocity') {
        exitOnMessageReceived(messageId, 10000, motionmaster.MotionMasterMessage.Status.AutoTuning.Success.Code.VELOCITY_DONE);

        const velocityLoopBandwidth = parseFloat(args[1]);
        const velocityDamping = parseFloat(args[2]);

        const computeAutoTuningGains: motionmaster.MotionMasterMessage.Request.IComputeAutoTuningGains = {
          deviceAddress,
          velocityParameters: {
            velocityLoopBandwidth,
            velocityDamping,
          },
        };

        motionMasterClient.sendRequest({ computeAutoTuningGains }, messageId);
      } else {
        throw new Error(`Unknown compute auto-tuning gains "${args[0]}" type.`);
      }
      break;
    }
    case 'setMotionControllerParameters': {
      throw new Error(`Request "${type}" is not yet implemented`);
    }
    case 'enableMotionController': {
      exitOnMessageReceived(messageId);

      const controllerType = parseInt(args[0], 10);
      const filter = args[1] === 'true' || false;

      const enableMotionController: motionmaster.MotionMasterMessage.Request.IEnableMotionController = {
        deviceAddress,
        controllerType,
        filter,
      };

      motionMasterClient.sendRequest({ enableMotionController }, messageId);
      break;
    }
    case 'disableMotionController': {
      const disableMotionController: motionmaster.MotionMasterMessage.Request.IDisableMotionController = { deviceAddress };

      motionMasterClient.sendRequest({ disableMotionController }, messageId);
      process.exit(0);
      break;
    }
    case 'setSignalGeneratorParameters': {
      throw new Error(`Request "${type}" is not yet implemented`);
    }
    case 'startSignalGenerator': {
      throw new Error(`Request "${type}" is not yet implemented`);
    }
    case 'stopSignalGenerator': {
      throw new Error(`Request "${type}" is not yet implemented`);
    }
    case 'startMonitoringDeviceParameterValues': {
      const parameters = args.slice(1).map(paramToIndexSubindex);
      const getDeviceParameterValues = { deviceAddress, parameters };
      const interval = cmd.interval;
      const topic = args[0];

      requestStartMonitoringDeviceParameterValues({ getDeviceParameterValues, interval, topic });
      break;
    }
    case 'stopMonitoringDeviceParameterValues': {
      const startMonitoringRequestId = args[0];
      const stopMonitoringDeviceParameterValues: motionmaster.MotionMasterMessage.Request.IStopMonitoringDeviceParameterValues = { startMonitoringRequestId };

      motionMasterClient.sendRequest({ stopMonitoringDeviceParameterValues }, messageId);
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

  const parameters: motionmaster.MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[] = params.map(paramToIndexSubindex);
  const getDeviceParameterValues: motionmaster.MotionMasterMessage.Request.IGetDeviceParameterValues = { deviceAddress, parameters };

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
  const setDeviceParameterValues: motionmaster.MotionMasterMessage.Request.ISetDeviceParameterValues = { deviceAddress, parameterValues };

  motionMasterClient.sendRequest({ setDeviceParameterValues }, messageId);
}

async function startOffsetDetectionAction(cmd: Command) {
  connectToMotionMaster(cmd.parent);

  const messageId = v4();
  printOnMessageReceived(messageId, cmd.parent.outputFormat as OutputFormat);
  exitOnMessageReceived(messageId, 180000, motionmaster.MotionMasterMessage.Status.OffsetDetection.Success.Code.DONE);

  const deviceAddress = await getCommandDeviceAddressAsync(cmd.parent);
  const startOffsetDetection: motionmaster.MotionMasterMessage.Request.IStartOffsetDetection = { deviceAddress };

  motionMasterClient.sendRequest({ startOffsetDetection }, messageId);
}

async function startCoggingTorqueRecordingAction(cmd: Command) {
  connectToMotionMaster(cmd.parent);

  const messageId = v4();
  printOnMessageReceived(messageId, cmd.parent.outputFormat as OutputFormat);
  exitOnMessageReceived(messageId, 300000, motionmaster.MotionMasterMessage.Status.CoggingTorqueRecording.Success.Code.DONE);

  const deviceAddress = await getCommandDeviceAddressAsync(cmd.parent);
  const skipAutoTuning = cmd.skipAutoTuning;
  const startCoggingTorqueRecording: motionmaster.MotionMasterMessage.Request.IStartCoggingTorqueRecording = { deviceAddress, skipAutoTuning };

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
  exitOnMessageReceived(messageId, 60000, motionmaster.MotionMasterMessage.Status.PlantIdentification.Success.Code.DONE);

  const startPlantIdentification: motionmaster.MotionMasterMessage.Request.IStartPlantIdentification = {
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
  const interval = cmd.interval;

  requestStartMonitoringDeviceParameterValues({ getDeviceParameterValues, interval, topic });
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
  const pingSystemInterval = rxjs.interval(config.pingSystemInterval);
  pingSystemInterval.subscribe(() => motionMasterClient.sendRequest({ pingSystem: {} }));

  // connect to server endpoint
  const serverSocket = zmq.socket('dealer');
  debug(`Identity: ${config.identity}`);
  serverSocket.identity = config.identity;
  serverSocket.connect(config.serverEndpoint);
  debug(`ZeroMQ DEALER socket is connected to server endpoint: ${config.serverEndpoint}`);

  // feed buffer data coming from Motion Master to MotionMasterClient
  serverSocket.on('message', (data) => {
    input.next(data);
  });

  // send buffer data fed from MotionMasterClient to Motion Master
  output.subscribe((buffer) => {
    const message = decodeMotionMasterMessage(buffer);
    // log outgoing messages and skip ping messages
    if (!(message && message.request && message.request.pingSystem)) {
      debug(
        util.inspect(decodeMotionMasterMessage(buffer).toJSON(), inspectOptions),
      );
    }
    serverSocket.send(buffer);
  });

  // connnect to notification endpoint
  const notificationSocket = zmq.socket('sub').connect(config.notificationEndpoint);
  debug(`ZeroMQ SUB socket connected to notification endpoint: ${config.notificationEndpoint}`);

  // subscribe to all topics
  notificationSocket.subscribe('');

  // exit process when a heartbeat message is not received for more than the time specified
  motionMasterClient.filterNotificationByTopic$('heartbeat').pipe(
    timeout(config.motionMasterHeartbeatTimeoutDue),
  ).subscribe({
    error: (err) => {
      console.error(`${err.name}: Heartbeat message not received for more than ${config.motionMasterHeartbeatTimeoutDue} ms. Check if Motion Master process is running.`);
      process.exit(-1);
    },
  });

  // feed notification buffer data coming from Motion Master to MotionMasterClient
  notificationSocket.on('message', (topic: Buffer, message: Buffer) => {
    notification.next([topic, message]);
  });
}

function requestStartMonitoringDeviceParameterValues(startMonitoringDeviceParameterValues: motionmaster.MotionMasterMessage.Request.IStartMonitoringDeviceParameterValues) {
  const messageId = v4();

  motionMasterClient.filterNotificationByTopic$(startMonitoringDeviceParameterValues.topic as string).subscribe((notif) => {
    const timestamp = Date.now();
    const topic = startMonitoringDeviceParameterValues.topic;
    const message = notif.message;
    console.log(
      util.inspect({ timestamp, topic, message }, inspectOptions),
    );
  });

  motionMasterClient.sendRequest({ startMonitoringDeviceParameterValues }, messageId);
}

async function getDeviceParameterInfoAsync(deviceAddress: number | null | undefined) {
  if (!deviceAddress) {
    return null;
  }

  if (deviceParameterInfoMap.has(deviceAddress)) {
    return deviceParameterInfoMap.get(deviceAddress); // retrieve from cache
  }

  const getDeviceParameterInfo = { deviceAddress };
  const messageId = v4();
  motionMasterClient.sendRequest({ getDeviceParameterInfo }, messageId);

  const deviceParameterInfo = await motionMasterClient.filterMotionMasterMessageById$(messageId).pipe(
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

function paramToIndexSubIndexValue(paramValue: string, deviceParameterInfo: motionmaster.MotionMasterMessage.Status.IDeviceParameterInfo | null | undefined) {
  const [param, value] = paramValue.split('=');
  const { index, subindex } = paramToIndexSubindex(param);

  const parameterValue: motionmaster.MotionMasterMessage.Status.DeviceParameterValues.IParameterValue = { index, subindex };

  if (deviceParameterInfo) {
    if (deviceParameterInfo.parameters) {
      const parameter = deviceParameterInfo.parameters.find((p) => p.index === index && p.subindex === subindex);
      if (parameter) {
        const VT = motionmaster.MotionMasterMessage.Status.DeviceParameterInfo.Parameter.ValueType;
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

async function getCommandDeviceAddressAsync(cmd: Command): Promise<number | null | undefined> {
  if (cmd.deviceAddress) {
    return cmd.deviceAddress;
  } else if (Number.isInteger(cmd.devicePosition)) {
    const device = await motionMasterClient.getDeviceAtPosition$(cmd.devicePosition).toPromise();
    if (device) {
      return device.deviceAddress;
    } else {
      throw new Error(`There is no device at position ${cmd.devicePosition}`);
    }
  } else {
    return null;
  }
}

function exitOnMessageReceived(messageId: string, due = 10000, exitOnSuccessCode?: number): void {
  motionMasterClient.filterMotionMasterMessageById$(messageId).pipe(
    first((message) => {
      if (exitOnSuccessCode === undefined) {
        return true;
      } else {
        if (message && message.status) {
          const key = Object.keys(message.status)[0] as StatusType;
          const status = message.status[key] as { success: any, error: any };
          if (status && (status.success.code === exitOnSuccessCode || status.error)) {
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
  motionMasterClient.filterMotionMasterMessageById$(messageId).subscribe((msg) => {
    const timestamp = Date.now();
    const message = msg.toJSON();
    const outputObj = { timestamp, message };

    switch (outputFormat) {
      case 'json':
        console.log(JSON.stringify(outputObj));
        break;
      case 'yaml':
        console.log(YAML.stringify(outputObj))
        break;
      default:
        console.log(
          util.inspect(outputObj, inspectOptions),
        );
    }
  });
}

function parseOptionValueAsInt(value: string): number {
  return parseInt(value, 10);
}
