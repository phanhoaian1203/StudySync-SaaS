using StudySync.Domain.Entities;

namespace StudySync.Application.Interfaces.Repositories;

public interface IBoardRepository
{
    Task<Board?> GetByIdAsync(Guid id);
    Task<IEnumerable<Board>> GetBoardsByWorkspaceIdAsync(Guid workspaceId);
    Task AddAsync(Board board);
    void Update(Board board);
    void Delete(Board board);
}
