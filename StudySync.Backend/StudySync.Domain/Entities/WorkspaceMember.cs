using StudySync.Domain.Enums;

namespace StudySync.Domain.Entities;

// Bảng này không cần kế thừa BaseEntity vì khóa chính của nó là cặp (WorkspaceId, UserId)
public class WorkspaceMember
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public WorkspaceRole Role { get; set; } = WorkspaceRole.Member;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}