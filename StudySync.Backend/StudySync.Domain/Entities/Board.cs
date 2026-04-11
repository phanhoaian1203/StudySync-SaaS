using StudySync.Domain.Common;
using System.Data.Common;

namespace StudySync.Domain.Entities;

public class Board : BaseEntity
{
    public Guid WorkspaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsFavorite { get; set; } = false;

    // Navigation Properties
    public Workspace Workspace { get; set; } = null!;
    public ICollection<Column> Columns { get; set; } = new List<Column>();
}