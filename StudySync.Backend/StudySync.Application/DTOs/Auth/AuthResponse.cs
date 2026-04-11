using StudySync.Domain.Enums;

namespace StudySync.Application.DTOs.Auth;

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public SubscriptionPlan SubscriptionPlan { get; set; }
}