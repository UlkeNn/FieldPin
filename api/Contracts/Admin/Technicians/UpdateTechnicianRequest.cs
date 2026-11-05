namespace FieldPin.Api.Contracts.Admin.Technicians;

public class UpdateTechnicianRequest
{
    public string? Username { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }


    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public DateTime? BirthDate { get; set; }


    // opsiyonel: şifre sıfırlama
    public string? NewPassword { get; set; }
}