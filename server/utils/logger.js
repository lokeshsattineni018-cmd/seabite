/**
 * Structured Logger for SeaBite (Senior Level Production Readiness)
 * Standardizes log format: [TIMESTAMP] [LEVEL] MESSAGE | CONTEXT
 */

const LOG_LEVELS = {
    INFO: "📘 INFO",
    WARN: "⚠️ WARN",
    ERROR: "❌ ERROR",
    AUDIT: "🔐 AUDIT",
    SECURITY: "🛡️ SECURITY"
};

const formatMessage = (level, message, context = {}) => {
    const timestamp = new Date().toISOString();
    const traceId = context.traceId || (context.req ? context.req.traceId : null);
    const traceStr = traceId ? ` [Trace: ${traceId}]` : "";
    const contextStr = Object.keys(context).length ? ` | Context: ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level}]${traceStr} ${message}${contextStr}`;
};

const logger = {
    info: (msg, ctx) => console.log(formatMessage(LOG_LEVELS.INFO, msg, ctx)),
    warn: (msg, ctx) => console.warn(formatMessage(LOG_LEVELS.WARN, msg, ctx)),
    error: (msg, ctx) => console.error(formatMessage(LOG_LEVELS.ERROR, msg, ctx)),
    audit: (msg, ctx) => console.log(formatMessage(LOG_LEVELS.AUDIT, msg, ctx)),
    security: (msg, ctx) => console.warn(formatMessage(LOG_LEVELS.SECURITY, msg, ctx))
};

export default logger;
