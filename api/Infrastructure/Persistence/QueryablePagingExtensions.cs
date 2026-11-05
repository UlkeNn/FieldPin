using Microsoft.EntityFrameworkCore;

namespace FieldPin.Api.Infrastructure.Persistence;

// Ortak sayfalama yardımcısı. WorkOrderService. ile aynı clamp kurallarını
// generic olarak sunar; yeni liste endpoint'leri (ör. ServiceRequests) bunu kullanır.
public static class QueryablePagingExtensions
{
    public const int DefaultPageSize = 15;
    public const int MaxPageSize = 50;

    public static async Task<(List<T> Items, int Page, int PageSize, int TotalCount, int TotalPages)>
        ToPagedAsync<T>(this IOrderedQueryable<T> query, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = DefaultPageSize;
        if (pageSize > MaxPageSize) pageSize = MaxPageSize;

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, page, pageSize, totalCount, totalPages);
    }
}
