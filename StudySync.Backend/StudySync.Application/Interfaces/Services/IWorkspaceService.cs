using StudySync.Application.DTOs.Workspace;

namespace StudySync.Application.Interfaces.Services;

public interface IWorkspaceService
{
    /// <summary>Lấy danh sách Workspace của user hiện tại (owned + member).</summary>
    Task<IEnumerable<WorkspaceResponse>> GetMyWorkspacesAsync(Guid userId);

    /// <summary>Lấy chi tiết 1 Workspace (phải là thành viên).</summary>
    Task<WorkspaceResponse> GetByIdAsync(Guid workspaceId, Guid requestingUserId);

    /// <summary>
    /// Tạo Workspace mới. Kiểm tra quota:
    /// Free User: tối đa 3 Workspace, Pro User: không giới hạn.
    /// </summary>
    Task<WorkspaceResponse> CreateAsync(CreateWorkspaceRequest request, Guid ownerId);

    /// <summary>Xóa mềm Workspace (chỉ Owner được phép).</summary>
    Task DeleteAsync(Guid workspaceId, Guid ownerId);
}
