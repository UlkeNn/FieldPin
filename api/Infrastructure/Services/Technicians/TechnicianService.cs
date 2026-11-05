using FieldPin.Api.Contracts.Admin.Technicians;
using FieldPin.Api.Infrastructure.Persistence;
using FieldPin.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FieldPin.Api.Infrastructure.Services.Technicians;

public class TechnicianService : ITechnicianService
{
    private readonly AppDbContext _db;
    private readonly PasswordHasher<AppUser> _hasher = new();

    public TechnicianService(AppDbContext db) => _db = db;

    public async Task<List<TechnicianDto>> GetAllAsync(string? search, bool? isActive)
    {
        var q = _db.Users.AsNoTracking().Where(x => !x.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            q = q.Where(x =>
                x.Username.Contains(s) ||
                (x.Email != null && x.Email.Contains(s)) ||
                (x.Phone != null && x.Phone.Contains(s))
            );
        }

        if (isActive.HasValue)
            q = q.Where(x => x.IsActive == isActive.Value);

        return await q
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => ToDto(x))
            .ToListAsync();
    }

    public async Task<TechnicianDto?> GetByIdAsync(string id)
    {
        var u = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        return u is null ? null : ToDto(u);
    }

    public async Task<TechnicianDto> CreateAsync(CreateTechnicianRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            throw new ArgumentException("Username ve Password zorunludur.");

        var username = req.Username.Trim();

        if (req.Password.Trim().Length < 6)
            throw new ArgumentException("Password en az 6 karakter olmalıdır.");

        var exists = await _db.Users.AnyAsync(x => x.Username.ToLower() == username.ToLower());
        if (exists)
            throw new InvalidOperationException("Bu username zaten kullanılıyor.");

        var user = new AppUser
        {
            Id = Guid.NewGuid().ToString("N"),
            Username = username,
            Role = string.IsNullOrWhiteSpace(req.Role) ? "Technician" : req.Role.Trim(),
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim(),
            Email = string.IsNullOrWhiteSpace(req.Email) ? null : req.Email.Trim(),
            Address = string.IsNullOrWhiteSpace(req.Address) ? null : req.Address.Trim(),
            BirthDate = req.BirthDate
        };

        user.PasswordHash = _hasher.HashPassword(user, req.Password.Trim());

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return ToDto(user);
    }

    public async Task<bool> UpdateAsync(string id, UpdateTechnicianRequest req)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (u is null) return false;

        if (!string.IsNullOrWhiteSpace(req.Username))
        {
            var username = req.Username.Trim();

            if (!string.Equals(username, u.Username, StringComparison.OrdinalIgnoreCase))
            {
                var exists = await _db.Users.AnyAsync(x =>
                    x.Id != id && x.Username.ToLower() == username.ToLower());

                if (exists)
                    throw new InvalidOperationException("Bu username zaten kullanılıyor.");

                u.Username = username;
            }
        }

        if (!string.IsNullOrWhiteSpace(req.Role))
            u.Role = req.Role.Trim();

        if (req.IsActive.HasValue)
        {
            u.IsActive = req.IsActive.Value;// Aktiflik değişmişse tüm refresh token'ları iptal et
            if (!req.IsActive.Value)
                await RevokeAllRefreshTokensAsync(u.Id);
        }

        if (req.Phone is not null)
            u.Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim();

        if (req.Email is not null)
            u.Email = string.IsNullOrWhiteSpace(req.Email) ? null : req.Email.Trim();

        if (req.Address is not null)
            u.Address = string.IsNullOrWhiteSpace(req.Address) ? null : req.Address.Trim();

        if (req.BirthDate.HasValue || req.BirthDate is null)
            u.BirthDate = req.BirthDate;

        if (!string.IsNullOrWhiteSpace(req.NewPassword))
        {
            var np = req.NewPassword.Trim();
            if (np.Length < 6)
                throw new ArgumentException("NewPassword en az 6 karakter olmalıdır.");
            u.PasswordHash = _hasher.HashPassword(u, np);
        }

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeactivateAsync(string id)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (u is null) return false;

        u.IsActive = false;
        await RevokeAllRefreshTokensAsync(id);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SoftDeleteAsync(string id)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null) return false;

        u.IsDeleted = true;
        u.IsActive = false;
        await RevokeAllRefreshTokensAsync(id);
        await _db.SaveChangesAsync();
        return true;
    }


    // ── PRIVATE METHODS ────────────────────────────────────
    // Bir kullanıcının tüm aktif refresh token'larını iptal eder (RevokedAtUtc doldurulur).
    private async Task RevokeAllRefreshTokensAsync(string userId)
    {
        var now = DateTime.UtcNow;
        await _db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAtUtc == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAtUtc, now));
    }


    // ── MAPPER ──────────────────────────────────────────────

    /// <summary>
    /// AppUser → TechnicianDto.
    /// AvatarUrl burada RELATIVE path olarak doldurulur (örn: "avatars/{userId}/{guid}.jpg").
    /// Controller bunu absolute URL'e çevirip istemciye gönderir.
    /// </summary>
    private static TechnicianDto ToDto(AppUser u) => new()
    {
        Id = u.Id,
        Username = u.Username,
        Role = u.Role,
        IsActive = u.IsActive,
        IsDeleted = u.IsDeleted,
        CreatedAtUtc = u.CreatedAtUtc,
        Phone = u.Phone,
        Email = u.Email,
        Address = u.Address,
        BirthDate = u.BirthDate,
        AvatarUrl = u.AvatarRelativePath   // controller absolute URL'e çevirecek
    };
}
