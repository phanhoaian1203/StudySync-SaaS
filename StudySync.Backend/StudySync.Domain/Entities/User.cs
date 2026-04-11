using StudySync.Domain.Common;
using StudySync.Domain.Enums;

namespace StudySync.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; } // Nullable vì có thể user không có avatar
    public SubscriptionPlan SubscriptionPlan { get; set; } = SubscriptionPlan.Free;

    // Navigation Properties
    public ICollection<Workspace> OwnedWorkspaces { get; set; } = new List<Workspace>();
    public ICollection<WorkspaceMember> WorkspaceMemberships { get; set; } = new List<WorkspaceMember>();
    public ICollection<TaskAssignee> AssignedTasks { get; set; } = new List<TaskAssignee>();
}