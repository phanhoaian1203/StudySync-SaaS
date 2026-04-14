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
    private readonly IPhotoService _photoService;
    private readonly StudySync.Infrastructure.Persistence.ApplicationDbContext _context;

    public TaskService(
        ITaskRepository taskRepository,
        IColumnRepository columnRepository,
        IUserRepository userRepository,
        IPhotoService photoService,
        StudySync.Infrastructure.Persistence.ApplicationDbContext context,
        IUnitOfWork unitOfWork)
    {
        _taskRepository = taskRepository;
        _columnRepository = columnRepository;
        _userRepository = userRepository;
        _photoService = photoService;
        _context = context;
        _unitOfWork = unitOfWork;
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
        task.DueDate = request.DueDate;
        task.Labels = request.Labels;

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
    }

    // Helper map Data full Assignees
    private async Task<TaskResponse> GetTaskResponseMappedById(Guid taskId)
    {
        var t = await _context.TaskItems
            .AsNoTracking()
            .Include(x => x.Assignees)
                .ThenInclude(a => a.User)
            .Include(x => x.Comments)
                .ThenInclude(c => c.User)
            .Include(x => x.Attachments)
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
            }).ToList()
        };
    }
}
