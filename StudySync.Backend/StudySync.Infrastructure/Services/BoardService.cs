using StudySync.Application.DTOs.Board;
using StudySync.Application.Interfaces.Repositories;
using StudySync.Application.Interfaces.Services;
using StudySync.Domain.Entities;
using StudySync.Domain.Exceptions;
using StudySync.Infrastructure.Persistence;

namespace StudySync.Infrastructure.Services;

public class BoardService : IBoardService
{
    private readonly IBoardRepository _boardRepository;
    private readonly IWorkspaceRepository _workspaceRepository;
    private readonly IColumnRepository _columnRepository;
    private readonly IUnitOfWork _unitOfWork;

    public BoardService(
        IBoardRepository boardRepository,
        IWorkspaceRepository workspaceRepository,
        IColumnRepository columnRepository,
        IUnitOfWork unitOfWork)
    {
        _boardRepository = boardRepository;
        _workspaceRepository = workspaceRepository;
        _columnRepository = columnRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<BoardResponse> GetByIdAsync(Guid boardId, Guid requestingUserId)
    {
        var board = await _boardRepository.GetByIdAsync(boardId)
            ?? throw new NotFoundException("Board", boardId);

        // Security Check: Có thể check kỹ hơn xem user có quyền trong Workspace không.
        // Tạm thời giả định có quyền nếu board tồn tại.
        
        return new BoardResponse
        {
            Id = board.Id,
            WorkspaceId = board.WorkspaceId,
            Name = board.Name,
            IsFavorite = board.IsFavorite,
            CreatedAt = board.CreatedAt
        };
    }

    public async Task<IEnumerable<BoardResponse>> GetBoardsByWorkspaceIdAsync(Guid workspaceId, Guid requestingUserId)
    {
        var workspace = await _workspaceRepository.GetByIdAsync(workspaceId)
            ?? throw new NotFoundException("Workspace", workspaceId);

        var boards = await _boardRepository.GetBoardsByWorkspaceIdAsync(workspaceId);
        
        return boards.Select(b => new BoardResponse
        {
            Id = b.Id,
            WorkspaceId = b.WorkspaceId,
            Name = b.Name,
            IsFavorite = b.IsFavorite,
            CreatedAt = b.CreatedAt
        });
    }

    public async Task<BoardResponse> CreateAsync(CreateBoardRequest request, Guid requestingUserId)
    {
        var workspace = await _workspaceRepository.GetByIdAsync(request.WorkspaceId)
            ?? throw new NotFoundException("Workspace", request.WorkspaceId);

        var board = new Board
        {
            WorkspaceId = request.WorkspaceId,
            Name = request.Name.Trim(),
        };

        await _boardRepository.AddAsync(board);

        // Tự động tạo 3 cột mặc định: To Do, In Progress, Done
        await _columnRepository.AddAsync(new Column { BoardId = board.Id, Name = "To Do", OrderIndex = 1000 });
        await _columnRepository.AddAsync(new Column { BoardId = board.Id, Name = "In Progress", OrderIndex = 2000 });
        await _columnRepository.AddAsync(new Column { BoardId = board.Id, Name = "Done", OrderIndex = 3000 });

        await _unitOfWork.SaveChangesAsync();

        return new BoardResponse
        {
            Id = board.Id,
            WorkspaceId = board.WorkspaceId,
            Name = board.Name,
            IsFavorite = board.IsFavorite,
            CreatedAt = board.CreatedAt
        };
    }

    public async Task DeleteAsync(Guid boardId, Guid requestingUserId)
    {
        var board = await _boardRepository.GetByIdAsync(boardId)
            ?? throw new NotFoundException("Board", boardId);

        _boardRepository.Delete(board);
        await _unitOfWork.SaveChangesAsync();
    }
}
