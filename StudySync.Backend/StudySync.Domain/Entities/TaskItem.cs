using StudySync.Domain.Common;

namespace StudySync.Domain.Entities;

public class TaskItem : BaseEntity
{
    public Guid ColumnId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Labels { get; set; }
    public double OrderIndex { get; set; }

    // Dấu vết kiểm toán (Audit Trail) - Rất quan trọng khi làm việc nhóm
    public Guid? CreatedById { get; set; }
    public Guid? UpdatedById { get; set; }

    // Navigation Properties
    public Column Column { get; set; } = null!;
    public ICollection<TaskAssignee> Assignees { get; set; } = new List<TaskAssignee>();
    public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
}