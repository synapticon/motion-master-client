import { Observable, Subject } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { v4 } from 'uuid';

import { IMotionMasterMessage, MotionMasterMessage } from './util';

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
  T extends 'systemPong' ? Observable<MotionMasterMessage.Status.SystemPong> :
  T extends 'systemVersion' ? Observable<MotionMasterMessage.Status.SystemVersion> :
  T extends 'systemEvent' ? Observable<MotionMasterMessage.Status.SystemEvent> :
  T extends 'deviceInfo' ? Observable<MotionMasterMessage.Status.DeviceInfo> :
  T extends 'deviceParameterInfo' ? Observable<MotionMasterMessage.Status.DeviceParameterInfo> :
  T extends 'deviceParameterValues' ? Observable<MotionMasterMessage.Status.DeviceParameterValues> :
  T extends 'multiDeviceParameterValues' ? Observable<MotionMasterMessage.Status.MultiDeviceParameterValues> :
  T extends 'deviceFileList' ? Observable<MotionMasterMessage.Status.DeviceFileList> :
  T extends 'deviceFile' ? Observable<MotionMasterMessage.Status.DeviceFile> :
  T extends 'deviceEvent' ? Observable<MotionMasterMessage.Status.DeviceEvent> :
  T extends 'deviceFirmwareInstallation' ? Observable<MotionMasterMessage.Status.DeviceFirmwareInstallation> :
  T extends 'deviceLog' ? Observable<MotionMasterMessage.Status.DeviceLog> :
  T extends 'deviceFaultReset' ? Observable<MotionMasterMessage.Status.DeviceFaultReset> :
  T extends 'coggingTorqueRecording' ? Observable<MotionMasterMessage.Status.CoggingTorqueRecording> :
  T extends 'coggingTorqueData' ? Observable<MotionMasterMessage.Status.CoggingTorqueData> :
  T extends 'offsetDetection' ? Observable<MotionMasterMessage.Status.OffsetDetection> :
  T extends 'plantIdentification' ? Observable<MotionMasterMessage.Status.PlantIdentification> :
  T extends 'autoTuning' ? Observable<MotionMasterMessage.Status.AutoTuning> :
  T extends 'motionController' ? Observable<MotionMasterMessage.Status.MotionController> :
  T extends 'signalGenerator' ? Observable<MotionMasterMessage.Status.SignalGenerator> :
  T extends 'monitoringParameterValues' ? Observable<MotionMasterMessage.Status.MonitoringParameterValues> :
  T extends 'deviceStop' ? Observable<MotionMasterMessage.Status.DeviceStop> :
  T extends 'ethercatNetworkState' ? Observable<MotionMasterMessage.Status.EthercatNetworkState> :
  T extends 'narrowAngleCalibration' ? Observable<MotionMasterMessage.Status.NarrowAngleCalibration> :
  T extends 'systemIdentification' ? Observable<MotionMasterMessage.Status.SystemIdentification> :
  T extends 'circuloEncoderMagnetDistance' ? Observable<MotionMasterMessage.Status.CirculoEncoderMagnetDistance> :
  T extends 'circuloEncoderNarrowAngleCalibrationProcedure' ? Observable<MotionMasterMessage.Status.CirculoEncoderNarrowAngleCalibrationProcedure> :
  T extends 'deviceCia402State' ? Observable<MotionMasterMessage.Status.DeviceCiA402State> :
  T extends 'systemLog' ? Observable<MotionMasterMessage.Status.SystemLog> :
  Observable<any>;

export class MotionMasterClient {

  /**
   * Decoded message instances coming from Motion Master.
   * @see https://github.com/protobufjs/protobuf.js#toolset Message.decode
   */
  readonly input$ = new Subject<MotionMasterMessage>();

  /**
   * Message instances or objects going to Motion Master.
   * @see https://github.com/protobufjs/protobuf.js#toolset Message.encode
   */
  readonly output$ = new Subject<IMotionMasterMessage>();

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

  requestStartPlantIdentification(deviceAddress: DeviceAddressType, durationSeconds: number, torqueAmplitude: number, startFrequency: number, endFrequency: number, cutoffFrequency: number, messageId?: string) {
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

  requestGetEthercatNetworkState(deviceAddress: DeviceAddressType, messageId?: string) {
    const getEthercatNetworkState = MotionMasterMessage.Request.GetEthercatNetworkState.create({ deviceAddress });
    const id = this.sendRequest({ getEthercatNetworkState }, messageId);
    return this.selectMessageStatus('ethercatNetworkState', id);
  }

  requestSetEthercatNetworkState(deviceAddress: DeviceAddressType, state: MotionMasterMessage.Request.SetEthercatNetworkState.State, messageId?: string) {
    const setEthercatNetworkState = MotionMasterMessage.Request.SetEthercatNetworkState.create({ deviceAddress, state });
    const id = this.sendRequest({ setEthercatNetworkState }, messageId);
    return this.selectMessageStatus('ethercatNetworkState', id);
  }

  requestStartNarrowAngleCalibration(deviceAddress: DeviceAddressType, messageId?: string) {
    const startNarrowAngleCalibration = MotionMasterMessage.Request.StartNarrowAngleCalibration.create({ deviceAddress });
    const id = this.sendRequest({ startNarrowAngleCalibration }, messageId);
    return this.selectMessageStatus('narrowAngleCalibration', id);
  }

  requestSetSystemClientTimeout(timeoutMs: number, messageId?: string) {
    const setSystemClientTimeout = MotionMasterMessage.Request.SetSystemClientTimeout.create({ timeoutMs });
    const id = this.sendRequest({ setSystemClientTimeout }, messageId);
    return id;
  }

  requestStartSystemIdentification(deviceAddress: DeviceAddressType, durationSeconds: number, torqueAmplitude: number, startFrequency: number, endFrequency: number, messageId?: string) {
    const startSystemIdentification = MotionMasterMessage.Request.StartSystemIdentification.create({
      deviceAddress,
      durationSeconds,
      torqueAmplitude,
      startFrequency,
      endFrequency,
    });
    const id = this.sendRequest({ startSystemIdentification }, messageId);
    return this.selectMessageStatus('systemIdentification', id);
  }

  requestGetCirculoEncoderMagnetDistance(deviceAddress: DeviceAddressType, encoderPort: number, messageId?: string) {
    const getCirculoEncoderMagnetDistance = MotionMasterMessage.Request.GetCirculoEncoderMagnetDistance.create({
      deviceAddress,
      encoderPort,
    });
    const id = this.sendRequest({ getCirculoEncoderMagnetDistance }, messageId);
    return this.selectMessageStatus('circuloEncoderMagnetDistance', id);
  }

  requestStartCirculoEncoderNarrowAngleCalibrationProcedure(deviceAddress: DeviceAddressType, encoderPort: number, messageId?: string) {
    const startCirculoEncoderNarrowAngleCalibrationProcedure = MotionMasterMessage.Request.StartCirculoEncoderNarrowAngleCalibrationProcedure.create({
      deviceAddress,
      encoderPort,
    });
    const id = this.sendRequest({ startCirculoEncoderNarrowAngleCalibrationProcedure }, messageId);
    return this.selectMessageStatus('circuloEncoderNarrowAngleCalibrationProcedure', id);
  }

  requestGetDeviceCia402State(deviceAddress: DeviceAddressType, messageId?: string) {
    const getDeviceCia402State = MotionMasterMessage.Request.GetDeviceCiA402State.create({ deviceAddress });
    const id = this.sendRequest({ getDeviceCia402State }, messageId);
    return this.selectMessageStatus('deviceCia402State', id);
  }

  requestSetDeviceCia402State(deviceAddress: DeviceAddressType, state: MotionMasterMessage.Status.DeviceCiA402State.State, messageId?: string) {
    const setDeviceCia402State = MotionMasterMessage.Request.SetDeviceCiA402State.create({ deviceAddress, state });
    const id = this.sendRequest({ setDeviceCia402State }, messageId);
    return this.selectMessageStatus('deviceCia402State', id);
  }

  requestGetSystemLog(messageId?: string) {
    const getSystemLog = MotionMasterMessage.Request.GetSystemLog.create({});
    const id = this.sendRequest({ getSystemLog }, messageId);
    return this.selectMessageStatus('systemLog', id);
  }

  /**
   * Select device at position in EtherCAT chain. This function makes an initial request to fetch a list of devices.
   * @param position device position in EtherCAT chain
   * @returns an observable of device messages
   */
  selectDeviceAtPosition(position: number) {
    return this.requestGetDeviceInfo().pipe(
      first(),
      map((deviceInfo: MotionMasterMessage.Status.IDeviceInfo) => {
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
    return this.input$.pipe(
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
      ? this.input$
      : this.input$.pipe(
        filter((message) => message.id === messageId),
      );

    // we expect Status to be ALWAYS defined on input message
    const status$ = message$.pipe(map((message) => message.status)) as Observable<MotionMasterMessage.Status>;
    return status$.pipe(map((status) => status[type])) as any;
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
    this.output$.next(message);
    return id;
  }

  sendMessage(message: IMotionMasterMessage) {
    this.output$.next(message);
    return message.id;
  }

}
