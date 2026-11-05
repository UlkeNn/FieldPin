namespace FieldPin.Api.Infrastructure.Options;

public class JwtOptions
{
    public string Issuer { get; set; } = default!;
    public string Audience { get; set; } = default!;
    public string Key { get; set; } = default!;

    /// <summary>Access token süresi (dk). Kısa tutulmalı: 15-30 dk.</summary>
    public int AccessTokenExpiresMinutes { get; set; } = 10;

    /// <summary>Refresh token süresi (dk). Uzun: 7-30 gün.</summary>
    public int RefreshTokenExpiresDays { get; set; } = 6;

    // Geriye dönük uyumluluk — eski config'de "ExpiresMinutes" varsa onu da oku
    public int ExpiresMinutes
    {
        get => AccessTokenExpiresMinutes;
        set => AccessTokenExpiresMinutes = value;
    }
}
