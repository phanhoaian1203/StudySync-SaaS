using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudySync.Application.DTOs.Task;
using StudySync.Application.Interfaces.Services;
using System.Security.Claims;

namespace StudySync.API.Controllers;

[Authorize]
[ApiController]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpPost]
    public async Task<ActionResult<TaskResponse>> Create(CreateTaskRequest request)
    {
        var userId = GetUserId();
        var task = await _taskService.CreateAsync(request, userId);
        return Ok(task);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        await _taskService.DeleteAsync(id, userId);
        return NoContent();
    }

    [HttpPut("{id:guid}/move")]
    public async Task<ActionResult<TaskResponse>> Move(Guid id, [FromBody] MoveTaskRequest request)
    {
        var userId = GetUserId();
        var task = await _taskService.MoveAsync(id, request, userId);
        return Ok(task);
    }

    [HttpPut("{id:guid}/details")]
    public async Task<ActionResult<TaskResponse>> UpdateDetails(Guid id, [FromBody] UpdateTaskDetailsRequest request)
    {
        var userId = GetUserId();
        var task = await _taskService.UpdateDetailsAsync(id, request, userId);
        return Ok(task);
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) throw new UnauthorizedAccessException();
        return Guid.Parse(userIdClaim);
    }
}
