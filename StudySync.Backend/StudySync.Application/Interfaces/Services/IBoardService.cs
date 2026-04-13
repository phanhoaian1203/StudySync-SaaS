using StudySync.Application.DTOs.Board;

namespace StudySync.Application.Interfaces.Services;

public interface IBoardService
{
    Task<BoardResponse> GetByIdAsync(Guid boardId, Guid requestingUserId);
    Task<IEnumerable<BoardResponse>> GetBoardsByWorkspaceIdAsync(Guid workspaceId, Guid requestingUserId);
    Task<BoardResponse> CreateAsync(CreateBoardRequest request, Guid requestingUserId);
    Task DeleteAsync(Guid boardId, Guid requestingUserId);
}
