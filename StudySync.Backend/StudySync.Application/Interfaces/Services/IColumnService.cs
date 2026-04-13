using StudySync.Application.DTOs.Column;

namespace StudySync.Application.Interfaces.Services;

public interface IColumnService
{
    Task<IEnumerable<ColumnResponse>> GetColumnsByBoardIdAsync(Guid boardId, Guid requestingUserId);
    Task<ColumnResponse> CreateAsync(CreateColumnRequest request, Guid requestingUserId);
    Task DeleteAsync(Guid columnId, Guid requestingUserId);
    
    // Todo (Sprint 4): Cập nhật vị trí (Drag & Drop)
}
