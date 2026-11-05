using FieldPin.Api.Models;
using FieldPin.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FieldPin.Api.Infrastructure.Services;


public interface IAuthService
{
    Task<LoginResult> LoginAsync(string username, string password);
    Task<AuthResult?> RefreshAsync(string refreshToken);
    Task RevokeAsync(string refreshToken);
    Task RevokeAllForUserAsync(string userId);

    /// <summary>
    /// Token doğrulanmış kullanıcının profil bilgilerini DB'den getirir.
    /// Avatar URL'i için absolute URL'e çevirme controller'ın sorumluluğunda
    /// (Request.Scheme/Host'a bağlı olduğu için).
    /// </summary>
    Task<MeData?> GetMeAsync(string userId);
}

public enum LoginStatus
{
    Success,
    InvalidCredentials,
    Inactive
}

public record LoginResult(LoginStatus Status, AuthResult? Auth)
{
    public static LoginResult Success(AuthResult auth) => new(LoginStatus.Success, auth);
    public static LoginResult InvalidCredentials() => new(LoginStatus.InvalidCredentials, null);
    public static LoginResult Inactive() => new(LoginStatus.Inactive, null);
}

public record AuthResult(
    AppUser User,
    string AccessToken,
    DateTime AccessTokenExpiresAtUtc,
    RefreshToken RefreshToken
);

/// <summary>
/// Auth service'inin "me" endpoint'ine döndürdüğü veri.
/// AvatarRelativePath storage'a göreli (URL'e çevirme controller'ın işi).
/// </summary>
public record MeData(
    string UserId,
    string Role,
    string? Username,
    string? AvatarRelativePath
);

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly PasswordHasher<AppUser> _hasher = new();

    public AuthService(AppDbContext db, IJwtTokenService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    public async Task<LoginResult> LoginAsync(string username, string password)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Username == username && !x.IsDeleted);
        if (user is null) return LoginResult.InvalidCredentials();

        var verify = _hasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (verify == PasswordVerificationResult.Failed) return LoginResult.InvalidCredentials();

        if (!user.IsActive) return LoginResult.Inactive();

        var auth = await CreateAuthResult(user);
        return LoginResult.Success(auth);
    }

    public async Task<MeData?> GetMeAsync(string userId)
    {
        return await _db.Users
            .AsNoTracking()
            .Where(x => x.Id == userId && x.IsActive)
            .Select(x => new MeData(x.Id, x.Role, x.Username, x.AvatarRelativePath))
            .FirstOrDefaultAsync();
    }

    public async Task<AuthResult?> RefreshAsync(string refreshToken)
    {
        var existing = await _db.RefreshTokens
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Token == refreshToken);

        // Token bulunamadı veya artık aktif değil
        if (existing is null || !existing.IsActive)
            return null;

        // Kullanıcı hâlâ aktif mi?
        if (!existing.User.IsActive)
            return null;

        // Mevcut refresh token'ı revoke et (rotation)
        existing.RevokedAtUtc = DateTime.UtcNow;

        // Yeni token çifti oluştur
        var result = await CreateAuthResult(existing.User);

        // Eski token'ın yerine geçeni işaretle
        existing.ReplacedByTokenId = result.RefreshToken.Id;

        await _db.SaveChangesAsync();
        return result;
    }

    public async Task RevokeAsync(string refreshToken)
    {
        var existing = await _db.RefreshTokens
            .FirstOrDefaultAsync(x => x.Token == refreshToken);

        if (existing is not null && existing.IsActive)
        {
            existing.RevokedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    public async Task RevokeAllForUserAsync(string userId)
    {
        var activeTokens = await _db.RefreshTokens
            .Where(x => x.UserId == userId && x.RevokedAtUtc == null)
            .ToListAsync();

        var now = DateTime.UtcNow;
        foreach (var t in activeTokens)
            t.RevokedAtUtc = now;

        await _db.SaveChangesAsync();
    }

    // ── Private ──

    private async Task<AuthResult> CreateAuthResult(AppUser user)
    {
        var (accessToken, accessExp) = _jwt.CreateAccessToken(user);
        var refreshToken = _jwt.CreateRefreshToken(user);

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        return new AuthResult(user, accessToken, accessExp, refreshToken);
    }
}
