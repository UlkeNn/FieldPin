using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FieldPin.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveRequestCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ServiceRequests_RequestCategories_CategoryId",
                table: "ServiceRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceRequests_RequestCategories_SubCategoryId",
                table: "ServiceRequests");

            migrationBuilder.DropIndex(
                name: "IX_ServiceRequests_CategoryId",
                table: "ServiceRequests");

            migrationBuilder.DropIndex(
                name: "IX_ServiceRequests_SubCategoryId",
                table: "ServiceRequests");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "ServiceRequests");

            migrationBuilder.DropColumn(
                name: "SubCategoryId",
                table: "ServiceRequests");

            // SQLite'ta DROP TABLE örtük bir DELETE yapar ve FK'ları kontrol eder. EF, ServiceRequests
            // rebuild'ini (FK/kolon düşürme) en sona koyduğundan referanslar önce null'a çekilir;
            // ParentId self-FK'sı yüzünden de alt kategoriler üst kategorilerden önce silinir.
            migrationBuilder.Sql("UPDATE \"ServiceRequests\" SET \"CategoryId\" = NULL, \"SubCategoryId\" = NULL;");
            migrationBuilder.Sql("DELETE FROM \"RequestCategories\" WHERE \"ParentId\" IS NOT NULL;");

            migrationBuilder.DropTable(
                name: "RequestCategories");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "ServiceRequests",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SubCategoryId",
                table: "ServiceRequests",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "RequestCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ParentId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequestCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RequestCategories_RequestCategories_ParentId",
                        column: x => x.ParentId,
                        principalTable: "RequestCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_CategoryId",
                table: "ServiceRequests",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_SubCategoryId",
                table: "ServiceRequests",
                column: "SubCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_RequestCategories_ParentId",
                table: "RequestCategories",
                column: "ParentId");

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceRequests_RequestCategories_CategoryId",
                table: "ServiceRequests",
                column: "CategoryId",
                principalTable: "RequestCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceRequests_RequestCategories_SubCategoryId",
                table: "ServiceRequests",
                column: "SubCategoryId",
                principalTable: "RequestCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
