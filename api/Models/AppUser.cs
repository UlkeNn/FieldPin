namespace FieldPin.Api.Models;

public class AppUser
{
    public string Id { get; set; } = default!;
    public string Username { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string Role { get; set; } = "Technician";
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public string? Phone { get; set;}
    public string? Email { get; set;}
    public string? Address { get; set;}
    public DateTime? BirthDate { get; set; }
    
    /// Storage'a göreli avatar yolu. Örn: "avatars/{userId}/{guid}.jpg"
    /// Public URL: ToAbsoluteUrl($"/uploads/{AvatarRelativePath}")
    public string? AvatarRelativePath { get; set; }
}