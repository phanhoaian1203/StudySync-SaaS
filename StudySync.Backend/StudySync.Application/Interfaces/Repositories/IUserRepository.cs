using StudySync.Domain.Entities;

namespace StudySync.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);

    Task<User?> GetByEmailAsync(string email);

    Task<bool> IsEmailExistsAsync(string email);

    Task AddAsync(User user);
    void Update(User user);

}