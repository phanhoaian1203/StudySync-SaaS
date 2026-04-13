using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using StudySync.Application.Interfaces.Services;
using StudySync.Domain.Entities;

namespace StudySync.Infrastructure.Authentication;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        // 1. Tạo các "con dấu" (Claims) đóng lên thẻ JWT
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("FullName", user.FullName),
            new Claim("SubscriptionPlan", user.SubscriptionPlan.ToString())
        };

        // 2. Lấy Secret Key từ cấu hình (phải đủ dài và bảo mật)
        var secretKey = _configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException(
                "JWT Secret Key chưa được cấu hình! Dùng 'dotnet user-secrets set Jwt:Secret <key>'");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // 3. Cấu hình thẻ JWT (Hết hạn sau 7 ngày)
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}