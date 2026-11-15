using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NavX.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Races",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Grid = table.Column<string>(type: "TEXT", nullable: false),
                    Start = table.Column<string>(type: "TEXT", nullable: false),
                    Goal = table.Column<string>(type: "TEXT", nullable: false),
                    Winner = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Races", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SavedMaps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Grid = table.Column<string>(type: "TEXT", nullable: false),
                    DefaultStart = table.Column<string>(type: "TEXT", nullable: true),
                    DefaultGoal = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavedMaps", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AlgorithmResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    RaceId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Algorithm = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Cost = table.Column<int>(type: "INTEGER", nullable: true),
                    Path = table.Column<string>(type: "TEXT", nullable: false),
                    ExploredCount = table.Column<int>(type: "INTEGER", nullable: false),
                    TimeMs = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlgorithmResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AlgorithmResults_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AlgorithmResults_RaceId",
                table: "AlgorithmResults",
                column: "RaceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlgorithmResults");

            migrationBuilder.DropTable(
                name: "SavedMaps");

            migrationBuilder.DropTable(
                name: "Races");
        }
    }
}
