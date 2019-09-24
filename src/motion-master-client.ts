import { motionmaster } from 'motion-master-proto';
import { Observable, Subject } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { v4 } from 'uuid';

export function encodeRequest(request: motionmaster.MotionMasterMessage.IRequest, id?: string): Buffer {
  if (!id) {
    id = v4();
  }
  const message = motionmaster.MotionMasterMessage.create({ id, request });
  return motionmaster.MotionMasterMessage.encode(message).finish() as Buffer;
}

export function decodeMotionMasterMessage(buffer: Buffer): motionmaster.MotionMasterMessage {
  return motionmaster.MotionMasterMessage.decode(new Uint8Array(buffer));
}

export interface INotification {
  topic: string;
  message: motionmaster.IMotionMasterMessage;
}

export type RequestType = keyof motionmaster.MotionMasterMessage.IRequest;
export type StatusType = keyof motionmaster.MotionMasterMessage.IStatus;
export type SignalGeneratorType = keyof motionmaster.MotionMasterMessage.Request.ISetSignalGeneratorParameters;
export type ComputeAutoTuningGainsType = keyof motionmaster.MotionMasterMessage.Request.IComputeAutoTuningGains;

export type DeviceAddressType = number | null | undefined;

export class MotionMasterClient {

  motionMasterMessage$: Observable<motionmaster.MotionMasterMessage>;
  notification$: Observable<INotification>;
  status$: Observable<motionmaster.MotionMasterMessage.Status>;

  systemVersion$: Observable<motionmaster.MotionMasterMessage.Status.SystemVersion>;
  deviceInfo$: Observable<motionmaster.MotionMasterMessage.Status.DeviceInfo>;
  deviceParameterInfo$: Observable<motionmaster.MotionMasterMessage.Status.DeviceParameterInfo>;
  deviceParameterValues$: Observable<motionmaster.MotionMasterMessage.Status.DeviceParameterValues>;

  constructor(
    private input: Subject<Buffer>,
    private output: Subject<Buffer>,
    private notification: Subject<[Buffer, Buffer]>,
  ) {
    this.motionMasterMessage$ = this.input.pipe(
      map(decodeMotionMasterMessage),
    );

    this.notification$ = this.notification.pipe(
      map((notif) => {
        const topic = notif[0].toString('utf8');
        const message = decodeMotionMasterMessage(notif[1]);
        return { topic, message };
      }),
    );

    this.status$ = this.motionMasterMessage$.pipe(
      map((message) => message.status),
    ) as Observable<motionmaster.MotionMasterMessage.Status>;

    this.systemVersion$ = this.selectStatus$('systemVersion') as Observable<motionmaster.MotionMasterMessage.Status.SystemVersion>;
    this.deviceInfo$ = this.selectStatus$('deviceInfo') as Observable<motionmaster.MotionMasterMessage.Status.DeviceInfo>;
    this.deviceParameterInfo$ = this.selectStatus$('deviceParameterInfo') as Observable<motionmaster.MotionMasterMessage.Status.DeviceParameterInfo>;
    this.deviceParameterValues$ = this.selectStatus$('deviceParameterValues') as Observable<motionmaster.MotionMasterMessage.Status.DeviceParameterValues>;
  }

  sendRequest(request: motionmaster.MotionMasterMessage.IRequest, messageId?: string) {
    const message = encodeRequest(request, messageId);
    this.output.next(message);
  }

  selectStatus$(type: StatusType) {
    return this.status$.pipe(
      filter((status) => status.type === type),
      map((status) => status[type]),
    );
  }

  getDeviceAtPosition$(position: number) {
    const messageId = v4();
    const observable = this.motionMasterMessage$.pipe(
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
    const getDeviceInfo = {};
    this.sendRequest({ getDeviceInfo }, messageId);
    return observable;
  }

  filterNotificationByTopic$(topic: string): Observable<INotification> {
    return this.notification.pipe(
      filter((notif) => notif[0].toString('utf8') === topic),
      map((notif) => ({ topic, message: decodeMotionMasterMessage(notif[1]) })),
    );
  }

  filterMotionMasterMessageById$(messageId: string) {
    return this.motionMasterMessage$.pipe(
      filter((message) => message.id === messageId),
    );
  }

  requestPingSystem(messageId?: string) {
    const pingSystem: motionmaster.MotionMasterMessage.Request.IPingSystem = {};
    this.sendRequest({ pingSystem }, messageId);
  }

  requestGetSystemVersion(messageId?: string) {
    const getSystemVersion: motionmaster.MotionMasterMessage.Request.IGetSystemVersion = {};
    this.sendRequest({ getSystemVersion }, messageId);
  }

  requestGetDeviceInfo(messageId?: string) {
    const getDeviceInfo: motionmaster.MotionMasterMessage.Request.IGetDeviceInfo = {};
    this.sendRequest({ getDeviceInfo }, messageId);
  }

  requestGetDeviceParameterInfo(deviceAddress: DeviceAddressType, messageId?: string) {
    const getDeviceParameterInfo: motionmaster.MotionMasterMessage.Request.IGetDeviceParameterInfo = { deviceAddress };
    this.sendRequest({ getDeviceParameterInfo }, messageId);
  }

  requestGetDeviceParameterValues(deviceAddress: DeviceAddressType, parameters: motionmaster.MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[], messageId?: string) {
    const getDeviceParameterValues: motionmaster.MotionMasterMessage.Request.IGetDeviceParameterValues = { deviceAddress, parameters };
    this.sendRequest({ getDeviceParameterValues }, messageId);
  }

  requestSetDeviceParameterValues(deviceAddress: DeviceAddressType, parameterValues: motionmaster.MotionMasterMessage.Request.SetDeviceParameterValues.IParameterValue[], messageId?: string) {
    const setDeviceParameterValues: motionmaster.MotionMasterMessage.Request.ISetDeviceParameterValues = { deviceAddress, parameterValues };
    this.sendRequest({ setDeviceParameterValues }, messageId);
  }

  requestGetDeviceFileList(deviceAddress: DeviceAddressType, messageId?: string) {
    const getDeviceFileList: motionmaster.MotionMasterMessage.Request.IGetDeviceFileList = { deviceAddress };
    this.sendRequest({ getDeviceFileList }, messageId);
  }

  requestGetDeviceFile(deviceAddress: DeviceAddressType, name: string, messageId?: string) {
    const getDeviceFile: motionmaster.MotionMasterMessage.Request.IGetDeviceFile = { deviceAddress, name };
    this.sendRequest({ getDeviceFile }, messageId);
  }

  requestSetDeviceFile(deviceAddress: DeviceAddressType, name: string, content: Uint8Array, overwrite: boolean, messageId?: string) {
    const setDeviceFile: motionmaster.MotionMasterMessage.Request.ISetDeviceFile = { deviceAddress, name, content, overwrite };
    this.sendRequest({ setDeviceFile }, messageId);
  }

  requestDeleteDeviceFile(deviceAddress: DeviceAddressType, name: string, messageId?: string) {
    const deleteDeviceFile: motionmaster.MotionMasterMessage.Request.IDeleteDeviceFile = { deviceAddress, name };
    this.sendRequest({ deleteDeviceFile }, messageId);
  }

  requestResetDeviceFault(deviceAddress: DeviceAddressType, messageId?: string) {
    const resetDeviceFault: motionmaster.MotionMasterMessage.Request.IResetDeviceFault = { deviceAddress };
    this.sendRequest({ resetDeviceFault }, messageId);
  }

  requestStopDevice(deviceAddress: DeviceAddressType, messageId?: string) {
    const stopDevice: motionmaster.MotionMasterMessage.Request.IStopDevice = { deviceAddress };
    this.sendRequest({ stopDevice }, messageId);
  }

  requestStartDeviceFirmwareInstallation(deviceAddress: DeviceAddressType, firmwarePackageContent: Buffer, messageId?: string) {
    const startDeviceFirmwareInstallation: motionmaster.MotionMasterMessage.Request.IStartDeviceFirmwareInstallation = { deviceAddress, firmwarePackageContent };
    this.sendRequest({ startDeviceFirmwareInstallation }, messageId);
  }

  requestGetDeviceLog(deviceAddress: DeviceAddressType, messageId?: string) {
    const getDeviceLog: motionmaster.MotionMasterMessage.Request.IGetDeviceLog = { deviceAddress };
    this.sendRequest({ getDeviceLog }, messageId);
  }

  requestStartCoggingTorqueRecording(deviceAddress: DeviceAddressType, skipAutoTuning: boolean, messageId?: string) {
    const startCoggingTorqueRecording: motionmaster.MotionMasterMessage.Request.IStartCoggingTorqueRecording = { deviceAddress, skipAutoTuning };
    this.sendRequest({ startCoggingTorqueRecording }, messageId);
  }

  requestGetCoggingTorqueData(deviceAddress: DeviceAddressType, messageId?: string) {
    const getCoggingTorqueData: motionmaster.MotionMasterMessage.Request.IGetCoggingTorqueData = { deviceAddress };
    this.sendRequest({ getCoggingTorqueData }, messageId);
  }

  requestStartOffsetDetection(deviceAddress: DeviceAddressType, messageId?: string) {
    const startOffsetDetection: motionmaster.MotionMasterMessage.Request.IStartOffsetDetection = { deviceAddress };
    this.sendRequest({ startOffsetDetection }, messageId);
  }

  requestSetMotionControllerParameters(deviceAddress: DeviceAddressType, target: number, messageId?: string) {
    const setMotionControllerParameters: motionmaster.MotionMasterMessage.Request.ISetMotionControllerParameters = {
      deviceAddress,
      target,
    };
    this.sendRequest({ setMotionControllerParameters }, messageId);
  }

  requestEnableMotionController(deviceAddress: DeviceAddressType, controllerType: motionmaster.MotionMasterMessage.Request.EnableMotionController.ControllerType, filterValue: boolean, messageId?: string) {
    const enableMotionController: motionmaster.MotionMasterMessage.Request.IEnableMotionController = {
      deviceAddress,
      controllerType,
      filter: filterValue,
    };
    this.sendRequest({ enableMotionController }, messageId);
  }

  requestDisableMotionController(deviceAddress: DeviceAddressType, messageId?: string) {
    const disableMotionController: motionmaster.MotionMasterMessage.Request.IDisableMotionController = { deviceAddress };
    this.sendRequest({ disableMotionController }, messageId);
  }

  requestStartSignalGenerator(deviceAddress: DeviceAddressType, messageId?: string) {
    const startSignalGenerator: motionmaster.MotionMasterMessage.Request.IStartSignalGenerator = { deviceAddress };
    this.sendRequest({ startSignalGenerator }, messageId);
  }

  requestStopSignalGenerator(deviceAddress: DeviceAddressType, messageId?: string) {
    const stopSignalGenerator: motionmaster.MotionMasterMessage.Request.IStopSignalGenerator = { deviceAddress };
    this.sendRequest({ stopSignalGenerator }, messageId);
  }

  requestStartMonitoringDeviceParameterValues(deviceAddress: DeviceAddressType, parameters: motionmaster.MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[], interval: number, topic: string, messageId?: string) {
    const getDeviceParameterValues = { deviceAddress, parameters };
    const startMonitoringDeviceParameterValues = { getDeviceParameterValues, interval, topic };
    this.sendRequest({ startMonitoringDeviceParameterValues }, messageId);
  }

  requestStopMonitoringDeviceParameterValues(startMonitoringRequestId: string, messageId?: string) {
    const stopMonitoringDeviceParameterValues: motionmaster.MotionMasterMessage.Request.IStopMonitoringDeviceParameterValues = { startMonitoringRequestId };
    this.sendRequest({ stopMonitoringDeviceParameterValues }, messageId);
  }

}
