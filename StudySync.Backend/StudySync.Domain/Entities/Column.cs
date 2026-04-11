using StudySync.Domain.Common;

namespace StudySync.Domain.Entities;

public class Column : BaseEntity
{
    public Guid BoardId { get; set; }
    public string Name { get; set; } = string.Empty;

    // Dùng kiểu double (hoặc float) để dễ dàng tính toán khi kéo thả đổi vị trí
    public double OrderIndex { get; set; }

    // Navigation Properties
    public Board Board { get; set; } = null!;
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}