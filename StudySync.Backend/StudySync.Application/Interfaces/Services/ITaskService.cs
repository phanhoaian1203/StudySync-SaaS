using StudySync.Application.DTOs.Task;

namespace StudySync.Application.Interfaces.Services;

public interface ITaskService
{
    Task<IEnumerable<TaskResponse>> GetTasksByColumnIdAsync(Guid columnId, Guid requestingUserId);
    Task<TaskResponse> CreateAsync(CreateTaskRequest request, Guid requestingUserId);
    Task DeleteAsync(Guid taskId, Guid requestingUserId);
    
    Task<TaskResponse> MoveAsync(Guid taskId, MoveTaskRequest request, Guid requestingUserId);
    
    Task<TaskResponse> UpdateDetailsAsync(Guid taskId, UpdateTaskDetailsRequest request, Guid requestingUserId);
}
