namespace StudySync.Domain.Exceptions;

/// <summary>
/// Ném ra khi không tìm thấy tài nguyên (HTTP 404 Not Found).
/// Ví dụ: User không tồn tại, Workspace không tìm thấy.
/// </summary>
public class NotFoundException : Exception
{
    public NotFoundException(string resourceName, object key)
        : base($"'{resourceName}' với ID '{key}' không tồn tại.") { }

    public NotFoundException(string message) : base(message) { }
}
