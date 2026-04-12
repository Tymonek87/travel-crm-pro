using TravelCrm.Api.Domain;

namespace TravelCrm.Api.Application;

public sealed class JourneyTransitionService
{
    public void ApplyStatusChange(LeadRecord lead, LeadStatusDefinition status, IReadOnlyList<LeadStatusDefinition> statuses)
    {
        var now = DateTime.UtcNow;
        var oldStatus = lead.StatusId;

        lead.StatusId = status.Id;
        lead.LastActivityAtUtc = now;
        lead.Activities.Add(new LeadActivity
        {
            Id = Guid.NewGuid(),
            TimestampUtc = now,
            Type = "StatusChanged",
            FromStatusId = oldStatus,
            ToStatusId = status.Id,
            Details = $"Status changed: {oldStatus} -> {status.Id}"
        });

        if (lead.JourneyStage == JourneyStage.Sales && status.IsWon)
        {
            MoveToStage(lead, JourneyStage.PreTrip, statuses, "Automatic transition after sales win.");
        }
    }

    public List<LeadRecord> RunDateBasedTransitions(IReadOnlyList<LeadRecord> leads, IReadOnlyList<LeadStatusDefinition> statuses)
    {
        var moved = new List<LeadRecord>();
        var now = DateTime.UtcNow;

        foreach (var lead in leads)
        {
            if (lead.JourneyStage == JourneyStage.PreTrip && lead.ReturnDateUtc is not null && lead.ReturnDateUtc <= now)
            {
                MoveToStage(lead, JourneyStage.PostTrip, statuses, "Automatic transition after return date.");
                moved.Add(lead);
            }
        }

        return moved;
    }

    private static void MoveToStage(LeadRecord lead, JourneyStage newStage, IReadOnlyList<LeadStatusDefinition> statuses, string reason)
    {
        var firstStageStatus = statuses
            .Where(s => s.Stage == newStage)
            .OrderBy(s => s.Order)
            .FirstOrDefault();

        if (firstStageStatus is null)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var oldStatus = lead.StatusId;

        lead.JourneyStage = newStage;
        lead.StatusId = firstStageStatus.Id;
        lead.LastActivityAtUtc = now;
        lead.Activities.Add(new LeadActivity
        {
            Id = Guid.NewGuid(),
            TimestampUtc = now,
            Type = "StatusChanged",
            FromStatusId = oldStatus,
            ToStatusId = firstStageStatus.Id,
            Details = reason
        });
    }
}
