import { motionmaster } from 'motion-master-proto';
import { Observable, Subject } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { v4 } from 'uuid';

/**
 * Encode Request in MotionMasterMessage with the provided id.
 * @param id message id
 * @param request oneof request objects
 */
export function encodeRequest(id: string, request: motionmaster.MotionMasterMessage.IRequest) {
  const message = motionmaster.MotionMasterMessage.create({ id, request });
  return motionmaster.MotionMasterMessage.encode(message).finish();
}

/**
 * Decode MotionMasterMessage from typed array.
 * @param data
 */
export function decodeMotionMasterMessage(data: Uint8Array) {
  return motionmaster.MotionMasterMessage.decode(data);
}

export type RequestType = keyof motionmaster.MotionMasterMessage.IRequest;
export type StatusType = keyof motionmaster.MotionMasterMessage.IStatus;
export type SignalGeneratorType = keyof motionmaster.MotionMasterMessage.Request.ISetSignalGeneratorParameters;
export type ComputeAutoTuningGainsType = keyof motionmaster.MotionMasterMessage.Request.IComputeAutoTuningGains;

export type DeviceAddressType = number | null | undefined;

/**
 * Select observable of Status message based on status type argument.
 * @see https://www.typescriptlang.org/docs/handbook/advanced-types.html#conditional-types
 */
export type StatusTypeObservable<T extends StatusType> =
  T extends 'systemPong' ? Observable<motionmaster.MotionMasterMessage.Status.SystemPong> :
  T extends 'systemVersion' ? Observable<motionmaster.MotionMasterMessage.Status.SystemVersion> :
  T extends 'systemEvent' ? Observable<motionmaster.MotionMasterMessage.Status.SystemEvent> :
  T extends 'deviceInfo' ? Observable<motionmaster.MotionMasterMessage.Status.DeviceInfo> :
  T extends 'deviceParameterInfo' ? Observable<motionmaster.MotionMasterMessage.Status.DeviceParameterInfo> :
  T extends 'deviceParameterValues' ? Observable<motionmaster.MotionMasterMessage.Status.DeviceParameterValues> :
  T extends 'multiDeviceParameterValues' ? Observable<motionmaster.MotionMasterMessage.Status.MultiDeviceParameterValues> :
  T extends 'deviceFileList' ? Observable<motionmaster.MotionMasterMessage.Status.DeviceFileList> :
  T extends 'deviceFile' ? Observable<motionmaster.MotionMasterMessage.Status.DeviceFile> :
  T extends 'deviceEvent' ? Observable<motionmaster.MotionMasterMessage.Status.DeviceEvent> :
  T extends 'deviceFirmwareInstallation' ? Observable<motionmaster.MotionMasterMessage.Status.DeviceFirmwareInstallation> :
  T extends 'deviceLog' ? Observable<motionmaster.MotionMasterMessage.Status.DeviceLog> :
  T extends 'deviceFaultReset' ? Observable<motionmaster.MotionMasterMessage.Status.DeviceFaultReset> :
  T extends 'coggingTorqueRecording' ? Observable<motionmaster.MotionMasterMessage.Status.CoggingTorqueRecording> :
  T extends 'coggingTorqueData' ? Observable<motionmaster.MotionMasterMessage.Status.CoggingTorqueData> :
  T extends 'offsetDetection' ? Observable<motionmaster.MotionMasterMessage.Status.OffsetDetection> :
  T extends 'plantIdentification' ? Observable<motionmaster.MotionMasterMessage.Status.PlantIdentification> :
  T extends 'autoTuning' ? Observable<motionmaster.MotionMasterMessage.Status.AutoTuning> :
  T extends 'motionController' ? Observable<motionmaster.MotionMasterMessage.Status.MotionController> :
  T extends 'signalGenerator' ? Observable<motionmaster.MotionMasterMessage.Status.SignalGenerator> :
  T extends 'monitoringParameterValues' ? Observable<motionmaster.MotionMasterMessage.Status.MonitoringParameterValues> :
  Observable<any>;

/**
 * Class representing a Motion Master client.
 *
 * It's composed out of input, output and notification streams:
 * - Subscribe to input to receive encoded messages from Motion Master DEALER socket.
 * - Send encoded messages to output stream.
 * - Subscribe to notification stream to receive messages published on a certain topic on Motion Master SUB socket.
 *
 * This class comes with properties and helper methods for:
 * - Automatically decoding messages.
 * - Sending requests and returing typed observables of the matching status messages.
 * - Selecting notification messages with optional decoding.
 * - Selecting device at position.
 */
export class MotionMasterClient {

  motionMasterMessage$: Observable<motionmaster.MotionMasterMessage>;

  status$: Observable<motionmaster.MotionMasterMessage.Status>;

  systemEvent$: Observable<motionmaster.MotionMasterMessage.Status.SystemEvent>;
  deviceEvent$: Observable<motionmaster.MotionMasterMessage.Status.DeviceEvent>;

  constructor(
    public readonly input: Subject<Uint8Array>,
    public readonly output: Subject<Uint8Array>,
    public readonly notification: Subject<[Uint8Array, Uint8Array]>,
  ) {
    this.motionMasterMessage$ = this.input.pipe(
      map(decodeMotionMasterMessage),
    );

    this.status$ = this.motionMasterMessage$.pipe(
      map((message) => message.status),
    ) as Observable<motionmaster.MotionMasterMessage.Status>; // we expect Status to be ALWAYS defined on input message

    this.systemEvent$ = this.status$.pipe(
      map((status) => status['systemEvent']),
    ) as Observable<motionmaster.MotionMasterMessage.Status.SystemEvent>;

    this.deviceEvent$ = this.status$.pipe(
      map((status) => status['deviceEvent']),
    ) as Observable<motionmaster.MotionMasterMessage.Status.DeviceEvent>;
  }

  requestPingSystem(messageId?: string) {
    const pingSystem: motionmaster.MotionMasterMessage.Request.IPingSystem = {};
    const id = this.sendRequest({ pingSystem }, messageId);
    return this.selectMessageStatus(id, 'systemPong');
  }

  requestGetSystemVersion(messageId?: string) {
    const getSystemVersion: motionmaster.MotionMasterMessage.Request.IGetSystemVersion = {};
    const id = this.sendRequest({ getSystemVersion }, messageId);
    return this.selectMessageStatus(id, 'systemVersion');
  }

  requestGetDeviceInfo(messageId?: string) {
    const getDeviceInfo: motionmaster.MotionMasterMessage.Request.IGetDeviceInfo = {};
    const id = this.sendRequest({ getDeviceInfo }, messageId);
    return this.selectMessageStatus(id, 'deviceInfo');
  }

  requestGetDeviceParameterInfo(deviceAddress: DeviceAddressType, messageId?: string) {
    const getDeviceParameterInfo: motionmaster.MotionMasterMessage.Request.IGetDeviceParameterInfo = { deviceAddress };
    const id = this.sendRequest({ getDeviceParameterInfo }, messageId);
    return this.selectMessageStatus(id, 'deviceParameterInfo');
  }

  requestGetDeviceParameterValues(deviceAddress: DeviceAddressType, parameters: motionmaster.MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[], messageId?: string) {
    const getDeviceParameterValues: motionmaster.MotionMasterMessage.Request.IGetDeviceParameterValues = { deviceAddress, parameters };
    const id = this.sendRequest({ getDeviceParameterValues }, messageId);
    return this.selectMessageStatus(id, 'deviceParameterValues');
  }

  requestSetDeviceParameterValues(deviceAddress: DeviceAddressType, parameterValues: motionmaster.MotionMasterMessage.Request.SetDeviceParameterValues.IParameterValue[], messageId?: string) {
    const setDeviceParameterValues: motionmaster.MotionMasterMessage.Request.ISetDeviceParameterValues = { deviceAddress, parameterValues };
    const id = this.sendRequest({ setDeviceParameterValues }, messageId);
    return this.selectMessageStatus(id, 'deviceParameterValues');
  }

  requestGetDeviceFileList(deviceAddress: DeviceAddressType, messageId?: string) {
    const getDeviceFileList: motionmaster.MotionMasterMessage.Request.IGetDeviceFileList = { deviceAddress };
    const id = this.sendRequest({ getDeviceFileList }, messageId);
    return this.selectMessageStatus(id, 'deviceFileList');
  }

  requestGetDeviceFile(deviceAddress: DeviceAddressType, name: string, messageId?: string) {
    const getDeviceFile: motionmaster.MotionMasterMessage.Request.IGetDeviceFile = { deviceAddress, name };
    const id = this.sendRequest({ getDeviceFile }, messageId);
    return this.selectMessageStatus(id, 'deviceFile');
  }

  requestSetDeviceFile(deviceAddress: DeviceAddressType, name: string, content: Uint8Array, overwrite: boolean, messageId?: string) {
    const setDeviceFile: motionmaster.MotionMasterMessage.Request.ISetDeviceFile = { deviceAddress, name, content, overwrite };
    const id = this.sendRequest({ setDeviceFile }, messageId);
    return this.selectMessageStatus(id, 'deviceFile');
  }

  requestDeleteDeviceFile(deviceAddress: DeviceAddressType, name: string, messageId?: string) {
    const deleteDeviceFile: motionmaster.MotionMasterMessage.Request.IDeleteDeviceFile = { deviceAddress, name };
    const id = this.sendRequest({ deleteDeviceFile }, messageId);
    return this.selectMessageStatus(id, 'deviceFile');
  }

  requestResetDeviceFault(deviceAddress: DeviceAddressType, messageId?: string) {
    const resetDeviceFault: motionmaster.MotionMasterMessage.Request.IResetDeviceFault = { deviceAddress };
    const id = this.sendRequest({ resetDeviceFault }, messageId);
    return this.selectMessageStatus(id, 'deviceFaultReset');
  }

  requestStopDevice(deviceAddress: DeviceAddressType, messageId?: string) {
    const stopDevice: motionmaster.MotionMasterMessage.Request.IStopDevice = { deviceAddress };
    this.sendRequest({ stopDevice }, messageId);
  }

  requestStartDeviceFirmwareInstallation(deviceAddress: DeviceAddressType, firmwarePackageContent: Uint8Array, messageId?: string) {
    const startDeviceFirmwareInstallation: motionmaster.MotionMasterMessage.Request.IStartDeviceFirmwareInstallation = { deviceAddress, firmwarePackageContent };
    const id = this.sendRequest({ startDeviceFirmwareInstallation }, messageId);
    return this.selectMessageStatus(id, 'deviceFirmwareInstallation');
  }

  requestGetDeviceLog(deviceAddress: DeviceAddressType, messageId?: string) {
    const getDeviceLog: motionmaster.MotionMasterMessage.Request.IGetDeviceLog = { deviceAddress };
    const id = this.sendRequest({ getDeviceLog }, messageId);
    return this.selectMessageStatus(id, 'deviceLog');
  }

  requestStartCoggingTorqueRecording(deviceAddress: DeviceAddressType, skipAutoTuning: boolean, messageId?: string) {
    const startCoggingTorqueRecording: motionmaster.MotionMasterMessage.Request.IStartCoggingTorqueRecording = { deviceAddress, skipAutoTuning };
    const id = this.sendRequest({ startCoggingTorqueRecording }, messageId);
    return this.selectMessageStatus(id, 'coggingTorqueRecording');
  }

  requestGetCoggingTorqueData(deviceAddress: DeviceAddressType, messageId?: string) {
    const getCoggingTorqueData: motionmaster.MotionMasterMessage.Request.IGetCoggingTorqueData = { deviceAddress };
    const id = this.sendRequest({ getCoggingTorqueData }, messageId);
    return this.selectMessageStatus(id, 'coggingTorqueData');
  }

  requestStartOffsetDetection(deviceAddress: DeviceAddressType, messageId?: string) {
    const startOffsetDetection: motionmaster.MotionMasterMessage.Request.IStartOffsetDetection = { deviceAddress };
    const id = this.sendRequest({ startOffsetDetection }, messageId);
    return this.selectMessageStatus(id, 'offsetDetection');
  }

  requestStartPlantIdentification(deviceAddress: DeviceAddressType, durationSeconds: number, torqueAmplitude: number, startFrequency: number, endFrequency: number, cutoffFrequency: number, messageId: string) {
    const startPlantIdentification: motionmaster.MotionMasterMessage.Request.IStartPlantIdentification = {
      deviceAddress,
      durationSeconds,
      torqueAmplitude,
      startFrequency,
      endFrequency,
      cutoffFrequency,
    };
    const id = this.sendRequest({ startPlantIdentification }, messageId);
    return this.selectMessageStatus(id, 'plantIdentification');
  }

  requestSetMotionControllerParameters(deviceAddress: DeviceAddressType, target: number, messageId?: string) {
    const setMotionControllerParameters: motionmaster.MotionMasterMessage.Request.ISetMotionControllerParameters = {
      deviceAddress,
      target,
    };
    const id = this.sendRequest({ setMotionControllerParameters }, messageId);
    return this.selectMessageStatus(id, 'motionController');
  }

  requestEnableMotionController(deviceAddress: DeviceAddressType, controllerType: motionmaster.MotionMasterMessage.Request.EnableMotionController.ControllerType, filterValue: boolean, messageId?: string) {
    const enableMotionController: motionmaster.MotionMasterMessage.Request.IEnableMotionController = {
      deviceAddress,
      controllerType,
      filter: filterValue,
    };
    const id = this.sendRequest({ enableMotionController }, messageId);
    return this.selectMessageStatus(id, 'motionController');
  }

  requestDisableMotionController(deviceAddress: DeviceAddressType, messageId?: string) {
    const disableMotionController: motionmaster.MotionMasterMessage.Request.IDisableMotionController = { deviceAddress };
    const id = this.sendRequest({ disableMotionController }, messageId);
    return this.selectMessageStatus(id, 'motionController');
  }

  requestStartSignalGenerator(deviceAddress: DeviceAddressType, messageId?: string) {
    const startSignalGenerator: motionmaster.MotionMasterMessage.Request.IStartSignalGenerator = { deviceAddress };
    const id = this.sendRequest({ startSignalGenerator }, messageId);
    return this.selectMessageStatus(id, 'signalGenerator');
  }

  requestStopSignalGenerator(deviceAddress: DeviceAddressType, messageId?: string) {
    const stopSignalGenerator: motionmaster.MotionMasterMessage.Request.IStopSignalGenerator = { deviceAddress };
    const id = this.sendRequest({ stopSignalGenerator }, messageId);
    return this.selectMessageStatus(id, 'signalGenerator');
  }

  requestStartMonitoringDeviceParameterValues(deviceAddress: DeviceAddressType, parameters: motionmaster.MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[], interval: number, topic: string, messageId?: string) {
    const getDeviceParameterValues = { deviceAddress, parameters };
    const startMonitoringDeviceParameterValues = { getDeviceParameterValues, interval, topic };
    const id = this.sendRequest({ startMonitoringDeviceParameterValues }, messageId);
    return this.selectMessageStatus(id, 'monitoringParameterValues');
  }

  requestStopMonitoringDeviceParameterValues(startMonitoringRequestId: string, messageId?: string) {
    const stopMonitoringDeviceParameterValues: motionmaster.MotionMasterMessage.Request.IStopMonitoringDeviceParameterValues = { startMonitoringRequestId };
    const id = this.sendRequest({ stopMonitoringDeviceParameterValues }, messageId);
    return this.selectMessageStatus(id, 'monitoringParameterValues');
  }

  /**
   * Select device at position in EtherCAT chain. This function makes an initial request to fetch a list of devices.
   * @param position device position in EtherCAT chain
   * @returns an observable of device messages
   */
  selectDeviceAtPosition(position: number) {
    const messageId = v4();
    const observable = this.motionMasterMessage$.pipe(
      filter((message) => message.id === messageId),
      first(),
      map((message) => message.status),
      map((status) => {
        if (status) {
          const deviceInfo = status.deviceInfo;
          if (deviceInfo && deviceInfo.devices) {
            return deviceInfo.devices.find((device) => device.position === position);
          }
        }
        return null;
      }),
    );
    const getDeviceInfo = {};
    this.sendRequest({ getDeviceInfo }, messageId);
    return observable;
  }

  /**
   * Select incoming messages by id.
   *
   * This function filters messages by id as there can be multiple messages coming in for a single request,
   * e.g. startOffsetDetection → started → progress → done. Ensure that you unsubscribe or use `takeWhile` operator.
   *
   * @param messageId
   * @returns an observable of motion master messages
   */
  selectMessage(messageId: string) {
    return this.motionMasterMessage$.pipe(
      filter((message) => message.id === messageId),
    );
  }

  /**
   * Select incoming messages by id and get their status response.
   *
   * This function filters messages by id as there can be multiple messages coming in for a single request,
   * e.g. startOffsetDetection → started → progress → done. Ensure that you unsubscribe or use `takeWhile` operator.
   *
   * @param messageId
   * @param type of status message received as a response
   */
  selectMessageStatus<T extends StatusType>(messageId: string, type: T): StatusTypeObservable<T> {
    const message$ = this.motionMasterMessage$.pipe(
      filter((message) => message.id === messageId),
    ) as Observable<motionmaster.MotionMasterMessage>; // we expect Status message with the initial id to always come back as a response

    const status$ = message$.pipe(
      map((message) => message.status),
    ) as Observable<motionmaster.MotionMasterMessage.Status>; // we expect Status to be ALWAYS defined on input message

    return status$.pipe(
      map((status) => status[type]),
    ) as any;
  }

  /**
   * Select notifications by topic and optionally decode the content.
   * @param topic to filter incoming notifications by
   * @param decode to MotionMasterMessage or leave the content as Uint8Array
   * @returns an observable of topic and depending on the value of decode argument: MotionMasterMessage when true, Uint8Array otherwise
   */
  selectNotification<T extends boolean>(topic: string | null | undefined, decode: T):
    T extends true ? Observable<{ topic: string, message: motionmaster.MotionMasterMessage }> : Observable<{ topic: string, message: Uint8Array }> {
    return this.notification.pipe(
      filter((notif) => notif[0].toString() === topic),
      map((notif) => ({ topic, message: decode ? decodeMotionMasterMessage(notif[1]) : notif[1] })),
    ) as any;
  }

  /**
   * Select status messages by type.
   * @param type status type, e.g. 'systemVersion', 'offsetDetection'
   * @returns an observable of status messages depending on the passed type
   */
  selectStatus<T extends StatusType>(type: T): StatusTypeObservable<T> {
    return this.status$.pipe(
      filter((status) => status.type === type),
      map((status) => status[type]),
    ) as any;
  }

  /**
   * Send encoded Request message to output.
   * @param request proto message
   * @param [messageId] identifies request, if no messageId is provided one is generated with uuid v4 and returned
   * @returns passed or generated messageId
   */
  sendRequest(request: motionmaster.MotionMasterMessage.IRequest, messageId?: string) {
    if (!messageId) {
      messageId = v4();
    }
    const message = encodeRequest(messageId, request);
    this.output.next(message);
    return messageId;
  }

}
