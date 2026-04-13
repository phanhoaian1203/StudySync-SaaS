using StudySync.Domain.Entities;

namespace StudySync.Application.Interfaces.Repositories;

public interface IColumnRepository
{
    Task<Column?> GetByIdAsync(Guid id);
    Task<IEnumerable<Column>> GetColumnsByBoardIdAsync(Guid boardId);
    Task AddAsync(Column column);
    void Update(Column column);
    void Delete(Column column);
    Task<double> GetMaxOrderIndexAsync(Guid boardId);
}
