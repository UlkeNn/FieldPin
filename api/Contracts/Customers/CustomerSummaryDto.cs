namespace FieldPin.Api.Contracts.Customers;

public record CustomerSummaryDto(
    Guid Id,
    string Name,
    string? Info,
    string? Phone
);
