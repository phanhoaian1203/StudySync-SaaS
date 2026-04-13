using System.ComponentModel.DataAnnotations;

namespace StudySync.Application.DTOs.Task;

public class UpdateTaskDetailsRequest
{
    [Required(ErrorMessage = "Tiêu đề không được để trống")]
    [MaxLength(200, ErrorMessage = "Tiêu đề không được vượt quá 200 ký tự")]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }
}
