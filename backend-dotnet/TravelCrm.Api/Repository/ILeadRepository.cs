using TravelCrm.Api.Contracts;
using TravelCrm.Api.Domain;

namespace TravelCrm.Api.Repository;

public interface ILeadRepository
{
    IReadOnlyList<LeadStatusDefinition> GetStatuses();
    LeadStatusDefinition? GetStatusById(string statusId);
    IReadOnlyList<LeadRecord> GetLeads(JourneyStage? stage);
    LeadRecord? GetLead(Guid id);
    LeadRecord CreateLead(CreateLeadRequest request);
    void UpsertLead(LeadRecord lead);
}
