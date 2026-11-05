# Service Requests API (Talep Modülü)

Müşteriden gelen montaj/değişim/arıza taleplerini yöneten API. Bir talep (`ServiceRequest`)
sahadaki işi temsil eden `WorkOrder`'dan ayrı, iş öncesi bir kayıttır; bir talepten birden
çok iş emri (`WorkOrder`) üretilebilir (1-N ilişki).

Bu doküman şu iki controller'ı kapsar:

| Controller | Base path | Kim kullanır |
|---|---|---|
| Admin — Service Requests | `api/admin/service-requests` | Admin paneli |
| Technician — Service Requests | `api/service-requests` | Mobil / teknisyen |

Talebin türü `jobType` (Montaj/Değişim/Arıza) ile belirlenir; ayrı bir kategori ağacı yoktur.

---

## Ortak kurallar

### Base URL & Auth

Tüm endpoint'ler JWT bearer auth ister (aksi belirtilmedikçe):

```
Authorization: Bearer <accessToken>
```

Token, `POST /api/auth/login` ile alınır:

```json
// İstek
{ "username": "admin", "password": "..." }

// Yanıt (200)
{
  "accessToken": "eyJhbGciOi...",
  "expiresAtUtc": "2026-09-20T18:23:00.739549Z",
  "userId": "admin-001",
  "role": "Admin",
  "refreshToken": "DPfBLHqcHN..."
}
```

Access token ömrü kısadır (~15 dk); süresi dolunca `POST /api/auth/refresh` ile yenilenir.

### JSON kuralları

- Property adları **camelCase** (`requestNo`, `assignedUserId`, ...).
- **Enum'lar sayı olarak** serialize edilir (string değil) — aşağıdaki enum tablolarına bakın.
- `DateTime` alanları UTC, ISO-8601 (`"2026-09-20T18:23:00.739549Z"`).
- `Guid` alanları standart tire'li string formatında.

### Sayfalama — `PagedResponse<T>`

Liste endpoint'leri bu zarfı döner:

```json
{
  "items": [ /* T[] */ ],
  "page": 1,
  "pageSize": 15,
  "totalCount": 42,
  "totalPages": 3
}
```

- `page` varsayılan `1`, `pageSize` varsayılan `15`.
- `pageSize` sunucu tarafında **50'de clamp edilir** — `pageSize=500` gönderirseniz yanıtta
  `pageSize: 50` döner ve en fazla 50 kayıt gelir. `page < 1` gönderilirse `1` kabul edilir.

### Optimistic concurrency — `RowVersion`

`ServiceRequest` kaydı bir `rowVersion` (Guid) taşır. Güncelleme (`PUT`) isteğinde son
okuduğunuz `rowVersion`'ı geri gönderirseniz, sizden sonra başka biri kaydı değiştirmişse
istek **409 Conflict** ile reddedilir. `rowVersion` göndermezseniz concurrency kontrolü
uygulanmaz (son yazan kazanır).

### Hata formatları

Bu API'de merkezi bir hata middleware'i yok; üç farklı gövde şekli görebilirsiniz:

| Durum | HTTP kodu | Gövde şekli |
|---|---|---|
| İş kuralı ihlali (örn. zorunlu alan eksik, geçersiz durum geçişi) | 400 | Düz metin (`Content-Type: text/plain`), örn. `"Başlık zorunludur."` |
| Model binding hatası (örn. geçersiz enum değeri, bozuk JSON) | 400 | `application/problem+json` — ASP.NET Core'un standart `ValidationProblemDetails` şeması (`{"title":"One or more validation errors occurred.","status":400,"errors":{...}}`) |
| Kayıt bulunamadı | 404 | Boş veya düz metin (örn. `"ServiceRequest not found."`) |
| Yetkisiz (token yok/geçersiz) | 401 | Boş gövde |
| Yasak (rol uygun değil / sahiplik kontrolü) | 403 | Boş gövde |
| Concurrency çakışması (`rowVersion` uyuşmuyor) | 409 | Düz metin |

Aşağıdaki her endpoint için gerçek hata mesajları ayrı ayrı listelenmiştir.

### Enum referansı

**RequestStatus** — `Completed` ve `Cancelled` terminaldir, oradan başka duruma geçiş yoktur.

| Değer | Anlam |
|---|---|
| 1 | New (Yeni) |
| 2 | Assigned (Atandı) |
| 3 | InProgress (İşlemde) |
| 4 | OnHold (Beklemede) |
| 5 | Completed (Tamamlandı) |
| 6 | Cancelled (İptal) |

**RequestPriority**

| Değer | Anlam |
|---|---|
| 1 | Low |
| 2 | Normal |
| 3 | High |
| 4 | Critical |

**RequestSource**

| Değer | Anlam |
|---|---|
| 1 | Web (Admin panelinden elle açıldı) |
| 2 | WhatsApp (alanlar elle girildi) |
| 3 | WhatsAppAi (AI ile otomatik dolduruldu — `rawPayload` zorunlu) |
| 4 | Email |
| 5 | Phone |

**SystemType**

| Değer | Anlam |
|---|---|
| 1 | System1 |
| 2 | System2 |

**JobType**

| Değer | Anlam |
|---|---|
| 1 | NewInstall (Montaj) |
| 2 | Replacement (Değişim) |
| 3 | Fault (Arıza) |

**ObjectType** (`deviceType` alanında kullanılır)

| Değer | Anlam |
|---|---|
| 1 | Plate |
| 2 | Device |
| 3 | Sensor |
| 4 | Gateway |
| 99 | Other |

**LocationSource**

| Değer | Anlam |
|---|---|
| 1 | Gps |
| 2 | Network |
| 3 | Manual |

### Dosya yükleme kuralları (medya endpoint'leri)

- Form alanı adı: **`files`** (`multipart/form-data`, çoklu dosya desteklenir).
- İzin verilen formatlar: `jpg`, `jpeg`, `png`, `webp`, `heic`, `heif`.
- HEIC/HEIF dosyalar otomatik **JPEG'e çevrilir** (kalite 85, EXIF auto-orient uygulanır) —
  dönen `contentType` bu durumda `image/jpeg` ve dosya uzantısı `.jpg` olur.
- İstek gövdesi limiti: **50 MB**.
- Yüklenen dosyalar `/uploads/servicerequests/{requestId}/{guid}.{ext}` altında statik olarak
  servis edilir; yanıttaki `url` alanı doğrudan tıklanabilir/gösterilebilir mutlak URL'dir.

---

## 1. Admin — Service Requests (`api/admin/service-requests`)

Tüm endpoint'ler `Authorize(Roles = "Admin")` — sadece Admin rolündeki kullanıcılar erişebilir.

### `GET /api/admin/service-requests`

Talepleri sayfalı ve filtreli listeler. Tüm query parametreleri opsiyoneldir.

**Query parametreleri**

| Parametre | Tip | Açıklama |
|---|---|---|
| `q` | string | `requestNo`, `title`, `description`, `requesterName`, `requesterPhone` içinde arama |
| `status` | RequestStatus | |
| `priority` | RequestPriority | |
| `source` | RequestSource | |
| `systemType` | SystemType | |
| `jobType` | JobType | |
| `customerId` | Guid | |
| `assignedUserId` | string | |
| `unassigned` | bool | `true` ise sadece atanmamış talepler |
| `overdueOnly` | bool | `true` ise SLA'i geçmiş ve hâlâ açık talepler |
| `from` / `to` | DateTime | `createdAtUtc` aralığı — `to` günü dahil edilir (gün sonuna kadar) |
| `sort` | string | `createdAt` \| `priority` \| `slaDueAt`; `-` öneki azalan sıralama. Varsayılan `-createdAt` |
| `page` | int | Varsayılan `1` |
| `pageSize` | int | Varsayılan `15`, en fazla `50` |

**Örnek istek**

```
GET /api/admin/service-requests?status=2&priority=4&sort=-slaDueAt&page=1&pageSize=15
```

**Yanıt — 200**

```json
{
  "items": [
    {
      "id": "9ef2c141-584b-40cc-8ab3-143da44d28a2",
      "requestNo": "TLP-1001",
      "title": "Kamera görüntü vermiyor",
      "status": 2,
      "priority": 3,
      "source": 5,
      "systemType": 2,
      "jobType": 3,
      "customer": {
        "id": "aa67023b-1e54-42ba-b41f-631572f7ddd9",
        "name": "Ahmet Yılmaz",
        "info": "Test müşteri",
        "phone": "0555 000 0001"
      },
      "assignedUserId": "d83ec9799cf44069afbdab7e6fb6c403",
      "assignedUserName": "deneme",
      "createdAtUtc": "2026-09-20T18:16:14.259973Z",
      "slaDueAtUtc": "2026-09-21T12:00:00Z",
      "isOverdue": false,
      "workOrderCount": 0,
      "mediaCount": 0
    }
  ],
  "page": 1,
  "pageSize": 15,
  "totalCount": 1,
  "totalPages": 1
}
```

Not: liste satırı (`ServiceRequestListItemDto`) `media`/`workOrders` dizilerini **içermez**,
sadece `mediaCount`/`workOrderCount` sayılarını verir — detay için `GET /{id}` çağırın.

**Hatalar**: yok (boş sonuç `totalCount: 0` ile 200 döner).

---

### `GET /api/admin/service-requests/{id}`

Tek bir talebin tam detayını döner.

**Yanıt — 200** (`ServiceRequestDetailDto`)

```json
{
  "id": "9ef2c141-584b-40cc-8ab3-143da44d28a2",
  "requestNo": "TLP-1001",
  "title": "Kamera görüntü vermiyor",
  "description": "Müşteri aradı, 2 nolu kamera 3 gündür görüntü göndermiyor.",
  "systemType": 2,
  "jobType": 3,
  "priority": 3,
  "status": 3,
  "source": 5,
  "customer": {
    "id": "aa67023b-1e54-42ba-b41f-631572f7ddd9",
    "name": "Ahmet Yılmaz",
    "info": "Test müşteri",
    "phone": "0555 000 0001"
  },
  "deviceType": 3,
  "deviceIdentifier": "CAM-002",
  "createdByUserId": "admin-001",
  "requesterName": "Ahmet Yılmaz",
  "requesterPhone": "0555 000 0001",
  "assignedUserId": "d83ec9799cf44069afbdab7e6fb6c403",
  "assignedUserName": "deneme",
  "assignedAtUtc": "2026-09-20T18:20:00Z",
  "addressText": "Merkez şube",
  "latitude": null,
  "longitude": null,
  "locationAccuracy": null,
  "locationCapturedAt": null,
  "locationSource": null,
  "createdAtUtc": "2026-09-20T18:16:14.259973Z",
  "updatedAtUtc": "2026-09-20T18:22:16.063863Z",
  "slaDueAtUtc": "2026-09-21T12:00:00Z",
  "completedAtUtc": null,
  "resolutionNote": null,
  "isOverdue": false,
  "rawPayload": null,
  "rowVersion": "97683276-3197-48c9-b3b7-e484eb018dc1",
  "media": [
    {
      "id": "095a8b9d-8a22-4d13-81d5-a3ed83d31d2e",
      "url": "https://api.example.com/uploads/servicerequests/9ef2c141-.../3cc5b73d....png",
      "fileName": "3cc5b73df4d740e497bb4bcf2c3d208d.png",
      "originalFileName": "test.png",
      "contentType": "image/png",
      "sizeBytes": 68,
      "createdAt": "2026-09-20T18:23:54.438438Z"
    }
  ],
  "workOrders": [
    {
      "id": "0cdd7fca-2cb6-4b69-a8cf-f59b7a6b5e0a",
      "systemType": 2,
      "jobType": 3,
      "technicianId": "d83ec9799cf44069afbdab7e6fb6c403",
      "createdAt": "2026-09-20T18:22:16.063863Z"
    }
  ]
}
```

**Hatalar**

| Kod | Sebep |
|---|---|
| 404 | Talep yok ya da soft-delete edilmiş |

---

### `POST /api/admin/service-requests`

Yeni talep oluşturur. `RequestNo` (`TLP-1001` formatında) sunucu tarafında global sıralı
üretilir, gönderilmez.

**İstek gövdesi** (`CreateServiceRequestRequest`)

```json
{
  "title": "Kamera görüntü vermiyor",
  "description": "Müşteri aradı, 2 nolu kamera 3 gündür görüntü göndermiyor.",
  "systemType": 2,
  "jobType": 3,
  "priority": 3,
  "source": 5,
  "customerId": "aa67023b-1e54-42ba-b41f-631572f7ddd9",
  "deviceType": 3,
  "deviceIdentifier": "CAM-002",
  "requesterName": "Ahmet Yılmaz",
  "requesterPhone": "0555 000 0001",
  "assignedUserId": null,
  "addressText": "Merkez şube",
  "latitude": null,
  "longitude": null,
  "locationAccuracy": null,
  "locationCapturedAt": null,
  "locationSource": null,
  "slaDueAtUtc": "2026-09-21T12:00:00Z",
  "rawPayload": null
}
```

**Alanlar**

| Alan | Tip | Zorunlu | Not |
|---|---|---|---|
| `title` | string | **evet** | Boş/whitespace olamaz |
| `description` | string? | hayır | |
| `systemType` | SystemType | evet | |
| `jobType` | JobType | evet | |
| `priority` | RequestPriority | evet | |
| `source` | RequestSource | evet | `WhatsAppAi` (3) ise `rawPayload` **zorunlu** |
| `customerId` | Guid? | hayır | Verilirse müşteri var, aktif ve silinmemiş olmalı |
| `deviceType` | ObjectType? | hayır | |
| `deviceIdentifier` | string? | hayır | Plaka/seri no gibi serbest metin |
| `requesterName` / `requesterPhone` | string? | hayır | Sistem kullanıcısı olmayan talepçi bilgisi |
| `assignedUserId` | string? | hayır | Verilirse: kullanıcı var, silinmemiş, aktif ve `Role == "Technician"` olmalı. Doluysa talep direkt `Assigned` (2) durumunda açılır |
| `addressText` | string? | hayır | |
| `latitude` / `longitude` | double? | hayır | **Birlikte verilmeli** (biri verilip diğeri boşsa 400). `latitude` ∈ [-90,90], `longitude` ∈ [-180,180] |
| `locationAccuracy` / `locationCapturedAt` / `locationSource` | | hayır | |
| `slaDueAtUtc` | DateTime? | hayır | |
| `rawPayload` | string? | `source==WhatsAppAi` ise evet | WhatsApp/AI ham verisi (serbest metin/JSON) |

`createdByUserId` istek gövdesinde yer almaz — sunucu, token'daki kullanıcıyı otomatik atar.
`status` da gövdede yer almaz; her zaman `New` (1) ile başlar (`assignedUserId` doluysa `Assigned`).

**Yanıt — 201 Created**, gövde `GET /{id}` ile aynı `ServiceRequestDetailDto` şeklidir.
`Location` header'ı `GET /api/admin/service-requests/{id}`'yi gösterir.

**Hatalar — 400**

| Mesaj | Sebep |
|---|---|
| `Başlık zorunludur.` | `title` boş |
| `AI ile doldurulan talepte RawPayload zorunludur.` | `source=3` ama `rawPayload` boş |
| `CustomerId not found.` | `customerId` yok/silinmiş |
| `Customer is passive.` | müşteri `isActive=false` |
| `AssignedUserId not found.` | `assignedUserId` yok/silinmiş |
| `Atanan kullanıcı pasif.` | kullanıcı `isActive=false` |
| `Sadece teknisyene atama yapılabilir.` | kullanıcının `role`'ü `Technician` değil |
| `Latitude and Longitude must be provided together.` | sadece biri verilmiş |
| `Latitude must be between -90 and 90.` / `Longitude must be between -180 and 180.` | aralık dışı |

---

### `PUT /api/admin/service-requests/{id}`

Kısmi güncelleme (**partial update**): `null` gönderilen alana **dokunulmaz**; string
alanlarda boş/whitespace gönderilirse alan `null`'a çekilir (`title` hariç — boş `title`
400 döner).

**İstek gövdesi** (`UpdateServiceRequestRequest`, tüm alanlar opsiyonel)

```json
{
  "title": "Değişen başlık",
  "description": null,
  "systemType": null,
  "jobType": null,
  "priority": null,
  "customerId": null,
  "deviceType": null,
  "deviceIdentifier": null,
  "requesterName": null,
  "requesterPhone": null,
  "addressText": null,
  "latitude": null,
  "longitude": null,
  "locationAccuracy": null,
  "locationCapturedAt": null,
  "locationSource": null,
  "slaDueAtUtc": null,
  "rawPayload": null,
  "rowVersion": "97683276-3197-48c9-b3b7-e484eb018dc1"
}
```

`rowVersion` opsiyoneldir ama **şiddetle önerilir**: son `GET` yanıtından aldığınız
`rowVersion`'ı geri gönderin ki başka biri aynı anda güncellemişse 409 alasınız.

Not: bu endpoint'te `status`/`assignedUserId` değiştirilemez — onlar için `PATCH /status`
ve `PATCH /assign` kullanın.

**Yanıt — 204 No Content** (body yok)

**Hatalar**

| Kod | Mesaj | Sebep |
|---|---|---|
| 404 | — | Talep yok |
| 400 | `Başlık boş olamaz.` | `title` whitespace gönderildi |
| 400 | (Create ile aynı mesajlar) | `customerId`/lat-lng doğrulamaları |
| 409 | `Talep başka bir işlem tarafından güncellendi. Güncel veriyi tekrar çekip yeniden deneyin.` | gönderilen `rowVersion` güncel değil |

---

### `PATCH /api/admin/service-requests/{id}/assign`

Talebi bir teknisyene atar. Talep `New` durumundaysa otomatik `Assigned`'a geçer (zaten
atanmışsa durum değişmez, sadece `assignedUserId` güncellenir).

**İstek gövdesi**

```json
{ "assignedUserId": "d83ec9799cf44069afbdab7e6fb6c403", "slaDueAtUtc": "2026-09-22T12:00:00Z" }
```

`slaDueAtUtc` opsiyoneldir; verilirse mevcut SLA'i değiştirir, verilmezse dokunulmaz.

**Yanıt — 204 No Content**

**Hatalar — 400**

| Mesaj | Sebep |
|---|---|
| `Kapanmış talep yeniden atanamaz.` | talep `Completed`/`Cancelled` |
| `AssignedUserId not found.` / `Atanan kullanıcı pasif.` / `Sadece teknisyene atama yapılabilir.` | Create ile aynı |

404: talep yok.

---

### `PATCH /api/admin/service-requests/{id}/status`

Durum değiştirir. İzin verilen geçişler admin için:

| Mevcut durum | Gidilebilir durumlar |
|---|---|
| New (1) | Assigned, InProgress, OnHold, Cancelled |
| Assigned (2) | New, InProgress, OnHold, Cancelled |
| InProgress (3) | Assigned, OnHold, Completed, Cancelled |
| OnHold (4) | InProgress, Cancelled |
| Completed (5) / Cancelled (6) | — (terminal, hiçbir yere geçilemez) |

**İstek gövdesi**

```json
{ "status": 5, "resolutionNote": "Kablo değiştirildi, cihaz veri gönderiyor." }
```

`resolutionNote`, hedef durum `Completed` veya `Cancelled` ise **zorunludur**.

**Yanıt — 204 No Content**

**Hatalar — 400**

| Mesaj | Sebep |
|---|---|
| `Kapanmış talebin durumu değiştirilemez.` | mevcut durum zaten `Completed`/`Cancelled` |
| `{Mevcut} durumundan {Hedef} durumuna geçilemez.` | izin verilmeyen geçiş (ör. `New` → `Completed`) |
| `Talebi tamamlarken ResolutionNote zorunludur.` | `status=5`, `resolutionNote` boş |
| `Talebi iptal ederken ResolutionNote (iptal sebebi) zorunludur.` | `status=6`, `resolutionNote` boş |

404: talep yok.

---

### `POST /api/admin/service-requests/{id}/media`

Talebe fotoğraf/dosya ekler. `multipart/form-data`, form alanı adı **`files`** (çoklu dosya
desteklenir). Genel dosya kurallarına bakın (üstte).

**Yanıt — 200**, `ServiceRequestMediaDto[]`:

```json
[
  {
    "id": "095a8b9d-8a22-4d13-81d5-a3ed83d31d2e",
    "url": "https://api.example.com/uploads/servicerequests/9ef2c141-.../3cc5b73d....png",
    "fileName": "3cc5b73df4d740e497bb4bcf2c3d208d.png",
    "originalFileName": "test.png",
    "contentType": "image/png",
    "sizeBytes": 68,
    "createdAt": "2026-09-20T18:23:54.438438Z"
  }
]
```

**Hatalar**

| Kod | Mesaj | Sebep |
|---|---|---|
| 404 | `ServiceRequest not found.` | talep yok |
| 400 | `No files provided.` | dosya gönderilmedi |
| 400 | `Only jpg, jpeg, png, webp, heic, heif image files are allowed.` | desteklenmeyen format |
| 400 | `HEIC conversion failed: ...` | HEIC dönüştürme hatası |

---

### `DELETE /api/admin/service-requests/{id}/media/{mediaId}`

Bir medya kaydını kalıcı siler (dosya diskten de silinir).

**Yanıt**: 204 No Content / 404 (talep ya da o talebe ait medya bulunamadı).

---

### `POST /api/admin/service-requests/{id}/work-orders`

Talepten bir **iş emri (WorkOrder)** üretir. `SystemType`, `JobType`, `CustomerId` ve konum
alanları talepten kopyalanır. Bir talepten **birden fazla** iş emri açılabilir (1-N).

**İstek gövdesi** (tüm alanlar opsiyonel)

```json
{ "technicianId": null, "notes": null }
```

- `technicianId` boş bırakılırsa talebin `assignedUserId`'si kullanılır; o da boşsa 400.
- `notes` boş bırakılırsa otomatik `"[TLP-1001] Kamera görüntü vermiyor"` formatında üretilir.

Talep `New`/`Assigned` durumundaysa çağrı sonrası otomatik `InProgress`'e geçer (zaten
`InProgress` ise değişmez; `Completed`/`Cancelled` ise 400).

**Yanıt — 201 Created**

```json
{ "workOrderId": "0cdd7fca-2cb6-4b69-a8cf-f59b7a6b5e0a" }
```

Oluşan `WorkOrder`'ın `serviceRequestId` alanı bu talebin id'sine eşit olur
(bkz. `GET /api/workorders/{id}` — ayrı bir dokümanda).

**Hatalar**

| Kod | Mesaj | Sebep |
|---|---|---|
| 404 | `ServiceRequest not found.` | talep yok |
| 400 | `Kapanmış bir talepten iş emri açılamaz.` | talep `Completed`/`Cancelled` |
| 400 | `Teknisyen belirtilmedi ve talebe atanmış kimse yok.` | `technicianId` boş ve talebe kimse atanmamış |

---

### `POST /api/admin/service-requests/{id}/work-orders/link`

Zaten var olan bir `WorkOrder`'ı bu talebe bağlar (`workOrder.serviceRequestId = id`).

**İstek gövdesi**

```json
{ "workOrderId": "0cdd7fca-2cb6-4b69-a8cf-f59b7a6b5e0a" }
```

**Yanıt**: 204 No Content.

**Hatalar**: 404 (talep yok) · 400 `WorkOrder not found.` (verilen id'de iş emri yok).

---

### `DELETE /api/admin/service-requests/{id}`

Soft delete (`isDeleted = true`). Kayıt DB'de kalır, listeleme/detay endpoint'lerinde artık
görünmez.

**Yanıt**: 204 No Content / 404.

---

## 2. Technician — Service Requests (`api/service-requests`)

`Authorize` (herhangi bir authenticated kullanıcı) ama **sunucu tarafında her zaman**
`assignedUserId == <token'daki userId>` filtresi uygulanır — bir teknisyen yalnızca kendine
atanan talepleri görebilir/durumunu değiştirebilir. Admin kullanıcılar bu endpoint'lere
erişebilir ama yine sadece **kendi** atamalarını görürler (talep yönetimi için Admin
controller'ını kullanmalıdırlar).

### `GET /api/service-requests/my`

Aynı `ServiceRequestListQuery` parametreleri (üstteki admin `GET` ile aynı — `q`, `status`,
`priority`, vb.), tek fark: `assignedUserId`/`unassigned` filtreleri **yok sayılır**, sonuç
her zaman token sahibine kilitlidir. Yanıt şekli admin listesiyle birebir aynı
(`PagedResponse<ServiceRequestListItemDto>`).

### `GET /api/service-requests/{id}`

Admin `GET /{id}` ile aynı `ServiceRequestDetailDto`'yu döner.

**Hatalar**: 404 (talep yok) · **403** (talep var ama `assignedUserId` sizin userId'niz değil).

### `PATCH /api/service-requests/{id}/status`

Aynı `ChangeStatusRequest` gövdesi, ama teknisyen için izin verilen geçişler daha kısıtlı:

| Mevcut durum | Gidilebilir durumlar |
|---|---|
| Assigned (2) | InProgress |
| InProgress (3) | OnHold, Completed |
| OnHold (4) | InProgress |

`New`, `Completed`, `Cancelled` durumlarından teknisyen hiçbir yere geçemez. Hata mesajları
admin endpoint'iyle aynıdır (`{Mevcut} durumundan {Hedef} durumuna geçilemez.`,
`ResolutionNote zorunludur.` vb.).

**Hatalar**: 404 · 403 (kendine atanmamış talep) · 400 (geçersiz geçiş).

### `POST /api/service-requests/{id}/media`

Admin medya endpoint'iyle aynı davranış/limitler, ek olarak: 403 (talep size atanmamışsa).

---

## İlgili not: `WorkOrder` üzerindeki değişiklik

Bu modülle birlikte `WorkOrder` şemasına `serviceRequestId` (Guid?, nullable) alanı eklendi:

- `GET /api/workorders/{id}` ve liste endpoint'lerinin döndürdüğü `WorkOrderDetailResponse`
  yanıtında artık `serviceRequestId` alanı var (talepten üretilmediyse `null`).
- `POST /api/workorders` (`CreateWorkOrderRequest`) artık opsiyonel `serviceRequestId` alanı
  kabul eder — doğrudan bir talebe bağlı iş emri açmak için kullanılabilir (verilirse talep
  var ve silinmemiş olmalı, yoksa 400 `ServiceRequestId not found.`).

`WorkOrder` endpoint'lerinin geri kalanı bu değişiklikten etkilenmedi.
