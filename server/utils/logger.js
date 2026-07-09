/**
 * Structured Logger for SeaBite (Senior Level Production Readiness)
 * Standardizes log format: [TIMESTAMP] [LEVEL] MESSAGE | CONTEXT
 */

const LOG_LEVELS = {
    DEBUG: "⚙️ DEBUG",
    INFO: "📘 INFO",
    WARN: "⚠️ WARN",
    ERROR: "❌ ERROR",
    AUDIT: "🔐 AUDIT",
    SECURITY: "🛡️ SECURITY"
};

const LOG_LEVEL_SEVERITY = {
    debug: 0,
    info: 1,
    audit: 1,
    warn: 2,
    security: 2,
    error: 3
};

const CURRENT_LOG_LEVEL = (process.env.LOG_LEVEL || "info").toLowerCase();

const shouldLog = (level) => {
    const messageSeverity = LOG_LEVEL_SEVERITY[level] !== undefined ? LOG_LEVEL_SEVERITY[level] : 1;
    const configuredSeverity = LOG_LEVEL_SEVERITY[CURRENT_LOG_LEVEL] !== undefined ? LOG_LEVEL_SEVERITY[CURRENT_LOG_LEVEL] : 1;
    return messageSeverity >= configuredSeverity;
};

const formatMessage = (level, message, context = {}) => {
    const timestamp = new Date().toISOString();
    const traceId = context.traceId || (context.req ? context.req.traceId : null);
    const traceStr = traceId ? ` [Trace: ${traceId}]` : "";
    const contextStr = Object.keys(context).length ? ` | Context: ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level}]${traceStr} ${message}${contextStr}`;
};

const logger = {
    debug: (msg, ctx) => {
        if (shouldLog("debug")) console.debug(formatMessage(LOG_LEVELS.DEBUG, msg, ctx));
    },
    info: (msg, ctx) => {
        if (shouldLog("info")) console.log(formatMessage(LOG_LEVELS.INFO, msg, ctx));
    },
    warn: (msg, ctx) => {
        if (shouldLog("warn")) console.warn(formatMessage(LOG_LEVELS.WARN, msg, ctx));
    },
    error: (msg, ctx) => {
        if (shouldLog("error")) console.error(formatMessage(LOG_LEVELS.ERROR, msg, ctx));
    },
    audit: (msg, ctx) => {
        if (shouldLog("audit")) console.log(formatMessage(LOG_LEVELS.AUDIT, msg, ctx));
    },
    security: (msg, ctx) => {
        if (shouldLog("security")) console.warn(formatMessage(LOG_LEVELS.SECURITY, msg, ctx));
    }
};

export default logger;
