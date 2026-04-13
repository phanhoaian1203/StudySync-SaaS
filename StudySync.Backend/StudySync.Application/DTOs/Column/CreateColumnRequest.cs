using System.ComponentModel.DataAnnotations;

namespace StudySync.Application.DTOs.Column;

public class CreateColumnRequest
{
    public Guid BoardId { get; set; }

    [Required(ErrorMessage = "Tên Column là bắt buộc")]
    [MaxLength(50, ErrorMessage = "Tên Column không vượt quá 50 ký tự")]
    public string Name { get; set; } = string.Empty;
}
