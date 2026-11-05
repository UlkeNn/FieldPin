namespace FieldPin.Api.Contracts.Anpr;

/// <summary>
/// Plaka tanıma yanıtı. Mobil istemci hem düz biçimi ({ plate, confidence })
/// hem de results listesini okuyabiliyor; biz düz + results birlikte döneriz.
/// </summary>
public record PlateRecognitionResponse(
    string Plate,
    double? Confidence,
    IReadOnlyList<PlateCandidate> Results
);

public record PlateCandidate(
    string Plate,
    double? Confidence
);
