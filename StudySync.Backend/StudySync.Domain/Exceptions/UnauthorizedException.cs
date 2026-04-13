namespace StudySync.Domain.Exceptions;

/// <summary>
/// Ném ra khi xác thực thất bại (HTTP 401 Unauthorized).
/// Ví dụ: Sai email/mật khẩu, token hết hạn.
/// </summary>
public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message) : base(message) { }
}
