using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudySync.Domain.Entities;

namespace StudySync.Infrastructure.Persistence.Configurations;

public class TaskAssigneeConfiguration : IEntityTypeConfiguration<TaskAssignee>
{
    public void Configure(EntityTypeBuilder<TaskAssignee> builder)
    {
        // Khóa chính kép
        builder.HasKey(ta => new { ta.TaskItemId, ta.UserId });

        // Tắt Cascade Delete
        builder.HasOne(ta => ta.TaskItem)
               .WithMany(t => t.Assignees)
               .HasForeignKey(ta => ta.TaskItemId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ta => ta.User)
               .WithMany(u => u.AssignedTasks)
               .HasForeignKey(ta => ta.UserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}