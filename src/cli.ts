#!/usr/bin/env node

import program, { Command } from 'commander';
import { motionmaster } from 'motion-master-proto';
import * as rxjs from 'rxjs';
import { first, map, timeout } from 'rxjs/operators';
import * as util from 'util';
import { v4 } from 'uuid';
import * as zmq from 'zeromq';
import { decodeMotionMasterMessage, MotionMasterClient } from './motion-master-client';

// tslint:disable: no-var-requires
const debug = require('debug')('motion-master-client');
const version = require('../package.json')['version'];
// tslint:enable-next-line: no-var-requires

process.on('uncaughtException', (err) => {
  console.error('Caught exception: ' + err);
  process.exit();
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection reason: ', reason);
  process.exit();
});

const inspectOptions: util.InspectOptions = {
  showHidden: false,
  depth: null,
  colors: true,
  maxArrayLength: null,
};

const config = {
  pingSystemInterval: 200, // ping Motion Master at regular intervals
  motionMasterHeartbeatTimeoutDue: 1000, // exit process when Motion Master doesn't send a heartbeat message in time specified
  serverEndpoint: 'tcp://127.0.0.1:62524', // request and receive status messages (response)
  notificationEndpoint: 'tcp://127.0.0.1:62525', // subscribe to a topic and receive published status messages (heartbeat and monitoring)
  identity: v4(), // ZeroMQ DEALER socket identity
};

// map to cache device parameter info per device
const deviceParameterInfoMap: Map<number, motionmaster.MotionMasterMessage.Status.IDeviceParameterInfo | null | undefined> = new Map();

const input = new rxjs.Subject<Buffer>();
const output = new rxjs.Subject<Buffer>();
const notification = new rxjs.Subject<[Buffer, Buffer]>();
const motionMasterClient = new MotionMasterClient(input, output, notification);

// connect to server endpoint
const serverSocket = zmq.socket('dealer');
debug(`Identity: ${config.identity}`);
serverSocket.identity = config.identity;
serverSocket.connect(config.serverEndpoint);
debug(`ZeroMQ DEALER socket is connected to server endpoint: ${config.serverEndpoint}`);

// connnect to notification endpoint
const notificationSocket = zmq.socket('sub').connect(config.notificationEndpoint);
debug(`ZeroMQ SUB socket connected to notification endpoint: ${config.notificationEndpoint}`);

// subscribe to all topics
notificationSocket.subscribe('');

// feed notification buffer data coming from Motion Master to MotionMasterClient
notificationSocket.on('message', (topic: Buffer, message: Buffer) => {
  notification.next([topic, message]);
});

// ping Motion Master in regular intervals
const pingSystemInterval = rxjs.interval(config.pingSystemInterval);
pingSystemInterval.subscribe(() => motionMasterClient.sendRequest({ pingSystem: {} }));

// exit process when a heartbeat message is not received for more than the time specified
motionMasterClient.filterNotificationByTopic$('heartbeat').pipe(
  timeout(config.motionMasterHeartbeatTimeoutDue),
).subscribe({
  error: (err) => {
    console.error(`${err.name}: Heartbeat message not received for more than ${config.motionMasterHeartbeatTimeoutDue} ms. Check if Motion Master process is running.`);
    process.exit(-1);
  },
});

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

//
// program and commands
//

program
  .version(version);

const requestCommand = program.command('request <type> [args...]');
addDeviceOptions(requestCommand);
requestCommand
  .action(requestAction);

const uploadCommand = program.command('upload [params...]');
addDeviceOptions(uploadCommand);
uploadCommand
  .action(uploadAction);

const downloadCommand = program.command('download [paramValues...]');
addDeviceOptions(downloadCommand);
downloadCommand
  .action(downloadAction);

const monitorCommmand = program.command('monitor <topic> [params...]');
addDeviceOptions(monitorCommmand);
monitorCommmand
  .option('-i, --interval <value>', 'sending interval in microseconds', parseOptionValueAsInt, 1 * 1000 * 1000)
  .action(monitorAction);

// parse command line arguments and execute the command action
program.parse(process.argv);

//
// command action functions
//

async function requestAction(type: string, args: string[], cmd: Command) {
  const deviceAddress = await getCommandDeviceAddressAsync(cmd);
  const messageId = v4();

  printOnMessageReceived(messageId);
  exitOnMessageReceived(messageId);

  switch (type) {
    case 'pingSystem': {
      const pingSystem: motionmaster.MotionMasterMessage.Request.IPingSystem = {};
      motionMasterClient.sendRequest({ pingSystem }, messageId);
      break;
    }
    case 'getSystemVersion': {
      const getSystemVersion: motionmaster.MotionMasterMessage.Request.IGetSystemVersion = {};
      motionMasterClient.sendRequest({ getSystemVersion }, messageId);
      break;
    }
    case 'getDeviceInfo': {
      const getDeviceInfo: motionmaster.MotionMasterMessage.Request.IGetDeviceInfo = {};
      motionMasterClient.sendRequest({ getDeviceInfo }, messageId);
      break;
    }
    case 'getDeviceParameterInfo': {
      const getDeviceParameterInfo: motionmaster.MotionMasterMessage.Request.IGetDeviceParameterInfo = { deviceAddress };
      motionMasterClient.sendRequest({ getDeviceParameterInfo }, messageId);
      break;
    }
    case 'getDeviceParameterValues': {
      const parameters: motionmaster.MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[] = args.map(paramToIndexSubindex);
      const getDeviceParameterValues: motionmaster.MotionMasterMessage.Request.IGetDeviceParameterValues = { deviceAddress, parameters };
      motionMasterClient.sendRequest({ getDeviceParameterValues }, messageId);
      break;
    }
    case 'getMultiDeviceParameterValues': {
      throw new Error(`Request "${type}" is not yet implemented`);
    }
    case 'setDeviceParameterValues': {
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
      const getDeviceFileList: motionmaster.MotionMasterMessage.Request.IGetDeviceFileList = { deviceAddress };
      motionMasterClient.sendRequest({ getDeviceFileList }, messageId);
      break;
    }
    case 'getDeviceFile': {
      const name = args[0];
      const getDeviceFile: motionmaster.MotionMasterMessage.Request.IGetDeviceFile = { deviceAddress, name };
      motionMasterClient.sendRequest({ getDeviceFile }, messageId);
      break;
    }
    case 'setDeviceFile': {
      throw new Error(`Request "${type}" is not yet implemented`);
    }
    case 'deleteDeviceFile': {
      const name = args[0];
      const deleteDeviceFile: motionmaster.MotionMasterMessage.Request.IDeleteDeviceFile = { deviceAddress, name };
      motionMasterClient.sendRequest({ deleteDeviceFile }, messageId);
      break;
    }
    case 'resetDeviceFault': {
      const resetDeviceFault: motionmaster.MotionMasterMessage.Request.IResetDeviceFault = { deviceAddress };
      motionMasterClient.sendRequest({ resetDeviceFault }, messageId);
      break;
    }
    case 'stopDevice': {
      const stopDevice: motionmaster.MotionMasterMessage.Request.IStopDevice = { deviceAddress };
      motionMasterClient.sendRequest({ stopDevice }, messageId);
      break;
    }
    case 'startDeviceFirmwareInstallation': {
      throw new Error(`Request "${type}" is not yet implemented`);
    }
    case 'getDeviceLog': {
      const getDeviceLog: motionmaster.MotionMasterMessage.Request.IGetDeviceLog = { deviceAddress };
      motionMasterClient.sendRequest({ getDeviceLog }, messageId);
      break;
    }
    case 'startCoggingTorqueRecording': {
      throw new Error(`Request "${type}" is not yet implemented`);
    }
    case 'getCoggingTorqueData': {
      const getCoggingTorqueData: motionmaster.MotionMasterMessage.Request.IGetCoggingTorqueData = { deviceAddress };
      motionMasterClient.sendRequest({ getCoggingTorqueData }, messageId);
      break;
    }
    case 'startOffsetDetection': {
      const startOffsetDetection: motionmaster.MotionMasterMessage.Request.IStartOffsetDetection = { deviceAddress };
      motionMasterClient.sendRequest({ startOffsetDetection }, messageId);
      break;
    }
    case 'startPlantIdentification': {
      throw new Error(`Request "${type}" is not yet implemented`);
    }
    case 'computeAutoTuningGains': {
      throw new Error(`Request "${type}" is not yet implemented`);
    }
    case 'setMotionControllerParameters': {
      throw new Error(`Request "${type}" is not yet implemented`);
    }
    case 'enableMotionController': {
      throw new Error(`Request "${type}" is not yet implemented`);
    }
    case 'disableMotionController': {
      throw new Error(`Request "${type}" is not yet implemented`);
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
      break;
    }
    default: {
      throw new Error(`Request "${type}" doesn\'t exist`);
    }
  }
}

async function uploadAction(params: string[], cmd: Command) {
  const messageId = v4();

  printOnMessageReceived(messageId);
  exitOnMessageReceived(messageId);

  const deviceAddress = await getCommandDeviceAddressAsync(cmd);
  const parameters: motionmaster.MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[] = params.map(paramToIndexSubindex);
  const getDeviceParameterValues: motionmaster.MotionMasterMessage.Request.IGetDeviceParameterValues = { deviceAddress, parameters };

  motionMasterClient.sendRequest({ getDeviceParameterValues }, messageId);
}

async function downloadAction(paramValues: string[], cmd: Command) {
  const messageId = v4();

  printOnMessageReceived(messageId);
  exitOnMessageReceived(messageId);

  const deviceAddress = await getCommandDeviceAddressAsync(cmd);
  const deviceParameterInfo = await getDeviceParameterInfoAsync(deviceAddress);
  const parameterValues = paramValues.map((paramValue) => paramToIndexSubIndexValue(paramValue, deviceParameterInfo));
  const setDeviceParameterValues: motionmaster.MotionMasterMessage.Request.ISetDeviceParameterValues = { deviceAddress, parameterValues };

  motionMasterClient.sendRequest({ setDeviceParameterValues }, messageId);
}

async function monitorAction(topic: string, params: string[], cmd: Command) {
  const deviceAddress = await getCommandDeviceAddressAsync(cmd);
  const parameters = params.map(paramToIndexSubindex);
  const getDeviceParameterValues = { deviceAddress, parameters };
  const interval = cmd.interval;

  requestStartMonitoringDeviceParameterValues({ getDeviceParameterValues, interval, topic });
}

//
// helper functions
//

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

function exitOnMessageReceived(messageId: string, exit = true, due = 10000): void {
  motionMasterClient.filterMotionMasterMessageById$(messageId).pipe(
    first(),
    timeout(due),
  ).subscribe({
    next: () => {
      if (exit) {
        debug(`Exit on message received ${messageId}`);
        process.exit(0);
      }
    },
    error: (err) => {
      console.error(`${err.name}: Status message ${messageId} not received for more than ${due} ms.`);
      process.exit(-1);
    },
  });
}

function printOnMessageReceived(messageId: string) {
  motionMasterClient.filterMotionMasterMessageById$(messageId).pipe(first()).subscribe((msg) => {
    const timestamp = Date.now();
    const message = msg.toJSON();
    console.log(
      util.inspect({ timestamp, message }, inspectOptions),
    );
  });
}

function parseOptionValueAsInt(value: string): number {
  return parseInt(value, 10);
}

function addDeviceOptions(cmd: Command) {
  cmd.option('-d, --device-address <value>', 'device address (uint32) generated by Motion Master - takes precedence over device position', parseOptionValueAsInt);
  cmd.option('-p, --device-position <value>', 'used when device address is not specified', parseOptionValueAsInt, 0);
}
