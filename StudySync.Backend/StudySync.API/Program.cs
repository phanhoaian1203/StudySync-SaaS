using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StudySync.API.Middleware;
using StudySync.Infrastructure;
using StudySync.Infrastructure.Persistence;
using StudySync.Infrastructure.Services;
using StudySync.Application.Helpers;
using StudySync.Application.Interfaces.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ════════════════════════════════════════════════════════════════════
// 1. INFRASTRUCTURE SERVICES (DbContext, Repositories, Services...)
// ════════════════════════════════════════════════════════════════════
builder.Services.AddInfrastructureServices(builder.Configuration);

// Cloudinary Configuration
builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("CloudinarySettings"));
builder.Services.AddScoped<IPhotoService, PhotoService>();
builder.Services.AddSignalR();


// ════════════════════════════════════════════════════════════════════
// 2. JWT AUTHENTICATION
// ════════════════════════════════════════════════════════════════════
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["Secret"]
    ?? throw new InvalidOperationException(
        "JWT Secret Key chưa được cấu hình! Dùng 'dotnet user-secrets set Jwt:Secret <key>'");
var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = jwtSettings["Issuer"],
        ValidAudience            = jwtSettings["Audience"],
        IssuerSigningKey         = new SymmetricSecurityKey(key),
        ClockSkew                = TimeSpan.Zero // Loại bỏ thời gian trễ mặc định 5 phút
    };

    // Chuẩn SignalR: Đọc token từ Query String ("access_token") vì WebSockets không gửi Headers
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// ════════════════════════════════════════════════════════════════════
// 3. CORS — Chỉ cho phép các origin cụ thể
// ════════════════════════════════════════════════════════════════════
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>()
    ?? throw new InvalidOperationException(
        "AllowedOrigins chưa được cấu hình trong appsettings.json!");

builder.Services.AddCors(options =>
{
    options.AddPolicy("StudySyncPolicy", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials(); // Cần thiết cho SignalR real-time sau này
    });
});

// ════════════════════════════════════════════════════════════════════
// 4. SWAGGER — Tích hợp Bearer Token authentication
// ════════════════════════════════════════════════════════════════════
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        // Ghi đè response mặc định của [ApiController] khi validation fail.
        // Mục đích: Trả về cùng format { statusCode, message } với GlobalExceptionHandler
        // thay vì ASP.NET default { type, title, errors } format.
        options.InvalidModelStateResponseFactory = context =>
        {
            // Lấy message của lỗi đầu tiên (ngắn gọn, dễ đọc)
            var firstError = context.ModelState
                .Where(x => x.Value?.Errors.Count > 0)
                .SelectMany(x => x.Value!.Errors)
                .Select(x => x.ErrorMessage)
                .FirstOrDefault() ?? "Dữ liệu đầu vào không hợp lệ.";

            return new Microsoft.AspNetCore.Mvc.ObjectResult(new
            {
                statusCode = StatusCodes.Status400BadRequest,
                message    = firstError,
                timestamp  = DateTime.UtcNow
            })
            {
                StatusCode = StatusCodes.Status400BadRequest
            };
        };
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "StudySync API",
        Version     = "v1",
        Description = "API backend cho nền tảng StudySync SaaS"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Nhập Token theo định dạng: Bearer {your_token}",
        Name        = "Authorization",
        In          = ParameterLocation.Header,
        Type        = SecuritySchemeType.ApiKey,
        Scheme      = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ════════════════════════════════════════════════════════════════════
// BUILD
// ════════════════════════════════════════════════════════════════════
var app = builder.Build();

// ════════════════════════════════════════════════════════════════════
// 5. MIDDLEWARE PIPELINE — Thứ tự rất quan trọng!
// ════════════════════════════════════════════════════════════════════

// Global Exception Handler — phải ở TRƯỚC TIÊN để bắt mọi lỗi
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

// CORS — phải trước Authentication
app.UseCors("StudySyncPolicy");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Chỉ redirect HTTPS trong môi trường Development
// Khi chạy trong Docker container, HTTPS được xử lý ở tầng reverse proxy/nginx bên ngoài
// Nếu bật trong container sẽ gây redirect loop vì container không có SSL cert
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<StudySync.Infrastructure.Hubs.BoardHub>("/hubs/board");

// ════════════════════════════════════════════════════════════════════
// 6. AUTOMATIC DATABASE MIGRATION (Hỗ trợ Docker không cần cài .NET SDK)
// ════════════════════════════════════════════════════════════════════
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        app.Logger.LogInformation("Đang kiểm tra và chạy Database Migration tự động...");
        dbContext.Database.Migrate();
        app.Logger.LogInformation("Database Migration hoàn tất!");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Lỗi nghiêm trọng khi chạy Database Migration.");
    }
}

app.Run();
