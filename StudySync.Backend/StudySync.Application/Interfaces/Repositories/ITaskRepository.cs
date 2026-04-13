using StudySync.Domain.Entities;

namespace StudySync.Application.Interfaces.Repositories;

public interface ITaskRepository
{
    Task<TaskItem?> GetByIdAsync(Guid id);
    Task<IEnumerable<TaskItem>> GetTasksByColumnIdAsync(Guid columnId);
    Task AddAsync(TaskItem task);
    void Update(TaskItem task);
    void Delete(TaskItem task);
    Task<double> GetMaxOrderIndexAsync(Guid columnId);
}
