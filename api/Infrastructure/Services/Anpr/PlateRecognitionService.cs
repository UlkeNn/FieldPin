using System.Net.Http.Headers;
using System.Text.Json;
using FieldPin.Api.Contracts.Anpr;
using FieldPin.Api.Infrastructure.Options;
using ImageMagick;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace FieldPin.Api.Infrastructure.Services.Anpr;

/// <summary>
/// Plaka tanıma servisi. Yüklenen görseli bir ALPR sağlayıcısına gönderip
/// tanınan plakayı döner. Normalizasyon mobil tarafta yapıldığı için burada
/// ham (büyük harfe çevrilmiş) plaka metni döndürülür.
/// </summary>
public interface IPlateRecognitionService
{
    /// <exception cref="ArgumentException">Geçersiz/boş dosya ya da izin verilmeyen format.</exception>
    /// <exception cref="PlateRecognitionNotConfiguredException">Sağlayıcı token'ı ayarlı değil.</exception>
    /// <exception cref="PlateNotFoundException">Görselde okunabilir plaka bulunamadı.</exception>
    Task<PlateRecognitionResponse> RecognizeAsync(IFormFile file, CancellationToken ct = default);
}

/// <summary>Sağlayıcı yapılandırılmadığında (token yok) fırlatılır → 501.</summary>
public class PlateRecognitionNotConfiguredException : Exception
{
    public PlateRecognitionNotConfiguredException(string message) : base(message) { }
}

/// <summary>Görselde plaka okunamadığında fırlatılır → 422.</summary>
public class PlateNotFoundException : Exception
{
    public PlateNotFoundException(string message) : base(message) { }
}

public class PlateRecognizerService : IPlateRecognitionService
{
    private readonly HttpClient _http;
    private readonly PlateRecognitionOptions _opt;
    private readonly ILogger<PlateRecognizerService> _logger;

    public PlateRecognizerService(
        HttpClient http,
        IOptions<PlateRecognitionOptions> opt,
        ILogger<PlateRecognizerService> logger)
    {
        _http = http;
        _opt = opt.Value;
        _logger = logger;
    }

    public async Task<PlateRecognitionResponse> RecognizeAsync(IFormFile file, CancellationToken ct = default)
    {
        if (file is null || file.Length <= 0)
            throw new ArgumentException("No image provided.");

        if (!ImageProcessing.IsAllowedImage(file))
            throw new ArgumentException("Only jpg, jpeg, png, webp, heic, heif image files are allowed.");

        if (string.IsNullOrWhiteSpace(_opt.Token) || string.IsNullOrWhiteSpace(_opt.ApiUrl))
            throw new PlateRecognitionNotConfiguredException(
                "Plate recognition provider is not configured. Set PlateRecognition:Token and PlateRecognition:ApiUrl.");

        // Görsel baytlarını hazırla (HEIC ise JPEG'e çevir — çoğu ALPR HEIC kabul etmez).
        var (bytes, fileName, contentType) = await PrepareImageAsync(file, ct);

        using var form = new MultipartFormDataContent();
        var imageContent = new ByteArrayContent(bytes);
        imageContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        // Plate Recognizer Snapshot API "upload" alanını bekler.
        form.Add(imageContent, "upload", fileName);
        if (!string.IsNullOrWhiteSpace(_opt.Regions))
            form.Add(new StringContent(_opt.Regions), "regions");

        using var req = new HttpRequestMessage(HttpMethod.Post, _opt.ApiUrl) { Content = form };
        req.Headers.Authorization = new AuthenticationHeaderValue("Token", _opt.Token);

        using var res = await _http.SendAsync(req, ct);
        var body = await res.Content.ReadAsStringAsync(ct);

        if (!res.IsSuccessStatusCode)
        {
            _logger.LogWarning("ALPR provider returned {Status}: {Body}", (int)res.StatusCode, body);
            throw new InvalidOperationException($"ALPR provider error (HTTP {(int)res.StatusCode}).");
        }

        var candidates = ParseCandidates(body)
            .Where(c => c.Confidence is null || c.Confidence >= _opt.MinConfidence)
            .OrderByDescending(c => c.Confidence ?? 0)
            .ToList();

        if (candidates.Count == 0)
            throw new PlateNotFoundException("No readable plate found in the image.");

        var best = candidates[0];
        return new PlateRecognitionResponse(
            Plate: best.Plate,
            Confidence: best.Confidence,
            Results: candidates);
    }

    /// <summary>HEIC ise JPEG'e çevirir; değilse orijinal baytları döndürür.</summary>
    private static async Task<(byte[] bytes, string fileName, string contentType)> PrepareImageAsync(
        IFormFile file, CancellationToken ct)
    {
        if (ImageProcessing.IsHeicLike(file))
        {
            await using var input = file.OpenReadStream();
            using var image = new MagickImage(input);
            image.AutoOrient();
            image.Format = MagickFormat.Jpeg;
            image.Quality = 85;
            return (image.ToByteArray(), "plate.jpg", "image/jpeg");
        }

        await using var ms = new MemoryStream();
        await file.CopyToAsync(ms, ct);
        var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? ".jpg";
        var name = string.IsNullOrWhiteSpace(file.FileName) ? $"plate{ext}" : file.FileName;
        return (ms.ToArray(), name, ImageProcessing.NormalizeContentType(file.ContentType, ext));
    }

    /// <summary>
    /// Plate Recognizer Snapshot yanıtını ayrıştırır:
    /// { "results": [ { "plate": "34abc123", "score": 0.9 }, ... ] }
    /// </summary>
    private static List<PlateCandidate> ParseCandidates(string json)
    {
        var list = new List<PlateCandidate>();
        if (string.IsNullOrWhiteSpace(json)) return list;

        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("results", out var results)
            || results.ValueKind != JsonValueKind.Array)
            return list;

        foreach (var r in results.EnumerateArray())
        {
            var plate = r.TryGetProperty("plate", out var p) && p.ValueKind == JsonValueKind.String
                ? p.GetString()
                : null;
            if (string.IsNullOrWhiteSpace(plate)) continue;

            double? score = r.TryGetProperty("score", out var s) && s.ValueKind == JsonValueKind.Number
                ? s.GetDouble()
                : null;

            // Büyük harfe çevir; ayrıntılı TR normalizasyonu mobil tarafta yapılıyor.
            list.Add(new PlateCandidate(plate!.ToUpperInvariant(), score));
        }

        return list;
    }
}
