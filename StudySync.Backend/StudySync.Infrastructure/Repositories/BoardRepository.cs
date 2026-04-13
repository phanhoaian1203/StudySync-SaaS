using Microsoft.EntityFrameworkCore;
using StudySync.Application.Interfaces.Repositories;
using StudySync.Domain.Entities;
using StudySync.Infrastructure.Persistence;

namespace StudySync.Infrastructure.Repositories;

public class BoardRepository : IBoardRepository
{
    private readonly ApplicationDbContext _context;

    public BoardRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Board?> GetByIdAsync(Guid id)
    {
        return await _context.Boards
            .FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted);
    }

    public async Task<IEnumerable<Board>> GetBoardsByWorkspaceIdAsync(Guid workspaceId)
    {
        return await _context.Boards
            .Where(b => b.WorkspaceId == workspaceId && !b.IsDeleted)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
    }

    public async Task AddAsync(Board board)
    {
        await _context.Boards.AddAsync(board);
    }

    public void Update(Board board)
    {
        board.UpdatedAt = DateTime.UtcNow;
        _context.Boards.Update(board);
    }

    public void Delete(Board board)
    {
        board.IsDeleted = true;
        board.DeletedAt = DateTime.UtcNow;
        _context.Boards.Update(board);
    }
}
