using System.ComponentModel.DataAnnotations;

namespace StudySync.Application.DTOs.Workspace;

public class CreateWorkspaceRequest
{
    [Required(ErrorMessage = "Tên Workspace là bắt buộc")]
    [MaxLength(100, ErrorMessage = "Tên Workspace không được vượt quá 100 ký tự")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(300, ErrorMessage = "Mô tả không được vượt quá 300 ký tự")]
    public string? Description { get; set; }
}
