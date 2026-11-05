using FieldPin.Api.Contracts.Customers;
using FieldPin.Api.Infrastructure.Persistence;
using FieldPin.Api.Mappers;
using FieldPin.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FieldPin.Api.Infrastructure.Services.Customers;

public class CustomerService : ICustomerService
{
    private readonly AppDbContext _db;
    public CustomerService(AppDbContext db) => _db = db;

    // ── PUBLIC / MOBILE ─────────────────────────────────────

    public async Task<List<CustomerSummaryDto>> GetActiveAsync(string? search)
    {
        var q = _db.Customers.AsNoTracking().Where(x => x.IsActive && !x.IsDeleted);
        q = ApplySearch(q, search);

        var list = await q.OrderBy(x => x.Name).ToListAsync();
        return list.Select(x => x.ToSummaryDto()).ToList();
    }

    public async Task<CustomerSummaryDto?> GetActiveByIdAsync(Guid id)
    {
        var c = await _db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.IsActive && !x.IsDeleted);
        return c?.ToSummaryDto();
    }

    // ── ADMIN ───────────────────────────────────────────────

    public async Task<List<CustomerDto>> AdminListAsync(string? search, bool? isActive)
    {
        var q = _db.Customers.AsNoTracking().Where(x => !x.IsDeleted);

        if (isActive.HasValue)
            q = q.Where(x => x.IsActive == isActive.Value);

        q = ApplySearch(q, search);

        var list = await q.OrderBy(x => x.Name).ToListAsync();
        return list.Select(x => x.ToDto()).ToList();
    }

    public async Task<CustomerDto?> GetByIdAsync(Guid id)
    {
        var c = await _db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        return c?.ToDto();
    }

    public async Task<CustomerDto> CreateAsync(CreateCustomerRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            throw new ArgumentException("Name zorunludur.");

        var entity = new Customer
        {
            Name = req.Name.Trim(),
            Info = string.IsNullOrWhiteSpace(req.Info) ? null : req.Info.Trim(),
            Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim(),
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Customers.Add(entity);
        await _db.SaveChangesAsync();
        return entity.ToDto();
    }

    public async Task<bool> UpdateAsync(Guid id, UpdateCustomerRequest req)
    {
        var c = await _db.Customers.FirstOrDefaultAsync(x => x.Id == id);
        if (c is null) return false;

        if (req.Name is not null && string.IsNullOrWhiteSpace(req.Name))
            throw new ArgumentException("Name boş olamaz.");

        c.ApplyUpdate(req);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SetActivationAsync(Guid id, bool isActive)
    {
        var c = await _db.Customers.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (c is null) return false;

        c.IsActive = isActive;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SoftDeleteAsync(Guid id)
    {
        var c = await _db.Customers.FirstOrDefaultAsync(x => x.Id == id);
        if (c is null) return false;

        c.IsDeleted = true;
        c.IsActive = false;
        await _db.SaveChangesAsync();
        return true;
    }

    // ── HELPER ──────────────────────────────────────────────

    private static IQueryable<Customer> ApplySearch(IQueryable<Customer> query, string? search)
    {
        if (string.IsNullOrWhiteSpace(search)) return query;

        var s = search.Trim();
        return query.Where(x =>
            x.Name.Contains(s) ||
            (x.Info != null && x.Info.Contains(s)) ||
            (x.Phone != null && x.Phone.Contains(s))
        );
    }
}
