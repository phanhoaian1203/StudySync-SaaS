using StudySync.Domain.Common;

namespace StudySync.Domain.Entities;

public class TaskAttachment : BaseEntity
{
    public Guid TaskId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string PublicId { get; set; } = string.Empty; // Để xóa trên Cloudinary
    public long FileSize { get; set; }
    public string FileType { get; set; } = string.Empty; // image/png, application/pdf...

    // Navigation Property
    public TaskItem Task { get; set; } = null!;
}
