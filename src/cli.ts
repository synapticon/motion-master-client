// tslint:disable-next-line: no-var-requires
const debug = require('debug')('motion-master-client');
import program from 'commander';
import { Subject } from 'rxjs';
import { v4 } from 'uuid';
import * as zmq from 'zeromq';

import { MotionMasterClient } from './motion-master-client';

const ZMQ_SERVER_ENDPOINT = 'tcp://127.0.0.1:62524';

const identity = v4();
debug(`Identity: ${identity}`);

const socket = zmq.socket('dealer');
socket.identity = identity;
socket.connect(ZMQ_SERVER_ENDPOINT);
debug(`ZeroMQ DEALER socket is connected to endpoint: ${ZMQ_SERVER_ENDPOINT}`);

const input = new Subject<Buffer>();
const output = new Subject<Buffer>();

socket.on('message', (data) => {
  input.next(data);
});

output.subscribe({
  next: (buffer) => socket.send(buffer),
});

const motionMasterClient = new MotionMasterClient(input, output);

program
  .option('-r, --request [type]', 'Request')
  .parse(process.argv);

motionMasterClient.status$.subscribe((status) => {
  console.log(status);
  socket.close();
});

if (program.request) {
  switch (program.request) {
    case 'getSystemVersion':
      motionMasterClient.requestGetSystemVersion();
  }
}
