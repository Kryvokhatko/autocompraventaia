/**
 * Structured logging for the automation framework.
 *
 * Six-level scheme, not ad hoc levels:
 *   Fatal (aborts execution) > Error (fails the test case) > Warn (unexpected,
 *   non-breaking) > Info (basic execution info) > Debug (failure-investigation
 *   detail) > Trace (finer than Debug).
 *
 * SUT-independent and reusable across any project, imported by fixtures and
 * Page Objects, never by specs directly (specs express intent through Page
 * Objects, not through logging).
 */

export enum LogLevel {
  Fatal = 0,
  Error = 1,
  Warn = 2,
  Info = 3,
  Debug = 4,
  Trace = 5,
}

const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.Fatal]: "FATAL",
  [LogLevel.Error]: "ERROR",
  [LogLevel.Warn]: "WARN",
  [LogLevel.Info]: "INFO",
  [LogLevel.Debug]: "DEBUG",
  [LogLevel.Trace]: "TRACE",
};

function resolveConfiguredLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? "Info").trim().toLowerCase();
  const match = Object.entries(LEVEL_NAMES).find(
    ([, name]) => name.toLowerCase() === raw
  );
  return match ? (Number(match[0]) as LogLevel) : LogLevel.Info;
}

export class Logger {
  private readonly scope: string;
  private readonly threshold: LogLevel;

  constructor(scope: string, threshold: LogLevel = resolveConfiguredLevel()) {
    this.scope = scope;
    this.threshold = threshold;
  }

  child(subScope: string): Logger {
    return new Logger(`${this.scope}:${subScope}`, this.threshold);
  }

  fatal(message: string, meta?: Record<string, unknown>) {
    this.write(LogLevel.Fatal, message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.write(LogLevel.Error, message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.write(LogLevel.Warn, message, meta);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.write(LogLevel.Info, message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.write(LogLevel.Debug, message, meta);
  }

  trace(message: string, meta?: Record<string, unknown>) {
    this.write(LogLevel.Trace, message, meta);
  }

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    if (level > this.threshold) return;

    const line = `[${LEVEL_NAMES[level]}] [${this.scope}] ${message}`;
    const payload = meta ? `${line} ${JSON.stringify(meta)}` : line;

    // Fatal/Error go to stderr so they surface in CI failure logs distinctly.
    if (level <= LogLevel.Error) {
      // eslint-disable-next-line no-console
      console.error(payload);
    } else {
      // eslint-disable-next-line no-console
      console.log(payload);
    }
  }
}

export function createLogger(scope: string): Logger {
  return new Logger(scope);
}
