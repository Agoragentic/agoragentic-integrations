import type { DateTime } from "luxon";
import { z } from "zod";
import type { INodeCredentials } from "./interfaces.js";
export declare const enum EventMessageTypeNames {
    generic = "$$EventMessage",
    audit = "$$EventMessageAudit",
    confirm = "$$EventMessageConfirm",
    workflow = "$$EventMessageWorkflow",
    node = "$$EventMessageNode",
    execution = "$$EventMessageExecution",
    aiNode = "$$EventMessageAiNode",
    runner = "$$EventMessageRunner",
    queue = "$$EventMessageQueue"
}
export declare const enum MessageEventBusDestinationTypeNames {
    abstract = "$$AbstractMessageEventBusDestination",
    webhook = "$$MessageEventBusDestinationWebhook",
    sentry = "$$MessageEventBusDestinationSentry",
    syslog = "$$MessageEventBusDestinationSyslog"
}
export declare const messageEventBusDestinationTypeNames: MessageEventBusDestinationTypeNames[];
export interface IAbstractEventMessage {
    __type: EventMessageTypeNames;
    id: string;
    ts: DateTime;
    eventName: string;
    message: string;
    payload: any;
}
declare const webhookParameterItemSchema: z.ZodObject<{
    parameters: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodNullable<z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
declare const webhookParameterOptionsSchema: z.ZodOptional<z.ZodObject<{
    batch: z.ZodOptional<z.ZodObject<{
        batchSize: z.ZodOptional<z.ZodNumber>;
        batchInterval: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    allowUnauthorizedCerts: z.ZodOptional<z.ZodBoolean>;
    queryParameterArrays: z.ZodOptional<z.ZodEnum<{
        repeat: "repeat";
        indices: "indices";
        brackets: "brackets";
    }>>;
    redirect: z.ZodOptional<z.ZodObject<{
        redirect: z.ZodObject<{
            followRedirects: z.ZodOptional<z.ZodBoolean>;
            maxRedirects: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
    }, z.core.$strip>>;
    response: z.ZodOptional<z.ZodObject<{
        response: z.ZodOptional<z.ZodObject<{
            fullResponse: z.ZodOptional<z.ZodBoolean>;
            neverError: z.ZodOptional<z.ZodBoolean>;
            responseFormat: z.ZodOptional<z.ZodString>;
            outputPropertyName: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    proxy: z.ZodOptional<z.ZodObject<{
        proxy: z.ZodObject<{
            protocol: z.ZodEnum<{
                http: "http";
                https: "https";
            }>;
            host: z.ZodString;
            port: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>>;
    timeout: z.ZodOptional<z.ZodNumber>;
    socket: z.ZodOptional<z.ZodObject<{
        keepAlive: z.ZodOptional<z.ZodBoolean>;
        maxSockets: z.ZodOptional<z.ZodNumber>;
        maxFreeSockets: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>>;
export declare const MessageEventBusDestinationOptionsSchema: z.ZodObject<{
    __type: z.ZodOptional<z.ZodEnum<{
        $$AbstractMessageEventBusDestination: "$$AbstractMessageEventBusDestination";
        $$MessageEventBusDestinationWebhook: "$$MessageEventBusDestinationWebhook";
        $$MessageEventBusDestinationSentry: "$$MessageEventBusDestinationSentry";
        $$MessageEventBusDestinationSyslog: "$$MessageEventBusDestinationSyslog";
    }>>;
    id: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    subscribedEvents: z.ZodOptional<z.ZodArray<z.ZodString>>;
    credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    anonymizeAuditMessages: z.ZodOptional<z.ZodBoolean>;
    circuitBreaker: z.ZodOptional<z.ZodObject<{
        maxFailures: z.ZodOptional<z.ZodNumber>;
        maxDuration: z.ZodOptional<z.ZodNumber>;
        halfOpenRequests: z.ZodOptional<z.ZodNumber>;
        failureWindow: z.ZodOptional<z.ZodNumber>;
        maxConcurrentHalfOpenRequests: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const MessageEventBusDestinationWebhookOptionsSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    subscribedEvents: z.ZodOptional<z.ZodArray<z.ZodString>>;
    credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    anonymizeAuditMessages: z.ZodOptional<z.ZodBoolean>;
    circuitBreaker: z.ZodOptional<z.ZodObject<{
        maxFailures: z.ZodOptional<z.ZodNumber>;
        maxDuration: z.ZodOptional<z.ZodNumber>;
        halfOpenRequests: z.ZodOptional<z.ZodNumber>;
        failureWindow: z.ZodOptional<z.ZodNumber>;
        maxConcurrentHalfOpenRequests: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    __type: z.ZodLiteral<"$$MessageEventBusDestinationWebhook">;
    url: z.ZodString;
    responseCodeMustMatch: z.ZodOptional<z.ZodBoolean>;
    expectedStatusCode: z.ZodOptional<z.ZodNumber>;
    method: z.ZodOptional<z.ZodString>;
    authentication: z.ZodOptional<z.ZodEnum<{
        none: "none";
        predefinedCredentialType: "predefinedCredentialType";
        genericCredentialType: "genericCredentialType";
    }>>;
    sendQuery: z.ZodOptional<z.ZodBoolean>;
    sendHeaders: z.ZodOptional<z.ZodBoolean>;
    genericAuthType: z.ZodOptional<z.ZodString>;
    nodeCredentialType: z.ZodOptional<z.ZodString>;
    specifyHeaders: z.ZodOptional<z.ZodString>;
    specifyQuery: z.ZodOptional<z.ZodString>;
    jsonQuery: z.ZodOptional<z.ZodString>;
    jsonHeaders: z.ZodOptional<z.ZodString>;
    headerParameters: z.ZodOptional<z.ZodObject<{
        parameters: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            value: z.ZodNullable<z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    queryParameters: z.ZodOptional<z.ZodObject<{
        parameters: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            value: z.ZodNullable<z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    sendPayload: z.ZodOptional<z.ZodBoolean>;
    options: z.ZodOptional<z.ZodObject<{
        batch: z.ZodOptional<z.ZodObject<{
            batchSize: z.ZodOptional<z.ZodNumber>;
            batchInterval: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        allowUnauthorizedCerts: z.ZodOptional<z.ZodBoolean>;
        queryParameterArrays: z.ZodOptional<z.ZodEnum<{
            repeat: "repeat";
            indices: "indices";
            brackets: "brackets";
        }>>;
        redirect: z.ZodOptional<z.ZodObject<{
            redirect: z.ZodObject<{
                followRedirects: z.ZodOptional<z.ZodBoolean>;
                maxRedirects: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>;
        }, z.core.$strip>>;
        response: z.ZodOptional<z.ZodObject<{
            response: z.ZodOptional<z.ZodObject<{
                fullResponse: z.ZodOptional<z.ZodBoolean>;
                neverError: z.ZodOptional<z.ZodBoolean>;
                responseFormat: z.ZodOptional<z.ZodString>;
                outputPropertyName: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
        proxy: z.ZodOptional<z.ZodObject<{
            proxy: z.ZodObject<{
                protocol: z.ZodEnum<{
                    http: "http";
                    https: "https";
                }>;
                host: z.ZodString;
                port: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>>;
        timeout: z.ZodOptional<z.ZodNumber>;
        socket: z.ZodOptional<z.ZodObject<{
            keepAlive: z.ZodOptional<z.ZodBoolean>;
            maxSockets: z.ZodOptional<z.ZodNumber>;
            maxFreeSockets: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const MessageEventBusDestinationSentryOptionsSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    subscribedEvents: z.ZodOptional<z.ZodArray<z.ZodString>>;
    credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    anonymizeAuditMessages: z.ZodOptional<z.ZodBoolean>;
    circuitBreaker: z.ZodOptional<z.ZodObject<{
        maxFailures: z.ZodOptional<z.ZodNumber>;
        maxDuration: z.ZodOptional<z.ZodNumber>;
        halfOpenRequests: z.ZodOptional<z.ZodNumber>;
        failureWindow: z.ZodOptional<z.ZodNumber>;
        maxConcurrentHalfOpenRequests: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    __type: z.ZodLiteral<"$$MessageEventBusDestinationSentry">;
    dsn: z.ZodString;
    tracesSampleRate: z.ZodOptional<z.ZodNumber>;
    sendPayload: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const MessageEventBusDestinationSyslogOptionsSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    subscribedEvents: z.ZodOptional<z.ZodArray<z.ZodString>>;
    credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    anonymizeAuditMessages: z.ZodOptional<z.ZodBoolean>;
    circuitBreaker: z.ZodOptional<z.ZodObject<{
        maxFailures: z.ZodOptional<z.ZodNumber>;
        maxDuration: z.ZodOptional<z.ZodNumber>;
        halfOpenRequests: z.ZodOptional<z.ZodNumber>;
        failureWindow: z.ZodOptional<z.ZodNumber>;
        maxConcurrentHalfOpenRequests: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    __type: z.ZodLiteral<"$$MessageEventBusDestinationSyslog">;
    expectedStatusCode: z.ZodOptional<z.ZodNumber>;
    host: z.ZodString;
    port: z.ZodOptional<z.ZodNumber>;
    protocol: z.ZodOptional<z.ZodEnum<{
        tcp: "tcp";
        udp: "udp";
        tls: "tls";
    }>>;
    facility: z.ZodOptional<z.ZodNumber>;
    app_name: z.ZodOptional<z.ZodString>;
    eol: z.ZodOptional<z.ZodString>;
    tlsCa: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type MessageEventBusDestinationOptions = Omit<z.infer<typeof MessageEventBusDestinationOptionsSchema>, '__type' | 'credentials'> & {
    __type?: MessageEventBusDestinationTypeNames;
    credentials?: INodeCredentials;
};
export type MessageEventBusDestinationWebhookParameterItem = z.infer<typeof webhookParameterItemSchema>;
export type MessageEventBusDestinationWebhookParameterOptions = z.infer<typeof webhookParameterOptionsSchema>;
export type MessageEventBusDestinationWebhookOptions = Omit<z.infer<typeof MessageEventBusDestinationWebhookOptionsSchema>, '__type' | 'credentials'> & {
    __type?: MessageEventBusDestinationTypeNames;
    credentials?: INodeCredentials;
};
export type MessageEventBusDestinationSyslogOptions = Omit<z.infer<typeof MessageEventBusDestinationSyslogOptionsSchema>, '__type' | 'credentials'> & {
    __type?: MessageEventBusDestinationTypeNames;
    credentials?: INodeCredentials;
};
export type MessageEventBusDestinationSentryOptions = Omit<z.infer<typeof MessageEventBusDestinationSentryOptionsSchema>, '__type' | 'credentials'> & {
    __type?: MessageEventBusDestinationTypeNames;
    credentials?: INodeCredentials;
};
export declare const defaultMessageEventBusDestinationOptions: MessageEventBusDestinationOptions;
export declare const defaultMessageEventBusDestinationSyslogOptions: MessageEventBusDestinationSyslogOptions;
export declare const defaultMessageEventBusDestinationWebhookOptions: MessageEventBusDestinationWebhookOptions;
export declare const defaultMessageEventBusDestinationSentryOptions: MessageEventBusDestinationSentryOptions;
export {};
//# sourceMappingURL=message-event-bus.d.ts.map