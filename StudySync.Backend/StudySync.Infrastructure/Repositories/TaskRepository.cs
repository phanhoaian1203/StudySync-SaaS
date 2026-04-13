using Microsoft.EntityFrameworkCore;
using StudySync.Application.Interfaces.Repositories;
using StudySync.Domain.Entities;
using StudySync.Infrastructure.Persistence;

namespace StudySync.Infrastructure.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly ApplicationDbContext _context;

    public TaskRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TaskItem?> GetByIdAsync(Guid id)
    {
        return await _context.TaskItems
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);
    }

    public async Task<IEnumerable<TaskItem>> GetTasksByColumnIdAsync(Guid columnId)
    {
        return await _context.TaskItems
            .Where(t => t.ColumnId == columnId && !t.IsDeleted)
            .OrderBy(t => t.OrderIndex)
            .ToListAsync();
    }

    public async Task AddAsync(TaskItem task)
    {
        await _context.TaskItems.AddAsync(task);
    }

    public void Update(TaskItem task)
    {
        task.UpdatedAt = DateTime.UtcNow;
        _context.TaskItems.Update(task);
    }

    public void Delete(TaskItem task)
    {
        task.IsDeleted = true;
        task.DeletedAt = DateTime.UtcNow;
        _context.TaskItems.Update(task);
    }

    public async Task<double> GetMaxOrderIndexAsync(Guid columnId)
    {
        var maxIndex = await _context.TaskItems
            .Where(t => t.ColumnId == columnId && !t.IsDeleted)
            .MaxAsync(t => (double?)t.OrderIndex);
            
        return maxIndex ?? 0;
    }
}
