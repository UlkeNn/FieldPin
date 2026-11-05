using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FieldPin.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class WorkOrders_MultiMedia_Role_FaultFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WorkOrderObjects_ObjectType_ObjectExternalId",
                table: "WorkOrderObjects");

            migrationBuilder.DropIndex(
                name: "IX_Customers_IsActive_Name",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "ContentType",
                table: "WorkOrderObjects");

            migrationBuilder.DropColumn(
                name: "FileName",
                table: "WorkOrderObjects");

            migrationBuilder.DropColumn(
                name: "ObjectExternalId",
                table: "WorkOrderObjects");

            migrationBuilder.DropColumn(
                name: "RelativePath",
                table: "WorkOrderObjects");

            migrationBuilder.DropColumn(
                name: "SizeBytes",
                table: "WorkOrderObjects");

            migrationBuilder.AddColumn<string>(
                name: "FaultCause",
                table: "WorkOrders",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FaultResolution",
                table: "WorkOrders",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Role",
                table: "WorkOrderObjects",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Customers",
                type: "TEXT",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP",
                oldClrType: typeof(DateTime),
                oldType: "TEXT");

            migrationBuilder.CreateTable(
                name: "WorkOrderObjectMedia",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    WorkOrderObjectId = table.Column<Guid>(type: "TEXT", nullable: false),
                    FileName = table.Column<string>(type: "TEXT", nullable: false),
                    OriginalFileName = table.Column<string>(type: "TEXT", nullable: true),
                    RelativePath = table.Column<string>(type: "TEXT", nullable: false),
                    ContentType = table.Column<string>(type: "TEXT", nullable: true),
                    SizeBytes = table.Column<long>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkOrderObjectMedia", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkOrderObjectMedia_WorkOrderObjects_WorkOrderObjectId",
                        column: x => x.WorkOrderObjectId,
                        principalTable: "WorkOrderObjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderObjectMedia_WorkOrderObjectId",
                table: "WorkOrderObjectMedia",
                column: "WorkOrderObjectId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkOrderObjectMedia");

            migrationBuilder.DropColumn(
                name: "FaultCause",
                table: "WorkOrders");

            migrationBuilder.DropColumn(
                name: "FaultResolution",
                table: "WorkOrders");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "WorkOrderObjects");

            migrationBuilder.AddColumn<string>(
                name: "ContentType",
                table: "WorkOrderObjects",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FileName",
                table: "WorkOrderObjects",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ObjectExternalId",
                table: "WorkOrderObjects",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RelativePath",
                table: "WorkOrderObjects",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "SizeBytes",
                table: "WorkOrderObjects",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "Customers",
                type: "TEXT",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "TEXT",
                oldDefaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrderObjects_ObjectType_ObjectExternalId",
                table: "WorkOrderObjects",
                columns: new[] { "ObjectType", "ObjectExternalId" });

            migrationBuilder.CreateIndex(
                name: "IX_Customers_IsActive_Name",
                table: "Customers",
                columns: new[] { "IsActive", "Name" });
        }
    }
}
