/**
 * Crontab Expression Studio Engine
 * Pure deterministic validation, natural English explanation generator,
 * and upcoming execution calculation for standard 5-part cron expressions.
 */

export interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

export interface CronValidationResult {
  valid: boolean;
  parts?: CronParts;
  error?: string;
}

export function parseCron(cronString: string): CronParts | null {
  const parts = cronString.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4],
  };
}

export function validateCronField(field: string, min: number, max: number): boolean {
  if (field === "*") return true;

  // Step notation: */5 or 1-30/5
  if (field.startsWith("*/")) {
    const step = parseInt(field.slice(2), 10);
    return !isNaN(step) && step > 0 && step <= max;
  }

  // Comma-separated list: 1,2,5
  if (field.includes(",")) {
    const items = field.split(",");
    return items.every((item) => validateCronField(item.trim(), min, max));
  }

  // Range notation: 1-5
  if (field.includes("-")) {
    const [startStr, endStr] = field.split("-");
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    return !isNaN(start) && !isNaN(end) && start >= min && end <= max && start <= end;
  }

  // Exact number
  const num = parseInt(field, 10);
  return !isNaN(num) && num >= min && num <= max;
}

export function validateCronExpression(cronString: string): CronValidationResult {
  const parts = parseCron(cronString);
  if (!parts) {
    return {
      valid: false,
      error: "Cron expression must contain exactly 5 space-separated fields (minute, hour, day of month, month, day of week).",
    };
  }

  if (!validateCronField(parts.minute, 0, 59)) {
    return { valid: false, error: `Invalid minute field '${parts.minute}' (must be 0–59).` };
  }
  if (!validateCronField(parts.hour, 0, 23)) {
    return { valid: false, error: `Invalid hour field '${parts.hour}' (must be 0–23).` };
  }
  if (!validateCronField(parts.dayOfMonth, 1, 31)) {
    return { valid: false, error: `Invalid day of month field '${parts.dayOfMonth}' (must be 1–31).` };
  }
  if (!validateCronField(parts.month, 1, 12)) {
    return { valid: false, error: `Invalid month field '${parts.month}' (must be 1–12).` };
  }
  if (!validateCronField(parts.dayOfWeek, 0, 7)) {
    return { valid: false, error: `Invalid day of week field '${parts.dayOfWeek}' (must be 0–7, where 0 and 7 are Sunday).` };
  }

  return { valid: true, parts };
}

export function explainCron(cronString: string): string {
  const validation = validateCronExpression(cronString);
  if (!validation.valid || !validation.parts) {
    return validation.error || "Invalid cron expression.";
  }

  const { minute, hour, dayOfMonth, month, dayOfWeek } = validation.parts;
  const segments: string[] = [];

  // Minute
  if (minute === "*") {
    segments.push("Every minute");
  } else if (minute.startsWith("*/")) {
    segments.push(`Every ${minute.slice(2)} minutes`);
  } else {
    segments.push(`At minute ${minute}`);
  }

  // Hour
  if (hour === "*") {
    // of every hour
    if (minute !== "*") segments.push("of every hour");
  } else if (hour.startsWith("*/")) {
    segments.push(`every ${hour.slice(2)} hours`);
  } else {
    segments.push(`past hour ${hour}:00`);
  }

  // Day of Month
  if (dayOfMonth !== "*") {
    segments.push(`on day ${dayOfMonth} of the month`);
  }

  // Month
  if (month !== "*") {
    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    segments.push(`in ${monthNames[parseInt(month, 10)] || `month ${month}`}`);
  }

  // Day of Week
  if (dayOfWeek === "*") {
    // all days
  } else if (dayOfWeek === "1-5") {
    segments.push("on weekdays (Mon through Fri)");
  } else if (dayOfWeek === "0,6" || dayOfWeek === "6,0") {
    segments.push("on weekends (Sat & Sun)");
  } else {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    segments.push(`on ${dayNames[parseInt(dayOfWeek, 10)] || `day ${dayOfWeek}`}`);
  }

  return segments.join(" ") + ".";
}

function matchesField(val: number, field: string): boolean {
  if (field === "*") return true;
  if (field.startsWith("*/")) {
    const step = parseInt(field.slice(2), 10);
    return step > 0 && val % step === 0;
  }
  if (field.includes(",")) {
    return field.split(",").some((f) => matchesField(val, f.trim()));
  }
  if (field.includes("-")) {
    const [start, end] = field.split("-").map((n) => parseInt(n, 10));
    return val >= start && val <= end;
  }
  return parseInt(field, 10) === val;
}

export function calculateNextRuns(cronString: string, count: number = 5, fromDate: Date = new Date()): Date[] {
  const validation = validateCronExpression(cronString);
  if (!validation.valid || !validation.parts) return [];

  const { minute, hour, dayOfMonth, month, dayOfWeek } = validation.parts;
  const results: Date[] = [];

  // Start at next whole minute
  let cur = new Date(fromDate.getTime() + 60000);
  cur.setSeconds(0);
  cur.setMilliseconds(0);

  let iterations = 0;
  const maxIterations = 200000; // safe bounded forward search

  while (results.length < count && iterations < maxIterations) {
    iterations++;

    const m = cur.getMinutes();
    const h = cur.getHours();
    const dom = cur.getDate();
    const mon = cur.getMonth() + 1;
    let dow = cur.getDay(); // 0 is Sunday

    const matchM = matchesField(m, minute);
    const matchH = matchesField(h, hour);
    const matchDom = matchesField(dom, dayOfMonth);
    const matchMon = matchesField(mon, month);
    const matchDow = matchesField(dow, dayOfWeek) || (dow === 0 && matchesField(7, dayOfWeek));

    if (matchM && matchH && matchDom && matchMon && matchDow) {
      results.push(new Date(cur.getTime()));
    }

    cur = new Date(cur.getTime() + 60000);
  }

  return results;
}
