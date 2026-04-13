using StudySync.Application.DTOs.Column;
using StudySync.Application.DTOs.Task;
using StudySync.Application.Interfaces.Repositories;
using StudySync.Application.Interfaces.Services;
using StudySync.Domain.Entities;
using StudySync.Domain.Exceptions;

namespace StudySync.Infrastructure.Services;

public class ColumnService : IColumnService
{
    private readonly IColumnRepository _columnRepository;
    private readonly IBoardRepository _boardRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ColumnService(
        IColumnRepository columnRepository,
        IBoardRepository boardRepository,
        IUnitOfWork unitOfWork)
    {
        _columnRepository = columnRepository;
        _boardRepository = boardRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ColumnResponse>> GetColumnsByBoardIdAsync(Guid boardId, Guid requestingUserId)
    {
        var board = await _boardRepository.GetByIdAsync(boardId)
            ?? throw new NotFoundException("Board", boardId);

        var columns = await _columnRepository.GetColumnsByBoardIdAsync(boardId);

        return columns.Select(c => new ColumnResponse
        {
            Id = c.Id,
            BoardId = c.BoardId,
            Name = c.Name,
            OrderIndex = c.OrderIndex,
            Tasks = c.Tasks.Select(t => new TaskResponse
            {
                Id = t.Id,
                ColumnId = t.ColumnId,
                Title = t.Title,
                Description = t.Description,
                DueDate = t.DueDate,
                OrderIndex = t.OrderIndex,
                CreatedAt = t.CreatedAt
            }).ToList()
        });
    }

    public async Task<ColumnResponse> CreateAsync(CreateColumnRequest request, Guid requestingUserId)
    {
        var board = await _boardRepository.GetByIdAsync(request.BoardId)
            ?? throw new NotFoundException("Board", request.BoardId);

        var defaultOffset = 1000;
        var maxOrder = await _columnRepository.GetMaxOrderIndexAsync(request.BoardId);
        
        var column = new Column
        {
            BoardId = request.BoardId,
            Name = request.Name.Trim(),
            OrderIndex = maxOrder + defaultOffset, // Xếp cuối
        };

        await _columnRepository.AddAsync(column);
        await _unitOfWork.SaveChangesAsync();

        return new ColumnResponse
        {
            Id = column.Id,
            BoardId = column.BoardId,
            Name = column.Name,
            OrderIndex = column.OrderIndex,
            Tasks = new List<TaskResponse>()
        };
    }

    public async Task DeleteAsync(Guid columnId, Guid requestingUserId)
    {
        var column = await _columnRepository.GetByIdAsync(columnId)
            ?? throw new NotFoundException("Column", columnId);

        // Security Check: Optional (kiểm tra quyền chủ workspace/board).
        
        _columnRepository.Delete(column);
        await _unitOfWork.SaveChangesAsync();
    }
}
