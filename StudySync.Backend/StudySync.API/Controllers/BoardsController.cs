using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudySync.Application.DTOs.Board;
using StudySync.Application.Interfaces.Services;
using System.Security.Claims;

namespace StudySync.API.Controllers;

[Authorize]
[ApiController]
[Route("api/workspaces/{workspaceId:guid}/boards")]
public class BoardsController : ControllerBase
{
    private readonly IBoardService _boardService;

    public BoardsController(IBoardService boardService)
    {
        _boardService = boardService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BoardResponse>>> GetBoards(Guid workspaceId)
    {
        var userId = GetUserId();
        var boards = await _boardService.GetBoardsByWorkspaceIdAsync(workspaceId, userId);
        return Ok(boards);
    }
    
    [HttpPost]
    public async Task<ActionResult<BoardResponse>> Create(Guid workspaceId, [FromBody] CreateBoardRequest request)
    {
        if (workspaceId != request.WorkspaceId) 
            return BadRequest("WorkspaceId in URL and body must match.");
            
        var userId = GetUserId();
        var board = await _boardService.CreateAsync(request, userId);
        
        // Trả về resource đã tạo. URL sẽ mapping hơi khác tí nhưng chấp nhận được.
        return CreatedAtAction(nameof(GetById), new { boardId = board.Id }, board);
    }
    
    // Đưa route get by id thẳng vào api/boards để dễ truy cập
    [HttpGet("/api/boards/{boardId:guid}")]
    public async Task<ActionResult<BoardResponse>> GetById(Guid boardId)
    {
        var userId = GetUserId();
        var board = await _boardService.GetByIdAsync(boardId, userId);
        return Ok(board);
    }

    [HttpDelete("/api/boards/{boardId:guid}")]
    public async Task<IActionResult> Delete(Guid boardId)
    {
        var userId = GetUserId();
        await _boardService.DeleteAsync(boardId, userId);
        return NoContent();
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) throw new UnauthorizedAccessException();
        return Guid.Parse(userIdClaim);
    }
}
