using System.Text.Json.Serialization;


namespace FieldPin.Api.Models;

public class Customer
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = default!;
    public string? Info { get; set; } // şehir/adres vb. kısa bilgi

    public string? Phone { get; set; }//phone da eklenmeli

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; } = false;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public List<WorkOrder> WorkOrders { get; set; } = new();
}
