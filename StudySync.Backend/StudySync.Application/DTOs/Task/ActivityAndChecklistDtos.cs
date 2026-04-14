namespace StudySync.Application.DTOs.Task;

public class ActivityLogResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public string ActivityType { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TaskChecklistResponse
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public double OrderIndex { get; set; }
}
