namespace FieldPin.Api.Contracts.Customers;

public class CustomerDto
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Info { get; set; }
    public string? Phone { get; set; }
    public bool IsActive{get; set;}
    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}