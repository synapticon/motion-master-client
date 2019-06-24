#!/usr/bin/env node

import program from 'commander';
import * as rxjs from 'rxjs';
import * as util from 'util';
import { v4 } from 'uuid';
import * as zmq from 'zeromq';

// tslint:disable-next-line: no-var-requires
const debug = require('debug')('motion-master-client');

// tslint:disable-next-line: no-var-requires
const version = require('../package.json')['version'];

const inspectOptions: util.InspectOptions = {
  showHidden: false,
  depth: null,
  colors: true,
  maxArrayLength: null,
};

const pingSystemInterval = rxjs.interval(250);

import { motionmaster } from 'motion-master-proto';
import { filter, first, map } from 'rxjs/operators';
import { decodeMotionMasterMessage, MotionMasterClient } from './motion-master-client';

const ZMQ_SERVER_ENDPOINT = 'tcp://127.0.0.1:62524';
const ZMQ_MONITOR_ENDPOINT = 'tcp://127.0.0.1:62525';

const identity = v4();
debug(`Identity: ${identity}`);

const serverSocket = zmq.socket('dealer');
serverSocket.identity = identity;
serverSocket.connect(ZMQ_SERVER_ENDPOINT);
debug(`ZeroMQ DEALER socket is connected to endpoint: ${ZMQ_SERVER_ENDPOINT}`);

const notificationSocket = zmq.socket('sub').connect(ZMQ_MONITOR_ENDPOINT);
debug(`ZeroMQ SUB socket connected to endpoint: ${ZMQ_MONITOR_ENDPOINT}`);

notificationSocket.subscribe('');

process.on('uncaughtException', (err) => {
  console.error('Caught exception: ' + err.message);
  process.exit();
});

interface INotification {
  topic: string;
  message: motionmaster.IMotionMasterMessage;
}

const input = new rxjs.Subject<Buffer>();
const output = new rxjs.Subject<Buffer>();
const notification = new rxjs.Subject<INotification>();

notificationSocket.on('message', (topicBuffer: Buffer, messageBuffer: Buffer) => {
  const topic = topicBuffer.toString();
  const message = decodeMotionMasterMessage(messageBuffer);
  if (topic !== 'heartbeat') { // skip heartbeat
    notification.next({ topic, message });
  }
});

const motionMasterClient = new MotionMasterClient(input, output);

pingSystemInterval.subscribe(() => motionMasterClient.requestPingSystem());

serverSocket.on('message', (data) => {
  input.next(data);
});

output.subscribe({
  next: (buffer) => {
    const message = decodeMotionMasterMessage(buffer);
    // log outgoing messages
    if (message && message.request && message.request.pingSystem) { // skip ping messages
      // ignore
    } else {
      debug(
        util.inspect(decodeMotionMasterMessage(buffer), inspectOptions),
      );
    }
    serverSocket.send(buffer);
  },
});

motionMasterClient.status$.subscribe((status) => {
  console.log(
    util.inspect(status, inspectOptions),
  );
});

program
  .version(version)
  .option('-k, --no-exit', 'keep the program running while the monitoring is publishing messages')
  .option('-d, --device-address <value>', 'device address', parseInt)
  .option('-p, --device-position <value>', 'use the device position instead of the device address', parseInt);

program
  .command('request <type> [params...]')
  .description('send a request message to Motion Master')
  .action(async (type: string, params: string[]) => {
    const deviceAddress = await getProgramDeviceAddress();
    const messageId = v4();
    exitOnMessageReceived(messageId);
    switch (type) {
      case 'GetSystemVersion':
        motionMasterClient.requestGetSystemVersion(messageId);
        break;
      case 'GetDeviceInfo':
        motionMasterClient.requestGetDeviceInfo(messageId);
        break;
      case 'GetDeviceParameterInfo':
        motionMasterClient.requestGetDeviceParameterInfo(deviceAddress, messageId);
        break;
      case 'GetDeviceParameterValues':
        const parameters = params.map(paramToIndexAndSubindex);
        motionMasterClient.requestGetDeviceParameterValues(deviceAddress, parameters, messageId);
        break;
      default:
        throw new Error(`Request "${program.request}" doesn\'t exist`);
    }
  });

program
  .command('upload [params...]')
  .action(async (params: string[]) => {
    const deviceAddress = await getProgramDeviceAddress();
    const parameters = params.map(paramToIndexAndSubindex);
    const messageId = v4();
    exitOnMessageReceived(messageId);
    motionMasterClient.requestGetDeviceParameterValues(deviceAddress, parameters, messageId);
  });

program
  .command('download <param> <value>')
  .action(async (param: string, value: any) => {
    const deviceAddress = await getProgramDeviceAddress();
    const { index, subindex } = paramToIndexAndSubindex(param);
    const intValue = parseInt(value, 10);
    const messageId = v4();
    exitOnMessageReceived(messageId);
    motionMasterClient.requestSetDeviceParameterValues(deviceAddress, [
      {
        index,
        subindex,
        intValue,
      },
    ], messageId);
  });

program
  .command('monitor <interval> <topic> [params...]')
  .action(async (interval: number, topic: string, params: string[]) => {
    const deviceAddress = await getProgramDeviceAddress();
    notification.pipe(
      filter((notif) => notif.topic === topic),
    ).subscribe((notif) => {
      console.log(
        Date.now(),
        notif.topic,
        util.inspect(notif.message, inspectOptions),
      );
    });
    const parameters = params.map(paramToIndexAndSubindex);
    motionMasterClient.startMonitoringDeviceParameterValues(interval, topic, { parameters, deviceAddress });
  });

program.parse(process.argv);

function paramToIndexAndSubindex(param: string) {
  let index;
  let subindex;
  [index, subindex] = param.split(':');
  index = parseInt(index, 16);
  subindex = parseInt(subindex, 10);
  return { index, subindex };
}

function getDeviceAtPosition(position: number) {
  const messageId = v4();
  const observable = motionMasterClient.motionMasterMessage$.pipe(
    filter((message) => message.id === messageId),
    first(),
    map((message) => message.status),
    map((status) => {
      if (status) {
        const deviceInfo = status.deviceInfo;
        if (deviceInfo && deviceInfo.devices) {
          return deviceInfo.devices[position];
        }
      }
      return null;
    }),
  );
  motionMasterClient.requestGetDeviceInfo(messageId);
  return observable;
}

async function getProgramDeviceAddress() {
  let deviceAddress = program.deviceAddress;
  if (Number.isInteger(program.devicePosition)) {
    const device = await getDeviceAtPosition(program.devicePosition).toPromise();
    if (device) {
      deviceAddress = device.deviceAddress;
    }
  }
  return deviceAddress;
}

function exitOnMessageReceived(messageId: string, exit: boolean = true) {
  motionMasterClient.motionMasterMessage$.pipe(
    filter((message) => message.id === messageId),
    first(),
  ).subscribe(() => {
    if (exit) {
      process.exit();
    }
  });
}
