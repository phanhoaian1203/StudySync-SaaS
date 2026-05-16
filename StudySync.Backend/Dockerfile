# ============================================================
# STAGE 1: BUILD — Biên dịch toàn bộ solution .NET 8
# ============================================================
# Dùng SDK image đầy đủ để có dotnet build/restore/publish
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# --- Copy .csproj files TRƯỚC để tận dụng Docker layer cache ---
# Nếu code thay đổi nhưng .csproj không đổi → Docker bỏ qua bước restore
COPY ["StudySync.API/StudySync.API.csproj",                         "StudySync.API/"]
COPY ["StudySync.Application/StudySync.Application.csproj",         "StudySync.Application/"]
COPY ["StudySync.Infrastructure/StudySync.Infrastructure.csproj",   "StudySync.Infrastructure/"]
COPY ["StudySync.Domain/StudySync.Domain.csproj",                   "StudySync.Domain/"]

# --- Restore tất cả NuGet packages ---
RUN dotnet restore "StudySync.API/StudySync.API.csproj"

# --- Copy toàn bộ source code ---
COPY . .

# --- Build & Publish ở chế độ Release (tối ưu hiệu năng) ---
WORKDIR "/src/StudySync.API"
RUN dotnet publish "StudySync.API.csproj" \
    -c Release \
    -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

# ============================================================
# STAGE 2: RUNTIME — Image cuối cùng nhỏ gọn (chỉ ASP.NET Runtime)
# ============================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Khai báo cổng HTTP mà container lắng nghe
EXPOSE 8080

# Biến môi trường mặc định cho ASP.NET Core trong container
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Copy kết quả publish từ Stage build
COPY --from=build /app/publish .

# Lệnh khởi động khi container chạy
ENTRYPOINT ["dotnet", "StudySync.API.dll"]
