using FieldPin.Api.Contracts.Customers;
using FieldPin.Api.Infrastructure.Services.Customers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FieldPin.Api.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _svc;
    public CustomersController(ICustomerService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<List<CustomerSummaryDto>>> GetAll([FromQuery] string? q)
        => Ok(await _svc.GetActiveAsync(q));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CustomerSummaryDto>> GetById([FromRoute] Guid id)
    {
        var dto = await _svc.GetActiveByIdAsync(id);
        return dto is null ? NotFound() : Ok(dto);
    }
}
