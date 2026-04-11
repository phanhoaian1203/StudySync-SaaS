using Microsoft.EntityFrameworkCore;
using StudySync.Application.Interfaces.Repositories;
using StudySync.Domain.Entities;
using StudySync.Infrastructure.Persistence;

namespace StudySync.Infrastructure.Repositories;

public class WorkspaceRepository : IWorkspaceRepository
{
    private readonly ApplicationDbContext _context;

    public WorkspaceRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Workspace?> GetByIdAsync(Guid id)
    {
        // Bí quyết: Dùng Include() để lấy luôn thông tin User (Owner) khi tìm Workspace
        return await _context.Workspaces
            .Include(w => w.Owner)
            .FirstOrDefaultAsync(w => w.Id == id && !w.IsDeleted);
    }

    public async Task<IEnumerable<Workspace>> GetWorkspacesByOwnerIdAsync(Guid ownerId)
    {
        return await _context.Workspaces
            .Where(w => w.OwnerId == ownerId && !w.IsDeleted)
            .ToListAsync();
    }

    public async Task AddAsync(Workspace workspace)
    {
        await _context.Workspaces.AddAsync(workspace);
    }

    public void Update(Workspace workspace)
    {
        workspace.UpdatedAt = DateTime.UtcNow;
        _context.Workspaces.Update(workspace);
    }

    public void Delete(Workspace workspace)
    {
        // Xóa mềm
        workspace.IsDeleted = true;
        workspace.DeletedAt = DateTime.UtcNow;
        _context.Workspaces.Update(workspace);
    }
}