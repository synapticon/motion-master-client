# Motion Master Client

Library and CLI tool for interacting with [Motion Master](https://github.com/synapticon/motion-master).

## Install

    sudo npm --unsafe-perm=true install -g @synapticon/motion-master-client

## Command line usage

    Usage: motion-master-client [options] [command]

    Options:
      -V, --version                           output the version number
      -k, --no-exit                           keep the program running while the monitoring is publishing messages
      -d, --device-address <value>            device address
      -p, --device-position <value>           use the device position instead of the device address
      -h, --help                              output usage information

    Commands:
      request <type> [params...]              send a request message to Motion Master
      upload [params...]
      download <param> <value>
      monitor <interval> <topic> [params...]

## Library usage

    const input = new rxjs.Subject<Buffer>();
    const output = new rxjs.Subject<Buffer>();
    const motionMasterClient = new MotionMasterClient(input, output);
    const messageId = v4(); // '4e4d938e-1021-4b68-ad01-38c7ed2c5ee4'
    motionMasterClient.requestGetSystemVersion(messageId);
    motionMasterClient.systemVersion$.subscribe(console.log);

## Publish

    npm publish --access=public
