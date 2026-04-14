using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudySync.Application.Interfaces.Services;
using System.Security.Claims;

namespace StudySync.API.Controllers;

[Authorize]
[ApiController]
[Route("api/tasks/{taskId:guid}/checklists")]
public class ChecklistsController : ControllerBase
{
    private readonly IChecklistService _checklistService;

    public ChecklistsController(IChecklistService checklistService)
    {
        _checklistService = checklistService;
    }

    [HttpPost]
    public async Task<IActionResult> Add(Guid taskId, [FromBody] AddChecklistRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await _checklistService.AddAsync(taskId, request.Content, userId);
        return Ok(response);
    }

    [HttpPatch("{id:guid}/toggle")]
    public async Task<IActionResult> Toggle(Guid taskId, Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await _checklistService.ToggleAsync(taskId, id, userId);
        return Ok(response);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid taskId, Guid id, [FromBody] AddChecklistRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await _checklistService.UpdateAsync(taskId, id, request.Content, userId);
        return Ok(response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid taskId, Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _checklistService.DeleteAsync(taskId, id, userId);
        return NoContent();
    }
}

public class AddChecklistRequest
{
    public string Content { get; set; } = string.Empty;
}
