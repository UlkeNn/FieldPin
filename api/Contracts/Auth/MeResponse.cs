namespace FieldPin.Api.Contracts.Auth;

/// <summary>
/// GET /api/Auth/me response'u.
/// </summary>
public record MeResponse(
    string UserId,
    string Role,
    string? Username,
    string? AvatarUrl
);
