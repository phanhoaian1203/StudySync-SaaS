using System.Net;
using System.Text.Json;
using StudySync.Domain.Exceptions;

namespace StudySync.API.Middleware;

/// <summary>
/// Global Exception Handler — bắt tập trung mọi lỗi chưa được xử lý.
/// Đây là "phòng tuyến cuối cùng", đảm bảo API không bao giờ trả về 
/// lỗi 500 thô cho client.
/// </summary>
public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Đã xảy ra lỗi chưa được xử lý: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message) = exception switch
        {
            ConflictException    => (HttpStatusCode.Conflict, exception.Message),          // 409
            NotFoundException    => (HttpStatusCode.NotFound, exception.Message),           // 404
            UnauthorizedException => (HttpStatusCode.Unauthorized, exception.Message),      // 401
            ForbiddenException   => (HttpStatusCode.Forbidden, exception.Message),         // 403
            BadRequestException  => (HttpStatusCode.BadRequest, exception.Message),        // 400
            InvalidOperationException => (HttpStatusCode.BadRequest, exception.Message),    // 400 - Thường là do thiếu Config
            ArgumentException    => (HttpStatusCode.BadRequest, exception.Message),         // 400
            _                    => (HttpStatusCode.InternalServerError,                    // 500
                                     exception.Message ?? "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.")
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            statusCode = (int)statusCode,
            message,
            // Trả về timestamp để tiện debug
            timestamp = DateTime.UtcNow
        };

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}
