using System.ComponentModel.DataAnnotations;

namespace StudySync.Application.DTOs.Task;

public class CreateTaskRequest
{
    public Guid ColumnId { get; set; }

    [Required(ErrorMessage = "Tiêu đề Task là bắt buộc")]
    [MaxLength(200, ErrorMessage = "Tiêu đề không vượt quá 200 ký tự")]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }
}
