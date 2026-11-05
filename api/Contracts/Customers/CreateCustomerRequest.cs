namespace FieldPin.Api.Contracts.Customers;

public class CreateCustomerRequest
{
    public string Name { get; set; } = default!;

    public string? Info { get; set; }
    public string? Phone { get; set; }
    
}