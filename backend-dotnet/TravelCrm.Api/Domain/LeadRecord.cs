namespace TravelCrm.Api.Domain;

public sealed class LeadRecord
{
    public required Guid Id { get; init; }
    public required string CustomerName { get; set; }
    public required string Destination { get; set; }
    public required decimal Value { get; set; }
    public required JourneyStage JourneyStage { get; set; }
    public required string StatusId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? DepartureDateUtc { get; set; }
    public DateTime? ReturnDateUtc { get; set; }
    public DateTime? OfferSentAtUtc { get; set; }
    public DateTime? LastActivityAtUtc { get; set; }
    public List<LeadActivity> Activities { get; } = new();
}
