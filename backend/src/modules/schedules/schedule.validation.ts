import { DAYS_OF_WEEK, DayOfWeek, IDailySchedule } from './schedule.model';

export interface DailyScheduleInput {
  day: string;
  startTime: string;
  endTime: string;
  breakHours?: number;
}

export interface CreateScheduleInput {
  name: string;
  type?: string;
  weeklyPattern: DailyScheduleInput[];
  weeklyHours?: number; // client may send this, but backend will recalculate
}

export interface UpdateScheduleInput {
  name?: string;
  type?: string;
  weeklyPattern?: DailyScheduleInput[];
  weeklyHours?: number;
}

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function calculateDailyHours(startTime: string, endTime: string, breakHours: number = 0): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const durationHours = (endMinutes - startMinutes) / 60;
  const worked = durationHours - breakHours;
  return Math.round(worked * 100) / 100;
}

export function validateDailyScheduleEntry(entry: DailyScheduleInput, seenDays: Set<string>): IDailySchedule {
  if (!entry || typeof entry !== 'object') {
    const error: any = new Error('Invalid daily schedule entry');
    error.statusCode = 400;
    throw error;
  }

  if (!entry.day || typeof entry.day !== 'string') {
    const error: any = new Error('Day is required for each schedule entry');
    error.statusCode = 400;
    throw error;
  }

  const normalizedDay = DAYS_OF_WEEK.find(d => d.toLowerCase() === entry.day.trim().toLowerCase());
  if (!normalizedDay) {
    const error: any = new Error(
      `Invalid day '${entry.day}'. Allowed days: ${DAYS_OF_WEEK.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  if (seenDays.has(normalizedDay.toLowerCase())) {
    const error: any = new Error(`Duplicate entry for day '${normalizedDay}' is not allowed`);
    error.statusCode = 400;
    throw error;
  }
  seenDays.add(normalizedDay.toLowerCase());

  if (!entry.startTime || typeof entry.startTime !== 'string' || !TIME_REGEX.test(entry.startTime.trim())) {
    const error: any = new Error(
      `Invalid start time '${entry.startTime}' for ${normalizedDay}. Format must be HH:mm (e.g., 09:00)`
    );
    error.statusCode = 400;
    throw error;
  }

  if (!entry.endTime || typeof entry.endTime !== 'string' || !TIME_REGEX.test(entry.endTime.trim())) {
    const error: any = new Error(
      `Invalid end time '${entry.endTime}' for ${normalizedDay}. Format must be HH:mm (e.g., 17:00)`
    );
    error.statusCode = 400;
    throw error;
  }

  const trimmedStart = entry.startTime.trim();
  const trimmedEnd = entry.endTime.trim();
  const startMinutes = timeToMinutes(trimmedStart);
  const endMinutes = timeToMinutes(trimmedEnd);

  if (endMinutes <= startMinutes) {
    const error: any = new Error(
      `End time (${trimmedEnd}) must be after start time (${trimmedStart}) for ${normalizedDay}`
    );
    error.statusCode = 400;
    throw error;
  }

  const durationHours = (endMinutes - startMinutes) / 60;

  const breakHours = entry.breakHours !== undefined && entry.breakHours !== null ? Number(entry.breakHours) : 0;
  if (isNaN(breakHours) || breakHours < 0) {
    const error: any = new Error(`Break hours cannot be negative for ${normalizedDay}`);
    error.statusCode = 400;
    throw error;
  }

  if (breakHours >= durationHours) {
    const error: any = new Error(
      `Break hours (${breakHours}) cannot be greater than or equal to total working duration (${durationHours} hrs) for ${normalizedDay}`
    );
    error.statusCode = 400;
    throw error;
  }

  return {
    day: normalizedDay,
    startTime: trimmedStart,
    endTime: trimmedEnd,
    breakHours
  };
}

export function validateAndCalculateSchedule(
  data: CreateScheduleInput | UpdateScheduleInput,
  isUpdate: boolean = false
): {
  name?: string;
  type?: string;
  weeklyPattern?: IDailySchedule[];
  weeklyHours?: number;
} {
  const result: any = {};

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      const error: any = new Error('Schedule name is required');
      error.statusCode = 400;
      throw error;
    }
    result.name = data.name.trim();
  }

  if (!isUpdate || data.type !== undefined) {
    if (data.type !== undefined) {
      if (typeof data.type !== 'string' || !data.type.trim()) {
        const error: any = new Error('Schedule type cannot be empty');
        error.statusCode = 400;
        throw error;
      }
      result.type = data.type.trim();
    } else if (!isUpdate) {
      result.type = 'Standard';
    }
  }

  if (!isUpdate || data.weeklyPattern !== undefined) {
    if (!Array.isArray(data.weeklyPattern)) {
      const error: any = new Error('Weekly pattern must be an array of daily schedule entries');
      error.statusCode = 400;
      throw error;
    }

    const seenDays = new Set<string>();
    const validatedPattern: IDailySchedule[] = [];
    let totalWeeklyHours = 0;

    for (const entry of data.weeklyPattern) {
      const validatedEntry = validateDailyScheduleEntry(entry, seenDays);
      validatedPattern.push(validatedEntry);
      const dailyHours = calculateDailyHours(
        validatedEntry.startTime,
        validatedEntry.endTime,
        validatedEntry.breakHours
      );
      totalWeeklyHours += dailyHours;
    }

    result.weeklyPattern = validatedPattern;
    result.weeklyHours = Math.round(totalWeeklyHours * 100) / 100;
  }

  return result;
}
