type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogPayload = Record<string, unknown>;

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL: LogLevel = __DEV__ ? 'debug' : 'warn';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[MIN_LEVEL];
}

const consoleFns: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: (...args) => console.debug(...args),
  info:  (...args) => console.info(...args),
  warn:  (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

function emit(level: LogLevel, event: string, payload?: LogPayload): void {
  if (!shouldLog(level)) return;
  const fn = consoleFns[level];
  const tag = `[${event}]`;
  if (payload !== undefined) {
    fn(tag, payload);
  } else {
    fn(tag);
  }
}

export const logger = {
  debug: (event: string, payload?: LogPayload) => emit('debug', event, payload),
  info:  (event: string, payload?: LogPayload) => emit('info',  event, payload),
  warn:  (event: string, payload?: LogPayload) => emit('warn',  event, payload),
  error: (event: string, payload?: LogPayload) => emit('error', event, payload),
};

/** 에러 객체에서 status/errorCode/message 수준만 추출한다. 응답 전문은 포함하지 않는다. */
export function toLogError(error: unknown): LogPayload {
  if (error instanceof Error) {
    const result: LogPayload = { message: error.message };
    const e = error as { statusCode?: unknown; error?: { code?: unknown } };
    if (typeof e.statusCode === 'number') result.status = e.statusCode;
    if (e.error?.code !== undefined) result.errorCode = String(e.error.code);
    return result;
  }
  return { error: String(error) };
}
