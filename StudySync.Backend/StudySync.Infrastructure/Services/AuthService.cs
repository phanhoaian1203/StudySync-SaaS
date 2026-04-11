using StudySync.Application.DTOs.Auth;
using StudySync.Application.Interfaces.Repositories;
using StudySync.Application.Interfaces.Services;
using StudySync.Domain.Entities;

namespace StudySync.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IUnitOfWork _unitOfWork;
    public AuthService(IUserRepository userRepository, IJwtTokenGenerator jwtTokenGenerator, IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
        _unitOfWork = unitOfWork;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _userRepository.IsEmailExistsAsync(request.Email))
        {
            throw new Exception("Email này đã được sử dụng!");
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var newUser = new User
        {
            Email = request.Email,
            FullName = request.FullName,
            PasswordHash = passwordHash
        };

        // Gọi Repo để thêm vào DbContext (Bộ nhớ đệm)
        await _userRepository.AddAsync(newUser);

        // 3. GỌI UNIT OF WORK ĐỂ LƯU XUỐNG SQL SERVER
        await _unitOfWork.SaveChangesAsync();

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