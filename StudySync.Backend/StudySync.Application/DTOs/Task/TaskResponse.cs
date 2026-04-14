namespace StudySync.Application.DTOs.Task;

public class TaskResponse
{
    public Guid Id { get; set; }
    public Guid ColumnId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Labels { get; set; }
    public double OrderIndex { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public List<StudySync.Application.DTOs.User.UserDto> Assignees { get; set; } = new();
}
