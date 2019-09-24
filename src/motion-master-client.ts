import { motionmaster } from 'motion-master-proto';
import { Observable, Subject } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { v4 } from 'uuid';

export function encodeRequest(request: motionmaster.MotionMasterMessage.IRequest, id?: string) {
  if (!id) {
    id = v4();
  }
  const message = motionmaster.MotionMasterMessage.create({ id, request });
  return motionmaster.MotionMasterMessage.encode(message).finish() as Buffer;
}

export function decodeMotionMasterMessage(buffer: Buffer) {
  return motionmaster.MotionMasterMessage.decode(new Uint8Array(buffer));
}

export type RequestType = keyof motionmaster.MotionMasterMessage.IRequest;
export type StatusType = keyof motionmaster.MotionMasterMessage.IStatus;
export type SignalGeneratorType = keyof motionmaster.MotionMasterMessage.Request.ISetSignalGeneratorParameters;
export type ComputeAutoTuningGainsType = keyof motionmaster.MotionMasterMessage.Request.IComputeAutoTuningGains;

export type DeviceAddressType = number | null | undefined;

export class MotionMasterClient {

  motionMasterMessage$: Observable<motionmaster.MotionMasterMessage>;

  status$: Observable<motionmaster.MotionMasterMessage.Status>;

  systemPong$: Observable<motionmaster.MotionMasterMessage.Status.SystemPong>;
  systemVersion$: Observable<motionmaster.MotionMasterMessage.Status.SystemVersion>;
  systemEvent$: Observable<motionmaster.MotionMasterMessage.Status.SystemEvent>;
  deviceInfo$: Observable<motionmaster.MotionMasterMessage.Status.DeviceInfo>;
  deviceParameterInfo$: Observable<motionmaster.MotionMasterMessage.Status.DeviceParameterInfo>;
  deviceParameterValues$: Observable<motionmaster.MotionMasterMessage.Status.DeviceParameterValues>;
  multiDeviceParameterValues$: Observable<motionmaster.MotionMasterMessage.Status.MultiDeviceParameterValues>;
  deviceFileList$: Observable<motionmaster.MotionMasterMessage.Status.DeviceFileList>;
  deviceFile$: Observable<motionmaster.MotionMasterMessage.Status.DeviceFile>;
  deviceEvent$: Observable<motionmaster.MotionMasterMessage.Status.DeviceEvent>;
  deviceFirmwareInstallation$: Observable<motionmaster.MotionMasterMessage.Status.DeviceFirmwareInstallation>;
  deviceLog$: Observable<motionmaster.MotionMasterMessage.Status.DeviceLog>;
  deviceFaultReset$: Observable<motionmaster.MotionMasterMessage.Status.DeviceFaultReset>;
  coggingTorqueRecording$: Observable<motionmaster.MotionMasterMessage.Status.CoggingTorqueRecording>;
  coggingTorqueData$: Observable<motionmaster.MotionMasterMessage.Status.CoggingTorqueData>;
  offsetDetection$: Observable<motionmaster.MotionMasterMessage.Status.OffsetDetection>;
  plantIdentification$: Observable<motionmaster.MotionMasterMessage.Status.PlantIdentification>;
  autoTuning$: Observable<motionmaster.MotionMasterMessage.Status.AutoTuning>;
  motionController$: Observable<motionmaster.MotionMasterMessage.Status.MotionController>;
  signalGenerator$: Observable<motionmaster.MotionMasterMessage.Status.SignalGenerator>;
  monitoringParameterValues$: Observable<motionmaster.MotionMasterMessage.Status.MonitoringParameterValues>;

  constructor(
    public readonly input: Subject<Buffer>,
    public readonly output: Subject<Buffer>,
    public readonly notification: Subject<[Buffer, Buffer]>,
  ) {
    this.motionMasterMessage$ = this.input.pipe(
      map(decodeMotionMasterMessage),
    );

    this.status$ = this.motionMasterMessage$.pipe(
      map((message) => message.status),
    ) as Observable<motionmaster.MotionMasterMessage.Status>;

    this.systemPong$ = this.selectStatus('systemPong');
    this.systemVersion$ = this.selectStatus('systemVersion');
    this.systemEvent$ = this.selectStatus('systemEvent');
    this.deviceInfo$ = this.selectStatus('deviceInfo');
    this.deviceParameterInfo$ = this.selectStatus('deviceParameterInfo');
    this.deviceParameterValues$ = this.selectStatus('deviceParameterValues');
    this.multiDeviceParameterValues$ = this.selectStatus('multiDeviceParameterValues');
    this.deviceFileList$ = this.selectStatus('deviceFileList');
    this.deviceFile$ = this.selectStatus('deviceFile');
    this.deviceEvent$ = this.selectStatus('deviceEvent');
    this.deviceFirmwareInstallation$ = this.selectStatus('deviceFirmwareInstallation');
    this.deviceLog$ = this.selectStatus('deviceLog');
    this.deviceFaultReset$ = this.selectStatus('deviceFaultReset');
    this.coggingTorqueRecording$ = this.selectStatus('coggingTorqueRecording');
    this.coggingTorqueData$ = this.selectStatus('coggingTorqueData');
    this.offsetDetection$ = this.selectStatus('offsetDetection');
    this.plantIdentification$ = this.selectStatus('plantIdentification');
    this.autoTuning$ = this.selectStatus('autoTuning');
    this.motionController$ = this.selectStatus('motionController');
    this.signalGenerator$ = this.selectStatus('signalGenerator');
    this.monitoringParameterValues$ = this.selectStatus('monitoringParameterValues');
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

  selectMessage(messageId: string) {
    return this.motionMasterMessage$.pipe(
      filter((message) => message.id === messageId),
    );
  }

  selectNotification<T extends boolean>(topic: string | null | undefined, decode: T):
    T extends true ? Observable<{ topic: string, message: motionmaster.MotionMasterMessage }> : Observable<{ topic: string, message: Buffer }> {
    return this.notification.pipe(
      filter((notif) => notif[0].toString('utf8') === topic),
      map((notif) => ({ topic, message: decode ? decodeMotionMasterMessage(notif[1]) : notif[1] })),
    ) as any;
  }

  selectStatus<T extends StatusType>(type: T):
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
    Observable<any> {
    return this.status$.pipe(
      filter((status) => status.type === type),
      map((status) => status[type]),
    ) as any;
  }

  sendRequest(request: motionmaster.MotionMasterMessage.IRequest, messageId?: string) {
    const message = encodeRequest(request, messageId);
    this.output.next(message);
  }

}
