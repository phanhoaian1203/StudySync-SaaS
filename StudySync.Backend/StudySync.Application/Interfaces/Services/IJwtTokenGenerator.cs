using StudySync.Domain.Entities;

namespace StudySync.Application.Interfaces.Services;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}