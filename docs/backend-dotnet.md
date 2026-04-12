# Travel CRM .NET Backend

## Goal

Backend supports a multi-stage sales journey for travel leads:

- Stage 1: `Sales` (from first contact to sale/loss)
- Stage 2: `PreTrip` (after sale, until departure/return handling)
- Stage 3: `PostTrip` (after trip return, follow-up and retention)

This model reflects that a lead lifecycle should continue after the first purchase.

## Project structure

`backend-dotnet/TravelCrm.Api`

- `Program.cs` - minimal API endpoints and dependency wiring
- `Domain/` - core entities and enums
- `Contracts/` - API request DTOs
- `Repository/` - persistence abstraction + in-memory implementation
- `Application/` - domain workflows and transition logic

## Domain model

### `JourneyStage`

Enum with funnel stages:

- `Sales`
- `PreTrip`
- `PostTrip`

### `LeadStatusDefinition`

Dynamic status definition used by dashboard and process logic.

Fields:

- `Id`
- `Title`
- `Stage`
- `Order`
- `IsWon`
- `IsLost`

### `LeadRecord`

Main lead aggregate with journey metadata and timeline fields.

Key fields include:

- `Id`
- `ClientName`
- `Destination`
- `EstimatedValue`
- `JourneyStage`
- `StatusId`
- `DepartureDateUtc`
- `ReturnDateUtc`
- `Activities`

## API contracts

### `CreateLeadRequest`

Input payload for creating a lead.

### `UpdateLeadStatusRequest`

Input payload for status transition:

- `StatusId`

## Repository layer

### `ILeadRepository`

Abstraction for:

- reading statuses
- reading leads (optionally filtered by stage)
- creating/upserting leads
- resolving lead/status by id

### `InMemoryLeadRepository`

Current implementation with seeded sample data and status configuration for all stages:

- Sales statuses: `New`, `OfferSent`, `OfferOpened`, `Negotiating`, `Won`, `Lost`
- PreTrip statuses: `PreTripDocs`, `PreTripUpsell`, `PreTripReady`
- PostTrip statuses: `PostTripSurvey`, `PostTripFollowup`

## Transition rules

Implemented in `Application/JourneyTransitionService.cs`.

### 1. Sales won => move to PreTrip

When a lead in `Sales` receives a status marked as `IsWon`, lead automatically moves to `PreTrip` and receives the first configured PreTrip status.

### 2. PreTrip return date passed => move to PostTrip

`RunDateBasedTransitions` checks `ReturnDateUtc` and automatically moves eligible `PreTrip` leads to first configured `PostTrip` status.

## Endpoints

- `GET /api/statuses`
- `GET /api/leads?stage=Sales|PreTrip|PostTrip`
- `POST /api/leads`
- `POST /api/leads/{id}/status`
- `POST /api/automation/run`

## Notes for next step

- Replace in-memory repository with persistent storage (SQL)
- Add auth/authorization (manager/admin scope)
- Add validation and error contract standardization
- Add automated tests for transitions and API contracts
