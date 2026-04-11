using StudySync.Domain.Entities;

namespace StudySync.Application.Interfaces.Repositories;

public interface IWorkspaceRepository
{
    Task<Workspace?> GetByIdAsync(Guid id);

    Task<IEnumerable<Workspace>> GetWorkspacesByOwnerIdAsync(Guid ownerId);

    Task AddAsync(Workspace workspace);
    void Update(Workspace workspace);
    void Delete(Workspace workspace); // Xóa mềm
}