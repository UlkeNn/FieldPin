using FieldPin.Api.Contracts.Customers;
using FieldPin.Api.Infrastructure.Services.Customers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FieldPin.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/customers")]
[Authorize(Roles = "Admin")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _svc;
    public CustomersController(ICustomerService svc) => _svc = svc;

    public record ActivationRequest(bool IsActive);

    [HttpGet]
    public async Task<ActionResult<List<CustomerDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] bool? isActive)
        => Ok(await _svc.AdminListAsync(search, isActive));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CustomerDto>> GetById([FromRoute] Guid id)
    {
        var dto = await _svc.GetByIdAsync(id);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> Create([FromBody] CreateCustomerRequest req)
    {
        try
        {
            var dto = await _svc.CreateAsync(req);
            return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] UpdateCustomerRequest req)
    {
        try
        {
            var ok = await _svc.UpdateAsync(id, req);
            return ok ? NoContent() : NotFound();
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
    }

    [HttpPatch("{id:guid}/activation")]
    public async Task<IActionResult> SetActivation([FromRoute] Guid id, [FromBody] ActivationRequest req)
    {
        var ok = await _svc.SetActivationAsync(id, req.IsActive);
        return ok ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        var ok = await _svc.SoftDeleteAsync(id);
        return ok ? NoContent() : NotFound();
    }
}
