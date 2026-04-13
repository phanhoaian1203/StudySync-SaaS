using StudySync.Application.DTOs.Task;

namespace StudySync.Application.Interfaces.Services;

public interface ITaskService
{
    Task<IEnumerable<TaskResponse>> GetTasksByColumnIdAsync(Guid columnId, Guid requestingUserId);
    Task<TaskResponse> CreateAsync(CreateTaskRequest request, Guid requestingUserId);
    Task DeleteAsync(Guid taskId, Guid requestingUserId);
    
    // Todo (Sprint 4): Cập nhật vị trí (Drag & Drop), Assign, Due Date
}
