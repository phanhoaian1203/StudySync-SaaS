using StudySync.Application.DTOs.Task;
using StudySync.Application.Interfaces.Repositories;
using StudySync.Application.Interfaces.Services;
using StudySync.Domain.Entities;
using StudySync.Domain.Exceptions;

namespace StudySync.Infrastructure.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;
    private readonly IColumnRepository _columnRepository;
    private readonly IUnitOfWork _unitOfWork;

    public TaskService(
        ITaskRepository taskRepository,
        IColumnRepository columnRepository,
        IUnitOfWork unitOfWork)
    {
        _taskRepository = taskRepository;
        _columnRepository = columnRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<TaskResponse>> GetTasksByColumnIdAsync(Guid columnId, Guid requestingUserId)
    {
        var column = await _columnRepository.GetByIdAsync(columnId)
            ?? throw new NotFoundException("Column", columnId);

        var tasks = await _taskRepository.GetTasksByColumnIdAsync(columnId);

        return tasks.Select(t => new TaskResponse
        {
            Id = t.Id,
            ColumnId = t.ColumnId,
            Title = t.Title,
            Description = t.Description,
            DueDate = t.DueDate,
            OrderIndex = t.OrderIndex,
            CreatedAt = t.CreatedAt
        });
    }

    public async Task<TaskResponse> CreateAsync(CreateTaskRequest request, Guid requestingUserId)
    {
        var column = await _columnRepository.GetByIdAsync(request.ColumnId)
            ?? throw new NotFoundException("Column", request.ColumnId);

        var maxOrder = await _taskRepository.GetMaxOrderIndexAsync(request.ColumnId);
        
        var task = new TaskItem
        {
            ColumnId = request.ColumnId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            OrderIndex = maxOrder + 1000, // Xếp cuối cột
            CreatedById = requestingUserId
        };

        await _taskRepository.AddAsync(task);
        await _unitOfWork.SaveChangesAsync();

        return new TaskResponse
        {
            Id = task.Id,
            ColumnId = task.ColumnId,
            Title = task.Title,
            Description = task.Description,
            DueDate = task.DueDate,
            OrderIndex = task.OrderIndex,
            CreatedAt = task.CreatedAt
        };
    }

    public async Task DeleteAsync(Guid taskId, Guid requestingUserId)
    {
        var task = await _taskRepository.GetByIdAsync(taskId)
            ?? throw new NotFoundException("Task", taskId);

        _taskRepository.Delete(task);
        await _unitOfWork.SaveChangesAsync();
    }
}
