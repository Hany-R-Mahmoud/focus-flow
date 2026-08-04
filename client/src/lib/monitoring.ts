import {
  captureError,
  event,
  initHeronSignal,
  log,
  type HeronSignalLogLevel,
  type HeronSignalPayload,
} from "@heronsignal/web";

const publicKey = (import.meta.env.VITE_HERONSIGNAL_PUBLIC_KEY || "").trim();

export function initializeMonitoring() {
  if (!publicKey) return;

  void initHeronSignal({
    publicKey,
    captureNetworkFailures: true,
    captureRuntimeErrors: true,
    captureResourceErrors: true,
  }).catch(error => {
    console.error("Failed to initialize HeronSignal", error);
  });
}

export function reportMonitoringError(error: unknown) {
  if (!publicKey) return;
  captureError(error instanceof Error ? error : String(error));
}

export function trackMonitoringEvent(
  name: string,
  payload?: HeronSignalPayload
) {
  if (!publicKey) return;
  event(name, payload);
}

export function logMonitoring(
  level: HeronSignalLogLevel,
  message: string,
  data?: HeronSignalPayload
) {
  if (!publicKey) return;
  log(level, message, data);
}
