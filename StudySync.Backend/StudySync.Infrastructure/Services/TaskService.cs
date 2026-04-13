using StudySync.Application.DTOs.Task;
using StudySync.Application.Interfaces.Repositories;
using StudySync.Application.Interfaces.Services;
using StudySync.Domain.Entities;
using StudySync.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace StudySync.Infrastructure.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;
    private readonly IColumnRepository _columnRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserRepository _userRepository;
    private readonly StudySync.Infrastructure.Persistence.ApplicationDbContext _context;

    public TaskService(
        ITaskRepository taskRepository,
        IColumnRepository columnRepository,
        IUserRepository userRepository,
        StudySync.Infrastructure.Persistence.ApplicationDbContext context,
        IUnitOfWork unitOfWork)
    {
        _taskRepository = taskRepository;
        _columnRepository = columnRepository;
        _userRepository = userRepository;
        _context = context;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<TaskResponse>> GetTasksByColumnIdAsync(Guid columnId, Guid requestingUserId)
    {
        // Bỏ qua Security Check tạm thời để tập trung vào Assignees logic

        // Lấy danh sách task kèm Assignees
        var tasks = await _context.TaskItems
            .Include(t => t.Assignees)
                .ThenInclude(a => a.User)
            .Where(t => t.ColumnId == columnId && !t.IsDeleted)
            .OrderBy(t => t.OrderIndex)
            .ToListAsync();

        return tasks.Select(t => new TaskResponse
        {
            Id = t.Id,
            ColumnId = t.ColumnId,
            Title = t.Title,
            Description = t.Description,
            DueDate = t.DueDate,
            OrderIndex = t.OrderIndex,
            CreatedAt = t.CreatedAt,
            Assignees = t.Assignees.Select(a => new StudySync.Application.DTOs.User.UserDto
            {
                Id = a.User.Id,
                FullName = a.User.FullName,
                Email = a.User.Email
            }).ToList()
        });
    }

    // ───────────────────────────────────────────────────────────────────
    public async Task<TaskResponse> CreateAsync(CreateTaskRequest request, Guid requestingUserId)
    {

        var newOrderIndex = await _taskRepository.GetMaxOrderIndexAsync(request.ColumnId) + 1000;

        var newTask = new TaskItem
        {
            ColumnId = request.ColumnId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            OrderIndex = newOrderIndex,
            CreatedById = requestingUserId
        };

        await _taskRepository.AddAsync(newTask);
        await _unitOfWork.SaveChangesAsync();

        return await GetTaskResponseMappedById(newTask.Id);
    }

    // ───────────────────────────────────────────────────────────────────
    public async Task DeleteAsync(Guid taskId, Guid requestingUserId)
    {
        var task = await _taskRepository.GetByIdAsync(taskId)
            ?? throw new NotFoundException("Task", taskId);

        _taskRepository.Delete(task);
        await _unitOfWork.SaveChangesAsync();
    }

    // ───────────────────────────────────────────────────────────────────
    public async Task<TaskResponse> MoveAsync(Guid taskId, MoveTaskRequest request, Guid requestingUserId)
    {
        var task = await _taskRepository.GetByIdAsync(taskId)
            ?? throw new NotFoundException("Task", taskId);

        task.ColumnId = request.NewColumnId;
        task.OrderIndex = request.OrderIndex;
        task.UpdatedById = requestingUserId;

        _taskRepository.Update(task);
        await _unitOfWork.SaveChangesAsync();

        return await GetTaskResponseMappedById(task.Id);
    }

    public async Task<TaskResponse> UpdateDetailsAsync(Guid taskId, UpdateTaskDetailsRequest request, Guid requestingUserId)
    {
        var task = await _taskRepository.GetByIdAsync(taskId)
            ?? throw new NotFoundException("Task", taskId);

        task.Title = request.Title.Trim();
        if (request.Description != null)
        {
            task.Description = request.Description.Trim();
        }
        else
        {
            task.Description = null;
        }

        task.UpdatedById = requestingUserId;

        _taskRepository.Update(task);
        await _unitOfWork.SaveChangesAsync();

        return await GetTaskResponseMappedById(task.Id);
    }

    public async Task<TaskResponse> AssignUserAsync(Guid taskId, AssignTaskRequest request, Guid requestingUserId)
    {
        var task = await _taskRepository.GetByIdAsync(taskId)
            ?? throw new NotFoundException("Task", taskId);
            
        // Kiểm tra user có tồn tại ko
        var userToAssign = await _userRepository.GetByIdAsync(request.UserId)
            ?? throw new NotFoundException("User", request.UserId);

        var existingAssignee = await _context.TaskAssignees
            .FirstOrDefaultAsync(a => a.TaskItemId == taskId && a.UserId == request.UserId);

        if (existingAssignee == null)
        {
            await _context.TaskAssignees.AddAsync(new TaskAssignee { TaskItemId = taskId, UserId = request.UserId });
            await _unitOfWork.SaveChangesAsync();
        }

        return await GetTaskResponseMappedById(taskId);
    }

    public async Task<TaskResponse> UnassignUserAsync(Guid taskId, Guid userIdToUnassign, Guid requestingUserId)
    {
        var task = await _taskRepository.GetByIdAsync(taskId)
             ?? throw new NotFoundException("Task", taskId);

        var existingAssignee = await _context.TaskAssignees
            .FirstOrDefaultAsync(a => a.TaskItemId == taskId && a.UserId == userIdToUnassign);

        if (existingAssignee != null)
        {
            _context.TaskAssignees.Remove(existingAssignee);
            await _unitOfWork.SaveChangesAsync();
        }

        return await GetTaskResponseMappedById(taskId);
    }

    // Helper map Data full Assignees
    private async Task<TaskResponse> GetTaskResponseMappedById(Guid taskId)
    {
        var t = await _context.TaskItems
            .Include(x => x.Assignees)
                .ThenInclude(a => a.User)
            .FirstOrDefaultAsync(x => x.Id == taskId);

        return new TaskResponse
        {
            Id = t!.Id,
            ColumnId = t.ColumnId,
            Title = t.Title,
            Description = t.Description,
            DueDate = t.DueDate,
            OrderIndex = t.OrderIndex,
            CreatedAt = t.CreatedAt,
            Assignees = t.Assignees.Select(a => new StudySync.Application.DTOs.User.UserDto
            {
                Id = a.User.Id,
                FullName = a.User.FullName,
                Email = a.User.Email
            }).ToList()
        };
    }
}
