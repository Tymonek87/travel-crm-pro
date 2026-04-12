import { Column, JourneyStage } from '../../types';

export const JOURNEY_STAGE_LABELS: Record<JourneyStage, string> = {
  sales: 'Sprzedaz',
  pre_trip: 'Przed wyjazdem',
  post_trip: 'Po powrocie',
};

export const getColumnsForStage = (columns: Column[], stage: JourneyStage): Column[] =>
  columns
    .filter((column) => (column.stage || 'sales') === stage)
    .sort((a, b) => a.order - b.order);

export const getFirstStatusForStage = (columns: Column[], stage: JourneyStage, fallback = 'New'): string =>
  getColumnsForStage(columns, stage)[0]?.id || fallback;
