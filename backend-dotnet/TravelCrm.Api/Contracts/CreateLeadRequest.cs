using TravelCrm.Api.Domain;

namespace TravelCrm.Api.Contracts;

public sealed class CreateLeadRequest
{
    public required string CustomerName { get; init; }
    public required string Destination { get; init; }
    public decimal Value { get; init; }
    public DateTime? DepartureDateUtc { get; init; }
    public DateTime? ReturnDateUtc { get; init; }
}
