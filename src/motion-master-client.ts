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

  requestGetDeviceParameterInfo(deviceAddress: number, messageId?: string) {
    const getDeviceParameterInfo = motionmaster.MotionMasterMessage.Request.GetDeviceParameterInfo.create({ deviceAddress });
    const request: motionmaster.MotionMasterMessage.IRequest = { getDeviceParameterInfo };
    this.sendRequest(request, messageId);
  }

  requestGetDeviceParameterValues(
    deviceAddress: number,
    parameters?: (motionmaster.MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[] | null),
    messageId?: string,
  ) {
    const getDeviceParameterValues = motionmaster.MotionMasterMessage.Request.GetDeviceParameterValues.create({
      deviceAddress,
      parameters,
    });
    const request: motionmaster.MotionMasterMessage.IRequest = { getDeviceParameterValues };
    this.sendRequest(request, messageId);
  }

  requestSetDeviceParameterValues(
    deviceAddress: number,
    parameterValues?: (motionmaster.MotionMasterMessage.Request.SetDeviceParameterValues.IParameterValue[] | null),
    messageId?: string,
  ) {
    const setDeviceParameterValues = motionmaster.MotionMasterMessage.Request.SetDeviceParameterValues.create({
      deviceAddress,
      parameterValues,
    });
    const request: motionmaster.MotionMasterMessage.IRequest = { setDeviceParameterValues };
    this.sendRequest(request, messageId);
  }

  sendRequest(request: motionmaster.MotionMasterMessage.IRequest, messageId?: string) {
    const message = encodeRequest(request, messageId);
    this.output.next(message);
  }

  startMonitoringDeviceParameterValues(
    interval: number,
    topic: string,
    getDeviceParameterValues: motionmaster.MotionMasterMessage.Request.IGetDeviceParameterValues,
    messageId?: string,
  ) {
    const startMonitoringDeviceParameterValues = motionmaster.MotionMasterMessage.Request.StartMonitoringDeviceParameterValues.create({
      getDeviceParameterValues,
      interval,
      topic,
    });
    const request: motionmaster.MotionMasterMessage.IRequest = { startMonitoringDeviceParameterValues };
    this.sendRequest(request, messageId);
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

  // GetMultiDeviceParameterValues get_multi_device_parameter_values = 106;
  // SetDeviceParameterValues set_device_parameter_values = 107;
  // SetMultiDeviceParameterValues set_multi_device_parameter_values = 108;
  // GetDeviceFileList get_device_file_list = 109;
  // GetDeviceFile get_device_file = 110;
  // SetDeviceFile set_device_file = 111;
  // DeleteDeviceFile delete_device_file = 112;
  // ResetDeviceFault reset_device_fault = 113;
  // StopDevice stop_device = 114;
  // StartDeviceFirmwareInstallation start_device_firmware_installation = 115;
  // GetDeviceLog get_device_log = 116;
  // StartCoggingTorqueRecording start_cogging_torque_recording = 117;
  // GetCoggingTorqueData get_cogging_torque_data = 118;
  // StartOffsetDetection start_offset_detection = 119;
  // StartPlantIdentification start_plant_identification = 120;
  // ComputeAutoTuningGains compute_auto_tuning_gains = 121;
  // SetMotionControllerParameters set_motion_controller_parameters = 122;
  // EnableMotionController enable_motion_controller = 123;
  // DisableMotionController disable_motion_controller = 124;
  // SetSignalGeneratorParameters set_signal_generator_parameters = 125;
  // StartSignalGenerator start_signal_generator = 126;
  // StopSignalGenerator stop_signal_generator = 127;
  // StopMonitoringDeviceParameterValues stop_monitoring_device_parameter_values = 129;

}
