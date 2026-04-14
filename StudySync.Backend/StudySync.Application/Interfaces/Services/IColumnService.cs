using StudySync.Application.DTOs.Column;

namespace StudySync.Application.Interfaces.Services;

public interface IColumnService
{
    Task<IEnumerable<ColumnResponse>> GetColumnsByBoardIdAsync(Guid boardId, Guid requestingUserId);
    Task<ColumnResponse> CreateAsync(CreateColumnRequest request, Guid requestingUserId);
    Task DeleteAsync(Guid columnId, Guid requestingUserId);
    
    Task<ColumnResponse> MoveAsync(Guid columnId, MoveColumnRequest request, Guid requestingUserId);
}
