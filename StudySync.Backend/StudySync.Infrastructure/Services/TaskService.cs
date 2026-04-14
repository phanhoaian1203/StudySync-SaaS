using StudySync.Application.DTOs.Task;
using StudySync.Application.Interfaces.Repositories;
using StudySync.Application.Interfaces.Services;
using StudySync.Domain.Entities;
using StudySync.Domain.Exceptions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace StudySync.Infrastructure.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepository;
    private readonly IColumnRepository _columnRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserRepository _userRepository;
    private readonly IPhotoService _photoService;
    private readonly StudySync.Infrastructure.Persistence.ApplicationDbContext _context;
    private readonly Microsoft.AspNetCore.SignalR.IHubContext<StudySync.Infrastructure.Hubs.BoardHub> _hubContext;

    public TaskService(
        ITaskRepository taskRepository,
        IColumnRepository columnRepository,
        IUserRepository userRepository,
        IPhotoService photoService,
        StudySync.Infrastructure.Persistence.ApplicationDbContext context,
        IUnitOfWork unitOfWork,
        Microsoft.AspNetCore.SignalR.IHubContext<StudySync.Infrastructure.Hubs.BoardHub> hubContext)
    {
        _taskRepository = taskRepository;
        _columnRepository = columnRepository;
        _userRepository = userRepository;
        _photoService = photoService;
        _context = context;
        _unitOfWork = unitOfWork;
        _hubContext = hubContext;
    }

    public async Task<IEnumerable<TaskResponse>> GetTasksByColumnIdAsync(Guid columnId, Guid requestingUserId)
    {
        // Bỏ qua Security Check tạm thời để tập trung vào Assignees logic

        // Lấy danh sách task kèm Assignees và Comments
        var tasks = await _context.TaskItems
            .AsNoTracking()
            .Include(t => t.Assignees)
                .ThenInclude(a => a.User)
            .Include(t => t.Comments)
                .ThenInclude(c => c.User)
            .Include(t => t.Attachments)
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
            Labels = t.Labels,
            OrderIndex = t.OrderIndex,
            CreatedAt = t.CreatedAt,
            Assignees = t.Assignees.Select(a => new StudySync.Application.DTOs.User.UserDto
            {
                Id = a.User.Id,
                FullName = a.User.FullName,
                Email = a.User.Email
            }).ToList(),
            Comments = t.Comments.OrderBy(c => c.CreatedAt).Select(c => new TaskCommentResponse
            {
                Id = c.Id,
                TaskItemId = c.TaskItemId,
                Content = c.Content,
                CreatedAt = c.CreatedAt,
                User = new StudySync.Application.DTOs.User.UserDto
                {
                    Id = c.User.Id,
                    FullName = c.User.FullName,
                    Email = c.User.Email
                }
            }).ToList(),
            Attachments = t.Attachments.OrderByDescending(a => a.CreatedAt).Select(a => new TaskAttachmentResponse
            {
                Id = a.Id,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                PublicId = a.PublicId,
                FileSize = a.FileSize,
                FileType = a.FileType,
                CreatedAt = a.CreatedAt
            }).ToList()
        });
    }

    public async Task<TaskResponse> GetByIdAsync(Guid taskId, Guid requestingUserId)
    {
        var task = await _taskRepository.GetByIdAsync(taskId)
            ?? throw new NotFoundException("Task", taskId);
            
        return await GetTaskResponseMappedById(taskId);
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

        // LOGGING
        var col = await _columnRepository.GetByIdAsync(request.ColumnId);
        await LogActivityAsync(col!.BoardId, newTask.Id, requestingUserId, StudySync.Domain.Enums.ActivityType.TaskCreated, $"Đã tạo thẻ mới: \"{newTask.Title}\"");

        var response = await GetTaskResponseMappedById(newTask.Id);
        await BroadcastUpdate(col.BoardId, "TaskCreated", response);
        return response;
    }

    // ───────────────────────────────────────────────────────────────────
    public async Task DeleteAsync(Guid taskId, Guid requestingUserId)
    {
        var task = await _taskRepository.GetByIdAsync(taskId)
            ?? throw new NotFoundException("Task", taskId);

        var col = await _columnRepository.GetByIdAsync(task.ColumnId);
        _taskRepository.Delete(task);
        await _unitOfWork.SaveChangesAsync();

        await LogActivityAsync(col!.BoardId, task.Id, requestingUserId, StudySync.Domain.Enums.ActivityType.TaskDeleted, $"Đã xóa thẻ: \"{task.Title}\"");
        await BroadcastUpdate(col.BoardId, "TaskDeleted", new { TaskId = taskId });
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

        // LOGGING & REAL-TIME
        var col = await _columnRepository.GetByIdAsync(task.ColumnId);
        await LogActivityAsync(col!.BoardId, task.Id, requestingUserId, StudySync.Domain.Enums.ActivityType.TaskMoved, $"Đã chuyển thẻ \"{task.Title}\" sang cột {col.Name}");

        var response = await GetTaskResponseMappedById(task.Id);
        await BroadcastUpdate(col.BoardId, "TaskMoved", response);
        return response;
    }

    public async Task<TaskResponse> UpdateDetailsAsync(Guid taskId, UpdateTaskDetailsRequest request, Guid requestingUserId)
    {
        var task = await _taskRepository.GetByIdAsync(taskId)
            ?? throw new NotFoundException("Task", taskId);

        var oldTitle = task.Title;
        task.Title = request.Title.Trim();
        if (request.Description != null)
        {
            task.Description = request.Description.Trim();
        }

        task.DueDate = request.DueDate;
        task.Labels = request.Labels;
        task.UpdatedById = requestingUserId;

        _taskRepository.Update(task);
        await _unitOfWork.SaveChangesAsync();

        // LOGGING
        var col = await _columnRepository.GetByIdAsync(task.ColumnId);
        if (oldTitle != task.Title)
        {
            await LogActivityAsync(col!.BoardId, task.Id, requestingUserId, StudySync.Domain.Enums.ActivityType.TaskUpdated, $"Đã đổi tiêu đề thẻ: \"{oldTitle}\" -> \"{task.Title}\"");
        }
        else
        {
            await LogActivityAsync(col!.BoardId, task.Id, requestingUserId, StudySync.Domain.Enums.ActivityType.TaskUpdated, $"Đã cập nhật chi tiết thẻ \"{task.Title}\"");
        }

        var response = await GetTaskResponseMappedById(task.Id);
        await BroadcastUpdate(col!.BoardId, "TaskUpdated", response);
        return response;
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

        var col = await _columnRepository.GetByIdAsync(task.ColumnId);
        var response = await GetTaskResponseMappedById(taskId);
        await BroadcastUpdate(col!.BoardId, "TaskUpdated", response);
        return response;
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

        var col = await _columnRepository.GetByIdAsync(task.ColumnId);
        var response = await GetTaskResponseMappedById(taskId);
        await BroadcastUpdate(col!.BoardId, "TaskUpdated", response);
        return response;
    }

    // Nạp Comment mới
    public async Task<TaskCommentResponse> AddCommentAsync(Guid taskId, CreateCommentRequest request, Guid requestingUserId)
    {
        var task = await _taskRepository.GetByIdAsync(taskId)
             ?? throw new NotFoundException("Task", taskId);

        var newComment = new TaskComment
        {
            TaskItemId = taskId,
            UserId = requestingUserId,
            Content = request.Content.Trim()
        };

        await _context.TaskComments.AddAsync(newComment);
        await _unitOfWork.SaveChangesAsync();

        // Broadcast Real-time
        var col = await _columnRepository.GetByIdAsync(task.ColumnId);
        var taskRes = await GetTaskResponseMappedById(taskId);
        await BroadcastUpdate(col!.BoardId, "CommentAdded", taskRes);

        // Trả về kèm thông tin người dùng
        var commentWithUser = await _context.TaskComments
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == newComment.Id);

        return new TaskCommentResponse
        {
            Id = commentWithUser!.Id,
            TaskItemId = commentWithUser.TaskItemId,
            Content = commentWithUser.Content,
            CreatedAt = commentWithUser.CreatedAt,
            User = new StudySync.Application.DTOs.User.UserDto
            {
                Id = commentWithUser.User.Id,
                FullName = commentWithUser.User.FullName,
                Email = commentWithUser.User.Email
            }
        };
    }

    // Attachment Logic
    public async Task<TaskAttachmentResponse> AddAttachmentAsync(Guid taskId, Microsoft.AspNetCore.Http.IFormFile file, Guid requestingUserId)
    {
        if (file == null || file.Length == 0)
            throw new BadRequestException("File không hợp lệ hoặc trống.");

        var task = await _taskRepository.GetByIdAsync(taskId)
             ?? throw new NotFoundException("Task", taskId);

        var uploadResult = await _photoService.AddPhotoAsync(file);

        if (uploadResult.Error != null)
        {
            throw new BadRequestException("Lỗi Cloudinary: " + uploadResult.Error.Message);
        }

        if (uploadResult.SecureUrl == null)
        {
            throw new Exception("Không nhận được URL bảo mật từ Cloudinary sau khi upload.");
        }

        var attachment = new TaskAttachment
        {
            TaskId = taskId,
            FileName = file.FileName,
            FileUrl = uploadResult.SecureUrl.ToString(),
            PublicId = uploadResult.PublicId,
            FileSize = file.Length,
            FileType = file.ContentType
        };

        await _context.TaskAttachments.AddAsync(attachment);
        await _unitOfWork.SaveChangesAsync();

        // Broadcast Real-time
        var col = await _columnRepository.GetByIdAsync(task.ColumnId);
        var taskRes = await GetTaskResponseMappedById(taskId);
        await BroadcastUpdate(col!.BoardId, "AttachmentAdded", taskRes);

        return new TaskAttachmentResponse
        {
            Id = attachment.Id,
            FileName = attachment.FileName,
            FileUrl = attachment.FileUrl,
            PublicId = attachment.PublicId,
            FileSize = attachment.FileSize,
            FileType = attachment.FileType,
            CreatedAt = attachment.CreatedAt
        };
    }

    public async Task DeleteAttachmentAsync(Guid taskId, Guid attachmentId, Guid requestingUserId)
    {
        var task = await _taskRepository.GetByIdAsync(taskId)
             ?? throw new NotFoundException("Task", taskId);

        var attachment = await _context.TaskAttachments.FindAsync(attachmentId)
             ?? throw new NotFoundException("Attachment", attachmentId);

        if (attachment.TaskId != taskId)
            throw new BadRequestException("Đính kèm này không thuộc về công việc được yêu cầu.");

        // Xóa trên Cloudinary
        var deleteResult = await _photoService.DeletePhotoAsync(attachment.PublicId);

        if (deleteResult.Error != null)
            throw new Exception("Lỗi khi xóa file trên Cloudinary: " + deleteResult.Error.Message);

        _context.TaskAttachments.Remove(attachment);
        await _unitOfWork.SaveChangesAsync();

        // Broadcast Real-time
        var col = await _columnRepository.GetByIdAsync(task.ColumnId);
        var taskRes = await GetTaskResponseMappedById(taskId);
        await BroadcastUpdate(col!.BoardId, "AttachmentDeleted", taskRes);
    }

    // Helper map Data full Assignees
    private async Task<TaskResponse> GetTaskResponseMappedById(Guid taskId)
    {
        var t = await _context.TaskItems
            .AsNoTracking()
            .AsSplitQuery()
            .Include(x => x.Assignees)
                .ThenInclude(a => a.User)
            .Include(x => x.Comments)
                .ThenInclude(c => c.User)
            .Include(x => x.Attachments)
            .Include(x => x.Checklists)
            .Include(x => x.ActivityLogs)
                .ThenInclude(al => al.User)
            .FirstOrDefaultAsync(x => x.Id == taskId);

        return new TaskResponse
        {
            Id = t!.Id,
            ColumnId = t.ColumnId,
            Title = t.Title,
            Description = t.Description,
            DueDate = t.DueDate,
            Labels = t.Labels,
            OrderIndex = t.OrderIndex,
            CreatedAt = t.CreatedAt,
            Assignees = t.Assignees.Select(a => new StudySync.Application.DTOs.User.UserDto
            {
                Id = a.User.Id,
                FullName = a.User.FullName,
                Email = a.User.Email
            }).ToList(),
            Comments = t.Comments.OrderBy(c => c.CreatedAt).Select(c => new TaskCommentResponse
            {
                Id = c.Id,
                TaskItemId = c.TaskItemId,
                Content = c.Content,
                CreatedAt = c.CreatedAt,
                User = new StudySync.Application.DTOs.User.UserDto
                {
                    Id = c.User.Id,
                    FullName = c.User.FullName,
                    Email = c.User.Email
                }
            }).ToList(),
            Attachments = t.Attachments.OrderByDescending(a => a.CreatedAt).Select(a => new TaskAttachmentResponse
            {
                Id = a.Id,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                PublicId = a.PublicId,
                FileSize = a.FileSize,
                FileType = a.FileType,
                CreatedAt = a.CreatedAt
            }).ToList(),
            Checklists = t.Checklists.OrderBy(c => c.OrderIndex).Select(c => new TaskChecklistResponse
            {
                Id = c.Id,
                Content = c.Content,
                IsCompleted = c.IsCompleted,
                OrderIndex = c.OrderIndex
            }).ToList(),
            ActivityLogs = t.ActivityLogs.OrderByDescending(al => al.CreatedAt).Select(al => new ActivityLogResponse
            {
                Id = al.Id,
                UserId = al.UserId,
                UserFullName = al.User.FullName,
                ActivityType = al.ActivityType.ToString(),
                Content = al.Content,
                OldValue = al.OldValue,
                NewValue = al.NewValue,
                CreatedAt = al.CreatedAt
            }).ToList()
        };
    }

    // ───────────────────────────────────────────────────────────────────
    // HELPERS FOR PERFORMANCE & REAL-TIME
    // ───────────────────────────────────────────────────────────────────
    private async Task LogActivityAsync(Guid boardId, Guid taskId, Guid userId, StudySync.Domain.Enums.ActivityType type, string content, string? oldVal = null, string? newVal = null)
    {
        var log = new StudySync.Domain.Entities.ActivityLog
        {
            BoardId = boardId,
            TaskItemId = taskId,
            UserId = userId,
            ActivityType = type,
            Content = content,
            OldValue = oldVal,
            NewValue = newVal
        };
        await _context.ActivityLogs.AddAsync(log);
        await _unitOfWork.SaveChangesAsync();
    }

    private async Task BroadcastUpdate(Guid boardId, string action, object data)
    {
        await _hubContext.Clients.Group(boardId.ToString()).SendAsync("ReceiveTaskUpdate", new { Action = action, Data = data });
    }
}
