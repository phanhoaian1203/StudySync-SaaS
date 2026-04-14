using StudySync.Application.DTOs.User;

namespace StudySync.Application.DTOs.Task;

public class TaskCommentResponse
{
    public Guid Id { get; set; }
    public Guid TaskItemId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public UserDto User { get; set; } = null!;
}
