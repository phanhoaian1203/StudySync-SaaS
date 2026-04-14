using StudySync.Domain.Common;

namespace StudySync.Domain.Entities;

public class TaskComment : BaseEntity
{
    public Guid TaskItemId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;

    // Navigation Properties
    public TaskItem TaskItem { get; set; } = null!;
    public User User { get; set; } = null!;
}
