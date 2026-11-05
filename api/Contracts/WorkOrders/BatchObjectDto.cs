using FieldPin.Api.Models;

namespace FieldPin.Api.Contracts.WorkOrders;

public record BatchObjectDto(
    ObjectType ObjectType,
    string? ObjectIdentifier,
    WorkOrderObjectRole Role,
    string? Notes
    //04032026//string? FileKey// multipart'taki file alan adı: örn "file_plate", "file_device1"
);
