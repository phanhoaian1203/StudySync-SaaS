using System.ComponentModel.DataAnnotations;

namespace StudySync.Application.DTOs.Task;

public class MoveTaskRequest
{
    [Required(ErrorMessage = "Mã cột không hợp lệ")]
    public Guid NewColumnId { get; set; }

    [Required(ErrorMessage = "Thứ tự sắp xếp không hợp lệ")]
    public double OrderIndex { get; set; }
}
