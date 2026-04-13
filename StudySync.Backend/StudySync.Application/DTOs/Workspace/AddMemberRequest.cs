using System.ComponentModel.DataAnnotations;

namespace StudySync.Application.DTOs.Workspace;

public class AddMemberRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
