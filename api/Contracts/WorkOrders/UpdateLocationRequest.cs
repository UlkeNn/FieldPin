using FieldPin.Api.Models;

namespace FieldPin.Api.Contracts.WorkOrders;

// PATCH /api/workorders/{id}/location için body.
// LocationSource verilmezse Manual kabul edilir, CapturedAt verilmezse UtcNow alınır.
public record UpdateLocationRequest(
    double Latitude,
    double Longitude,
    double? LocationAccuracy,
    DateTime? LocationCapturedAt,
    LocationSource? LocationSource
);
