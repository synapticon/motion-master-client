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
export declare type StatusTypeObservable<T extends StatusType> = T extends 'systemPong' ? Observable<MotionMasterMessage.Status.ISystemPong> : T extends 'systemVersion' ? Observable<MotionMasterMessage.Status.ISystemVersion> : T extends 'systemEvent' ? Observable<MotionMasterMessage.Status.ISystemEvent> : T extends 'deviceInfo' ? Observable<MotionMasterMessage.Status.IDeviceInfo> : T extends 'deviceParameterInfo' ? Observable<MotionMasterMessage.Status.IDeviceParameterInfo> : T extends 'deviceParameterValues' ? Observable<MotionMasterMessage.Status.IDeviceParameterValues> : T extends 'multiDeviceParameterValues' ? Observable<MotionMasterMessage.Status.IMultiDeviceParameterValues> : T extends 'deviceFileList' ? Observable<MotionMasterMessage.Status.IDeviceFileList> : T extends 'deviceFile' ? Observable<MotionMasterMessage.Status.IDeviceFile> : T extends 'deviceEvent' ? Observable<MotionMasterMessage.Status.IDeviceEvent> : T extends 'deviceFirmwareInstallation' ? Observable<MotionMasterMessage.Status.IDeviceFirmwareInstallation> : T extends 'deviceLog' ? Observable<MotionMasterMessage.Status.IDeviceLog> : T extends 'deviceFaultReset' ? Observable<MotionMasterMessage.Status.IDeviceFaultReset> : T extends 'coggingTorqueRecording' ? Observable<MotionMasterMessage.Status.ICoggingTorqueRecording> : T extends 'coggingTorqueData' ? Observable<MotionMasterMessage.Status.ICoggingTorqueData> : T extends 'offsetDetection' ? Observable<MotionMasterMessage.Status.IOffsetDetection> : T extends 'plantIdentification' ? Observable<MotionMasterMessage.Status.IPlantIdentification> : T extends 'autoTuning' ? Observable<MotionMasterMessage.Status.IAutoTuning> : T extends 'motionController' ? Observable<MotionMasterMessage.Status.IMotionController> : T extends 'signalGenerator' ? Observable<MotionMasterMessage.Status.ISignalGenerator> : T extends 'monitoringParameterValues' ? Observable<MotionMasterMessage.Status.IMonitoringParameterValues> : T extends 'deviceStop' ? Observable<MotionMasterMessage.Status.IDeviceStop> : T extends 'ethercatNetworkState' ? Observable<MotionMasterMessage.Status.IEthercatNetworkState> : T extends 'narrowAngleCalibration' ? Observable<MotionMasterMessage.Status.NarrowAngleCalibration> : T extends 'systemIdentification' ? Observable<MotionMasterMessage.Status.ISystemIdentification> : Observable<any>;
export declare class MotionMasterClient {
    readonly input$: Subject<IMotionMasterMessage>;
    readonly output$: Subject<IMotionMasterMessage>;
    status$: Observable<MotionMasterMessage.IStatus | null | undefined>;
    requestPingSystem(messageId?: string): Observable<MotionMasterMessage.Status.ISystemPong>;
    requestGetSystemVersion(messageId?: string): Observable<MotionMasterMessage.Status.ISystemVersion>;
    requestGetDeviceInfo(messageId?: string): Observable<MotionMasterMessage.Status.IDeviceInfo>;
    requestGetDeviceParameterInfo(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.IDeviceParameterInfo>;
    requestGetDeviceParameterValues(deviceAddress: DeviceAddressType, parameters: MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[], messageId?: string): Observable<MotionMasterMessage.Status.IDeviceParameterValues>;
    requestSetDeviceParameterValues(deviceAddress: DeviceAddressType, parameterValues: MotionMasterMessage.Request.SetDeviceParameterValues.IParameterValue[], messageId?: string): Observable<MotionMasterMessage.Status.IDeviceParameterValues>;
    requestGetDeviceFileList(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.IDeviceFileList>;
    requestGetDeviceFile(deviceAddress: DeviceAddressType, name: string, messageId?: string): Observable<MotionMasterMessage.Status.IDeviceFile>;
    requestSetDeviceFile(deviceAddress: DeviceAddressType, name: string, content: Uint8Array, overwrite: boolean, messageId?: string): Observable<MotionMasterMessage.Status.IDeviceFile>;
    requestDeleteDeviceFile(deviceAddress: DeviceAddressType, name: string, messageId?: string): Observable<MotionMasterMessage.Status.IDeviceFile>;
    requestResetDeviceFault(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.IDeviceFaultReset>;
    requestStopDevice(deviceAddress: DeviceAddressType, messageId?: string): string;
    requestStartDeviceFirmwareInstallation(deviceAddress: DeviceAddressType, firmwarePackageContent: Uint8Array, messageId?: string): Observable<MotionMasterMessage.Status.IDeviceFirmwareInstallation>;
    requestGetDeviceLog(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.IDeviceLog>;
    requestStartCoggingTorqueRecording(deviceAddress: DeviceAddressType, skipAutoTuning: boolean, messageId?: string): Observable<MotionMasterMessage.Status.ICoggingTorqueRecording>;
    requestGetCoggingTorqueData(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.ICoggingTorqueData>;
    requestStartOffsetDetection(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.IOffsetDetection>;
    requestStartPlantIdentification(deviceAddress: DeviceAddressType, durationSeconds: number, torqueAmplitude: number, startFrequency: number, endFrequency: number, cutoffFrequency: number, messageId?: string): Observable<MotionMasterMessage.Status.IPlantIdentification>;
    requestComputePositionAutoTuningGains(deviceAddress: number, positionParameters: MotionMasterMessage.Request.ComputeAutoTuningGains.IPositionParameters, messageId?: string): Observable<MotionMasterMessage.Status.IAutoTuning>;
    requestComputeVelocityAutoTuningGains(deviceAddress: number, velocityParameters: MotionMasterMessage.Request.ComputeAutoTuningGains.IVelocityParameters, messageId?: string): Observable<MotionMasterMessage.Status.IAutoTuning>;
    requestSetMotionControllerParameters(deviceAddress: DeviceAddressType, target: number, messageId?: string): string;
    requestEnableMotionController(deviceAddress: DeviceAddressType, controllerType: MotionMasterMessage.Request.EnableMotionController.ControllerType, filterValue: boolean, messageId?: string): Observable<MotionMasterMessage.Status.IMotionController>;
    requestDisableMotionController(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.IMotionController>;
    requestSetSignalGeneratorParameters(setSignalGeneratorParameters: MotionMasterMessage.Request.ISetSignalGeneratorParameters, messageId?: string): string;
    requestStartSignalGenerator(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.ISignalGenerator>;
    requestStopSignalGenerator(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.ISignalGenerator>;
    requestStartMonitoringDeviceParameterValues(deviceAddress: DeviceAddressType, parameters: MotionMasterMessage.Request.GetDeviceParameterValues.IParameter[], interval: number, topic: string, messageId?: string): Observable<MotionMasterMessage.Status.IMonitoringParameterValues>;
    requestStopMonitoringDeviceParameterValues(startMonitoringRequestId: string, messageId?: string): Observable<MotionMasterMessage.Status.IMonitoringParameterValues>;
    requestGetEthercatNetworkState(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.IEthercatNetworkState>;
    requestSetEthercatNetworkState(deviceAddress: DeviceAddressType, state: MotionMasterMessage.Request.SetEthercatNetworkState.State, messageId?: string): Observable<MotionMasterMessage.Status.IEthercatNetworkState>;
    requestStartNarrowAngleCalibration(deviceAddress: DeviceAddressType, messageId?: string): Observable<MotionMasterMessage.Status.NarrowAngleCalibration>;
    requestSetSystemClientTimeout(timeoutMs: number, messageId?: string): string;
    requestStartSystemIdentification(deviceAddress: DeviceAddressType, durationSeconds: number, torqueAmplitude: number, startFrequency: number, endFrequency: number, cutoffFrequency: number, messageId?: string): Observable<MotionMasterMessage.Status.ISystemIdentification>;
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
    selectMessage(messageId: string): Observable<IMotionMasterMessage>;
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