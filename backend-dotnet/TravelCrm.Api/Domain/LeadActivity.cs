namespace TravelCrm.Api.Domain;

public sealed class LeadActivity
{
    public required Guid Id { get; init; }
    public required DateTime TimestampUtc { get; init; }
    public required string Type { get; init; }
    public string? FromStatusId { get; init; }
    public string? ToStatusId { get; init; }
    public string? Details { get; init; }
}
