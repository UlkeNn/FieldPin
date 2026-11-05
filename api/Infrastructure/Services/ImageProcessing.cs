using ImageMagick;
using Microsoft.AspNetCore.Http;

namespace FieldPin.Api.Infrastructure.Services;

/// <summary>
/// Yüklenen görüntü dosyaları için ortak doğrulama ve dönüştürme yardımcıları.
/// Hem WorkOrder media yüklemesi hem de kullanıcı avatar yüklemesi tarafından kullanılır.
/// </summary>
public static class ImageProcessing
{
    /// <summary>
    /// Dosya HEIC/HEIF formatında mı? (iPhone'un varsayılan foto formatı)
    /// </summary>
    public static bool IsHeicLike(IFormFile file)
    {
        var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? "";
        var ct = file.ContentType?.ToLowerInvariant() ?? "";

        return ext is ".heic" or ".heif"
            || ct.Contains("heic") || ct.Contains("heif");
    }

    /// <summary>
    /// Yüklemeye izin verilen image formatlarından biri mi?
    /// (jpg, jpeg, png, webp, heic, heif)
    /// </summary>
    public static bool IsAllowedImage(IFormFile file)
    {
        var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? "";
        var ct = file.ContentType?.ToLowerInvariant() ?? "";

        if (!string.IsNullOrWhiteSpace(ct) && !ct.StartsWith("image/"))
            return false;

        return ext is ".jpg" or ".jpeg" or ".png" or ".webp" or ".heic" or ".heif"
            || ct.Contains("jpeg") || ct.Contains("jpg")
            || ct.Contains("png") || ct.Contains("webp")
            || ct.Contains("heic") || ct.Contains("heif");
    }

    /// <summary>
    /// HEIC/HEIF dosyasını JPEG'e çevirip hedef yola yazar.
    /// AutoOrient ile EXIF rotasyonu uygulanır, kalite %85.
    /// </summary>
    public static async Task ConvertHeicToJpegAsync(IFormFile file, string destinationPath)
    {
        await using var inputStream = file.OpenReadStream();
        using var image = new MagickImage(inputStream);

        image.AutoOrient();
        image.Format = MagickFormat.Jpeg;
        image.Quality = 85;
        image.Write(destinationPath);
    }

    /// <summary>
    /// Content-Type'ı normalize eder. Boş veya geçersizse uzantıdan tahmin eder.
    /// </summary>
    public static string NormalizeContentType(string? contentType, string ext)
    {
        if (!string.IsNullOrWhiteSpace(contentType)
            && contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return contentType;

        return ext switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
    }
}
