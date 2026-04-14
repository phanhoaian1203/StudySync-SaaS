using Microsoft.EntityFrameworkCore;
using StudySync.Application.Interfaces.Repositories;
using StudySync.Domain.Entities;
using StudySync.Infrastructure.Persistence;

namespace StudySync.Infrastructure.Repositories;

public class ColumnRepository : IColumnRepository
{
    private readonly ApplicationDbContext _context;

    public ColumnRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Column?> GetByIdAsync(Guid id)
    {
        return await _context.Columns
            .Include(c => c.Tasks.Where(t => !t.IsDeleted).OrderBy(t => t.OrderIndex))
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
    }

    public async Task<IEnumerable<Column>> GetColumnsByBoardIdAsync(Guid boardId)
    {
        return await _context.Columns
            .Include(c => c.Tasks.Where(t => !t.IsDeleted).OrderBy(t => t.OrderIndex))
                .ThenInclude(t => t.Assignees)
                    .ThenInclude(a => a.User)
            .Include(c => c.Tasks.Where(t => !t.IsDeleted).OrderBy(t => t.OrderIndex))
                .ThenInclude(t => t.Comments)
                    .ThenInclude(cmt => cmt.User)
            .Where(c => c.BoardId == boardId && !c.IsDeleted)
            .OrderBy(c => c.OrderIndex)
            .ToListAsync();
    }

    public async Task AddAsync(Column column)
    {
        await _context.Columns.AddAsync(column);
    }

    public void Update(Column column)
    {
        column.UpdatedAt = DateTime.UtcNow;
        _context.Columns.Update(column);
    }

    public void Delete(Column column)
    {
        column.IsDeleted = true;
        column.DeletedAt = DateTime.UtcNow;
        _context.Columns.Update(column);
    }

    public async Task<double> GetMaxOrderIndexAsync(Guid boardId)
    {
        var maxIndex = await _context.Columns
            .Where(c => c.BoardId == boardId && !c.IsDeleted)
            .MaxAsync(c => (double?)c.OrderIndex);
            
        return maxIndex ?? 0;
    }
}
