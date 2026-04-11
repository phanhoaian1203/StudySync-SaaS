using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudySync.Domain.Entities;

namespace StudySync.Infrastructure.Persistence.Configurations;

public class WorkspaceMemberConfiguration : IEntityTypeConfiguration<WorkspaceMember>
{
    public void Configure(EntityTypeBuilder<WorkspaceMember> builder)
    {
        // Khóa chính kép
        builder.HasKey(wm => new { wm.WorkspaceId, wm.UserId });

        // Tắt Cascade Delete
        builder.HasOne(wm => wm.Workspace)
               .WithMany(w => w.Members)
               .HasForeignKey(wm => wm.WorkspaceId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(wm => wm.User)
               .WithMany(u => u.WorkspaceMemberships)
               .HasForeignKey(wm => wm.UserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}