import { Observable, Subject } from 'rxjs';
import { IMotionMasterMessage, MotionMasterMessage } from './util';
export declare type RequestType = keyof MotionMasterMessage.IRequest;
export declare type StatusType = keyof MotionMasterMessage.IStatus;
export declare type SignalGeneratorType = keyof MotionMasterMessage.Request.ISetSignalGeneratorParameters;
export declare type ComputeAutoTuningGainsType = keyof MotionMasterMessage.Request.IComputeAutoTuningGains;
export declare type DeviceAddressType = number | null | undefined;
/**
 * Select observable of Status message based on status type argument.
 * @see https://www.typescriptlang.org/docs/handbook/advanced-types.html#conditional-types
 */
export declare type StatusTypeObservable<T extends StatusType> = T extends 'systemPong' ? Observable<MotionMasterMessage.Status.SystemPong> : T extends 'systemVersion' ? Observable<MotionMasterMessage.Status.SystemVersion> : T extends 'systemEvent' ? Observable<MotionMasterMessage.Status.SystemEvent> : T extends 'deviceInfo' ? Observable<MotionMasterMessage.Status.DeviceInfo> : T extends 'deviceParameterInfo' ? Observable<MotionMasterMessage.Status.DeviceParameterInfo> : T extends 'deviceParameterValues' ? Observable<MotionMasterMessage.Status.DeviceParameterValues> : T extends 'multiDeviceParameterValues' ? Observable<MotionMasterMessage.Status.MultiDeviceParameterValues> : T extends 'deviceFileList' ? Observable<MotionMasterMessage.Status.DeviceFileList> : T extends 'deviceFile' ? Observable<MotionMasterMessage.Status.DeviceFile> : T extends 'deviceEvent' ? Observable<MotionMasterMessage.Status.DeviceEvent> : T extends 'deviceFirmwareInstallation' ? Observable<MotionMasterMessage.Status.DeviceFirmwareInstallation> : T extends 'deviceLog' ? Observable<MotionMasterMessage.Status.DeviceLog> : T extends 'deviceFaultReset' ? Observable<MotionMasterMessage.Status.DeviceFaultReset> : T extends 'coggingTorqueRecording' ? Observable<MotionMasterMessage.Status.CoggingTorqueRecording> : T extends 'coggingTorqueData' ? Observable<MotionMasterMessage.Status.CoggingTorqueData> : T extends 'offsetDetection' ? Observable<MotionMasterMessage.Status.OffsetDetection> : T extends 'plantIdentification' ? Observable<MotionMasterMessage.Status.PlantIdentification> : T extends 'autoTuning' ? Observable<MotionMasterMessage.Status.AutoTuning> : T extends 'motionController' ? Observable<MotionMasterMessage.Status.MotionController> : T extends 'signalGenerator' ? Observable<MotionMasterMessage.Status.SignalGenerator> : T extends 'monitoringParameterValues' ? Observable<MotionMasterMessage.Status.MonitoringParameterValues> : T extends 'deviceStop' ? Observable<MotionMasterMessage.Status.DeviceStop> : T extends 'ethercatNetworkState' ? Observable<MotionMasterMessage.Status.EthercatNetworkState> : T extends 'narrowAngleCalibration' ? Observable<MotionMasterMessage.Status.NarrowAngleCalibration> : T extends 'systemIdentification' ? Observable<MotionMasterMessage.Status.SystemIdentification> : T extends 'circuloEncoderMagnetDistance' ? Observable<MotionMasterMessage.Status.CirculoEncoderMagnetDistance> : T extends 'circuloEncoderNarrowAngleCalibrationProcedure' ? Observable<MotionMasterMessage.Status.CirculoEncoderNarrowAngleCalibrationProcedure> : T extends 'deviceCia402State' ? Observable<MotionMasterMessage.Status.DeviceCiA402State> : T extends 'systemLog' ? Observable<MotionMasterMessage.Status.SystemLog> : Observable<any>;
export declare class MotionMasterClient {
    /**
     * Decoded message instances coming from Motion Master.
     * @see https://github.com/protobufjs/protobuf.js#toolset Message.decode
     */
    readonly input$: Subject<MotionMasterMessage>;
    /**
     * Message instances or objects going to Motion Master.
     * @see https://github.com/protobufjs/protobuf.js#toolset Message.encode
     */
    readonly output$: Subject<IMotionMasterMessage>;
    requestPingSystem(messageId?: string): Observable<MotionMasterMessage.Status.SystemPong>;
    requestGetSystemVersion(messageId?: string): Observable<MotionMasterMessage.Status.SystemVersion>;
    requestGetDeviceInfo(messageId?: string): Observable<MotionMasterMessage.Status.DeviceInfo>;
    requestGetDeviceParameterInfo(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.DeviceParameterInfo>;
    requestGetDeviceParameterValues(deviceAddress: DeviceAddressType, parameters: MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[], messageId?: string): Observable<MotionMasterMessage.Status.DeviceParameterValues>;
    requestSetDeviceParameterValues(deviceAddress: DeviceAddressType, parameterValues: MotionMasterMessage.Request.SetDeviceParameterValues.IParameterValue[], messageId?: string): Observable<MotionMasterMessage.Status.DeviceParameterValues>;
    requestGetDeviceFileList(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.DeviceFileList>;
    requestGetDeviceFile(deviceAddress: DeviceAddressType, name: string, messageId?: string): Observable<MotionMasterMessage.Status.DeviceFile>;
    requestSetDeviceFile(deviceAddress: DeviceAddressType, name: string, content: Uint8Array, overwrite: boolean, messageId?: string): Observable<MotionMasterMessage.Status.DeviceFile>;
    requestDeleteDeviceFile(deviceAddress: DeviceAddressType, name: string, messageId?: string): Observable<MotionMasterMessage.Status.DeviceFile>;
    requestResetDeviceFault(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.DeviceFaultReset>;
    requestStopDevice(deviceAddress: DeviceAddressType, messageId?: string): string;
    requestStartDeviceFirmwareInstallation(deviceAddress: DeviceAddressType, firmwarePackageContent: Uint8Array, messageId?: string): Observable<MotionMasterMessage.Status.DeviceFirmwareInstallation>;
    requestGetDeviceLog(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.DeviceLog>;
    requestStartCoggingTorqueRecording(deviceAddress: DeviceAddressType, skipAutoTuning: boolean, messageId?: string): Observable<MotionMasterMessage.Status.CoggingTorqueRecording>;
    requestGetCoggingTorqueData(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.CoggingTorqueData>;
    requestStartOffsetDetection(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.OffsetDetection>;
    requestStartPlantIdentification(deviceAddress: DeviceAddressType, durationSeconds: number, torqueAmplitude: number, startFrequency: number, endFrequency: number, cutoffFrequency: number, messageId?: string): Observable<MotionMasterMessage.Status.PlantIdentification>;
    requestComputePositionAutoTuningGains(deviceAddress: number, positionParameters: MotionMasterMessage.Request.ComputeAutoTuningGains.IPositionParameters, messageId?: string): Observable<MotionMasterMessage.Status.AutoTuning>;
    requestComputeVelocityAutoTuningGains(deviceAddress: number, velocityParameters: MotionMasterMessage.Request.ComputeAutoTuningGains.IVelocityParameters, messageId?: string): Observable<MotionMasterMessage.Status.AutoTuning>;
    requestSetMotionControllerParameters(deviceAddress: DeviceAddressType, target: number, messageId?: string): string;
    requestEnableMotionController(deviceAddress: DeviceAddressType, controllerType: MotionMasterMessage.Request.EnableMotionController.ControllerType, filterValue: boolean, messageId?: string): Observable<MotionMasterMessage.Status.MotionController>;
    requestDisableMotionController(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.MotionController>;
    requestSetSignalGeneratorParameters(setSignalGeneratorParameters: MotionMasterMessage.Request.ISetSignalGeneratorParameters, messageId?: string): string;
    requestStartSignalGenerator(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.SignalGenerator>;
    requestStopSignalGenerator(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.SignalGenerator>;
    requestStartMonitoringDeviceParameterValues(deviceAddress: DeviceAddressType, parameters: MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[], interval: number, topic: string, messageId?: string): Observable<MotionMasterMessage.Status.MonitoringParameterValues>;
    requestStopMonitoringDeviceParameterValues(startMonitoringRequestId: string, messageId?: string): Observable<MotionMasterMessage.Status.MonitoringParameterValues>;
    requestGetEthercatNetworkState(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.EthercatNetworkState>;
    requestSetEthercatNetworkState(deviceAddress: DeviceAddressType, state: MotionMasterMessage.Request.SetEthercatNetworkState.State, messageId?: string): Observable<MotionMasterMessage.Status.EthercatNetworkState>;
    requestStartNarrowAngleCalibration(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.NarrowAngleCalibration>;
    requestSetSystemClientTimeout(timeoutMs: number, messageId?: string): string;
    requestStartSystemIdentification(deviceAddress: DeviceAddressType, durationSeconds: number, torqueAmplitude: number, startFrequency: number, endFrequency: number, messageId?: string): Observable<MotionMasterMessage.Status.SystemIdentification>;
    requestGetCirculoEncoderMagnetDistance(deviceAddress: DeviceAddressType, encoderPort: number, messageId?: string): Observable<MotionMasterMessage.Status.CirculoEncoderMagnetDistance>;
    requestStartCirculoEncoderNarrowAngleCalibrationProcedure(deviceAddress: DeviceAddressType, encoderPort: number, messageId?: string): Observable<MotionMasterMessage.Status.CirculoEncoderNarrowAngleCalibrationProcedure>;
    requestGetDeviceCia402State(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.DeviceCiA402State>;
    requestSetDeviceCia402State(deviceAddress: DeviceAddressType, state: MotionMasterMessage.Status.DeviceCiA402State.State, messageId?: string): Observable<MotionMasterMessage.Status.DeviceCiA402State>;
    requestGetSystemLog(messageId?: string): Observable<MotionMasterMessage.Status.SystemLog>;
    /**
     * Select device at position in EtherCAT chain. This function makes an initial request to fetch a list of devices.
     * @param position device position in EtherCAT chain
     * @returns an observable of device messages
     */
    selectDeviceAtPosition(position: number): Observable<MotionMasterMessage.Status.DeviceInfo.IDevice | null | undefined>;
    /**
     * Select incoming messages by id.
     *
     * This function filters messages by id as there can be multiple messages coming in for a single request,
     * e.g. startOffsetDetection → started → progress → done. Ensure that you unsubscribe or use `takeWhile` operator.
     *
     * @param messageId
     * @returns an observable of motion master messages
     */
    selectMessage(messageId: string): Observable<MotionMasterMessage>;
    /**
     * Select incoming messages by id (optionally) and get their status response.
     *
     * This function filters messages by id as there can be multiple messages coming in for a single request,
     * e.g. startOffsetDetection → started → progress → done. Ensure that you unsubscribe or use `takeWhile` operator.
     *
     * @param messageId
     * @param type of status message received as a response
     */
    selectMessageStatus<T extends StatusType>(type: T, messageId?: string): StatusTypeObservable<T>;
    /**
     * Send Request message to output.
     * @param request proto message
     * @param [messageId] identifies request, if no messageId is provided one is generated with uuid v4 and returned
     * @returns passed or generated messageId
     */
    sendRequest(request: MotionMasterMessage.IRequest, messageId?: string): string;
    sendMessage(message: IMotionMasterMessage): string | null | undefined;
}
//# sourceMappingURL=motion-master-client.d.ts.map