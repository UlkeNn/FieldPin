using FieldPin.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace FieldPin.Api.Infrastructure.Services;

public interface IUserAvatarService
{
    /// <summary>
    /// Kullanıcının avatarını günceller. Eski dosyayı diskten siler, yeniyi yazar.
    /// HEIC formatı otomatik olarak JPEG'e çevrilir.
    /// </summary>
    /// <returns>Yeni avatarın storage'a göreli yolu (örn. "avatars/{userId}/{guid}.jpg")</returns>
    /// <exception cref="ArgumentException">Geçersiz dosya / izin verilmeyen format</exception>
    /// <exception cref="KeyNotFoundException">Kullanıcı bulunamazsa</exception>
    Task<string> UploadAsync(string userId, IFormFile file);

    /// <summary>
    /// Kullanıcının avatarını siler (hem diskten hem DB'den).
    /// Avatar zaten yoksa true döner (idempotent).
    /// </summary>
    Task<bool> DeleteAsync(string userId);
}

public class UserAvatarService : IUserAvatarService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public UserAvatarService(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    public async Task<string> UploadAsync(string userId, IFormFile file)
    {
        if (file is null || file.Length <= 0)
            throw new ArgumentException("No file provided.");

        if (!ImageProcessing.IsAllowedImage(file))
            throw new ArgumentException("Only jpg, jpeg, png, webp, heic, heif image files are allowed.");

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user is null)
            throw new KeyNotFoundException("User not found.");

        var avatarDir = GetAvatarDir(userId);
        Directory.CreateDirectory(avatarDir);

        // Eski avatar dosyalarını temizle (disk şişmesin — bir kullanıcı = bir avatar)
        ClearDirectoryContents(avatarDir);

        var isHeic = ImageProcessing.IsHeicLike(file);
        string storedName;
        string fullPath;

        if (isHeic)
        {
            storedName = $"{Guid.NewGuid():N}.jpg";
            fullPath = Path.Combine(avatarDir, storedName);
            await ImageProcessing.ConvertHeicToJpegAsync(file, fullPath);
        }
        else
        {
            var originalExt = Path.GetExtension(file.FileName);
            var ext = string.IsNullOrWhiteSpace(originalExt)
                ? ".jpg"
                : originalExt.ToLowerInvariant();

            storedName = $"{Guid.NewGuid():N}{ext}";
            fullPath = Path.Combine(avatarDir, storedName);

            await using var stream = File.Create(fullPath);
            await file.CopyToAsync(stream);
        }

        var relativePath = Path.Combine("avatars", userId, storedName).Replace("\\", "/");

        user.AvatarRelativePath = relativePath;
        await _db.SaveChangesAsync();

        return relativePath;
    }

    public async Task<bool> DeleteAsync(string userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user is null) return false;

        // Disk temizliği — DB kaydı zaten yoksa bile diskte artık varsa temizle
        var avatarDir = GetAvatarDir(userId);
        if (Directory.Exists(avatarDir))
            ClearDirectoryContents(avatarDir);

        if (user.AvatarRelativePath is not null)
        {
            user.AvatarRelativePath = null;
            await _db.SaveChangesAsync();
        }

        return true;
    }

    // ── Helpers ──

    private string GetAvatarDir(string userId)
    {
        var uploadsRoot = Path.Combine(_env.ContentRootPath, "storage", "uploads");
        return Path.Combine(uploadsRoot, "avatars", userId);
    }

    private static void ClearDirectoryContents(string dir)
    {
        if (!Directory.Exists(dir)) return;

        foreach (var file in Directory.EnumerateFiles(dir))
        {
            try { File.Delete(file); }
            catch { /* silinemeyen dosya varsa devam et — best effort */ }
        }
    }
}
