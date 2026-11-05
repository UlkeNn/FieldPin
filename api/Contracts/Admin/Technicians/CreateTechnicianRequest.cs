namespace FieldPin.Api.Contracts.Admin.Technicians;

public class CreateTechnicianRequest
{
    public string Username { get; set; } = default!;
    public string Password { get; set; } = default!;
    public string Role { get; set; } = "Technician"; // ister Admin de oluşturabilsin


    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public DateTime? BirthDate { get; set; }
}