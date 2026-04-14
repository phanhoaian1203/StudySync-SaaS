using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using StudySync.Infrastructure.Hubs;
using StudySync.Application.DTOs.Task;
using StudySync.Application.Interfaces.Repositories;
using StudySync.Application.Interfaces.Services;
using StudySync.Domain.Entities;
using StudySync.Domain.Enums;
using StudySync.Domain.Exceptions;
using StudySync.Infrastructure.Persistence;

namespace StudySync.Infrastructure.Services;

public class ChecklistService : IChecklistService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHubContext<BoardHub> _hubContext;

    public ChecklistService(ApplicationDbContext context, IUnitOfWork unitOfWork, IHubContext<BoardHub> hubContext)
    {
        _context = context;
        _unitOfWork = unitOfWork;
        _hubContext = hubContext;
    }

    public async Task<TaskChecklistResponse> AddAsync(Guid taskId, string content, Guid requestingUserId)
    {
        var task = await _context.TaskItems.Include(t => t.Column).FirstOrDefaultAsync(t => t.Id == taskId)
            ?? throw new NotFoundException("Task", taskId);

        var maxOrder = await _context.TaskChecklists.Where(c => c.TaskItemId == taskId).MaxAsync(c => (double?)c.OrderIndex) ?? 0;

        var checklist = new TaskChecklist
        {
            TaskItemId = taskId,
            Content = content.Trim(),
            IsCompleted = false,
            OrderIndex = maxOrder + 1000
        };

        await _context.TaskChecklists.AddAsync(checklist);
        
        // Log Activity
        await LogActivityAsync(task.Column.BoardId, taskId, requestingUserId, ActivityType.ChecklistAdded, $"Đã thêm mục kiểm soát: \"{checklist.Content}\"");
        
        await _unitOfWork.SaveChangesAsync();

        var response = MapToResponse(checklist);
        await BroadcastUpdate(task.Column.BoardId, taskId, "ChecklistAdded", response);
        return response;
    }

    public async Task<TaskChecklistResponse> ToggleAsync(Guid taskId, Guid checklistId, Guid requestingUserId)
    {
        var item = await _context.TaskChecklists
            .Include(c => c.TaskItem).ThenInclude(t => t.Column)
            .FirstOrDefaultAsync(c => c.Id == checklistId)
            ?? throw new NotFoundException("Checklist", checklistId);

        item.IsCompleted = !item.IsCompleted;
        
        await LogActivityAsync(item.TaskItem.Column.BoardId, taskId, requestingUserId, ActivityType.ChecklistToggled, 
            $"{(item.IsCompleted ? "Đã hoàn thành" : "Đã bỏ chọn")} mục: \"{item.Content}\"");

        await _unitOfWork.SaveChangesAsync();

        var response = MapToResponse(item);
        await BroadcastUpdate(item.TaskItem.Column.BoardId, taskId, "ChecklistToggled", response);
        return response;
    }

    public async Task DeleteAsync(Guid taskId, Guid checklistId, Guid requestingUserId)
    {
        var item = await _context.TaskChecklists
            .Include(c => c.TaskItem).ThenInclude(t => t.Column)
            .FirstOrDefaultAsync(c => c.Id == checklistId)
            ?? throw new NotFoundException("Checklist", checklistId);

        _context.TaskChecklists.Remove(item);
        
        await LogActivityAsync(item.TaskItem.Column.BoardId, taskId, requestingUserId, ActivityType.ChecklistDeleted, $"Đã xóa mục: \"{item.Content}\"");
        
        await _unitOfWork.SaveChangesAsync();
        await BroadcastUpdate(item.TaskItem.Column.BoardId, taskId, "ChecklistDeleted", new { ChecklistId = checklistId });
    }

    public async Task<TaskChecklistResponse> UpdateAsync(Guid taskId, Guid checklistId, string content, Guid requestingUserId)
    {
        var item = await _context.TaskChecklists
            .Include(c => c.TaskItem).ThenInclude(t => t.Column)
            .FirstOrDefaultAsync(c => c.Id == checklistId)
            ?? throw new NotFoundException("Checklist", checklistId);

        var oldContent = item.Content;
        item.Content = content.Trim();

        await LogActivityAsync(item.TaskItem.Column.BoardId, taskId, requestingUserId, ActivityType.ChecklistToggled, 
            $"Đã sửa nội dung mục checklist: \"{oldContent}\" -> \"{item.Content}\"");

        await _unitOfWork.SaveChangesAsync();

        var response = MapToResponse(item);
        await BroadcastUpdate(item.TaskItem.Column.BoardId, taskId, "ChecklistUpdated", response);
        return response;
    }

    private TaskChecklistResponse MapToResponse(TaskChecklist c) => new TaskChecklistResponse
    {
        Id = c.Id,
        Content = c.Content,
        IsCompleted = c.IsCompleted,
        OrderIndex = c.OrderIndex
    };

    private async Task LogActivityAsync(Guid boardId, Guid taskId, Guid userId, ActivityType type, string content)
    {
        var log = new ActivityLog
        {
            BoardId = boardId,
            TaskItemId = taskId,
            UserId = userId,
            ActivityType = type,
            Content = content
        };
        await _context.ActivityLogs.AddAsync(log);
    }

    private async Task BroadcastUpdate(Guid boardId, Guid taskId, string type, object data)
    {
        await _hubContext.Clients.Group(boardId.ToString()).SendAsync("ReceiveTaskUpdate", new { Action = type, TaskId = taskId, Data = data });
    }
}
