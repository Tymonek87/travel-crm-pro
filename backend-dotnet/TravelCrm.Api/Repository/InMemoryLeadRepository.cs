using TravelCrm.Api.Contracts;
using TravelCrm.Api.Domain;

namespace TravelCrm.Api.Repository;

public sealed class InMemoryLeadRepository : ILeadRepository
{
    private readonly List<LeadStatusDefinition> _statuses =
    [
        new() { Id = "New", Title = "Nowe", Stage = JourneyStage.Sales, Order = 0 },
        new() { Id = "OfferSent", Title = "Oferta Wyslana", Stage = JourneyStage.Sales, Order = 1 },
        new() { Id = "OfferOpened", Title = "Oferta Otwarta", Stage = JourneyStage.Sales, Order = 2 },
        new() { Id = "Negotiating", Title = "Negocjacje", Stage = JourneyStage.Sales, Order = 3 },
        new() { Id = "Won", Title = "Wygrane", Stage = JourneyStage.Sales, Order = 4, IsWon = true },
        new() { Id = "Lost", Title = "Przegrane", Stage = JourneyStage.Sales, Order = 5, IsLost = true },
        new() { Id = "PreTripDocs", Title = "Dokumenty i formalnosci", Stage = JourneyStage.PreTrip, Order = 6 },
        new() { Id = "PreTripUpsell", Title = "Dosprzedaz uslug", Stage = JourneyStage.PreTrip, Order = 7 },
        new() { Id = "PreTripReady", Title = "Gotowy do wyjazdu", Stage = JourneyStage.PreTrip, Order = 8, IsWon = true },
        new() { Id = "PostTripSurvey", Title = "Ankieta po powrocie", Stage = JourneyStage.PostTrip, Order = 9 },
        new() { Id = "PostTripFollowup", Title = "Follow-up i kolejna oferta", Stage = JourneyStage.PostTrip, Order = 10, IsWon = true },
    ];

    private readonly List<LeadRecord> _leads =
    [
        new()
        {
            Id = Guid.NewGuid(),
            CustomerName = "Jan Kowalski",
            Destination = "Malediwy - 14 dni",
            Value = 25000m,
            JourneyStage = JourneyStage.Sales,
            StatusId = "New",
            CreatedAtUtc = DateTime.UtcNow.AddDays(-1)
        }
    ];

    public IReadOnlyList<LeadStatusDefinition> GetStatuses() => _statuses.OrderBy(s => s.Order).ToList();

    public LeadStatusDefinition? GetStatusById(string statusId) => _statuses.FirstOrDefault(s => s.Id.Equals(statusId, StringComparison.OrdinalIgnoreCase));

    public IReadOnlyList<LeadRecord> GetLeads(JourneyStage? stage)
    {
        var query = _leads.AsQueryable();
        if (stage is not null)
        {
            query = query.Where(l => l.JourneyStage == stage);
        }

        return query.ToList();
    }

    public LeadRecord? GetLead(Guid id) => _leads.FirstOrDefault(l => l.Id == id);

    public LeadRecord CreateLead(CreateLeadRequest request)
    {
        var firstSalesStatus = _statuses.Where(s => s.Stage == JourneyStage.Sales).OrderBy(s => s.Order).First().Id;
        var lead = new LeadRecord
        {
            Id = Guid.NewGuid(),
            CustomerName = request.CustomerName,
            Destination = request.Destination,
            Value = request.Value,
            JourneyStage = JourneyStage.Sales,
            StatusId = firstSalesStatus,
            CreatedAtUtc = DateTime.UtcNow,
            DepartureDateUtc = request.DepartureDateUtc,
            ReturnDateUtc = request.ReturnDateUtc,
        };

        _leads.Add(lead);
        return lead;
    }

    public void UpsertLead(LeadRecord lead)
    {
        var idx = _leads.FindIndex(l => l.Id == lead.Id);
        if (idx >= 0)
        {
            _leads[idx] = lead;
        }
        else
        {
            _leads.Add(lead);
        }
    }
}
