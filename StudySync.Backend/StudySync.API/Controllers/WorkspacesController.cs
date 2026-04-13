using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudySync.Application.DTOs.Workspace;
using StudySync.Application.Interfaces.Services;
using System.Security.Claims;

namespace StudySync.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WorkspacesController : ControllerBase
{
    private readonly IWorkspaceService _workspaceService;

    public WorkspacesController(IWorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
    }

    /// <summary>
    /// Lấy danh sách Workspace của user đang đăng nhập.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkspaceResponse>>> GetMyWorkspaces()
    {
        var userId = GetUserId();
        var workspaces = await _workspaceService.GetMyWorkspacesAsync(userId);
        return Ok(workspaces);
    }

    /// <summary>
    /// Lấy chi tiết 1 Workspace.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WorkspaceResponse>> GetById(Guid id)
    {
        var userId = GetUserId();
        var workspace = await _workspaceService.GetByIdAsync(id, userId);
        return Ok(workspace);
    }

    /// <summary>
    /// Tạo mới Workspace.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<WorkspaceResponse>> Create(CreateWorkspaceRequest request)
    {
        var userId = GetUserId();
        var workspace = await _workspaceService.CreateAsync(request, userId);
        
        return CreatedAtAction(
            nameof(GetById), 
            new { id = workspace.Id }, 
            workspace);
    }

    /// <summary>
    /// Xóa Workspace. Chỉ Owner mới có quyền.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        await _workspaceService.DeleteAsync(id, userId);
        return NoContent();
    }

    // ─────────────────────────────────────────────────────────────────
    // Helper: Trích xuất UserId từ Claims (JWT)
    // ─────────────────────────────────────────────────────────────────
    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            // Trường hợp hy hữu: Token hợp lệ nhưng thiếu Claim (lỗi server logic)
            throw new UnauthorizedAccessException("Không tìm thấy thông tin định danh trong Token.");
        }

        return userId;
    }
}
