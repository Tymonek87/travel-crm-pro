import { TaskReportItem } from '../../types';

const pad = (value: number) => String(value).padStart(2, '0');

export const formatLocalDateTime = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const getDueDateAtHour = (base: Date, daysOffset: number, hour = 10, minute = 0): string => {
  const due = new Date(base);
  due.setDate(due.getDate() + daysOffset);
  due.setHours(hour, minute, 0, 0);
  return formatLocalDateTime(due);
};

export const splitDateTime = (dateTime: string): { date: string; time: string } => {
  const [date = '', time = '10:00'] = dateTime.split(' ');
  return { date, time };
};

type BuildTaskInput = {
  title: string;
  client: string;
  createdDate: string;
  dueDate: string;
  assignedTo?: string;
  priority?: TaskReportItem['priority'];
  status?: TaskReportItem['status'];
};

export const buildTask = ({
  title,
  client,
  createdDate,
  dueDate,
  assignedTo = 'Ja',
  priority = 'medium',
  status = 'new',
}: BuildTaskInput): TaskReportItem => ({
  id: `T-${String(Math.random()).slice(2, 8)}`,
  taskId: Math.floor(Math.random() * 1000000),
  title,
  status,
  createdDate,
  dueDate,
  priority,
  client,
  assignedTo,
});
