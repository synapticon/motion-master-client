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

    this.systemVersion$ = this.status$.pipe(
      filter((status) => !!status.systemVersion),
      map((status) => status.systemVersion),
    ) as Observable<motionmaster.MotionMasterMessage.Status.SystemVersion>;

    this.deviceInfo$ = this.status$.pipe(
      filter((status) => !!status.deviceInfo),
      map((status) => status.deviceInfo),
    ) as Observable<motionmaster.MotionMasterMessage.Status.DeviceInfo>;

    this.deviceParameterInfo$ = this.status$.pipe(
      filter((status) => !!status.deviceParameterInfo),
      map((status) => status.deviceParameterInfo),
    ) as Observable<motionmaster.MotionMasterMessage.Status.DeviceParameterInfo>;

    this.deviceParameterValues$ = this.status$.pipe(
      filter((status) => !!status.deviceParameterValues),
      map((status) => status.deviceParameterValues),
    ) as Observable<motionmaster.MotionMasterMessage.Status.DeviceParameterValues>;
  }

  requestPingSystem(messageId?: string) {
    const pingSystem = motionmaster.MotionMasterMessage.Request.PingSystem.create();
    const request: motionmaster.MotionMasterMessage.IRequest = { pingSystem };
    this.sendRequest(request, messageId);
  }

  requestGetSystemVersion(messageId?: string) {
    const getSystemVersion = motionmaster.MotionMasterMessage.Request.GetSystemVersion.create();
    const request: motionmaster.MotionMasterMessage.IRequest = { getSystemVersion };
    this.sendRequest(request, messageId);
  }

  requestGetDeviceInfo(messageId?: string) {
    const getDeviceInfo = motionmaster.MotionMasterMessage.Request.GetDeviceInfo.create();
    const request: motionmaster.MotionMasterMessage.IRequest = { getDeviceInfo };
    this.sendRequest(request, messageId);
  }

  requestGetDeviceParameterInfo(properties: motionmaster.MotionMasterMessage.Request.IGetDeviceParameterInfo, messageId?: string) {
    const getDeviceParameterInfo = motionmaster.MotionMasterMessage.Request.GetDeviceParameterInfo.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { getDeviceParameterInfo };
    this.sendRequest(request, messageId);
  }

  requestGetDeviceParameterValues(properties: motionmaster.MotionMasterMessage.Request.IGetDeviceParameterValues, messageId?: string) {
    const getDeviceParameterValues = motionmaster.MotionMasterMessage.Request.GetDeviceParameterValues.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { getDeviceParameterValues };
    this.sendRequest(request, messageId);
  }

  requestGetMultiDeviceParameterValues(properties: motionmaster.MotionMasterMessage.Request.IGetMultiDeviceParameterValues, messageId?: string) {
    const getMultiDeviceParameterValues = motionmaster.MotionMasterMessage.Request.GetMultiDeviceParameterValues.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { getMultiDeviceParameterValues };
    this.sendRequest(request, messageId);
  }

  requestSetDeviceParameterValues(properties: motionmaster.MotionMasterMessage.Request.ISetDeviceParameterValues, messageId?: string) {
    const setDeviceParameterValues = motionmaster.MotionMasterMessage.Request.SetDeviceParameterValues.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { setDeviceParameterValues };
    this.sendRequest(request, messageId);
  }

  requestSetMultiDeviceParameterValues(properties: motionmaster.MotionMasterMessage.Request.ISetMultiDeviceParameterValues, messageId?: string) {
    const setMultiDeviceParameterValues = motionmaster.MotionMasterMessage.Request.SetMultiDeviceParameterValues.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { setMultiDeviceParameterValues };
    this.sendRequest(request, messageId);
  }

  requestGetDeviceFileList(properties: motionmaster.MotionMasterMessage.Request.IGetDeviceFileList, messageId?: string) {
    const getDeviceFileList = motionmaster.MotionMasterMessage.Request.GetDeviceFileList.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { getDeviceFileList };
    this.sendRequest(request, messageId);
  }

  requestGetDeviceFile(properties: motionmaster.MotionMasterMessage.Request.IGetDeviceFile, messageId?: string) {
    const getDeviceFile = motionmaster.MotionMasterMessage.Request.GetDeviceFile.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { getDeviceFile };
    this.sendRequest(request, messageId);
  }

  requestSetDeviceFile(properties: motionmaster.MotionMasterMessage.Request.ISetDeviceFile, messageId?: string) {
    const setDeviceFile = motionmaster.MotionMasterMessage.Request.SetDeviceFile.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { setDeviceFile };
    this.sendRequest(request, messageId);
  }

  requestDeleteDeviceFile(properties: motionmaster.MotionMasterMessage.Request.IDeleteDeviceFile, messageId?: string) {
    const deleteDeviceFile = motionmaster.MotionMasterMessage.Request.DeleteDeviceFile.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { deleteDeviceFile };
    this.sendRequest(request, messageId);
  }

  requestResetDeviceFault(properties: motionmaster.MotionMasterMessage.Request.IResetDeviceFault, messageId?: string) {
    const resetDeviceFault = motionmaster.MotionMasterMessage.Request.ResetDeviceFault.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { resetDeviceFault };
    this.sendRequest(request, messageId);
  }

  requestStopDevice(properties: motionmaster.MotionMasterMessage.Request.IStopDevice, messageId?: string) {
    const stopDevice = motionmaster.MotionMasterMessage.Request.StopDevice.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { stopDevice };
    this.sendRequest(request, messageId);
  }

  requestStartDeviceFirmwareInstallation(properties: motionmaster.MotionMasterMessage.Request.IStartDeviceFirmwareInstallation, messageId?: string) {
    const startDeviceFirmwareInstallation = motionmaster.MotionMasterMessage.Request.StartDeviceFirmwareInstallation.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { startDeviceFirmwareInstallation };
    this.sendRequest(request, messageId);
  }

  requestGetDeviceLog(properties: motionmaster.MotionMasterMessage.Request.IGetDeviceLog, messageId?: string) {
    const getDeviceLog = motionmaster.MotionMasterMessage.Request.GetDeviceLog.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { getDeviceLog };
    this.sendRequest(request, messageId);
  }

  requestStartCoggingTorqueRecording(properties: motionmaster.MotionMasterMessage.Request.IStartCoggingTorqueRecording, messageId?: string) {
    const startCoggingTorqueRecording = motionmaster.MotionMasterMessage.Request.StartCoggingTorqueRecording.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { startCoggingTorqueRecording };
    this.sendRequest(request, messageId);
  }

  requestGetCoggingTorqueData(properties: motionmaster.MotionMasterMessage.Request.IGetCoggingTorqueData, messageId?: string) {
    const getCoggingTorqueData = motionmaster.MotionMasterMessage.Request.GetCoggingTorqueData.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { getCoggingTorqueData };
    this.sendRequest(request, messageId);
  }

  requestStartOffsetDetection(properties: motionmaster.MotionMasterMessage.Request.IStartOffsetDetection, messageId?: string) {
    const startOffsetDetection = motionmaster.MotionMasterMessage.Request.StartOffsetDetection.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { startOffsetDetection };
    this.sendRequest(request, messageId);
  }

  requestStartPlantIdentification(properties: motionmaster.MotionMasterMessage.Request.IStartPlantIdentification, messageId?: string) {
    const startPlantIdentification = motionmaster.MotionMasterMessage.Request.StartPlantIdentification.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { startPlantIdentification };
    this.sendRequest(request, messageId);
  }

  requestComputeAutoTuningGains(properties: motionmaster.MotionMasterMessage.Request.IComputeAutoTuningGains, messageId?: string) {
    const computeAutoTuningGains = motionmaster.MotionMasterMessage.Request.ComputeAutoTuningGains.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { computeAutoTuningGains };
    this.sendRequest(request, messageId);
  }

  requestSetMotionControllerParameters(properties: motionmaster.MotionMasterMessage.Request.ISetMotionControllerParameters, messageId?: string) {
    const setMotionControllerParameters = motionmaster.MotionMasterMessage.Request.SetMotionControllerParameters.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { setMotionControllerParameters };
    this.sendRequest(request, messageId);
  }

  requestEnableMotionController(properties: motionmaster.MotionMasterMessage.Request.IEnableMotionController, messageId?: string) {
    const enableMotionController = motionmaster.MotionMasterMessage.Request.EnableMotionController.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { enableMotionController };
    this.sendRequest(request, messageId);
  }

  requestDisableMotionController(properties: motionmaster.MotionMasterMessage.Request.IDisableMotionController, messageId?: string) {
    const disableMotionController = motionmaster.MotionMasterMessage.Request.DisableMotionController.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { disableMotionController };
    this.sendRequest(request, messageId);
  }

  requestSetSignalGeneratorParameters(properties: motionmaster.MotionMasterMessage.Request.ISetSignalGeneratorParameters, messageId?: string) {
    const setSignalGeneratorParameters = motionmaster.MotionMasterMessage.Request.SetSignalGeneratorParameters.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { setSignalGeneratorParameters };
    this.sendRequest(request, messageId);
  }

  requestStartSignalGenerator(properties: motionmaster.MotionMasterMessage.Request.IStartSignalGenerator, messageId?: string) {
    const startSignalGenerator = motionmaster.MotionMasterMessage.Request.StartSignalGenerator.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { startSignalGenerator };
    this.sendRequest(request, messageId);
  }

  requestStopSignalGenerator(properties: motionmaster.MotionMasterMessage.Request.IStopSignalGenerator, messageId?: string) {
    const stopSignalGenerator = motionmaster.MotionMasterMessage.Request.StopSignalGenerator.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { stopSignalGenerator };
    this.sendRequest(request, messageId);
  }

  requestStartMonitoringDeviceParameterValues(properties: motionmaster.MotionMasterMessage.Request.IStartMonitoringDeviceParameterValues, messageId?: string) {
    const startMonitoringDeviceParameterValues = motionmaster.MotionMasterMessage.Request.StartMonitoringDeviceParameterValues.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { startMonitoringDeviceParameterValues };
    this.sendRequest(request, messageId);
  }

  requestStopMonitoringDeviceParameterValues(properties: motionmaster.MotionMasterMessage.Request.IStopMonitoringDeviceParameterValues, messageId?: string) {
    const stopMonitoringDeviceParameterValues = motionmaster.MotionMasterMessage.Request.StopMonitoringDeviceParameterValues.create(properties);
    const request: motionmaster.MotionMasterMessage.IRequest = { stopMonitoringDeviceParameterValues };
    this.sendRequest(request, messageId);
  }

  sendRequest(request: motionmaster.MotionMasterMessage.IRequest, messageId?: string) {
    const message = encodeRequest(request, messageId);
    this.output.next(message);
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
    this.requestGetDeviceInfo(messageId);
    return observable;
  }

  filterNotificationByTopic$(topic: string): Observable<INotification> {
    return this.notification.pipe(
      filter((notif) => notif[0].toString('utf8') === topic),
      map((notif) => ({ topic, message: decodeMotionMasterMessage(notif[1]) })),
    );
  }

}
