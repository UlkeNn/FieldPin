namespace FieldPin.Api.Contracts.Admin.Technicians;

public class TechnicianDto
{
    public string Id { get; set; } = default!;
    public string Username { get; set; } = default!;
    public string Role { get; set; } = default!;
    public bool IsActive { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAtUtc { get; set; }

    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }

    public DateTime? BirthDate { get; set; }
    public int? Age { get; set; } // UI için hesaplanmış

    /// Profil fotoğrafı URL'i.
    /// İstemciye dönerken her zaman absolute URL veya null olur.
    public string? AvatarUrl { get; set; }
}