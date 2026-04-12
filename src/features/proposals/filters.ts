import { Lead } from '../../types';

export type ProposalFilters = {
  direction: string;
  minValue: string;
  maxValue: string;
  departureFrom: string;
  departureTo: string;
};

export const filterLeadsByProposalFilters = (leads: Lead[], filters: ProposalFilters): Lead[] => {
  const normalizedDirection = filters.direction.trim().toLowerCase();
  const minValue = filters.minValue.trim() === '' ? null : Number(filters.minValue);
  const maxValue = filters.maxValue.trim() === '' ? null : Number(filters.maxValue);
  const departureFrom = filters.departureFrom ? new Date(`${filters.departureFrom}T00:00:00`) : null;
  const departureTo = filters.departureTo ? new Date(`${filters.departureTo}T23:59:59`) : null;

  return leads.filter((lead) => {
    const matchesDirection = normalizedDirection === '' || lead.destination.toLowerCase().includes(normalizedDirection);
    const matchesMinValue = minValue === null || (!Number.isNaN(minValue) && lead.value >= minValue);
    const matchesMaxValue = maxValue === null || (!Number.isNaN(maxValue) && lead.value <= maxValue);

    let matchesDeparture = true;
    if (departureFrom || departureTo) {
      const departureDate = lead.departureDate ? new Date(lead.departureDate) : null;
      if (!departureDate || Number.isNaN(departureDate.getTime())) {
        matchesDeparture = false;
      } else {
        if (departureFrom && departureDate < departureFrom) matchesDeparture = false;
        if (departureTo && departureDate > departureTo) matchesDeparture = false;
      }
    }

    return matchesDirection && matchesMinValue && matchesMaxValue && matchesDeparture;
  });
};
