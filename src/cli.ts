#!/usr/bin/env node

import program, { Command } from 'commander';
import { motionmaster } from 'motion-master-proto';
import * as rxjs from 'rxjs';
import { filter, first, timeout } from 'rxjs/operators';
import * as util from 'util';
import { v4 } from 'uuid';
import * as zmq from 'zeromq';
import { decodeMotionMasterMessage, MotionMasterClient } from './motion-master-client';

// tslint:disable: no-var-requires
const debug = require('debug')('motion-master-client');
const version = require('../package.json')['version'];
// tslint:enable-next-line: no-var-requires

const inspectOptions: util.InspectOptions = {
  showHidden: false,
  depth: null,
  colors: true,
  maxArrayLength: null,
};

const cliOptions = {
  pingSystemInterval: 200,
  motionMasterHeartbeatTimeoutDue: 1000,
  serverEndpoint: 'tcp://127.0.0.1:62524',
  notificationEndpoint: 'tcp://127.0.0.1:62525',
};

const pingSystemInterval = rxjs.interval(cliOptions.pingSystemInterval);

const identity = v4();
debug(`Identity: ${identity}`);

const serverSocket = zmq.socket('dealer');
serverSocket.identity = identity;
serverSocket.connect(cliOptions.serverEndpoint);
debug(`ZeroMQ DEALER socket is connected to server endpoint: ${cliOptions.serverEndpoint}`);

const notificationSocket = zmq.socket('sub').connect(cliOptions.notificationEndpoint);
debug(`ZeroMQ SUB socket connected to notification endpoint: ${cliOptions.notificationEndpoint}`);

notificationSocket.subscribe('');

process.on('uncaughtException', (err) => {
  console.error('Caught exception: ' + err);
  process.exit();
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection reason: ', reason);
  process.exit();
});

const input = new rxjs.Subject<Buffer>();
const output = new rxjs.Subject<Buffer>();
const notification = new rxjs.Subject<[Buffer, Buffer]>();

// feed notification buffer data coming from Motion Master to MotionMasterClient
notificationSocket.on('message', (topic: Buffer, message: Buffer) => {
  notification.next([topic, message]);
});

const motionMasterClient = new MotionMasterClient(input, output, notification);

pingSystemInterval.subscribe(() => motionMasterClient.sendRequest({ pingSystem: {} }));

motionMasterClient.filterNotificationByTopic$('heartbeat').pipe(
  timeout(cliOptions.motionMasterHeartbeatTimeoutDue),
).subscribe({
  error: (err) => {
    console.error(`${err.name}: Heartbeat message not received for more than ${cliOptions.motionMasterHeartbeatTimeoutDue} ms. Check if Motion Master process is running.`);
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

// log all status messages coming from Motion Master
motionMasterClient.motionMasterMessage$.subscribe((msg) => {
  const timestamp = Date.now();
  const message = msg.toJSON();
  console.log(
    util.inspect({ timestamp, message }, inspectOptions),
  );
});

program
  .version(version);

// request
const requestCommand = program.command('request <type> [args...]');
addDeviceOptions(requestCommand);
requestCommand
  .action(async (type: string, args: string[], cmd: Command) => {
    const deviceAddress = await getCommandDeviceAddress(cmd);
    const messageId = v4();
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
        const parameterValues = args.map(paramToIndexSubIndexValue);
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
  });

// upload
const uploadCommand = program.command('upload [params...]');
addDeviceOptions(uploadCommand);
uploadCommand
  .action(async (params: string[], cmd: Command) => {
    const messageId = v4();
    exitOnMessageReceived(messageId);

    const deviceAddress = await getCommandDeviceAddress(cmd);
    const parameters: motionmaster.MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[] = params.map(paramToIndexSubindex);
    const getDeviceParameterValues: motionmaster.MotionMasterMessage.Request.IGetDeviceParameterValues = { deviceAddress, parameters };

    motionMasterClient.sendRequest({ getDeviceParameterValues }, messageId);
  });

// download
const downloadCommand = program.command('download [paramValues...]');
addDeviceOptions(downloadCommand);
downloadCommand
  .option('-d, --device-address <value>', 'device address (uint32) generated by Motion Master - takes precedence over device position', parseOptionValueAsInt)
  .option('-p, --device-position <value>', 'used when device address is not specified', parseOptionValueAsInt, 0)
  .action(async (paramValues: string[], cmd: Command) => {
    const messageId = v4();
    exitOnMessageReceived(messageId);

    const deviceAddress = await getCommandDeviceAddress(cmd);
    const parameterValues = paramValues.map(paramToIndexSubIndexValue);
    const setDeviceParameterValues: motionmaster.MotionMasterMessage.Request.ISetDeviceParameterValues = { deviceAddress, parameterValues };

    motionMasterClient.sendRequest({ setDeviceParameterValues }, messageId);
  });

// monitor
const monitorCommmand = program.command('monitor <topic> [params...]');
addDeviceOptions(monitorCommmand);
monitorCommmand
  .option('-i, --interval <value>', 'sending interval in microseconds', parseOptionValueAsInt, 1 * 1000 * 1000)
  .action(async (topic: string, params: string[], cmd: Command) => {
    const deviceAddress = await getCommandDeviceAddress(cmd);
    const parameters = params.map(paramToIndexSubindex);
    const getDeviceParameterValues = { deviceAddress, parameters };
    const interval = cmd.interval;

    requestStartMonitoringDeviceParameterValues({ getDeviceParameterValues, interval, topic });
  });

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

// parse command line arguments
program.parse(process.argv);

//
// helper functions
//

function paramToIndexSubindex(paramValue: string) {
  const [indexStr, subindexStr] = paramValue.split(':');
  const index = parseInt(indexStr, 16);
  const subindex = parseInt(subindexStr, 10);
  return { index, subindex };
}

function paramToIndexSubIndexValue(paramValue: string) {
  const [param, valueStr] = paramValue.split('=');
  const { index, subindex } = paramToIndexSubindex(param);
  const value = parseFloat(valueStr);
  const intValue = value;
  const uintValue = value;
  const floatValue = value;
  return { index, subindex, intValue, uintValue, floatValue };
}

async function getCommandDeviceAddress(cmd: Command): Promise<number | null | undefined> {
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
  motionMasterClient.motionMasterMessage$.pipe(
    filter((message) => message.id === messageId),
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

function parseOptionValueAsInt(value: string): number {
  return parseInt(value, 10);
}

function addDeviceOptions(cmd: Command) {
  cmd.option('-d, --device-address <value>', 'device address (uint32) generated by Motion Master - takes precedence over device position', parseOptionValueAsInt);
  cmd.option('-p, --device-position <value>', 'used when device address is not specified', parseOptionValueAsInt, 0);
}
