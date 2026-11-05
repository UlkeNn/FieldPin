namespace FieldPin.Api.Infrastructure.Options;

/// <summary>
/// Plaka tanıma (ANPR/ALPR) ayarları. appsettings.json içindeki "PlateRecognition"
/// bölümünden bağlanır. Token gizli olduğu için ortam değişkeni / user-secrets ile
/// verilmesi önerilir (örn. PlateRecognition__Token).
/// </summary>
public class PlateRecognitionOptions
{
    public const string SectionName = "PlateRecognition";

    /// <summary>Sağlayıcı adı. Şu an yalnızca "PlateRecognizer" desteklenir (Snapshot API uyumlu).</summary>
    public string Provider { get; set; } = "PlateRecognizer";

    /// <summary>
    /// ALPR uç noktası. Bulut için Plate Recognizer Snapshot API,
    /// self-hosted SDK için kendi adresiniz (örn. http://localhost:8080/v1/plate-reader/).
    /// </summary>
    public string ApiUrl { get; set; } = "https://api.platerecognizer.com/v1/plate-reader/";

    /// <summary>Sağlayıcı API token'ı. Boşsa servis 501 döner.</summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>Bölge ipucu (Türkiye için "tr"). Tanıma doğruluğunu artırır.</summary>
    public string Regions { get; set; } = "tr";

    /// <summary>Bu eşiğin altındaki adaylar elenir (0–1).</summary>
    public double MinConfidence { get; set; } = 0.3;
}
