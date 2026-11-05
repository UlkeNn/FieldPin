import type {
  WorkOrderObjectDto,
  WorkOrderObjectMediaDto,
} from "../../api/workorders";

/**
 * Nesne tipi numarasını okunabilir etikete çevirir.
 */
export function objectTypeLabel(n: number): string {
  if (n === 1) return "ARAÇ";
  if (n === 2) return "CİHAZ";
  if (n === 3) return "SENSÖR";
  if (n === 4) return "GATEWAY";
  if (n === 99) return "DİĞER";
  return `TYPE-${n}`;
}

/**
 * Eski endpoint tek foto url döndürdüğünde bile uyumlu şekilde
 * medya listesini normalize eder.
 */
export function normalizeObjectMedia(
  object: WorkOrderObjectDto
): WorkOrderObjectMediaDto[] {
  if (Array.isArray(object.media) && object.media.length > 0) {
    return object.media;
  }

  if (object.url) {
    return [
      {
        id: `${object.id}-legacy`,
        url: object.url,
        fileName: "legacy-image",
        originalFileName: null,
        contentType: null,
        sizeBytes: null,
        createdAt: object.createdAt,
      },
    ];
  }

  return [];
}
