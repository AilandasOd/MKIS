using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MKInformacineSistemaBack.Migrations
{
    /// <inheritdoc />
    public partial class Clubs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ClubId",
                table: "Polygons",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ClubId",
                table: "HuntingAreas",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ClubId",
                table: "DrivenHunts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ContactEmail",
                table: "Clubs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ContactPhone",
                table: "Clubs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Clubs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "FoundedDate",
                table: "Clubs",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "Clubs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ClubMemberships",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    JoinDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClubMemberships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClubMemberships_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClubMemberships_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Polygons_ClubId",
                table: "Polygons",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_HuntingAreas_ClubId",
                table: "HuntingAreas",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_DrivenHunts_ClubId",
                table: "DrivenHunts",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_ClubMemberships_ClubId",
                table: "ClubMemberships",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_ClubMemberships_MemberId",
                table: "ClubMemberships",
                column: "MemberId");

            migrationBuilder.AddForeignKey(
                name: "FK_DrivenHunts_Clubs_ClubId",
                table: "DrivenHunts",
                column: "ClubId",
                principalTable: "Clubs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_HuntingAreas_Clubs_ClubId",
                table: "HuntingAreas",
                column: "ClubId",
                principalTable: "Clubs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Polygons_Clubs_ClubId",
                table: "Polygons",
                column: "ClubId",
                principalTable: "Clubs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DrivenHunts_Clubs_ClubId",
                table: "DrivenHunts");

            migrationBuilder.DropForeignKey(
                name: "FK_HuntingAreas_Clubs_ClubId",
                table: "HuntingAreas");

            migrationBuilder.DropForeignKey(
                name: "FK_Polygons_Clubs_ClubId",
                table: "Polygons");

            migrationBuilder.DropTable(
                name: "ClubMemberships");

            migrationBuilder.DropIndex(
                name: "IX_Polygons_ClubId",
                table: "Polygons");

            migrationBuilder.DropIndex(
                name: "IX_HuntingAreas_ClubId",
                table: "HuntingAreas");

            migrationBuilder.DropIndex(
                name: "IX_DrivenHunts_ClubId",
                table: "DrivenHunts");

            migrationBuilder.DropColumn(
                name: "ClubId",
                table: "Polygons");

            migrationBuilder.DropColumn(
                name: "ClubId",
                table: "HuntingAreas");

            migrationBuilder.DropColumn(
                name: "ClubId",
                table: "DrivenHunts");

            migrationBuilder.DropColumn(
                name: "ContactEmail",
                table: "Clubs");

            migrationBuilder.DropColumn(
                name: "ContactPhone",
                table: "Clubs");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Clubs");

            migrationBuilder.DropColumn(
                name: "FoundedDate",
                table: "Clubs");

            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "Clubs");
        }
    }
}
