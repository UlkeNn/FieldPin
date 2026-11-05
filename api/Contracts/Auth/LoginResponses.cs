namespace FieldPin.Api.Contracts.Auth;

public record LoginResponse(
    string AccessToken,
    DateTime ExpiresAtUtc,
    string UserId,
    string Role,
    string RefreshToken
);
