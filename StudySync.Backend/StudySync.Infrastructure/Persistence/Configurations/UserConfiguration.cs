using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudySync.Domain.Entities;

namespace StudySync.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        // Cấu hình cho bảng User ở đây
        builder.Property(u => u.Email)
               .HasMaxLength(100)
               .IsRequired();

        // Bạn có thể thêm index để tìm kiếm email nhanh hơn và không bị trùng lặp
        builder.HasIndex(u => u.Email).IsUnique();
    }
}