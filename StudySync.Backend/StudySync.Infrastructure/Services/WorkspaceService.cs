using Microsoft.EntityFrameworkCore;
using StudySync.Application.DTOs.Workspace;
using StudySync.Application.Interfaces.Repositories;
using StudySync.Application.Interfaces.Services;
using StudySync.Domain.Entities;
using StudySync.Domain.Enums;
using StudySync.Domain.Exceptions;
using StudySync.Infrastructure.Persistence;

namespace StudySync.Infrastructure.Services;

public class WorkspaceService : IWorkspaceService
{
    private readonly IWorkspaceRepository _workspaceRepository;
    private readonly IUserRepository      _userRepository;
    private readonly IUnitOfWork          _unitOfWork;
    private readonly ApplicationDbContext _context;

    // Giới hạn số Workspace cho Free User
    private const int FREE_WORKSPACE_LIMIT = 3;

    public WorkspaceService(
        IWorkspaceRepository workspaceRepository,
        IUserRepository      userRepository,
        IUnitOfWork          unitOfWork,
        ApplicationDbContext context)
    {
        _workspaceRepository = workspaceRepository;
        _userRepository      = userRepository;
        _unitOfWork          = unitOfWork;
        _context             = context;
    }

    // ───────────────────────────────────────────────────────────────────
    public async Task<IEnumerable<WorkspaceResponse>> GetMyWorkspacesAsync(Guid userId)
    {
        // Lấy workspace do user sở hữu + workspace user là thành viên
        var workspaces = await _context.Workspaces
            .AsNoTracking()
            .Where(w => !w.IsDeleted && (
                w.OwnerId == userId ||
                w.Members.Any(m => m.UserId == userId)
            ))
            .Select(w => new WorkspaceResponse
            {
                Id          = w.Id,
                Name        = w.Name,
                Description = w.Description,
                OwnerId     = w.OwnerId,
                MemberCount = w.Members.Count,
                BoardCount  = w.Boards.Count(b => !b.IsDeleted),
                CreatedAt   = w.CreatedAt,
            })
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        return workspaces;
    }

    // ───────────────────────────────────────────────────────────────────
    public async Task<WorkspaceResponse> GetByIdAsync(Guid workspaceId, Guid requestingUserId)
    {
        var workspace = await _context.Workspaces
            .AsNoTracking()
            .Where(w => w.Id == workspaceId && !w.IsDeleted)
            .Select(w => new WorkspaceResponse
            {
                Id          = w.Id,
                Name        = w.Name,
                Description = w.Description,
                OwnerId     = w.OwnerId,
                MemberCount = w.Members.Count,
                BoardCount  = w.Boards.Count(b => !b.IsDeleted),
                CreatedAt   = w.CreatedAt,
            })
            .FirstOrDefaultAsync();

        if (workspace == null)
            throw new NotFoundException("Workspace", workspaceId);

        // Kiểm tra quyền xem: phải là Owner hoặc Member
        var isMember = await _context.WorkspaceMembers
            .AnyAsync(m => m.WorkspaceId == workspaceId && m.UserId == requestingUserId);

        if (workspace.OwnerId != requestingUserId && !isMember)
            throw new ForbiddenException("Bạn không có quyền truy cập Workspace này.");

        return workspace;
    }

    // ───────────────────────────────────────────────────────────────────
    public async Task<WorkspaceResponse> CreateAsync(CreateWorkspaceRequest request, Guid ownerId)
    {
        // 1. Kiểm tra user tồn tại
        var owner = await _userRepository.GetByIdAsync(ownerId)
            ?? throw new NotFoundException("User", ownerId);

        // 2. Kiểm tra quota theo plan
        if (owner.SubscriptionPlan == SubscriptionPlan.Free)
        {
            var currentCount = await _context.Workspaces
                .CountAsync(w => w.OwnerId == ownerId && !w.IsDeleted);

            if (currentCount >= FREE_WORKSPACE_LIMIT)
                throw new ForbiddenException(
                    $"Gói Free chỉ cho phép tối đa {FREE_WORKSPACE_LIMIT} Workspace. " +
                    "Vui lòng nâng cấp lên Pro để tạo thêm.");
        }

        // 3. Tạo Workspace
        var workspace = new Workspace
        {
            Name        = request.Name.Trim(),
            Description = request.Description?.Trim(),
            OwnerId     = ownerId,
        };

        await _workspaceRepository.AddAsync(workspace);
        await _unitOfWork.SaveChangesAsync();

        return new WorkspaceResponse
        {
            Id          = workspace.Id,
            Name        = workspace.Name,
            Description = workspace.Description,
            OwnerId     = workspace.OwnerId,
            MemberCount = 0, // Mới tạo, chưa có thành viên
            BoardCount  = 0,
            CreatedAt   = workspace.CreatedAt,
        };
    }

    // ───────────────────────────────────────────────────────────────────
    public async Task DeleteAsync(Guid workspaceId, Guid ownerId)
    {
        var workspace = await _workspaceRepository.GetByIdAsync(workspaceId)
            ?? throw new NotFoundException("Workspace", workspaceId);

        // Chỉ Owner mới được xóa
        if (workspace.OwnerId != ownerId)
            throw new ForbiddenException("Chỉ người tạo Workspace mới có thể xóa nó.");

        _workspaceRepository.Delete(workspace);
        await _unitOfWork.SaveChangesAsync();
    }

    // ───────────────────────────────────────────────────────────────────
    public async Task<WorkspaceMemberResponse> AddMemberAsync(Guid workspaceId, AddMemberRequest request, Guid requestingUserId)
    {
        var workspace = await _workspaceRepository.GetByIdAsync(workspaceId)
            ?? throw new NotFoundException("Workspace", workspaceId);

        // Chỉ Owner mới được quyền Adds
        if (workspace.OwnerId != requestingUserId)
            throw new ForbiddenException("Chỉ Owner mới có quyền thêm thành viên.");

        var userToAdd = await _userRepository.GetByEmailAsync(request.Email.Trim())
            ?? throw new NotFoundException("User", "Email not found");

        // Kiểm tra đã là thành viên chưa
        var existingMember = await _context.WorkspaceMembers
            .FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId && m.UserId == userToAdd.Id);

        if (existingMember != null || workspace.OwnerId == userToAdd.Id)
            throw new ConflictException("Người dùng đã tồn tại trong Workspace này.");

        var newMember = new WorkspaceMember
        {
            WorkspaceId = workspaceId,
            UserId = userToAdd.Id,
            Role = WorkspaceRole.Member,
            JoinedAt = DateTime.UtcNow
        };

        await _context.WorkspaceMembers.AddAsync(newMember);
        await _unitOfWork.SaveChangesAsync();

        return new WorkspaceMemberResponse
        {
            UserId = userToAdd.Id,
            FullName = userToAdd.FullName,
            Email = userToAdd.Email,
            Role = newMember.Role.ToString(),
            JoinedAt = newMember.JoinedAt
        };
    }

    public async Task<IEnumerable<WorkspaceMemberResponse>> GetMembersAsync(Guid workspaceId, Guid requestingUserId)
    {
        var workspace = await _workspaceRepository.GetByIdAsync(workspaceId)
            ?? throw new NotFoundException("Workspace", workspaceId);

        // Phải là members mới được xem list members
        var isMember = await _context.WorkspaceMembers
            .AnyAsync(m => m.WorkspaceId == workspaceId && m.UserId == requestingUserId);

        if (workspace.OwnerId != requestingUserId && !isMember)
            throw new ForbiddenException("Bạn không có quyền truy cập Workspace này.");

        // Lấy Owner mapping
        var owner = await _userRepository.GetByIdAsync(workspace.OwnerId);
        
        var membersList = new List<WorkspaceMemberResponse>();
        if (owner != null)
        {
            membersList.Add(new WorkspaceMemberResponse
            {
                UserId = owner.Id,
                FullName = owner.FullName,
                Email = owner.Email,
                Role = "Owner",
                JoinedAt = workspace.CreatedAt // Owner join lúc tạo
            });
        }

        var otherMembers = await _context.WorkspaceMembers
            .Include(m => m.User)
            .Where(m => m.WorkspaceId == workspaceId)
            .Select(m => new WorkspaceMemberResponse
            {
                UserId = m.User.Id,
                FullName = m.User.FullName,
                Email = m.User.Email,
                Role = m.Role.ToString(),
                JoinedAt = m.JoinedAt
            })
            .ToListAsync();

        membersList.AddRange(otherMembers);
        return membersList.OrderBy(m => m.JoinedAt);
    }
}
