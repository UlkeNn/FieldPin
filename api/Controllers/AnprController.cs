using FieldPin.Api.Infrastructure.Services.Anpr;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FieldPin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnprController : ControllerBase
{
    private readonly IPlateRecognitionService _svc;
    public AnprController(IPlateRecognitionService svc) => _svc = svc;

    /// <summary>
    /// Bir görselden ARAÇ PLAKASINI tanır.
    /// İstek: multipart/form-data. Dosya "upload" ya da "file" alanında beklenir
    /// (mobil ikisini de gönderir); bulunamazsa formdaki ilk dosya kullanılır.
    /// Yanıt: { plate, confidence, results }.
    /// </summary>
    [HttpPost("recognize")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(20_000_000)]
    [RequestFormLimits(MultipartBodyLengthLimit = 20_000_000)]
    public async Task<IActionResult> Recognize(CancellationToken ct)
    {
        if (!Request.HasFormContentType)
            return BadRequest(new { message = "Expected multipart/form-data." });

        var form = await Request.ReadFormAsync(ct);

        // Mobil istemci dosyayı "upload" ve "file" alan adlarıyla gönderiyor.
        // Parametre-adı bazlı binding'e güvenmeyip alan adından okuyoruz; son çare ilk dosya.
        var file = form.Files.GetFile("upload")
                ?? form.Files.GetFile("file")
                ?? form.Files.FirstOrDefault();

        if (file is null) return BadRequest(new { message = "No image provided." });

        try
        {
            var result = await _svc.RecognizeAsync(file, ct);
            return Ok(result);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (PlateNotFoundException ex) { return UnprocessableEntity(new { message = ex.Message }); }
        catch (PlateRecognitionNotConfiguredException ex)
        {
            return StatusCode(StatusCodes.Status501NotImplemented, new { message = ex.Message });
        }
        catch (ImageMagick.MagickException ex) { return BadRequest(new { message = $"HEIC conversion failed: {ex.Message}" }); }
    }
}