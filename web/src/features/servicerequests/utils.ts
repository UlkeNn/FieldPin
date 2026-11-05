import { REQUEST_STATUS } from "../../api/serviceRequests";

/**
 * Admin için izin verilen durum geçişleri.
 * (Teknisyen tarafı — mobil/service-requests/my — ayrı ve daha kısıtlı;
 * bu dosya yalnızca admin panelini ilgilendiriyor.)
 * Completed ve Cancelled terminaldir, hiçbir yere geçilemez.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<number, number[]> = {
  [REQUEST_STATUS.New]: [
    REQUEST_STATUS.Assigned,
    REQUEST_STATUS.InProgress,
    REQUEST_STATUS.OnHold,
    REQUEST_STATUS.Cancelled,
  ],
  [REQUEST_STATUS.Assigned]: [
    REQUEST_STATUS.New,
    REQUEST_STATUS.InProgress,
    REQUEST_STATUS.OnHold,
    REQUEST_STATUS.Cancelled,
  ],
  [REQUEST_STATUS.InProgress]: [
    REQUEST_STATUS.Assigned,
    REQUEST_STATUS.OnHold,
    REQUEST_STATUS.Completed,
    REQUEST_STATUS.Cancelled,
  ],
  [REQUEST_STATUS.OnHold]: [REQUEST_STATUS.InProgress, REQUEST_STATUS.Cancelled],
  [REQUEST_STATUS.Completed]: [],
  [REQUEST_STATUS.Cancelled]: [],
};

export function isTerminalStatus(status: number): boolean {
  return status === REQUEST_STATUS.Completed || status === REQUEST_STATUS.Cancelled;
}

export function requiresResolutionNote(targetStatus: number): boolean {
  return (
    targetStatus === REQUEST_STATUS.Completed ||
    targetStatus === REQUEST_STATUS.Cancelled
  );
}

/**
 * Öncelik chip rengi. Kritik/Yüksek kırmızı-turuncu tonlarında,
 * Düşük/Normal daha nötr — liste taramasında göz hemen kritik
 * kayıtlara gitsin diye.
 */
export function priorityColor(
  priority: number,
): "default" | "info" | "warning" | "error" {
  if (priority === 4) return "error"; // Critical
  if (priority === 3) return "warning"; // High
  if (priority === 2) return "info"; // Normal
  return "default"; // Low
}

/**
 * Durum chip rengi.
 */
export function statusColor(
  status: number,
): "default" | "info" | "warning" | "success" | "error" {
  if (status === REQUEST_STATUS.New) return "default";
  if (status === REQUEST_STATUS.Assigned) return "info";
  if (status === REQUEST_STATUS.InProgress) return "warning";
  if (status === REQUEST_STATUS.OnHold) return "warning";
  if (status === REQUEST_STATUS.Completed) return "success";
  return "error"; // Cancelled
}
