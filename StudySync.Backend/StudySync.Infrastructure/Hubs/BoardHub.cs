using Microsoft.AspNetCore.SignalR;

namespace StudySync.Infrastructure.Hubs;

public class BoardHub : Hub
{
    public async Task JoinBoard(string boardId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, boardId);
        // Có thể gửi log "User X joined board" nếu cần
    }

    public async Task LeaveBoard(string boardId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, boardId);
    }
}
