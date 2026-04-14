using Microsoft.AspNetCore.Http;
using CloudinaryDotNet.Actions;

namespace StudySync.Application.Interfaces.Services;

public interface IPhotoService
{
    Task<ImageUploadResult> AddPhotoAsync(IFormFile file);
    Task<DeletionResult> DeletePhotoAsync(string publicId);
}
