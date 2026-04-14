using StudySync.Domain.Common;
using StudySync.Domain.Enums;

namespace StudySync.Domain.Entities;

public class ActivityLog : BaseEntity
{
    public Guid BoardId { get; set; }
    public Guid? TaskItemId { get; set; }
    public Guid UserId { get; set; }
    public ActivityType ActivityType { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }

    // Navigation properties
    public virtual Board Board { get; set; } = null!;
    public virtual TaskItem? TaskItem { get; set; }
    public virtual User User { get; set; } = null!;
}
