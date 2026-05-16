using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StudySync.Application.Interfaces.Repositories;
using StudySync.Application.Interfaces.Services;
using StudySync.Infrastructure.Authentication;
using StudySync.Infrastructure.Persistence;
using StudySync.Infrastructure.Repositories;
using StudySync.Infrastructure.Services;

namespace StudySync.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Đăng ký tất cả dependencies của tầng Infrastructure.
    /// Infrastructure tự quản lý dependencies của mình, không cần Program.cs biết chi tiết.
    /// </summary>
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── DATABASE ────────────────────────────────────────────────
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Connection string 'DefaultConnection' chưa được cấu hình!");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                // ── DOCKER RESILIENCE ──────────────────────────────────────
                // Bật tự động retry khi SQL Server chưa sẵn sàng.
                // Quan trọng trong Docker: SQL Server cần 20-60s để khởi động
                // sau khi healthcheck pass. Nếu không có retry → backend crash.
                // Retry 6 lần, mỗi lần cách nhau tối đa 30 giây (tổng ~3 phút)
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 6,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null);
                
                // Timeout mỗi lần kết nối: 60 giây
                sqlOptions.CommandTimeout(60);
            }));

        // ── REPOSITORIES ────────────────────────────────────────────
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IWorkspaceRepository, WorkspaceRepository>();
        services.AddScoped<IBoardRepository, BoardRepository>();
        services.AddScoped<IColumnRepository, ColumnRepository>();
        services.AddScoped<ITaskRepository, TaskRepository>();

        // ── UNIT OF WORK ────────────────────────────────────────────
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // ── SERVICES ────────────────────────────────────────────────
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IWorkspaceService, WorkspaceService>();
        services.AddScoped<IBoardService, BoardService>();
        services.AddScoped<IColumnService, ColumnService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<IChecklistService, ChecklistService>();

        return services;
    }
}