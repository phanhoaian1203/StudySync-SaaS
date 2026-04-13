namespace StudySync.Domain.Exceptions;

/// <summary>
/// Ném ra khi người dùng đã xác thực nhưng không có quyền thực hiện hành động (HTTP 403 Forbidden).
/// Ví dụ: Free User cố dùng tính năng OCR của Pro, user không phải Owner của Workspace.
/// </summary>
public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message) { }
}
