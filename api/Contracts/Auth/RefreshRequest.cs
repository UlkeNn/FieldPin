namespace FieldPin.Api.Contracts.Auth;

/// <summary>
/// Mobile istemciler refresh token'ı body'de gönderir.
/// Web istemciler HttpOnly cookie kullanır (body boş olabilir).
/// </summary>
public record RefreshRequest(string? RefreshToken = null);
