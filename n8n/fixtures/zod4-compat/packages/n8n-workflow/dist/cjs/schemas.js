"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INodesSchema = exports.INodeSchema = exports.INodeCredentialsSchema = exports.INodeCredentialsDetailsSchema = exports.OnErrorSchema = exports.INodeParametersSchema = exports.NodeParameterValueTypeSchema = exports.IconOrEmojiSchema = exports.AssignmentCollectionValueSchema = exports.AssignmentValueSchema = exports.FilterValueSchema = exports.FilterTypeCombinatorSchema = exports.FilterConditionValueSchema = exports.FilterOperatorValueSchema = exports.FilterOperatorTypeSchema = exports.FilterOptionsValueSchema = exports.ResourceMapperValueSchema = exports.ResourceMapperFieldSchema = exports.INodePropertyOptionsSchema = exports.NodeConnectionTypeSchema = exports.IDisplayOptionsSchema = exports.DisplayConditionSchema = exports.NumberOrStringSchema = exports.INodePropertyRoutingSchema = exports.INodeRequestSendSchema = exports.HttpRequestOptionsSchema = exports.INodeRequestOutputSchema = exports.PostReceiveActionSchema = exports.IPostReceiveSortSchema = exports.IPostReceiveSetKeyValueSchema = exports.IPostReceiveSetSchema = exports.IPostReceiveRootPropertySchema = exports.IPostReceiveLimitSchema = exports.IPostReceiveFilterSchema = exports.IPostReceiveBinaryDataSchema = exports.IPostReceiveBaseSchema = exports.IN8nRequestOperationsSchema = exports.IN8nRequestOperationPaginationOffsetSchema = exports.IN8nRequestOperationPaginationGenericSchema = exports.IN8nRequestOperationPaginationBaseSchema = exports.IRequestOptionsSimplifiedAuthSchema = exports.IDataObjectSchema = exports.GenericValueSchema = exports.FieldTypeSchema = exports.INodeParameterResourceLocatorSchema = void 0;
const zod_1 = require("zod");
exports.INodeParameterResourceLocatorSchema = zod_1.z.object({
    __rl: zod_1.z.literal(true),
    mode: zod_1.z.string(),
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.null()]),
    cachedResultName: zod_1.z.string().optional(),
    cachedResultUrl: zod_1.z.string().optional(),
    __regex: zod_1.z.string().optional(),
});
const NodeParameterValueSchema = zod_1.z.union([
    zod_1.z.string(),
    zod_1.z.number(),
    zod_1.z.boolean(),
    zod_1.z.null(),
    zod_1.z.undefined(),
]);
const RequiredNodeParameterValueSchema = zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean(), zod_1.z.null()]);
exports.FieldTypeSchema = zod_1.z.enum([
    'boolean',
    'number',
    'string',
    'string-alphanumeric',
    'dateTime',
    'time',
    'array',
    'object',
    'options',
    'url',
    'jwt',
    'form-fields',
]);
// For `object` in GenericValue's type definition.
// We should probably look into not using `object` there,
// it's unclear whether functions are really expected.
const ObjectLikeSchema = zod_1.z.custom((v) => (typeof v === 'object' && v !== null) || typeof v === 'function', { message: 'Expected a non-primitive object' });
exports.GenericValueSchema = zod_1.z.union([
    zod_1.z.string(),
    zod_1.z.number(),
    zod_1.z.boolean(),
    zod_1.z.undefined(),
    zod_1.z.null(),
    ObjectLikeSchema,
]);
exports.IDataObjectSchema = zod_1.z.lazy(() => zod_1.z.record(zod_1.z.string(), zod_1.z.union([
    exports.GenericValueSchema,
    zod_1.z.array(exports.GenericValueSchema),
    exports.IDataObjectSchema,
    zod_1.z.array(exports.IDataObjectSchema),
])));
exports.IRequestOptionsSimplifiedAuthSchema = zod_1.z.object({
    auth: zod_1.z
        .object({
        username: zod_1.z.string(),
        password: zod_1.z.string(),
        sendImmediately: zod_1.z.boolean().optional(),
    })
        .optional(),
    body: zod_1.z.object({}).optional(),
    headers: exports.IDataObjectSchema.optional(),
    qs: exports.IDataObjectSchema.optional(),
    url: zod_1.z.string().optional(),
    skipSslCertificateValidation: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string()]).optional(),
});
exports.IN8nRequestOperationPaginationBaseSchema = zod_1.z.object({
    type: zod_1.z.string(),
    properties: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
});
exports.IN8nRequestOperationPaginationGenericSchema = exports.IN8nRequestOperationPaginationBaseSchema.extend({
    type: zod_1.z.literal('generic'),
    properties: zod_1.z.object({
        continue: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string()]),
        request: exports.IRequestOptionsSimplifiedAuthSchema,
    }),
});
exports.IN8nRequestOperationPaginationOffsetSchema = exports.IN8nRequestOperationPaginationBaseSchema.extend({
    type: zod_1.z.literal('offset'),
    properties: zod_1.z.object({
        limitParameter: zod_1.z.string(),
        offsetParameter: zod_1.z.string(),
        pageSize: zod_1.z.number(),
        rootProperty: zod_1.z.string().optional(),
        type: zod_1.z.enum(['body', 'query']),
    }),
});
exports.IN8nRequestOperationsSchema = zod_1.z.object({
    pagination: zod_1.z
        .union([
        exports.IN8nRequestOperationPaginationGenericSchema,
        exports.IN8nRequestOperationPaginationOffsetSchema,
        // TODO: Validating the function shape is skipped at runtime, any function is accepted
        zod_1.z.custom((v) => typeof v === 'function'),
    ])
        .optional(),
});
exports.IPostReceiveBaseSchema = zod_1.z.object({
    type: zod_1.z.string(),
    enabled: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string()]).optional(),
    properties: zod_1.z.record(zod_1.z.string(), zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean(), exports.IDataObjectSchema])),
    errorMessage: zod_1.z.string().optional(),
});
exports.IPostReceiveBinaryDataSchema = exports.IPostReceiveBaseSchema.extend({
    type: zod_1.z.literal('binaryData'),
    properties: zod_1.z.object({
        destinationProperty: zod_1.z.string(),
    }),
});
exports.IPostReceiveFilterSchema = exports.IPostReceiveBaseSchema.extend({
    type: zod_1.z.literal('filter'),
    properties: zod_1.z.object({
        pass: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string()]),
    }),
});
exports.IPostReceiveLimitSchema = exports.IPostReceiveBaseSchema.extend({
    type: zod_1.z.literal('limit'),
    properties: zod_1.z.object({
        maxResults: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]),
    }),
});
exports.IPostReceiveRootPropertySchema = exports.IPostReceiveBaseSchema.extend({
    type: zod_1.z.literal('rootProperty'),
    properties: zod_1.z.object({
        property: zod_1.z.string(),
    }),
});
exports.IPostReceiveSetSchema = exports.IPostReceiveBaseSchema.extend({
    type: zod_1.z.literal('set'),
    properties: zod_1.z.object({
        value: zod_1.z.string(),
    }),
});
exports.IPostReceiveSetKeyValueSchema = exports.IPostReceiveBaseSchema.extend({
    type: zod_1.z.literal('setKeyValue'),
    properties: zod_1.z.record(zod_1.z.string(), zod_1.z.union([zod_1.z.string(), zod_1.z.number()])),
});
exports.IPostReceiveSortSchema = exports.IPostReceiveBaseSchema.extend({
    type: zod_1.z.literal('sort'),
    properties: zod_1.z.object({
        key: zod_1.z.string(),
    }),
});
exports.PostReceiveActionSchema = zod_1.z.union([
    // TODO: Validating the function shape is skipped at runtime, any function is accepted
    zod_1.z.custom((v) => typeof v === 'function'),
    exports.IPostReceiveBinaryDataSchema,
    exports.IPostReceiveFilterSchema,
    exports.IPostReceiveLimitSchema,
    exports.IPostReceiveRootPropertySchema,
    exports.IPostReceiveSetSchema,
    exports.IPostReceiveSetKeyValueSchema,
    exports.IPostReceiveSortSchema,
]);
exports.INodeRequestOutputSchema = zod_1.z.object({
    maxResults: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]),
    postReceive: zod_1.z.array(exports.PostReceiveActionSchema),
});
exports.HttpRequestOptionsSchema = zod_1.z.object({}); // TODO
exports.INodeRequestSendSchema = zod_1.z.object({
    preSend: zod_1.z.array(zod_1.z.custom((v) => typeof v === 'function')),
    paginate: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string()]).optional(),
    property: zod_1.z.string().optional(),
    propertyInDotNotation: zod_1.z.boolean().optional(),
    type: zod_1.z.enum(['body', 'query']),
    value: zod_1.z.string().optional(),
});
exports.INodePropertyRoutingSchema = zod_1.z.object({
    operations: exports.IN8nRequestOperationsSchema.optional(),
    output: exports.INodeRequestOutputSchema.optional(),
    request: exports.HttpRequestOptionsSchema.optional(),
    send: exports.INodeRequestSendSchema.optional(),
});
exports.NumberOrStringSchema = zod_1.z.union([zod_1.z.number(), zod_1.z.string()]);
exports.DisplayConditionSchema = zod_1.z.union([
    zod_1.z.object({ _cnd: zod_1.z.object({ eq: RequiredNodeParameterValueSchema }) }),
    zod_1.z.object({ _cnd: zod_1.z.object({ not: RequiredNodeParameterValueSchema }) }),
    zod_1.z.object({ _cnd: zod_1.z.object({ gte: exports.NumberOrStringSchema }) }),
    zod_1.z.object({ _cnd: zod_1.z.object({ lte: exports.NumberOrStringSchema }) }),
    zod_1.z.object({ _cnd: zod_1.z.object({ gt: exports.NumberOrStringSchema }) }),
    zod_1.z.object({ _cnd: zod_1.z.object({ lt: exports.NumberOrStringSchema }) }),
    zod_1.z.object({
        _cnd: zod_1.z.object({
            between: zod_1.z.object({ from: exports.NumberOrStringSchema, to: exports.NumberOrStringSchema }),
        }),
    }),
    zod_1.z.object({ _cnd: zod_1.z.object({ startsWith: zod_1.z.string() }) }),
    zod_1.z.object({ _cnd: zod_1.z.object({ endsWith: zod_1.z.string() }) }),
    zod_1.z.object({ _cnd: zod_1.z.object({ includes: zod_1.z.string() }) }),
    zod_1.z.object({ _cnd: zod_1.z.object({ regex: zod_1.z.string() }) }),
    zod_1.z.object({ _cnd: zod_1.z.object({ exists: zod_1.z.literal(true) }) }),
]);
exports.IDisplayOptionsSchema = zod_1.z.object({
    show: zod_1.z
        .object({
        '@version': zod_1.z.array(zod_1.z.union([zod_1.z.number(), exports.DisplayConditionSchema])).optional(),
        '@feature': zod_1.z.array(zod_1.z.union([zod_1.z.string(), exports.DisplayConditionSchema])).optional(),
        '@tool': zod_1.z.array(zod_1.z.boolean()).optional(),
    })
        .catchall(zod_1.z.union([
        zod_1.z.array(zod_1.z.union([NodeParameterValueSchema, exports.DisplayConditionSchema])),
        zod_1.z.undefined(),
    ])),
    hide: zod_1.z.record(zod_1.z.string(), zod_1.z.union([zod_1.z.array(zod_1.z.union([NodeParameterValueSchema, exports.DisplayConditionSchema])), zod_1.z.undefined()])),
    hideOnCloud: zod_1.z.boolean().optional(),
});
exports.NodeConnectionTypeSchema = zod_1.z.enum([
    'ai_agent',
    'ai_chain',
    'ai_document',
    'ai_embedding',
    'ai_languageModel',
    'ai_memory',
    'ai_outputParser',
    'ai_retriever',
    'ai_reranker',
    'ai_textSplitter',
    'ai_tool',
    'ai_vectorStore',
    'main',
]);
exports.INodePropertyOptionsSchema = zod_1.z.object({
    name: zod_1.z.string(),
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean()]),
    action: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    routing: exports.INodePropertyRoutingSchema.optional(),
    outputConnectionType: exports.NodeConnectionTypeSchema.optional(),
    inputSchema: zod_1.z.any().optional(),
    displayOptions: exports.IDisplayOptionsSchema.optional(),
    disabledOptions: zod_1.z.literal(undefined).optional(),
});
exports.ResourceMapperFieldSchema = zod_1.z.object({
    id: zod_1.z.string(),
    displayName: zod_1.z.string(),
    defaultMatch: zod_1.z.boolean(),
    canBeUsedToMatch: zod_1.z.boolean().optional(),
    required: zod_1.z.boolean(),
    display: zod_1.z.boolean(),
    type: exports.FieldTypeSchema.optional(),
    removed: zod_1.z.boolean().optional(),
    options: zod_1.z.array(exports.INodePropertyOptionsSchema),
    readOnly: zod_1.z.boolean().optional(),
});
exports.ResourceMapperValueSchema = zod_1.z.object({
    mappingMode: zod_1.z.string(),
    value: zod_1.z.record(zod_1.z.string(), zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean(), zod_1.z.null()])),
    matchingColumns: zod_1.z.array(zod_1.z.string()),
    schema: zod_1.z.array(exports.ResourceMapperFieldSchema),
    attemptToConvertTypes: zod_1.z.boolean(),
    convertFieldsToString: zod_1.z.boolean(),
});
exports.FilterOptionsValueSchema = zod_1.z.object({
    caseSensitive: zod_1.z.boolean(),
    leftValue: zod_1.z.string(),
    typeValidation: zod_1.z.enum(['strict', 'loose']),
    version: zod_1.z.union([zod_1.z.literal(1), zod_1.z.literal(2), zod_1.z.literal(3)]),
});
exports.FilterOperatorTypeSchema = zod_1.z.enum([
    'string',
    'number',
    'boolean',
    'array',
    'object',
    'dateTime',
    'any',
]);
exports.FilterOperatorValueSchema = zod_1.z.object({
    type: exports.FilterOperatorTypeSchema,
    operation: zod_1.z.string(),
    rightType: exports.FilterOperatorTypeSchema.optional(),
    singleValue: zod_1.z.boolean().optional(),
});
exports.FilterConditionValueSchema = zod_1.z.object({
    id: zod_1.z.string(),
    leftValue: zod_1.z.union([RequiredNodeParameterValueSchema, zod_1.z.array(RequiredNodeParameterValueSchema)]),
    operator: exports.FilterOperatorValueSchema,
    rightValue: zod_1.z.union([
        RequiredNodeParameterValueSchema,
        zod_1.z.array(RequiredNodeParameterValueSchema),
    ]),
});
exports.FilterTypeCombinatorSchema = zod_1.z.enum(['and', 'or']);
exports.FilterValueSchema = zod_1.z.object({
    options: exports.FilterOptionsValueSchema,
    conditions: zod_1.z.array(exports.FilterConditionValueSchema),
    combinator: exports.FilterTypeCombinatorSchema,
});
exports.AssignmentValueSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean(), zod_1.z.null()]),
    type: zod_1.z.string().optional(),
});
exports.AssignmentCollectionValueSchema = zod_1.z.object({
    assignments: zod_1.z.array(exports.AssignmentValueSchema),
});
exports.IconOrEmojiSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({ type: zod_1.z.literal('icon'), value: zod_1.z.string() }),
    zod_1.z.object({ type: zod_1.z.literal('emoji'), value: zod_1.z.string() }),
]);
exports.NodeParameterValueTypeSchema = zod_1.z.lazy(() => zod_1.z.union([
    NodeParameterValueSchema,
    exports.INodeParameterResourceLocatorSchema,
    exports.ResourceMapperValueSchema,
    exports.FilterValueSchema,
    exports.AssignmentCollectionValueSchema,
    exports.IconOrEmojiSchema,
    exports.INodeParametersSchema,
    // only the shapes allowed by the TS union
    zod_1.z.array(NodeParameterValueSchema),
    zod_1.z.array(exports.INodeParametersSchema),
    zod_1.z.array(exports.INodeParameterResourceLocatorSchema),
    zod_1.z.array(exports.ResourceMapperValueSchema),
]));
exports.INodeParametersSchema = zod_1.z.record(zod_1.z.string(), exports.NodeParameterValueTypeSchema);
exports.OnErrorSchema = zod_1.z.enum([
    'continueErrorOutput',
    'continueRegularOutput',
    'stopWorkflow',
]);
exports.INodeCredentialsDetailsSchema = zod_1.z.object({
    id: zod_1.z.string().nullable(),
    name: zod_1.z.string(),
});
exports.INodeCredentialsSchema = zod_1.z.record(zod_1.z.string(), exports.INodeCredentialsDetailsSchema);
exports.INodeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    typeVersion: zod_1.z.number(),
    type: zod_1.z.string(),
    position: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()]),
    disabled: zod_1.z.boolean().optional(),
    notes: zod_1.z.string().optional(),
    notesInFlow: zod_1.z.boolean().optional(),
    retryOnFail: zod_1.z.boolean().optional(),
    maxTries: zod_1.z.number().optional(),
    waitBetweenTries: zod_1.z.number().optional(),
    alwaysOutputData: zod_1.z.boolean().optional(),
    executeOnce: zod_1.z.boolean().optional(),
    onError: exports.OnErrorSchema.optional(),
    continueOnFail: zod_1.z.boolean().optional(),
    webhookId: zod_1.z.string().optional(),
    extendsCredential: zod_1.z.string().optional(),
    rewireOutputLogTo: exports.NodeConnectionTypeSchema.optional(),
    parameters: exports.INodeParametersSchema,
    credentials: exports.INodeCredentialsSchema.optional(),
    forceCustomOperation: zod_1.z
        .object({
        resource: zod_1.z.string(),
        operation: zod_1.z.string(),
    })
        .optional(),
});
exports.INodesSchema = zod_1.z.array(exports.INodeSchema);
//# sourceMappingURL=schemas.js.map