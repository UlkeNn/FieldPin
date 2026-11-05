using FieldPin.Api.Contracts.Customers;
using FieldPin.Api.Models;

namespace FieldPin.Api.Mappers;

public static class CustomerMapper
{
    public static CustomerDto ToDto(this Customer c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Info = c.Info,
        Phone = c.Phone,
        IsActive = c.IsActive,
        IsDeleted = c.IsDeleted,
        CreatedAtUtc = c.CreatedAtUtc
    };

    public static CustomerSummaryDto ToSummaryDto(this Customer c)
        => new(c.Id, c.Name, c.Info, c.Phone);

    public static void ApplyUpdate(this Customer c, UpdateCustomerRequest req)
    {
        // Name null ise dokunma, dolu ise trimle (boş ise controller/service 400 dönsün)
        if (req.Name is not null)
        {
            var v = req.Name.Trim();
            if (!string.IsNullOrWhiteSpace(v))
                c.Name = v;
        }

        // Info/Phone: "" => null
        if (req.Info is not null)
            c.Info = string.IsNullOrWhiteSpace(req.Info) ? null : req.Info.Trim();

        if (req.Phone is not null)
            c.Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim();

        if (req.IsActive.HasValue)
            c.IsActive = req.IsActive.Value;
    }
}