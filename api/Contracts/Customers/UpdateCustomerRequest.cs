namespace FieldPin.Api.Contracts.Customers;

public class UpdateCustomerRequest
{
    public string? Name { get; set; }

    public string? Info { get; set; }
    public string? Phone { get; set; }
    public bool? IsActive { get; set; }
}