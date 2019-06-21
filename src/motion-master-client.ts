import { motionmaster } from 'motion-master-proto';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { v4 } from 'uuid';

export type RequestType = ('pingSystem' | 'getSystemVersion' | 'getDeviceInfo' | 'getDeviceParameterInfo' | 'getDeviceParameterValues' | 'getMultiDeviceParameterValues' | 'setDeviceParameterValues' | 'setMultiDeviceParameterValues' | 'getDeviceFileList' | 'getDeviceFile' | 'setDeviceFile' | 'deleteDeviceFile' | 'resetDeviceFault' | 'stopDevice' | 'startDeviceFirmwareInstallation' | 'getDeviceLog' | 'startCoggingTorqueRecording' | 'getCoggingTorqueData' | 'startOffsetDetection' | 'startPlantIdentification' | 'computeAutoTuningGains' | 'setMotionControllerParameters' | 'enableMotionController' | 'disableMotionController' | 'setSignalGeneratorParameters' | 'startSignalGenerator' | 'stopSignalGenerator' | 'startMonitoringDeviceParameterValues' | 'stopMonitoringDeviceParameterValues');

export function filterByDeviceAddress(deviceAddress: number, observable: Observable<{ deviceAddress: number }>) {
  return observable.pipe(filter((data) => data.deviceAddress === deviceAddress));
}

export class MotionMasterClient {

  motionMasterMessage$: Observable<motionmaster.MotionMasterMessage>;
  status$: Observable<motionmaster.MotionMasterMessage.Status>;
  systemVersion$: Observable<motionmaster.MotionMasterMessage.Status.SystemVersion>;
  deviceInfo$: Observable<motionmaster.MotionMasterMessage.Status.DeviceInfo>;
  deviceParameterInfo$: Observable<motionmaster.MotionMasterMessage.Status.DeviceParameterInfo>;
  deviceParameterValues$: Observable<motionmaster.MotionMasterMessage.Status.DeviceParameterValues>;

  constructor(
    private input: Subject<Buffer>,
    private output: Subject<Buffer>,
  ) {
    this.motionMasterMessage$ = this.input.pipe(map(this.decodeMotionMasterMessage));
    this.status$ = this.motionMasterMessage$.pipe(map((message) => message.status)) as Observable<motionmaster.MotionMasterMessage.Status>;

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

  requestGetSystemVersion(messageId?: string) {
    const getSystemVersion = motionmaster.MotionMasterMessage.Request.GetSystemVersion.create();
    const request: motionmaster.MotionMasterMessage.IRequest = { getSystemVersion };
    const message = this.encodeRequest(request, messageId);
    this.output.next(message);
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

  requestGetDeviceParameterValues(deviceAddress: number, messageId?: string) {
    const getDeviceParameterValues = motionmaster.MotionMasterMessage.Request.GetDeviceParameterValues.create({ deviceAddress });
    const request: motionmaster.MotionMasterMessage.IRequest = { getDeviceParameterValues };
    this.sendRequest(request, messageId);
  }

  sendRequest(request: motionmaster.MotionMasterMessage.IRequest, messageId?: string) {
    const message = this.encodeRequest(request, messageId);
    this.output.next(message);
  }

  // PingSystem ping_system = 101;
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
  // StartMonitoringDeviceParameterValues start_monitoring_device_parameter_values = 128;
  // StopMonitoringDeviceParameterValues stop_monitoring_device_parameter_values = 129;

  encodeRequest(request: motionmaster.MotionMasterMessage.IRequest, id?: string): Buffer {
    if (!id) {
      id = v4();
    }
    const message = motionmaster.MotionMasterMessage.create({ id, request });
    return motionmaster.MotionMasterMessage.encode(message).finish() as Buffer;
  }

  decodeMotionMasterMessage(buffer: Buffer): motionmaster.MotionMasterMessage {
    return motionmaster.MotionMasterMessage.decode(new Uint8Array(buffer));
  }

}
