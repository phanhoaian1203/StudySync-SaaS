using Microsoft.AspNetCore.Mvc;
using StudySync.Application.DTOs.Auth;
using StudySync.Application.Interfaces.Services;

namespace StudySync.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Đăng ký tài khoản mới.
    /// Trả về 200 + JWT token nếu thành công.
    /// Trả về 409 nếu email đã tồn tại (GlobalExceptionHandler xử lý).
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Đăng nhập.
    /// Trả về 200 + JWT token nếu thành công.
    /// Trả về 401 nếu sai email/mật khẩu (GlobalExceptionHandler xử lý).
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(result);
    }
}