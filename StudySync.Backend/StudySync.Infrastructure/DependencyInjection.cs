using Microsoft.Extensions.DependencyInjection;
using StudySync.Application.Interfaces.Repositories;
using StudySync.Infrastructure.Repositories;

namespace StudySync.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IWorkspaceRepository, WorkspaceRepository>();



        return services;
    }
}