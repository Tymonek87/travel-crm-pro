<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f8c8df01-c55c-48ab-9bec-f2e2f3ab0f58

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## .NET Backend (Travel CRM API)

Repository includes a backend scaffold in `backend-dotnet/TravelCrm.Api` based on `.NET 8` minimal API.

### Run backend locally

Prerequisites: `.NET 8 SDK`

1. Restore and run:
   `dotnet run --project backend-dotnet/TravelCrm.Api/TravelCrm.Api.csproj`
2. Open Swagger UI:
   `http://localhost:5000/swagger` (or the URL shown in console)

### Main API endpoints

- `GET /api/statuses` - return configured lead statuses (dynamic by stage)
- `GET /api/leads?stage=Sales|PreTrip|PostTrip` - return leads, optionally filtered by journey stage
- `POST /api/leads` - create lead
- `POST /api/leads/{id}/status` - change lead status within current stage
- `POST /api/automation/run` - run date-based stage transitions

### Documentation

Detailed backend description is available in:
- `docs/backend-dotnet.md`
