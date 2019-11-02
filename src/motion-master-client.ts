import { motionmaster } from '@synapticon/motion-master-proto';
import { Observable, Subject } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { v4 } from 'uuid';

export import MotionMasterMessage = motionmaster.MotionMasterMessage;
export import IMotionMasterMessage = motionmaster.IMotionMasterMessage;

/**
 * Encode MotionMasterMessage to typed array.
 * @param message an instance of MotionMasterMessage.
 * @returns Uint8Array
 */
export function encodeMotionMasterMessage(message: IMotionMasterMessage) {
  return MotionMasterMessage.encode(message).finish();
}

/**
 * Decode MotionMasterMessage from typed array.
 * @param data Uint8Array to decode
 * @returns MotionMasterMessage
 */
export function decodeMotionMasterMessage(data: Uint8Array) {
  return MotionMasterMessage.decode(data);
}

export type RequestType = keyof MotionMasterMessage.IRequest;
export type StatusType = keyof MotionMasterMessage.IStatus;
export type SignalGeneratorType = keyof MotionMasterMessage.Request.ISetSignalGeneratorParameters;
export type ComputeAutoTuningGainsType = keyof MotionMasterMessage.Request.IComputeAutoTuningGains;

export type DeviceAddressType = number | null | undefined;

/**
 * Select observable of Status message based on status type argument.
 * @see https://www.typescriptlang.org/docs/handbook/advanced-types.html#conditional-types
 */
export type StatusTypeObservable<T extends StatusType> =
  T extends 'systemPong' ? Observable<MotionMasterMessage.Status.ISystemPong> :
  T extends 'systemVersion' ? Observable<MotionMasterMessage.Status.ISystemVersion> :
  T extends 'systemEvent' ? Observable<MotionMasterMessage.Status.ISystemEvent> :
  T extends 'deviceInfo' ? Observable<MotionMasterMessage.Status.IDeviceInfo> :
  T extends 'deviceParameterInfo' ? Observable<MotionMasterMessage.Status.IDeviceParameterInfo> :
  T extends 'deviceParameterValues' ? Observable<MotionMasterMessage.Status.IDeviceParameterValues> :
  T extends 'multiDeviceParameterValues' ? Observable<MotionMasterMessage.Status.IMultiDeviceParameterValues> :
  T extends 'deviceFileList' ? Observable<MotionMasterMessage.Status.IDeviceFileList> :
  T extends 'deviceFile' ? Observable<MotionMasterMessage.Status.IDeviceFile> :
  T extends 'deviceEvent' ? Observable<MotionMasterMessage.Status.IDeviceEvent> :
  T extends 'deviceFirmwareInstallation' ? Observable<MotionMasterMessage.Status.IDeviceFirmwareInstallation> :
  T extends 'deviceLog' ? Observable<MotionMasterMessage.Status.IDeviceLog> :
  T extends 'deviceFaultReset' ? Observable<MotionMasterMessage.Status.IDeviceFaultReset> :
  T extends 'coggingTorqueRecording' ? Observable<MotionMasterMessage.Status.ICoggingTorqueRecording> :
  T extends 'coggingTorqueData' ? Observable<MotionMasterMessage.Status.ICoggingTorqueData> :
  T extends 'offsetDetection' ? Observable<MotionMasterMessage.Status.IOffsetDetection> :
  T extends 'plantIdentification' ? Observable<MotionMasterMessage.Status.IPlantIdentification> :
  T extends 'autoTuning' ? Observable<MotionMasterMessage.Status.IAutoTuning> :
  T extends 'motionController' ? Observable<MotionMasterMessage.Status.IMotionController> :
  T extends 'signalGenerator' ? Observable<MotionMasterMessage.Status.ISignalGenerator> :
  T extends 'monitoringParameterValues' ? Observable<MotionMasterMessage.Status.IMonitoringParameterValues> :
  T extends 'deviceStop' ? Observable<MotionMasterMessage.Status.IDeviceStop> :
  Observable<any>;

/**
 * Class representing a Motion Master client.
 *
 * It's composed out of input, output and notification streams:
 * - Subscribe to input to receive messages from Motion Master DEALER socket.
 * - Send messages to output stream.
 * - Subscribe to notification stream to receive messages published on a certain topic on Motion Master SUB socket.
 *
 * This class comes with properties and helper methods for:
 * - Automatically decoding messages.
 * - Sending requests and returing typed observables of the matching status messages.
 * - Selecting notification messages with optional decoding.
 * - Selecting device at position.
 */
export class MotionMasterClient {

  motionMasterMessage$: Observable<MotionMasterMessage>;

  status$: Observable<MotionMasterMessage.IStatus | null | undefined>;

  systemEvent$: Observable<MotionMasterMessage.Status.ISystemEvent | null | undefined>;
  deviceEvent$: Observable<MotionMasterMessage.Status.IDeviceEvent | null | undefined>;

  constructor(
    public readonly input: Subject<MotionMasterMessage>,
    public readonly output: Subject<MotionMasterMessage>,
    public readonly notification: Subject<[string, MotionMasterMessage]>,
  ) {
    this.motionMasterMessage$ = this.input;
    this.status$ = this.motionMasterMessage$.pipe(map((message) => message.status));
    this.systemEvent$ = this.status$.pipe(map((status) => status ? status['systemEvent'] : undefined));
    this.deviceEvent$ = this.status$.pipe(map((status) => status ? status['deviceEvent'] : undefined));
  }

  requestPingSystem(messageId?: string) {
    const pingSystem = MotionMasterMessage.Request.PingSystem.create();
    const id = this.sendRequest({ pingSystem }, messageId);
    return this.selectMessageStatus('systemPong', id);
  }

  requestGetSystemVersion(messageId?: string) {
    const getSystemVersion = MotionMasterMessage.Request.GetSystemVersion.create();
    const id = this.sendRequest({ getSystemVersion }, messageId);
    return this.selectMessageStatus('systemVersion', id);
  }

  requestGetDeviceInfo(messageId?: string) {
    const getDeviceInfo = MotionMasterMessage.Request.GetDeviceInfo.create();
    const id = this.sendRequest({ getDeviceInfo }, messageId);
    return this.selectMessageStatus('deviceInfo', id);
  }

  requestGetDeviceParameterInfo(deviceAddress: DeviceAddressType, messageId?: string) {
    const getDeviceParameterInfo = MotionMasterMessage.Request.GetDeviceParameterInfo.create({ deviceAddress });
    const id = this.sendRequest({ getDeviceParameterInfo }, messageId);
    return this.selectMessageStatus('deviceParameterInfo', id);
  }

  requestGetDeviceParameterValues(deviceAddress: DeviceAddressType, parameters: MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[], messageId?: string) {
    const getDeviceParameterValues = MotionMasterMessage.Request.GetDeviceParameterValues.create({ deviceAddress, parameters });
    const id = this.sendRequest({ getDeviceParameterValues }, messageId);
    return this.selectMessageStatus('deviceParameterValues', id);
  }

  requestSetDeviceParameterValues(deviceAddress: DeviceAddressType, parameterValues: MotionMasterMessage.Request.SetDeviceParameterValues.IParameterValue[], messageId?: string) {
    const setDeviceParameterValues = MotionMasterMessage.Request.SetDeviceParameterValues.create({ deviceAddress, parameterValues });
    const id = this.sendRequest({ setDeviceParameterValues }, messageId);
    return this.selectMessageStatus('deviceParameterValues', id);
  }

  requestGetDeviceFileList(deviceAddress: DeviceAddressType, messageId?: string) {
    const getDeviceFileList = MotionMasterMessage.Request.GetDeviceFileList.create({ deviceAddress });
    const id = this.sendRequest({ getDeviceFileList }, messageId);
    return this.selectMessageStatus('deviceFileList', id);
  }

  requestGetDeviceFile(deviceAddress: DeviceAddressType, name: string, messageId?: string) {
    const getDeviceFile = MotionMasterMessage.Request.GetDeviceFile.create({ deviceAddress, name });
    const id = this.sendRequest({ getDeviceFile }, messageId);
    return this.selectMessageStatus('deviceFile', id);
  }

  requestSetDeviceFile(deviceAddress: DeviceAddressType, name: string, content: Uint8Array, overwrite: boolean, messageId?: string) {
    const setDeviceFile = MotionMasterMessage.Request.SetDeviceFile.create({ deviceAddress, name, content, overwrite });
    const id = this.sendRequest({ setDeviceFile }, messageId);
    return this.selectMessageStatus('deviceFile', id);
  }

  requestDeleteDeviceFile(deviceAddress: DeviceAddressType, name: string, messageId?: string) {
    const deleteDeviceFile = MotionMasterMessage.Request.DeleteDeviceFile.create({ deviceAddress, name });
    const id = this.sendRequest({ deleteDeviceFile }, messageId);
    return this.selectMessageStatus('deviceFile', id);
  }

  requestResetDeviceFault(deviceAddress: DeviceAddressType, messageId?: string) {
    const resetDeviceFault = MotionMasterMessage.Request.ResetDeviceFault.create({ deviceAddress });
    const id = this.sendRequest({ resetDeviceFault }, messageId);
    return this.selectMessageStatus('deviceFaultReset', id);
  }

  requestStopDevice(deviceAddress: DeviceAddressType, messageId?: string) {
    const stopDevice = MotionMasterMessage.Request.StopDevice.create({ deviceAddress });
    const id = this.sendRequest({ stopDevice }, messageId);
    return id;
  }

  requestStartDeviceFirmwareInstallation(deviceAddress: DeviceAddressType, firmwarePackageContent: Uint8Array, messageId?: string) {
    const startDeviceFirmwareInstallation = MotionMasterMessage.Request.StartDeviceFirmwareInstallation.create({ deviceAddress, firmwarePackageContent });
    const id = this.sendRequest({ startDeviceFirmwareInstallation }, messageId);
    return this.selectMessageStatus('deviceFirmwareInstallation', id);
  }

  requestGetDeviceLog(deviceAddress: DeviceAddressType, messageId?: string) {
    const getDeviceLog = MotionMasterMessage.Request.GetDeviceLog.create({ deviceAddress });
    const id = this.sendRequest({ getDeviceLog }, messageId);
    return this.selectMessageStatus('deviceLog', id);
  }

  requestStartCoggingTorqueRecording(deviceAddress: DeviceAddressType, skipAutoTuning: boolean, messageId?: string) {
    const startCoggingTorqueRecording = MotionMasterMessage.Request.StartCoggingTorqueRecording.create({ deviceAddress, skipAutoTuning });
    const id = this.sendRequest({ startCoggingTorqueRecording }, messageId);
    return this.selectMessageStatus('coggingTorqueRecording', id);
  }

  requestGetCoggingTorqueData(deviceAddress: DeviceAddressType, messageId?: string) {
    const getCoggingTorqueData = MotionMasterMessage.Request.GetCoggingTorqueData.create({ deviceAddress });
    const id = this.sendRequest({ getCoggingTorqueData }, messageId);
    return this.selectMessageStatus('coggingTorqueData', id);
  }

  requestStartOffsetDetection(deviceAddress: DeviceAddressType, messageId?: string) {
    const startOffsetDetection = MotionMasterMessage.Request.StartOffsetDetection.create({ deviceAddress });
    const id = this.sendRequest({ startOffsetDetection }, messageId);
    return this.selectMessageStatus('offsetDetection', id);
  }

  requestStartPlantIdentification(deviceAddress: DeviceAddressType, durationSeconds: number, torqueAmplitude: number, startFrequency: number, endFrequency: number, cutoffFrequency: number, messageId: string) {
    const startPlantIdentification = MotionMasterMessage.Request.StartPlantIdentification.create({
      deviceAddress,
      durationSeconds,
      torqueAmplitude,
      startFrequency,
      endFrequency,
      cutoffFrequency,
    });
    const id = this.sendRequest({ startPlantIdentification }, messageId);
    return this.selectMessageStatus('plantIdentification', id);
  }

  requestComputePositionAutoTuningGains(
    deviceAddress: number,
    positionParameters: MotionMasterMessage.Request.ComputeAutoTuningGains.IPositionParameters,
    messageId?: string,
  ) {
    const computeAutoTuningGains = MotionMasterMessage.Request.ComputeAutoTuningGains.create({ deviceAddress, positionParameters });
    const id = this.sendRequest({ computeAutoTuningGains }, messageId);
    return this.selectMessageStatus('autoTuning', id);
  }

  requestComputeVelocityAutoTuningGains(
    deviceAddress: number,
    velocityParameters: MotionMasterMessage.Request.ComputeAutoTuningGains.IVelocityParameters,
    messageId?: string,
  ) {
    const computeAutoTuningGains = MotionMasterMessage.Request.ComputeAutoTuningGains.create({ deviceAddress, velocityParameters });
    const id = this.sendRequest({ computeAutoTuningGains }, messageId);
    return this.selectMessageStatus('autoTuning', id);
  }

  requestSetMotionControllerParameters(deviceAddress: DeviceAddressType, target: number, messageId?: string) {
    const setMotionControllerParameters = MotionMasterMessage.Request.SetMotionControllerParameters.create({
      deviceAddress,
      target,
    });
    const id = this.sendRequest({ setMotionControllerParameters }, messageId);
    return id;
  }

  requestEnableMotionController(deviceAddress: DeviceAddressType, controllerType: MotionMasterMessage.Request.EnableMotionController.ControllerType, filterValue: boolean, messageId?: string) {
    const enableMotionController = MotionMasterMessage.Request.EnableMotionController.create({
      deviceAddress,
      controllerType,
      filter: filterValue,
    });
    const id = this.sendRequest({ enableMotionController }, messageId);
    return this.selectMessageStatus('motionController', id);
  }

  requestDisableMotionController(deviceAddress: DeviceAddressType, messageId?: string) {
    const disableMotionController = MotionMasterMessage.Request.DisableMotionController.create({ deviceAddress });
    const id = this.sendRequest({ disableMotionController }, messageId);
    return this.selectMessageStatus('motionController', id);
  }

  requestSetSignalGeneratorParameters(
    setSignalGeneratorParameters: MotionMasterMessage.Request.ISetSignalGeneratorParameters,
    messageId?: string,
  ) {
    const id = this.sendRequest({ setSignalGeneratorParameters }, messageId);
    return id;
  }

  requestStartSignalGenerator(deviceAddress: DeviceAddressType, messageId?: string) {
    const startSignalGenerator = MotionMasterMessage.Request.StartSignalGenerator.create({ deviceAddress });
    const id = this.sendRequest({ startSignalGenerator }, messageId);
    return this.selectMessageStatus('signalGenerator', id);
  }

  requestStopSignalGenerator(deviceAddress: DeviceAddressType, messageId?: string) {
    const stopSignalGenerator = MotionMasterMessage.Request.StopSignalGenerator.create({ deviceAddress });
    const id = this.sendRequest({ stopSignalGenerator }, messageId);
    return this.selectMessageStatus('signalGenerator', id);
  }

  requestStartMonitoringDeviceParameterValues(deviceAddress: DeviceAddressType, parameters: MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[], interval: number, topic: string, messageId?: string) {
    const getDeviceParameterValues = { deviceAddress, parameters };
    const startMonitoringDeviceParameterValues = MotionMasterMessage.Request.StartMonitoringDeviceParameterValues.create({ getDeviceParameterValues, interval, topic });
    const id = this.sendRequest({ startMonitoringDeviceParameterValues }, messageId);
    return this.selectMessageStatus('monitoringParameterValues', id);
  }

  requestStopMonitoringDeviceParameterValues(startMonitoringRequestId: string, messageId?: string) {
    const stopMonitoringDeviceParameterValues = MotionMasterMessage.Request.StopMonitoringDeviceParameterValues.create({ startMonitoringRequestId });
    const id = this.sendRequest({ stopMonitoringDeviceParameterValues }, messageId);
    return this.selectMessageStatus('monitoringParameterValues', id);
  }

  /**
   * Select device at position in EtherCAT chain. This function makes an initial request to fetch a list of devices.
   * @param position device position in EtherCAT chain
   * @returns an observable of device messages
   */
  selectDeviceAtPosition(position: number) {
    return this.requestGetDeviceInfo().pipe(
      first(),
      map((deviceInfo) => {
        if (deviceInfo.devices) {
          return deviceInfo.devices.find((device) => device.position === position);
        } else {
          return null;
        }
      }),
    );
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
   * Select incoming messages by id (optionally) and get their status response.
   *
   * This function filters messages by id as there can be multiple messages coming in for a single request,
   * e.g. startOffsetDetection → started → progress → done. Ensure that you unsubscribe or use `takeWhile` operator.
   *
   * @param messageId
   * @param type of status message received as a response
   */
  selectMessageStatus<T extends StatusType>(type: T, messageId?: string): StatusTypeObservable<T> {
    const message$ = messageId === undefined
      ? this.motionMasterMessage$
      : this.motionMasterMessage$.pipe(
        filter((message) => message.id === messageId),
      );

    // we expect Status to be ALWAYS defined on input message
    const status$ = message$.pipe(map((message) => message.status)) as Observable<MotionMasterMessage.Status>;
    return status$.pipe(map((status) => status[type])) as any;
  }

  /**
   * Select notifications by topic.
   * @param topic to filter incoming notifications by
   * @returns an observable of topic and MotionMasterMessage
   */
  selectNotification<T extends boolean>(topic: string | null | undefined):
    T extends true ? Observable<{ topic: string, message: IMotionMasterMessage }> : Observable<{ topic: string, message: IMotionMasterMessage }> {
    return this.notification.pipe(
      filter((notif) => notif[0].toString() === topic),
      map((notif) => ({ topic, message: notif[1] })),
    ) as any;
  }

  /**
   * Send Request message to output.
   * @param request proto message
   * @param [messageId] identifies request, if no messageId is provided one is generated with uuid v4 and returned
   * @returns passed or generated messageId
   */
  sendRequest(request: MotionMasterMessage.IRequest, messageId?: string) {
    const id = messageId || v4();
    const message = MotionMasterMessage.create({ request, id });
    this.output.next(message);
    return id;
  }

  sendMessage(message: MotionMasterMessage) {
    this.output.next(message);
    return message.id;
  }

}
