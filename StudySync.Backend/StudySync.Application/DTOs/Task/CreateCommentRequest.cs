using System.ComponentModel.DataAnnotations;

namespace StudySync.Application.DTOs.Task;

public class CreateCommentRequest
{
    [Required(ErrorMessage = "Nội dung bình luận không được bỏ trống")]
    public string Content { get; set; } = string.Empty;
}
