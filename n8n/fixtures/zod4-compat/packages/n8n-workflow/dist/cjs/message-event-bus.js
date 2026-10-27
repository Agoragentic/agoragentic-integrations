"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultMessageEventBusDestinationSentryOptions = exports.defaultMessageEventBusDestinationWebhookOptions = exports.defaultMessageEventBusDestinationSyslogOptions = exports.defaultMessageEventBusDestinationOptions = exports.MessageEventBusDestinationSyslogOptionsSchema = exports.MessageEventBusDestinationSentryOptionsSchema = exports.MessageEventBusDestinationWebhookOptionsSchema = exports.MessageEventBusDestinationOptionsSchema = exports.messageEventBusDestinationTypeNames = void 0;
const zod_1 = require("zod");
exports.messageEventBusDestinationTypeNames = [
    "$$AbstractMessageEventBusDestination" /* MessageEventBusDestinationTypeNames.abstract */,
    "$$MessageEventBusDestinationWebhook" /* MessageEventBusDestinationTypeNames.webhook */,
    "$$MessageEventBusDestinationSentry" /* MessageEventBusDestinationTypeNames.sentry */,
    "$$MessageEventBusDestinationSyslog" /* MessageEventBusDestinationTypeNames.syslog */,
];
// ===============================
// Event Destination Zod Schemas
// ===============================
// Circuit Breaker Options Schema
const circuitBreakerSchema = zod_1.z
    .object({
    maxFailures: zod_1.z.number().int().positive().optional(),
    maxDuration: zod_1.z.number().int().positive().optional(),
    halfOpenRequests: zod_1.z.number().int().positive().optional(),
    failureWindow: zod_1.z.number().int().positive().optional(),
    maxConcurrentHalfOpenRequests: zod_1.z.number().int().positive().optional(),
})
    .optional();
// Webhook Parameter Item Schema
const webhookParameterItemSchema = zod_1.z.object({
    parameters: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        value: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean(), zod_1.z.null()]).nullable(),
    })),
});
// Webhook Parameter Options Schema
const webhookParameterOptionsSchema = zod_1.z
    .object({
    batch: zod_1.z
        .object({
        batchSize: zod_1.z.number().int().positive().optional(),
        batchInterval: zod_1.z.number().int().positive().optional(),
    })
        .optional(),
    allowUnauthorizedCerts: zod_1.z.boolean().optional(),
    queryParameterArrays: zod_1.z.enum(['indices', 'brackets', 'repeat']).optional(),
    redirect: zod_1.z
        .object({
        redirect: zod_1.z.object({
            followRedirects: zod_1.z.boolean().optional(),
            maxRedirects: zod_1.z.number().int().positive().optional(),
        }),
    })
        .optional(),
    response: zod_1.z
        .object({
        response: zod_1.z
            .object({
            fullResponse: zod_1.z.boolean().optional(),
            neverError: zod_1.z.boolean().optional(),
            responseFormat: zod_1.z.string().optional(),
            outputPropertyName: zod_1.z.string().optional(),
        })
            .optional(),
    })
        .optional(),
    proxy: zod_1.z
        .object({
        proxy: zod_1.z.object({
            protocol: zod_1.z.enum(['https', 'http']),
            host: zod_1.z.string(),
            port: zod_1.z.number().int().positive(),
        }),
    })
        .optional(),
    timeout: zod_1.z.number().int().positive().optional(),
    socket: zod_1.z
        .object({
        keepAlive: zod_1.z.boolean().optional(),
        maxSockets: zod_1.z.number().int().positive().optional(),
        maxFreeSockets: zod_1.z.number().int().positive().optional(),
    })
        .optional(),
})
    .optional();
// Base Destination Options Schema
exports.MessageEventBusDestinationOptionsSchema = zod_1.z.object({
    __type: zod_1.z
        .enum([
        '$$AbstractMessageEventBusDestination',
        '$$MessageEventBusDestinationWebhook',
        '$$MessageEventBusDestinationSentry',
        '$$MessageEventBusDestinationSyslog',
    ])
        .optional(),
    id: zod_1.z.string().min(1).optional(),
    label: zod_1.z.string().min(1).optional(),
    enabled: zod_1.z.boolean().optional(),
    subscribedEvents: zod_1.z.array(zod_1.z.string()).optional(),
    credentials: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    anonymizeAuditMessages: zod_1.z.boolean().optional(),
    circuitBreaker: circuitBreakerSchema,
});
// Webhook Destination Schema
exports.MessageEventBusDestinationWebhookOptionsSchema = exports.MessageEventBusDestinationOptionsSchema.extend({
    __type: zod_1.z.literal('$$MessageEventBusDestinationWebhook'),
    url: zod_1.z.string().url(),
    responseCodeMustMatch: zod_1.z.boolean().optional(),
    expectedStatusCode: zod_1.z.number().int().optional(),
    method: zod_1.z.string().optional(),
    authentication: zod_1.z
        .enum(['predefinedCredentialType', 'genericCredentialType', 'none'])
        .optional(),
    sendQuery: zod_1.z.boolean().optional(),
    sendHeaders: zod_1.z.boolean().optional(),
    genericAuthType: zod_1.z.string().optional(),
    nodeCredentialType: zod_1.z.string().optional(),
    specifyHeaders: zod_1.z.string().optional(),
    specifyQuery: zod_1.z.string().optional(),
    jsonQuery: zod_1.z.string().optional(),
    jsonHeaders: zod_1.z.string().optional(),
    headerParameters: webhookParameterItemSchema.optional(),
    queryParameters: webhookParameterItemSchema.optional(),
    sendPayload: zod_1.z.boolean().optional(),
    options: webhookParameterOptionsSchema,
});
// Sentry Destination Schema
exports.MessageEventBusDestinationSentryOptionsSchema = exports.MessageEventBusDestinationOptionsSchema.extend({
    __type: zod_1.z.literal('$$MessageEventBusDestinationSentry'),
    dsn: zod_1.z.string().url(),
    tracesSampleRate: zod_1.z.number().min(0).max(1).optional(),
    sendPayload: zod_1.z.boolean().optional(),
});
// Syslog Destination Schema
exports.MessageEventBusDestinationSyslogOptionsSchema = exports.MessageEventBusDestinationOptionsSchema.extend({
    __type: zod_1.z.literal('$$MessageEventBusDestinationSyslog'),
    expectedStatusCode: zod_1.z.number().int().optional(),
    host: zod_1.z.string().min(1),
    port: zod_1.z.number().int().positive().optional(),
    protocol: zod_1.z.enum(['udp', 'tcp', 'tls']).optional(),
    facility: zod_1.z.number().int().min(0).max(23).optional(),
    app_name: zod_1.z.string().optional(),
    eol: zod_1.z.string().optional(),
    tlsCa: zod_1.z.string().optional(),
});
// ==================================
// Event Destination Default Settings
// ==================================
exports.defaultMessageEventBusDestinationOptions = {
    __type: "$$AbstractMessageEventBusDestination" /* MessageEventBusDestinationTypeNames.abstract */,
    id: '',
    label: 'New Event Destination',
    enabled: true,
    subscribedEvents: ['n8n.audit', 'n8n.workflow'],
    credentials: {},
    anonymizeAuditMessages: false,
};
exports.defaultMessageEventBusDestinationSyslogOptions = {
    ...exports.defaultMessageEventBusDestinationOptions,
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
exports.defaultMessageEventBusDestinationWebhookOptions = {
    ...exports.defaultMessageEventBusDestinationOptions,
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
exports.defaultMessageEventBusDestinationSentryOptions = {
    ...exports.defaultMessageEventBusDestinationOptions,
    __type: "$$MessageEventBusDestinationSentry" /* MessageEventBusDestinationTypeNames.sentry */,
    label: 'Sentry DSN',
    dsn: 'https://',
    sendPayload: true,
};
//# sourceMappingURL=message-event-bus.js.map