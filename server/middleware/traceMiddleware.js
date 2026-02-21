import { v4 as uuidv4 } from "uuid";

/**
 * Trace Middleware (Ultimate Level Hardening)
 * Assigns a unique X-Request-ID to every incoming request for distributed-style tracing.
 */
const traceMiddleware = (req, res, next) => {
    const traceId = req.headers["x-request-id"] || uuidv4();
    req.traceId = traceId;
    res.setHeader("X-Request-ID", traceId);
    next();
};

export default traceMiddleware;
