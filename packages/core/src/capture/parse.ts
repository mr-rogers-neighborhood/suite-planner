import { addDaysToKey, type DateKey, formatClockTime, isValidDateKey, weekdayOf } from "../dates";

export type ParsedCapture = {
  title: string;
  dateKey: DateKey | null;
  time: string | null;
  estimateMinutes: number | null;
  projectName: string | null;
  tagNames: string[];
  priority: number | null;
};

const WEEKDAYS: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

/**
 * Turns one line of text into a task draft. Every token it recognises is removed from the title;
 * anything it does not recognise stays in the title rather than being silently dropped.
 */
export function parseCapture(
  input: string,
  today: DateKey,
  options: { impliedDate?: DateKey } = {},
): ParsedCapture {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  const titleParts: string[] = [];
  const tagNames: string[] = [];
  let dateKey: DateKey | null = null;
  let time: string | null = null;
  let estimateMinutes: number | null = null;
  let projectName: string | null = null;
  let priority: number | null = null;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === undefined) continue;
    const lower = token.toLowerCase();

    if (lower === "next") {
      const following = tokens[index + 1];
      if (following && WEEKDAYS[following.toLowerCase()] !== undefined) continue;
    }

    if (lower === "today") {
      dateKey = today;
      continue;
    }
    if (lower === "tomorrow") {
      dateKey = addDaysToKey(today, 1);
      continue;
    }
    if (lower === "yesterday") {
      dateKey = addDaysToKey(today, -1);
      continue;
    }

    const weekday = WEEKDAYS[lower];
    if (weekday !== undefined) {
      dateKey = addDaysToKey(today, (weekday - weekdayOf(today) + 7) % 7);
      continue;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(token) && isValidDateKey(token)) {
      dateKey = token;
      continue;
    }

    if (token.startsWith("#") && token.length > 1) {
      projectName = token.slice(1);
      continue;
    }

    if (token.startsWith("@") && token.length > 1) {
      tagNames.push(token.slice(1));
      continue;
    }

    const priorityMatch = /^!([1-3])$/.exec(token);
    if (priorityMatch?.[1]) {
      priority = Number(priorityMatch[1]);
      continue;
    }

    const estimateMatch = /^~(\d+(?:\.\d+)?)(m|h)$/i.exec(token);
    if (estimateMatch?.[1] && estimateMatch[2]) {
      const amount = Number(estimateMatch[1]);
      estimateMinutes = Math.round(estimateMatch[2].toLowerCase() === "h" ? amount * 60 : amount);
      continue;
    }

    const clock = parseClockToken(token);
    if (clock) {
      time = clock;
      continue;
    }

    titleParts.push(token);
  }

  if (time && dateKey === null) dateKey = options.impliedDate ?? today;

  return {
    title: titleParts.join(" ").trim() || input.trim(),
    dateKey,
    time,
    estimateMinutes,
    projectName,
    tagNames,
    priority,
  };
}

function parseClockToken(token: string): string | null {
  const meridiem = /^(\d{1,2})(?::(\d{2}))?(am|pm)$/i.exec(token);
  if (meridiem?.[1]) {
    let hour = Number(meridiem[1]);
    const minute = Number(meridiem[2] ?? "0");
    const suffix = meridiem[3]?.toLowerCase();
    if (suffix === "pm" && hour < 12) hour += 12;
    if (suffix === "am" && hour === 12) hour = 0;
    return hour <= 23 && minute <= 59 ? formatClockTime(hour, minute) : null;
  }

  const clock = /^(\d{1,2}):(\d{2})$/.exec(token);
  if (clock?.[1] && clock[2]) {
    const hour = Number(clock[1]);
    const minute = Number(clock[2]);
    return hour <= 23 && minute <= 59 ? formatClockTime(hour, minute) : null;
  }

  return null;
}
