using FieldPin.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FieldPin.Api.Infrastructure.Persistence;

public class DbSeeder
{
    private readonly AppDbContext _db;
    private readonly PasswordHasher<AppUser> _hasher = new();

    public DbSeeder(AppDbContext db) => _db = db;

    public async Task SeedAsync()
    {
        await _db.Database.MigrateAsync();

        //Admin yoksa ekle
        var adminUsername = "admin";
        var adminExists = await _db.Users.AnyAsync(x => x.Username == adminUsername);
        if (!adminExists)
        {
            var admin = new AppUser
            {
                Id = "admin-001",
                Username = adminUsername,
                Role = "Admin",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            };
            var adminPassword = Environment.GetEnvironmentVariable("ADMIN_DEFAULT_PASSWORD") 
                ?? throw new InvalidOperationException("ADMIN_DEFAULT_PASSWORD env variable is required.");

            admin.PasswordHash = _hasher.HashPassword(admin, adminPassword);
            _db.Users.Add(admin);
        }

        //Default technician yoksa ekle
        var techExists = await _db.Users.AnyAsync(x => x.Id == "tech-001" || x.Username == "tech-001");
        if (!techExists)
        {
            var tech = new AppUser
            {
                Id = "tech-001",
                Username = "tech-001",
                Role = "Technician",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            };
            var techPassword = Environment.GetEnvironmentVariable("TECH_DEFAULT_PASSWORD") 
                ?? "tech1234";
            tech.PasswordHash = _hasher.HashPassword(tech, techPassword);
            _db.Users.Add(tech);
        }

        // ✅ Müşteri seed
        if (!await _db.Customers.AnyAsync())
        {
            _db.Customers.AddRange(
                new Customer { Id = Guid.NewGuid(), Name = "Örnek Müşteri", Info = "Test müşteri", Phone = "0555 000 0001", IsActive = true },
                new Customer { Id = Guid.NewGuid(), Name = "Örnek Lojistik", Info = "Kurumsal", Phone = "0555 000 0002", IsActive = true },
                new Customer { Id = Guid.NewGuid(), Name = "Örnek Teknik", Info = "Servis", Phone = "0555 000 0003", IsActive = true }
            );
        }

        await _db.SaveChangesAsync();
    }
}