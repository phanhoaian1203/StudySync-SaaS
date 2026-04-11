using StudySync.Application.DTOs.Auth;
using StudySync.Application.Interfaces.Repositories;
using StudySync.Application.Interfaces.Services;
using StudySync.Domain.Entities;

namespace StudySync.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(IUserRepository userRepository, IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        // 1. Kiểm tra Email tồn tại chưa
        if (await _userRepository.IsEmailExistsAsync(request.Email))
        {
            throw new Exception("Email này đã được sử dụng!"); // Tạm ném Exception, sau này sẽ dùng Custom Exception chuẩn hơn
        }

        // 2. Mã hóa mật khẩu bằng BCrypt
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // 3. Tạo User mới
        var newUser = new User
        {
            Email = request.Email,
            FullName = request.FullName,
            PasswordHash = passwordHash
        };

        await _userRepository.AddAsync(newUser);

        // LƯU Ý: Ở đây đáng lẽ phải gọi _context.SaveChanges() nếu bạn dùng UnitOfWork. 
        // Nếu chưa cấu hình UnitOfWork, logic tạm thời chưa lưu thẳng xuống DB.
        // Ta sẽ giả định User đã được lưu và có ID.

        // 4. Sinh Token
        var token = _jwtTokenGenerator.GenerateToken(newUser);

        return new AuthResponse
        {
            Token = token,
            UserId = newUser.Id,
            Email = newUser.Email,
            FullName = newUser.FullName,
            SubscriptionPlan = newUser.SubscriptionPlan
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        // 1. Tìm User theo Email
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            throw new Exception("Email hoặc mật khẩu không chính xác.");
        }

        // 2. So sánh mật khẩu người dùng nhập với Hash trong Database
        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            throw new Exception("Email hoặc mật khẩu không chính xác.");
        }

        // 3. Sinh Token
        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponse
        {
            Token = token,
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            SubscriptionPlan = user.SubscriptionPlan
        };
    }
}