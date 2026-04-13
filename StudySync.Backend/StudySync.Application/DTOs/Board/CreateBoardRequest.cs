using System.ComponentModel.DataAnnotations;

namespace StudySync.Application.DTOs.Board;

public class CreateBoardRequest
{
    public Guid WorkspaceId { get; set; }

    [Required(ErrorMessage = "Tên Board là bắt buộc")]
    [MaxLength(100, ErrorMessage = "Tên Board không vượt quá 100 ký tự")]
    public string Name { get; set; } = string.Empty;
}
