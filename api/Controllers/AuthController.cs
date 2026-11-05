using FieldPin.Api.Contracts.Auth;
using FieldPin.Api.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FieldPin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    private readonly IUserAvatarService _avatarSvc;
    private const string RefreshTokenCookieName = "refreshToken";

    public AuthController(IAuthService auth, IUserAvatarService avatarSvc)
    {
        _auth = auth;
        _avatarSvc = avatarSvc;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var result = await _auth.LoginAsync(req.Username, req.Password);

        switch (result.Status)
        {
            case LoginStatus.InvalidCredentials:
                return Unauthorized(new { code = "INVALID_CREDENTIALS", message = "Kullanıcı adı veya şifre hatalı" });

            case LoginStatus.Inactive:
                return StatusCode(403, new { code = "ACCOUNT_INACTIVE", message = "Hesabınız kullanıma kapatılmıştır. Lütfen yöneticinizle iletişime geçin." });

            case LoginStatus.Success:
                var auth = result.Auth!;
                SetRefreshTokenCookie(auth.RefreshToken.Token, auth.RefreshToken.ExpiresAtUtc);
                return Ok(new LoginResponse(
                    auth.AccessToken,
                    auth.AccessTokenExpiresAtUtc,
                    auth.User.Id,
                    auth.User.Role,
                    auth.RefreshToken.Token
                ));

            default:
                return StatusCode(500);
        }
    }

    /// <summary>
    /// Refresh token ile yeni access token al.
    /// Web: HttpOnly cookie'den okur (body boş olabilir).
    /// Mobile: Body'den okur.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<ActionResult<LoginResponse>> Refresh([FromBody] RefreshRequest? req)
    {
        // Önce cookie'ye bak, yoksa body'ye bak
        var refreshToken = Request.Cookies[RefreshTokenCookieName]
                           ?? req?.RefreshToken;

        if (string.IsNullOrWhiteSpace(refreshToken))
            return Unauthorized(new { message = "Refresh token bulunamadı" });

        var result = await _auth.RefreshAsync(refreshToken);
        if (result is null)
        {
            // Geçersiz/süresi dolmuş token — cookie'yi de temizle
            ClearRefreshTokenCookie();
            return Unauthorized(new { message = "Refresh token geçersiz veya süresi dolmuş" });
        }

        // Yeni refresh token'ı cookie'ye yaz (rotation)
        SetRefreshTokenCookie(result.RefreshToken.Token, result.RefreshToken.ExpiresAtUtc);

        return Ok(new LoginResponse(
            result.AccessToken,
            result.AccessTokenExpiresAtUtc,
            result.User.Id,
            result.User.Role,
            result.RefreshToken.Token
        ));
    }

    /// <summary>
    /// Logout — refresh token'ı revoke et ve cookie'yi temizle.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest? req)
    {
        var refreshToken = Request.Cookies[RefreshTokenCookieName]
                           ?? req?.RefreshToken;

        if (!string.IsNullOrWhiteSpace(refreshToken))
            await _auth.RevokeAsync(refreshToken);

        ClearRefreshTokenCookie();
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<MeResponse>> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var data = await _auth.GetMeAsync(userId);
        if (data is null) return NotFound();

        // Avatar relative path'i absolute URL'e çevirmek HTTP layer'ın işi
        // (Request.Scheme/Host'a bağlı olduğu için service'te yapılamaz).
        var avatarUrl = string.IsNullOrWhiteSpace(data.AvatarRelativePath)
            ? null
            : ToAbsoluteUrl($"/uploads/{data.AvatarRelativePath}");

        return Ok(new MeResponse(data.UserId, data.Role, data.Username, avatarUrl));
    }

    /// <summary>
    /// Giriş yapmış kullanıcının profil fotoğrafını günceller.
    /// Eski dosya silinir, yeni dosya yazılır. HEIC otomatik JPEG'e çevrilir.
    /// </summary>
    [Authorize]
    [HttpPut("me/avatar")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_000_000)]                      // 10 MB
    [RequestFormLimits(MultipartBodyLengthLimit = 10_000_000)]
    public async Task<ActionResult<AvatarResponse>> UpdateMyAvatar(IFormFile file)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        try
        {
            var relativePath = await _avatarSvc.UploadAsync(userId, file);
            var absoluteUrl = ToAbsoluteUrl($"/uploads/{relativePath}");
            return Ok(new AvatarResponse(absoluteUrl));
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (ImageMagick.MagickException ex) { return BadRequest($"HEIC conversion failed: {ex.Message}"); }
    }

    /// <summary>
    /// Giriş yapmış kullanıcının profil fotoğrafını siler. Idempotent — yoksa bile 204 döner.
    /// </summary>
    [Authorize]
    [HttpDelete("me/avatar")]
    public async Task<IActionResult> DeleteMyAvatar()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var ok = await _avatarSvc.DeleteAsync(userId);
        return ok ? NoContent() : NotFound();
    }

    // ── Helpers ──

    private string ToAbsoluteUrl(string path)
        => $"{Request.Scheme}://{Request.Host}{path}";

    private void SetRefreshTokenCookie(string token, DateTime expiresAtUtc)
    {
        Response.Cookies.Append(RefreshTokenCookieName, token, new CookieOptions
        {
            HttpOnly = true,                  // JS erişemez
            Secure = true,                    // Sadece HTTPS
            SameSite = SameSiteMode.Strict,   // CSRF koruması
            Expires = expiresAtUtc,
            Path = "/api/Auth"                // Sadece auth endpoint'lerine gönderilsin
        });
    }

    private void ClearRefreshTokenCookie()
    {
        Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/api/Auth"
        });
    }
}
