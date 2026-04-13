namespace StudySync.Domain.Exceptions;

/// <summary>
/// Ném ra khi có xung đột dữ liệu (HTTP 409 Conflict).
/// Ví dụ: Email đã được đăng ký, tên Workspace đã tồn tại.
/// </summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}
