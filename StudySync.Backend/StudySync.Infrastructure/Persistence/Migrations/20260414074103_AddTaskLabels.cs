using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudySync.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskLabels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Labels",
                table: "TaskItems",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Labels",
                table: "TaskItems");
        }
    }
}
