using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FieldPin.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkOrderLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "WorkOrders",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "LocationAccuracy",
                table: "WorkOrders",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LocationCapturedAt",
                table: "WorkOrders",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LocationSource",
                table: "WorkOrders",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "WorkOrders",
                type: "REAL",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "WorkOrders");

            migrationBuilder.DropColumn(
                name: "LocationAccuracy",
                table: "WorkOrders");

            migrationBuilder.DropColumn(
                name: "LocationCapturedAt",
                table: "WorkOrders");

            migrationBuilder.DropColumn(
                name: "LocationSource",
                table: "WorkOrders");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "WorkOrders");
        }
    }
}
