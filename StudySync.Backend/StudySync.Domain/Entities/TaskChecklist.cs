using StudySync.Domain.Common;

namespace StudySync.Domain.Entities;

public class TaskChecklist : BaseEntity
{
    public Guid TaskItemId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public double OrderIndex { get; set; }

    // Navigation property
    public virtual TaskItem TaskItem { get; set; } = null!;
}
