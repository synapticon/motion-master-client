// tslint:disable-next-line: no-var-requires
const debug = require('debug')('motion-master-client');
import program from 'commander';
import { Subject } from 'rxjs';
import * as util from 'util';
import { v4 } from 'uuid';
import * as zmq from 'zeromq';

import { MotionMasterClient, filterByDeviceAddress } from './motion-master-client';

const ZMQ_SERVER_ENDPOINT = 'tcp://127.0.0.1:62524';

const identity = v4();
debug(`Identity: ${identity}`);

const socket = zmq.socket('dealer');
socket.identity = identity;
socket.connect(ZMQ_SERVER_ENDPOINT);
debug(`ZeroMQ DEALER socket is connected to endpoint: ${ZMQ_SERVER_ENDPOINT}`);

process.on('uncaughtException', (err) => {
  console.error('Caught exception: ' + err.message);
  socket.close();
});

const input = new Subject<Buffer>();
const output = new Subject<Buffer>();

const motionMasterClient = new MotionMasterClient(input, output);

socket.on('message', (data) => {
  input.next(data);
});

output.subscribe({
  next: (buffer) => {
    debug(motionMasterClient.decodeMotionMasterMessage(buffer));
    socket.send(buffer);
  },
});

program
  .option('-r, --request [type]', 'Request type matches the Request message name. See the Motion Master proto file.')
  .option('-c, --close', 'Close the connection after a Status message is received.')
  .option('-d, --device-address [value]', 'Device Address')
  .parse(process.argv);

motionMasterClient.status$.subscribe((status) => {
  console.log(util.inspect(status, { showHidden: false, depth: null, colors: true, maxArrayLength: null }));
  if (program.close) {
    socket.close();
  }
});

if (program.request) {
  switch (program.request) {
    case 'GetSystemVersion':
      motionMasterClient.requestGetSystemVersion();
      break;
    case 'GetDeviceInfo':
      motionMasterClient.requestGetDeviceInfo();
      break;
    case 'GetDeviceParameterInfo':
      motionMasterClient.requestGetDeviceParameterInfo(program.deviceAddress);
      break;
    case 'GetDeviceParameterValues':
      motionMasterClient.requestGetDeviceParameterValues(program.deviceAddress);
      break;
    default:
      throw new Error(`Request "${program.request}" doesn\'t exist`);
  }
}
