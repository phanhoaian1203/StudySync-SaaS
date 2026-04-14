using StudySync.Application.DTOs.Task;

namespace StudySync.Application.Interfaces.Services;

public interface IChecklistService
{
    Task<TaskChecklistResponse> AddAsync(Guid taskId, string content, Guid requestingUserId);
    Task<TaskChecklistResponse> ToggleAsync(Guid taskId, Guid checklistId, Guid requestingUserId);
    Task DeleteAsync(Guid taskId, Guid checklistId, Guid requestingUserId);
    Task<TaskChecklistResponse> UpdateAsync(Guid taskId, Guid checklistId, string content, Guid requestingUserId);
}
