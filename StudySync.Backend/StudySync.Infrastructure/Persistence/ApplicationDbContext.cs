using System.Reflection;
using Microsoft.EntityFrameworkCore;
using StudySync.Domain.Entities;

namespace StudySync.Infrastructure.Persistence; 
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Workspace> Workspaces { get; set; }
    public DbSet<WorkspaceMember> WorkspaceMembers { get; set; }
    public DbSet<Board> Boards { get; set; }
    public DbSet<Column> Columns { get; set; }
    public DbSet<TaskItem> TaskItems { get; set; }
    public DbSet<TaskAssignee> TaskAssignees { get; set; }
    public DbSet<TaskComment> TaskComments { get; set; }
    public DbSet<TaskAttachment> TaskAttachments { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }
    public DbSet<TaskChecklist> TaskChecklists { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // Fix vòng lặp Cascade Delete SQL Server
        modelBuilder.Entity<TaskComment>()
            .HasOne(c => c.User)
            .WithMany()
            .OnDelete(DeleteBehavior.Restrict);

        // Xóa Task thì xóa luôn Attachments
        modelBuilder.Entity<TaskAttachment>()
            .HasOne(a => a.Task)
            .WithMany(t => t.Attachments)
            .HasForeignKey(a => a.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        // ════════════════════════════════════════════════════════════════════
        // PERFORMANCE OPTIMIZATION: Bổ sung Index cho các khóa ngoại thường dùng
        // ════════════════════════════════════════════════════════════════════
        
        modelBuilder.Entity<Workspace>().HasIndex(w => w.OwnerId);
        modelBuilder.Entity<Board>().HasIndex(b => b.WorkspaceId);
        modelBuilder.Entity<Column>().HasIndex(c => c.BoardId);
        
        modelBuilder.Entity<TaskItem>()
            .HasIndex(t => t.ColumnId);
        
        modelBuilder.Entity<TaskComment>()
            .HasIndex(c => c.TaskItemId);
            
        modelBuilder.Entity<TaskAttachment>()
            .HasIndex(a => a.TaskId);

        // ════════════════════════════════════════════════════════════════════
        // SPRINT 13: Activity Log & Task Checklist Configurations
        // ════════════════════════════════════════════════════════════════════

        modelBuilder.Entity<ActivityLog>()
            .HasOne(al => al.Board)
            .WithMany()
            .HasForeignKey(al => al.BoardId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<ActivityLog>()
            .HasOne(al => al.User)
            .WithMany()
            .HasForeignKey(al => al.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ActivityLog>()
            .HasOne(al => al.TaskItem)
            .WithMany(t => t.ActivityLogs)
            .HasForeignKey(al => al.TaskItemId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<ActivityLog>()
            .HasIndex(al => al.BoardId);
        modelBuilder.Entity<ActivityLog>()
            .HasIndex(al => al.TaskItemId);

        modelBuilder.Entity<TaskChecklist>()
            .HasOne(tc => tc.TaskItem)
            .WithMany(t => t.Checklists)
            .HasForeignKey(tc => tc.TaskItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TaskChecklist>()
            .HasIndex(tc => tc.TaskItemId);
    }
}