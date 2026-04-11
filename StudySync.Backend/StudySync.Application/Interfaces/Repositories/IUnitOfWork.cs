namespace StudySync.Application.Interfaces.Repositories;

public interface IUnitOfWork : IDisposable
{
    // Hàm lưu toàn bộ thay đổi xuống Database
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    // Các hàm quản lý Transaction (Dùng cho các nghiệp vụ phức tạp)
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}