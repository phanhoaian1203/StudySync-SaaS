using StudySync.Application.DTOs.Task;

namespace StudySync.Application.DTOs.Column;

public class ColumnResponse
{
    public Guid Id { get; set; }
    public Guid BoardId { get; set; }
    public string Name { get; set; } = string.Empty;
    public double OrderIndex { get; set; }
    
    // Thuận tiện để Frontend render danh sách thẻ theo từng cột
    public List<TaskResponse> Tasks { get; set; } = new();
}
