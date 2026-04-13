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
            options.UseSqlServer(connectionString));

        // ── REPOSITORIES ────────────────────────────────────────────
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IWorkspaceRepository, WorkspaceRepository>();

        // ── UNIT OF WORK ────────────────────────────────────────────
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // ── SERVICES ────────────────────────────────────────────────
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IAuthService, AuthService>();

        return services;
    }
}