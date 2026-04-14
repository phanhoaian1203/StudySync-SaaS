namespace StudySync.Domain.Enums;

public enum ActivityType
{
    TaskCreated,
    TaskUpdated,
    TaskDeleted,
    TaskMoved,
    CommentAdded,
    CommentDeleted,
    AttachmentAdded,
    AttachmentDeleted,
    ChecklistAdded,
    ChecklistToggled,
    ChecklistDeleted,
    MemberAssigned,
    MemberUnassigned
}
