namespace TravelCrm.Api.Domain;

public sealed class LeadStatusDefinition
{
    public required string Id { get; init; }
    public required string Title { get; init; }
    public required JourneyStage Stage { get; init; }
    public required int Order { get; init; }
    public bool IsWon { get; init; }
    public bool IsLost { get; init; }
}
