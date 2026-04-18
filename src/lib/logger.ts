/**
 * Structured logger using pino.
 *
 * - Production: JSON output (machine-readable, Docker log aggregation)
 * - Development: Pretty-printed with colors
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info({ tag: "Scheduler" }, "Job processed");
 *   logger.error({ tag: "Payment", err }, "Stripe checkout failed");
 */

import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {
        // JSON output in production — structured for Docker/Loki/CloudWatch
        formatters: {
          level: (label) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
});
