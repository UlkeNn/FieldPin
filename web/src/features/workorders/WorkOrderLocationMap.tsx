import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { type WorkOrderMapPointDto } from "../../api/map";
import { jobTypeLabel, systemTypeLabel } from "../../api/workorders";
import animationGif from "../../assets/animation_map.gif";
import { brandColors } from "../../theme";

// ── Leaflet default marker icon path düzeltmesi (Vite bozuyor) ──
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// ─────────────────────────────────────────────────────────────
// SABİTLER
// ─────────────────────────────────────────────────────────────
const CLUSTER_RADIUS_PX = 60;     // bu pixel mesafenin altındaki pinler kümelenir
const SPIDERFY_RADIUS_PX = 75;    // spiderfy yarıçapı
const SPIDERFY_RADIUS_PX_LARGE = 110; // 8'den fazla pin varsa daha geniş yay
const IZMIR: [number, number] = [38.4237, 27.1428];

// ─────────────────────────────────────────────────────────────
// YARDIMCI: GRADIENT RENK (yeşil → kırmızı)
// İlk pin yeşil, son pin kırmızı, aralar HSL hue interpolation ile
// ─────────────────────────────────────────────────────────────
function gradientColor(index: number, total: number): string {
  if (total <= 1) return "hsl(135, 70%, 42%)"; // tek nokta → yeşil
  const t = index / (total - 1);                // 0..1
  const hue = 135 - 135 * t;                    // 135 (yeşil) → 0 (kırmızı)
  return `hsl(${hue}, 75%, 45%)`;
}

// ─────────────────────────────────────────────────────────────
// YARDIMCI: HAVERSINE (km) — düz mesafe
// ─────────────────────────────────────────────────────────────
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ─────────────────────────────────────────────────────────────
// YARDIMCI: NUMARALI GRADIENT PIN (divIcon)
// ─────────────────────────────────────────────────────────────
function numberedPinIcon(num: number, color: string, isSelected = false): L.DivIcon {
  const size = isSelected ? 34 : 28;
  const ring = isSelected ? "0 0 0 4px rgba(37,99,235,0.45)" : "0 2px 6px rgba(0,0,0,0.35)";
  return L.divIcon({
    className: "fp-numbered-pin",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      color:#fff;
      display:flex;align-items:center;justify-content:center;
      border-radius:50%;
      font-weight:800;font-size:${size > 30 ? 14 : 12}px;
      border:2.5px solid #fff;
      box-shadow:${ring};
      transition:transform .15s ease;
    ">${num}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// ─────────────────────────────────────────────────────────────
// YARDIMCI: BASİT (NUMARASIZ) PIN — detay sayfası için
// ─────────────────────────────────────────────────────────────
function plainPinIcon(): L.DivIcon {
  return L.divIcon({
    className: "fp-plain-pin",
    html: `<div style="
      width:22px;height:22px;
      background:#2563eb;
      border-radius:50%;
      border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
}

// ─────────────────────────────────────────────────────────────
// YARDIMCI: CLUSTER PIN (GIF + sayaç)
// ─────────────────────────────────────────────────────────────
function clusterPinIcon(lastRouteIndex: number, count: number,color : string, gifUrl: string, faded = false): L.DivIcon {
  const opacity = faded ? 0.35 : 1;
  return L.divIcon({
    className: "fp-cluster-pin",
    html: `
      <div class="fp-cluster-wrap" style="opacity:${opacity};">
        <div class="fp-cluster-bubble"
             style="background-image:url('${gifUrl}'); background-color: ${color};">
            <span class="fp-cluster-number">${lastRouteIndex}</span> 
        </div>
        <div class="fp-cluster-badge">${count}</div>
      </div>`,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
    popupAnchor: [0, -28],
  });
}

// ─────────────────────────────────────────────────────────────
// İç tip: rota indeksli nokta
// ─────────────────────────────────────────────────────────────
type IndexedPoint = WorkOrderMapPointDto & { routeIndex: number };

// ─────────────────────────────────────────────────────────────
// İç tip: cluster
// ─────────────────────────────────────────────────────────────
type Cluster = {
  id: string;                 // cluster identity (ilk pointId tabanlı)
  centerLatLng: [number, number];
  centerPx: L.Point;
  points: IndexedPoint[];
};

// ─────────────────────────────────────────────────────────────
// MAP DAVRANIŞLARI
// fitBounds + selectedId davranışı için yardımcı 
// ─────────────────────────────────────────────────────────────
function MapBehaviors({
  positions,
  selectedPoint,
}: {
  positions: [number, number][];
  selectedPoint: IndexedPoint | null;
}) {
  const map = useMap();

  useEffect(() => {
  if (positions.length === 0) return;

  // harita ilk yüklendiğinde veya noktalar gerçekten 
  // değiştiğinde (örn. filtreleme) fitBounds yapması için:
  const bounds = L.latLngBounds(positions);
  map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [positions.length]); // Sadece nokta sayısı değiştiğinde tetiklensin

  // Yan listeden seçim → o noktaya zoom
  useEffect(() => {
    if (!selectedPoint) return;
    map.flyTo([selectedPoint.latitude, selectedPoint.longitude], 17, {
      duration: 0.7,
    });
  }, [selectedPoint, map]);

  return null;
}

// ─────────────────────────────────────────────────────────────
// Zoom değişimini yakalayıp dışarıya bildiren küçük yardımcı
// ─────────────────────────────────────────────────────────────
function ZoomTracker({ onZoomChange }: { onZoomChange: (z: number) => void }) {
  const map = useMap();
  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);
  useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
    moveend: () => onZoomChange(map.getZoom()), // pan sonrası da hesabı tazele
  });
  return null;
}

// ─────────────────────────────────────────────────────────────
// Boş alana tıklayınca spiderfy'ı kapatmak için
// ─────────────────────────────────────────────────────────────
function MapClickClose({ onClose }: { onClose: () => void }) {
  useMapEvents({ click: () => onClose() });
  return null;
}

// ─────────────────────────────────────────────────────────────
// CLUSTER + SPIDERFY KATMANI
// useMap kullandığı için MapContainer içinde render edilir.
// ─────────────────────────────────────────────────────────────
function ClusterLayer({
  points,
  zoom,
  spiderfiedClusterId,
  setSpiderfiedClusterId,
  selectedPointId,
  showRouteNumbers,
  popupRefById,
}: {
  points: IndexedPoint[];
  zoom: number;
  spiderfiedClusterId: string | null;
  setSpiderfiedClusterId: (id: string | null) => void;
  selectedPointId: string | null;
  showRouteNumbers: boolean;
  popupRefById: React.MutableRefObject<Record<string, L.Marker | null>>;
}) {
  const map = useMap();

  // Pixel-tabanlı greedy clustering
  const clusters = useMemo<Cluster[]>(() => {
    if (points.length === 0) return [];
    const out: Cluster[] = [];

    for (const p of points) {
      const px = map.project([p.latitude, p.longitude], zoom);
      let placed = false;

      for (const c of out) {
        const dx = px.x - c.centerPx.x;
        const dy = px.y - c.centerPx.y;
        if (Math.hypot(dx, dy) < CLUSTER_RADIUS_PX) {
          c.points.push(p);
          placed = true;
          break;
        }
      }

      if (!placed) {
        out.push({
          id: `c-${p.id}`,
          centerLatLng: [p.latitude, p.longitude],
          centerPx: px,
          points: [p],
        });
      }
    }
    return out;
  }, [points, zoom, map]);

  // Spiderfy: aktif cluster'ın çocukları için sahte konumlar üret
  const spiderfiedCluster = useMemo(
    () => clusters.find((c) => c.id === spiderfiedClusterId) || null,
    [clusters, spiderfiedClusterId]
  );

  type SpiderItem = {
    point: IndexedPoint;
    fakeLatLng: [number, number];
    realLatLng: [number, number];
  };

  const spiderItems: SpiderItem[] = useMemo(() => {
    if (!spiderfiedCluster) return [];
    const n = spiderfiedCluster.points.length;
    if (n <= 1) return [];

    const radius = n > 8 ? SPIDERFY_RADIUS_PX_LARGE : SPIDERFY_RADIUS_PX;
    const center = spiderfiedCluster.centerPx;

    return spiderfiedCluster.points.map((pt, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2; // tepeden başla
      const fakePx = L.point(
        center.x + radius * Math.cos(angle),
        center.y + radius * Math.sin(angle)
      );
      const fakeLatLng = map.unproject(fakePx, zoom);
      return {
        point: pt,
        fakeLatLng: [fakeLatLng.lat, fakeLatLng.lng],
        realLatLng: [pt.latitude, pt.longitude],
      };
    });
  }, [spiderfiedCluster, map, zoom]);

  // selectedPointId değişince → o nokta hangi cluster'da, gerekirse aç + popup
  useEffect(() => {
    if (!selectedPointId) return;
    const owner = clusters.find((c) =>
      c.points.some((p) => p.id === selectedPointId)
    );
    if (!owner) return;

    if (owner.points.length > 1) {
      // Cluster içindeyse: önce spiderfy aç, sonra ilgili marker popup'ını aç
      setSpiderfiedClusterId(owner.id);
      // Popup'ı bir tick sonra aç (render için)
      setTimeout(() => {
        const m = popupRefById.current[selectedPointId];
        m?.openPopup();
      }, 60);
    } else {
      setSpiderfiedClusterId(null);
      setTimeout(() => {
        const m = popupRefById.current[selectedPointId];
        m?.openPopup();
      }, 60);
    }
  }, [selectedPointId, clusters, setSpiderfiedClusterId, popupRefById]);

  return (
    <>
      {/* ── Tek pinli clusterlar */}
      {clusters
        .filter((c) => c.points.length === 1)
        .map((c) => {
          const p = c.points[0];
          const total = points.length;
          const color = gradientColor(p.routeIndex - 1, total);
          const isSelected = selectedPointId === p.id;
          const icon = showRouteNumbers
            ? numberedPinIcon(p.routeIndex, color, isSelected)
            : plainPinIcon();

          return (
            <Marker
              key={p.id}
              position={[p.latitude, p.longitude]}
              icon={icon}
              ref={(m) => {
                popupRefById.current[p.id] = m as L.Marker | null;
              }}
            >
              <Popup autoPan={false}>
                <PointPopupContent point={p} total={total} />
              </Popup>
            </Marker>
          );
        })}

      {/* ── Çoklu cluster'lar !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */}
      {clusters
        .filter((c) => c.points.length > 1)
        .map((c) => {
          const isOpen = c.id === spiderfiedClusterId;

          //son iş numarası alınır clusterda buradayken
          const lastRouteIndex = c.points.reduce(
            (maxPointNumber, p) => (p.routeIndex > maxPointNumber ? p.routeIndex : maxPointNumber),
            c.points[0].routeIndex
          );

          const color = gradientColor(lastRouteIndex - 1, points.length);

          return (
            <Marker
              key={c.id}
              position={c.centerLatLng}
              icon={clusterPinIcon(lastRouteIndex, c.points.length, color, animationGif, isOpen)}
              eventHandlers={{
                click: (e) => {
                  // Haritanın click event'ini yakalamasın diye
                  L.DomEvent.stopPropagation(e.originalEvent);
                  setSpiderfiedClusterId(isOpen ? null : c.id);
                },
              }}
            />
          );
        })}

      {/* ── Spiderfy: leader lines + sahte konumdaki numaralı pinler ── */}
      {spiderfiedCluster &&
        spiderItems.map((s) => {
          const total = points.length;
          const color = gradientColor(s.point.routeIndex - 1, total);
          const isSelected = selectedPointId === s.point.id;
          return (
            <span key={`sp-${s.point.id}`}>
              <Polyline
                positions={[spiderfiedCluster.centerLatLng, s.fakeLatLng]}
                pathOptions={{
                  color: "#94a3b8",
                  weight: 1.5,
                  opacity: 0.85,
                  dashArray: "3 4",
                }}
              />
              <Marker
                position={s.fakeLatLng}
                icon={
                  showRouteNumbers
                    ? numberedPinIcon(s.point.routeIndex, color, isSelected)
                    : plainPinIcon()
                }
                ref={(m) => {
                  popupRefById.current[s.point.id] = m as L.Marker | null;
                }}
                eventHandlers={{
                  click: (e) => L.DomEvent.stopPropagation(e.originalEvent),
                }}
              >
                <Popup autoPan={false}>
                  <PointPopupContent point={s.point} total={total} />
                </Popup>
              </Marker>
            </span>
          );
        })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Pin popup içeriği (Türkçe labels)
// ─────────────────────────────────────────────────────────────
function PointPopupContent({
  point,
  total,
}: {
  point: IndexedPoint;
  total: number;
}) {
  const dot = gradientColor(point.routeIndex - 1, total);
  return (
    <div style={{ minWidth: 220, fontFamily: "inherit" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: dot,
            color: "#fff",
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          {point.routeIndex}
        </span>
        <strong style={{ fontSize: 14 }}>
          {point.routeIndex}. Durak
        </strong>
      </div>
      <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
        <div>
          <span style={{ color: "#667085" }}>Müşteri:</span>{" "}
          <strong>{point.customerName || "-"}</strong>
        </div>
        <div>
          <span style={{ color: "#667085" }}>Sistem:</span>{" "}
          {systemTypeLabel(point.systemType)} •{" "}
          <span style={{ color: "#667085" }}>İş:</span>{" "}
          {jobTypeLabel(point.jobType)}
        </div>
        <div>
          <span style={{ color: "#667085" }}>Tarih:</span>{" "}
          {new Date(point.createdAt).toLocaleString("tr-TR")}
        </div>
        {point.notes?.trim() ? (
          <div style={{ marginTop: 4, color: "#374151" }}>
            <em>"{point.notes}"</em>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────
interface Props {
  points: WorkOrderMapPointDto[];
  /** Numaralı + gradient pinler kullanılsın mı? (default true).
   *  WorkOrdersPage tek-noktalı detay görünümünde false geçebilir. */
  showRouteNumbers?: boolean;
  /** Yan listeden tıklanan nokta — varsa harita o pin'e zoom + popup açar. */
  selectedPointId?: string | null;
}

export const WorkOrderLocationMap: React.FC<Props> = ({
  points,
  showRouteNumbers = true,
  selectedPointId = null,
}) => {
  // Tarihe göre sıralı + routeIndex
  const sortedPoints = useMemo<IndexedPoint[]>(() => {
    return [...points]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .map((p, i) => ({ ...p, routeIndex: i + 1 }));
  }, [points]);

  const linePositions: [number, number][] = sortedPoints.map((p) => [
    p.latitude,
    p.longitude,
  ]);

  const [zoom, setZoom] = useState<number>(11);
  const [spiderfiedClusterId, setSpiderfiedClusterId] =
    useState<string | null>(null);

  // Zoom değiştiğinde clustering yeniden hesaplanacağı için
  // yanlış bir cluster'a kilitlenmiş kalabiliriz; kapatalım
  useEffect(() => {
    setSpiderfiedClusterId(null);
  }, [zoom, points]);

  const popupRefById = useRef<Record<string, L.Marker | null>>({});

  const selectedPoint =
    sortedPoints.find((p) => p.id === selectedPointId) || null;

  const isEmpty = sortedPoints.length === 0;

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {/* Leaflet özel stilleri (cluster, hover, vs.) */}
      <style>{`
        .fp-cluster-wrap {
          position: relative;
          width: 56px;
          height: 56px;
          transition: transform .2s ease;
        }
        .fp-cluster-bubble {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          background-color: ${brandColors.teal};
          border: 3px solid #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        }
          .fp-cluster-number {
            color: #fff;
            font-size: 20px;
            font-weight: 900;
            line-height: 1;
            line-spacing: -0.5px;
            text-shadow:
              0 1px 3px rgba(0,0,0,0.85),
              0 0 8px rgba(0,0,0,0.6);
            pointer-events: none;
          }
        .fp-cluster-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          border-radius: 11px;
          background: #111827;
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .fp-cluster-pin:hover .fp-cluster-wrap {
          transform: scale(1.12);
        }
        .fp-cluster-pin {
          cursor: pointer;
        }
        .fp-numbered-pin > div:hover {
          transform: scale(1.18);
        }
        .leaflet-popup-content-wrapper {
          border-radius: 10px;
        }
      `}</style>

      <MapContainer
        center={IZMIR}
        zoom={11}
        style={{ height: "100%", width: "100%", minHeight: 400 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomTracker onZoomChange={setZoom} />
        <MapClickClose onClose={() => setSpiderfiedClusterId(null)} />
        <MapBehaviors
          positions={linePositions}
          selectedPoint={selectedPoint}
        />

        {/* Rota çizgisi (kronolojik) */}
        {linePositions.length > 1 && (
          <Polyline
            positions={linePositions}
            pathOptions={{
              color: "#2563eb",
              weight: 3,
              opacity: 0.7,
              dashArray: "6 8",
            }}
          />
        )}

        {/* Cluster + spiderfy */}
        <ClusterLayer
          points={sortedPoints}
          zoom={zoom}
          spiderfiedClusterId={spiderfiedClusterId}
          setSpiderfiedClusterId={setSpiderfiedClusterId}
          selectedPointId={selectedPointId}
          showRouteNumbers={showRouteNumbers}
          popupRefById={popupRefById}
        />
      </MapContainer>

      {/* Empty state overlay */}
      {isEmpty && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(2px)",
            pointerEvents: "none",
            zIndex: 500,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "14px 22px",
              borderRadius: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Bu aralıkta konumu kaydedilmiş iş yok.
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderLocationMap;