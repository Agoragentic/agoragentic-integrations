import { z } from "zod";
export const messageEventBusDestinationTypeNames = [
    "$$AbstractMessageEventBusDestination" /* MessageEventBusDestinationTypeNames.abstract */,
    "$$MessageEventBusDestinationWebhook" /* MessageEventBusDestinationTypeNames.webhook */,
    "$$MessageEventBusDestinationSentry" /* MessageEventBusDestinationTypeNames.sentry */,
    "$$MessageEventBusDestinationSyslog" /* MessageEventBusDestinationTypeNames.syslog */,
];
// ===============================
// Event Destination Zod Schemas
// ===============================
// Circuit Breaker Options Schema
const circuitBreakerSchema = z
    .object({
    maxFailures: z.number().int().positive().optional(),
    maxDuration: z.number().int().positive().optional(),
    halfOpenRequests: z.number().int().positive().optional(),
    failureWindow: z.number().int().positive().optional(),
    maxConcurrentHalfOpenRequests: z.number().int().positive().optional(),
})
    .optional();
// Webhook Parameter Item Schema
const webhookParameterItemSchema = z.object({
    parameters: z.array(z.object({
        name: z.string(),
        value: z.union([z.string(), z.number(), z.boolean(), z.null()]).nullable(),
    })),
});
// Webhook Parameter Options Schema
const webhookParameterOptionsSchema = z
    .object({
    batch: z
        .object({
        batchSize: z.number().int().positive().optional(),
        batchInterval: z.number().int().positive().optional(),
    })
        .optional(),
    allowUnauthorizedCerts: z.boolean().optional(),
    queryParameterArrays: z.enum(['indices', 'brackets', 'repeat']).optional(),
    redirect: z
        .object({
        redirect: z.object({
            followRedirects: z.boolean().optional(),
            maxRedirects: z.number().int().positive().optional(),
        }),
    })
        .optional(),
    response: z
        .object({
        response: z
            .object({
            fullResponse: z.boolean().optional(),
            neverError: z.boolean().optional(),
            responseFormat: z.string().optional(),
            outputPropertyName: z.string().optional(),
        })
            .optional(),
    })
        .optional(),
    proxy: z
        .object({
        proxy: z.object({
            protocol: z.enum(['https', 'http']),
            host: z.string(),
            port: z.number().int().positive(),
        }),
    })
        .optional(),
    timeout: z.number().int().positive().optional(),
    socket: z
        .object({
        keepAlive: z.boolean().optional(),
        maxSockets: z.number().int().positive().optional(),
        maxFreeSockets: z.number().int().positive().optional(),
    })
        .optional(),
})
    .optional();
// Base Destination Options Schema
export const MessageEventBusDestinationOptionsSchema = z.object({
    __type: z
        .enum([
        '$$AbstractMessageEventBusDestination',
        '$$MessageEventBusDestinationWebhook',
        '$$MessageEventBusDestinationSentry',
        '$$MessageEventBusDestinationSyslog',
    ])
        .optional(),
    id: z.string().min(1).optional(),
    label: z.string().min(1).optional(),
    enabled: z.boolean().optional(),
    subscribedEvents: z.array(z.string()).optional(),
    credentials: z.record(z.string(), z.unknown()).optional(),
    anonymizeAuditMessages: z.boolean().optional(),
    circuitBreaker: circuitBreakerSchema,
});
// Webhook Destination Schema
export const MessageEventBusDestinationWebhookOptionsSchema = MessageEventBusDestinationOptionsSchema.extend({
    __type: z.literal('$$MessageEventBusDestinationWebhook'),
    url: z.string().url(),
    responseCodeMustMatch: z.boolean().optional(),
    expectedStatusCode: z.number().int().optional(),
    method: z.string().optional(),
    authentication: z
        .enum(['predefinedCredentialType', 'genericCredentialType', 'none'])
        .optional(),
    sendQuery: z.boolean().optional(),
    sendHeaders: z.boolean().optional(),
    genericAuthType: z.string().optional(),
    nodeCredentialType: z.string().optional(),
    specifyHeaders: z.string().optional(),
    specifyQuery: z.string().optional(),
    jsonQuery: z.string().optional(),
    jsonHeaders: z.string().optional(),
    headerParameters: webhookParameterItemSchema.optional(),
    queryParameters: webhookParameterItemSchema.optional(),
    sendPayload: z.boolean().optional(),
    options: webhookParameterOptionsSchema,
});
// Sentry Destination Schema
export const MessageEventBusDestinationSentryOptionsSchema = MessageEventBusDestinationOptionsSchema.extend({
    __type: z.literal('$$MessageEventBusDestinationSentry'),
    dsn: z.string().url(),
    tracesSampleRate: z.number().min(0).max(1).optional(),
    sendPayload: z.boolean().optional(),
});
// Syslog Destination Schema
export const MessageEventBusDestinationSyslogOptionsSchema = MessageEventBusDestinationOptionsSchema.extend({
    __type: z.literal('$$MessageEventBusDestinationSyslog'),
    expectedStatusCode: z.number().int().optional(),
    host: z.string().min(1),
    port: z.number().int().positive().optional(),
    protocol: z.enum(['udp', 'tcp', 'tls']).optional(),
    facility: z.number().int().min(0).max(23).optional(),
    app_name: z.string().optional(),
    eol: z.string().optional(),
    tlsCa: z.string().optional(),
});
// ==================================
// Event Destination Default Settings
// ==================================
export const defaultMessageEventBusDestinationOptions = {
    __type: "$$AbstractMessageEventBusDestination" /* MessageEventBusDestinationTypeNames.abstract */,
    id: '',
    label: 'New Event Destination',
    enabled: true,
    subscribedEvents: ['n8n.audit', 'n8n.workflow'],
    credentials: {},
    anonymizeAuditMessages: false,
};
export const defaultMessageEventBusDestinationSyslogOptions = {
    ...defaultMessageEventBusDestinationOptions,
    __type: "$$MessageEventBusDestinationSyslog" /* MessageEventBusDestinationTypeNames.syslog */,
    label: 'Syslog Server',
    expectedStatusCode: 200,
    host: '127.0.0.1',
    port: 514,
    protocol: 'tcp',
    facility: 16,
    app_name: 'n8n',
    eol: '\n',
};
export const defaultMessageEventBusDestinationWebhookOptions = {
    ...defaultMessageEventBusDestinationOptions,
    __type: "$$MessageEventBusDestinationWebhook" /* MessageEventBusDestinationTypeNames.webhook */,
    credentials: {},
    label: 'Webhook Endpoint',
    expectedStatusCode: 200,
    responseCodeMustMatch: false,
    url: 'https://',
    method: 'POST',
    authentication: 'none',
    sendQuery: false,
    sendHeaders: false,
    genericAuthType: '',
    nodeCredentialType: '',
    specifyHeaders: '',
    specifyQuery: '',
    jsonQuery: '',
    jsonHeaders: '',
    headerParameters: { parameters: [] },
    queryParameters: { parameters: [] },
    sendPayload: true,
    options: {},
};
export const defaultMessageEventBusDestinationSentryOptions = {
    ...defaultMessageEventBusDestinationOptions,
    __type: "$$MessageEventBusDestinationSentry" /* MessageEventBusDestinationTypeNames.sentry */,
    label: 'Sentry DSN',
    dsn: 'https://',
    sendPayload: true,
};
//# sourceMappingURL=message-event-bus.js.map