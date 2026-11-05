using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FieldPin.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerIsActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WorkOrders_CustomerId_CreatedAt",
                table: "WorkOrders");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Customers",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrders_CustomerId",
                table: "WorkOrders",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_IsActive_Name",
                table: "Customers",
                columns: new[] { "IsActive", "Name" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WorkOrders_CustomerId",
                table: "WorkOrders");

            migrationBuilder.DropIndex(
                name: "IX_Customers_IsActive_Name",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Customers");

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrders_CustomerId_CreatedAt",
                table: "WorkOrders",
                columns: new[] { "CustomerId", "CreatedAt" });
        }
    }
}
