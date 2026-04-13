using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudySync.Application.DTOs.Column;
using StudySync.Application.Interfaces.Services;
using System.Security.Claims;

namespace StudySync.API.Controllers;

[Authorize]
[ApiController]
[Route("api/columns")]
public class ColumnsController : ControllerBase
{
    private readonly IColumnService _columnService;

    public ColumnsController(IColumnService columnService)
    {
        _columnService = columnService;
    }

    [HttpGet("/api/boards/{boardId:guid}/columns")]
    public async Task<ActionResult<IEnumerable<ColumnResponse>>> GetByBoardId(Guid boardId)
    {
        var userId = GetUserId();
        var columns = await _columnService.GetColumnsByBoardIdAsync(boardId, userId);
        return Ok(columns);
    }

    [HttpPost]
    public async Task<ActionResult<ColumnResponse>> Create(CreateColumnRequest request)
    {
        var userId = GetUserId();
        var column = await _columnService.CreateAsync(request, userId);
        return Ok(column); // Technically should be CreatedAtAction, but Ok is fine for this simplify
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        await _columnService.DeleteAsync(id, userId);
        return NoContent();
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) throw new UnauthorizedAccessException();
        return Guid.Parse(userIdClaim);
    }
}
