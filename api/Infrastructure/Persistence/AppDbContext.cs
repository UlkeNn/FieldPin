using Microsoft.EntityFrameworkCore;
using FieldPin.Api.Models;
namespace FieldPin.Api.Infrastructure.Persistence;
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<FieldPin.Api.Models.AppUser> Users => Set<FieldPin.Api.Models.AppUser>();

    public DbSet<WorkOrder> WorkOrders => Set<WorkOrder>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<WorkOrderObject> WorkOrderObjects => Set<WorkOrderObject>();

    // WorkOrderObjectMedia tablomuz
    public DbSet<WorkOrderObjectMedia> WorkOrderObjectMedia => Set<WorkOrderObjectMedia>();

    // Refresh token'lar
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // Talep (ServiceRequest) modülü
    public DbSet<ServiceRequest> ServiceRequests => Set<ServiceRequest>();
    public DbSet<ServiceRequestMedia> ServiceRequestMedia => Set<ServiceRequestMedia>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WorkOrder>()
            .HasIndex(x => new { x.TechnicianId, x.CreatedAt });

        modelBuilder.Entity<Customer>()
            .Property(x => x.CreatedAtUtc)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        modelBuilder.Entity<WorkOrderObject>()
            .HasIndex(x => x.WorkOrderId);

        modelBuilder.Entity<WorkOrderObject>()
            .HasIndex(x => new { x.ObjectType, x.ObjectIdentifier });

        // media ilişkisi
        modelBuilder.Entity<WorkOrderObjectMedia>()
            .HasIndex(x => x.WorkOrderObjectId);

        modelBuilder.Entity<WorkOrderObjectMedia>()
            .HasOne(x => x.WorkOrderObject)
            .WithMany(x => x.Media)
            .HasForeignKey(x => x.WorkOrderObjectId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<FieldPin.Api.Models.AppUser>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Username).IsRequired().HasMaxLength(64);
            e.Property(x => x.PasswordHash).IsRequired();
            e.Property(x => x.Role).IsRequired().HasMaxLength(32);
        });

        // ── Refresh Token ──
        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Token).IsRequired().HasMaxLength(256);
            e.HasIndex(x => x.Token).IsUnique();
            e.HasIndex(x => x.UserId);

            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            // Computed property'ler DB'ye yazılmasın
            e.Ignore(x => x.IsExpired);
            e.Ignore(x => x.IsRevoked);
            e.Ignore(x => x.IsActive);
        });

        // ── ServiceRequest (Talep) ──────────────────────────
        modelBuilder.Entity<ServiceRequest>()
            .HasIndex(x => x.RequestNo)
            .IsUnique();

        modelBuilder.Entity<ServiceRequest>()
            .HasIndex(x => new { x.Status, x.CreatedAtUtc });

        modelBuilder.Entity<ServiceRequest>()
            .HasIndex(x => new { x.AssignedUserId, x.Status });

        modelBuilder.Entity<ServiceRequest>()
            .HasIndex(x => x.CustomerId);

        modelBuilder.Entity<ServiceRequest>()
            .Property(x => x.RowVersion)
            .IsConcurrencyToken();

        // Talep silinince iş emri silinmez, sadece bağ kopar
        modelBuilder.Entity<WorkOrder>()
            .HasOne(x => x.ServiceRequest)
            .WithMany(x => x.WorkOrders)
            .HasForeignKey(x => x.ServiceRequestId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ServiceRequestMedia>()
            .HasIndex(x => x.ServiceRequestId);

        modelBuilder.Entity<ServiceRequestMedia>()
            .HasOne(x => x.ServiceRequest)
            .WithMany(x => x.Media)
            .HasForeignKey(x => x.ServiceRequestId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
