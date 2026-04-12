using TravelCrm.Api.Application;
using TravelCrm.Api.Contracts;
using TravelCrm.Api.Domain;
using TravelCrm.Api.Repository;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<ILeadRepository, InMemoryLeadRepository>();
builder.Services.AddSingleton<JourneyTransitionService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/api/statuses", (ILeadRepository repo) => Results.Ok(repo.GetStatuses()));

app.MapGet("/api/leads", (JourneyStage? stage, ILeadRepository repo) =>
{
    var leads = repo.GetLeads(stage);
    return Results.Ok(leads);
});

app.MapPost("/api/leads", (CreateLeadRequest request, ILeadRepository repo) =>
{
    var lead = repo.CreateLead(request);
    return Results.Created($"/api/leads/{lead.Id}", lead);
});

app.MapPost("/api/leads/{id:guid}/status", (Guid id, UpdateLeadStatusRequest request, ILeadRepository repo, JourneyTransitionService transitions) =>
{
    var lead = repo.GetLead(id);
    if (lead is null)
    {
        return Results.NotFound(new { message = "Lead not found." });
    }

    var status = repo.GetStatusById(request.StatusId);
    if (status is null)
    {
        return Results.BadRequest(new { message = "Unknown status." });
    }

    if (lead.JourneyStage != status.Stage)
    {
        return Results.BadRequest(new { message = "Status belongs to a different journey stage." });
    }

    transitions.ApplyStatusChange(lead, status, repo.GetStatuses());
    repo.UpsertLead(lead);

    return Results.Ok(lead);
});

app.MapPost("/api/automation/run", (ILeadRepository repo, JourneyTransitionService transitions) =>
{
    var moved = transitions.RunDateBasedTransitions(repo.GetLeads(null), repo.GetStatuses());
    foreach (var lead in moved)
    {
        repo.UpsertLead(lead);
    }

    return Results.Ok(new { movedCount = moved.Count });
});

app.Run();
