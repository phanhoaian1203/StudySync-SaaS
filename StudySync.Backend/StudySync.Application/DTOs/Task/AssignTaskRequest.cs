using System.ComponentModel.DataAnnotations;

namespace StudySync.Application.DTOs.Task;

public class AssignTaskRequest
{
    [Required]
    public Guid UserId { get; set; }
}
