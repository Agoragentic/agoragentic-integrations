import { z } from "zod";
export const INodeParameterResourceLocatorSchema = z.object({
    __rl: z.literal(true),
    mode: z.string(),
    value: z.union([z.string(), z.number(), z.null()]),
    cachedResultName: z.string().optional(),
    cachedResultUrl: z.string().optional(),
    __regex: z.string().optional(),
});
const NodeParameterValueSchema = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.undefined(),
]);
const RequiredNodeParameterValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export const FieldTypeSchema = z.enum([
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
const ObjectLikeSchema = z.custom((v) => (typeof v === 'object' && v !== null) || typeof v === 'function', { message: 'Expected a non-primitive object' });
export const GenericValueSchema = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.undefined(),
    z.null(),
    ObjectLikeSchema,
]);
export const IDataObjectSchema = z.lazy(() => z.record(z.string(), z.union([
    GenericValueSchema,
    z.array(GenericValueSchema),
    IDataObjectSchema,
    z.array(IDataObjectSchema),
])));
export const IRequestOptionsSimplifiedAuthSchema = z.object({
    auth: z
        .object({
        username: z.string(),
        password: z.string(),
        sendImmediately: z.boolean().optional(),
    })
        .optional(),
    body: z.object({}).optional(),
    headers: IDataObjectSchema.optional(),
    qs: IDataObjectSchema.optional(),
    url: z.string().optional(),
    skipSslCertificateValidation: z.union([z.boolean(), z.string()]).optional(),
});
export const IN8nRequestOperationPaginationBaseSchema = z.object({
    type: z.string(),
    properties: z.record(z.string(), z.unknown()),
});
export const IN8nRequestOperationPaginationGenericSchema = IN8nRequestOperationPaginationBaseSchema.extend({
    type: z.literal('generic'),
    properties: z.object({
        continue: z.union([z.boolean(), z.string()]),
        request: IRequestOptionsSimplifiedAuthSchema,
    }),
});
export const IN8nRequestOperationPaginationOffsetSchema = IN8nRequestOperationPaginationBaseSchema.extend({
    type: z.literal('offset'),
    properties: z.object({
        limitParameter: z.string(),
        offsetParameter: z.string(),
        pageSize: z.number(),
        rootProperty: z.string().optional(),
        type: z.enum(['body', 'query']),
    }),
});
export const IN8nRequestOperationsSchema = z.object({
    pagination: z
        .union([
        IN8nRequestOperationPaginationGenericSchema,
        IN8nRequestOperationPaginationOffsetSchema,
        // TODO: Validating the function shape is skipped at runtime, any function is accepted
        z.custom((v) => typeof v === 'function'),
    ])
        .optional(),
});
export const IPostReceiveBaseSchema = z.object({
    type: z.string(),
    enabled: z.union([z.boolean(), z.string()]).optional(),
    properties: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), IDataObjectSchema])),
    errorMessage: z.string().optional(),
});
export const IPostReceiveBinaryDataSchema = IPostReceiveBaseSchema.extend({
    type: z.literal('binaryData'),
    properties: z.object({
        destinationProperty: z.string(),
    }),
});
export const IPostReceiveFilterSchema = IPostReceiveBaseSchema.extend({
    type: z.literal('filter'),
    properties: z.object({
        pass: z.union([z.boolean(), z.string()]),
    }),
});
export const IPostReceiveLimitSchema = IPostReceiveBaseSchema.extend({
    type: z.literal('limit'),
    properties: z.object({
        maxResults: z.union([z.number(), z.string()]),
    }),
});
export const IPostReceiveRootPropertySchema = IPostReceiveBaseSchema.extend({
    type: z.literal('rootProperty'),
    properties: z.object({
        property: z.string(),
    }),
});
export const IPostReceiveSetSchema = IPostReceiveBaseSchema.extend({
    type: z.literal('set'),
    properties: z.object({
        value: z.string(),
    }),
});
export const IPostReceiveSetKeyValueSchema = IPostReceiveBaseSchema.extend({
    type: z.literal('setKeyValue'),
    properties: z.record(z.string(), z.union([z.string(), z.number()])),
});
export const IPostReceiveSortSchema = IPostReceiveBaseSchema.extend({
    type: z.literal('sort'),
    properties: z.object({
        key: z.string(),
    }),
});
export const PostReceiveActionSchema = z.union([
    // TODO: Validating the function shape is skipped at runtime, any function is accepted
    z.custom((v) => typeof v === 'function'),
    IPostReceiveBinaryDataSchema,
    IPostReceiveFilterSchema,
    IPostReceiveLimitSchema,
    IPostReceiveRootPropertySchema,
    IPostReceiveSetSchema,
    IPostReceiveSetKeyValueSchema,
    IPostReceiveSortSchema,
]);
export const INodeRequestOutputSchema = z.object({
    maxResults: z.union([z.number(), z.string()]),
    postReceive: z.array(PostReceiveActionSchema),
});
export const HttpRequestOptionsSchema = z.object({}); // TODO
export const INodeRequestSendSchema = z.object({
    preSend: z.array(z.custom((v) => typeof v === 'function')),
    paginate: z.union([z.boolean(), z.string()]).optional(),
    property: z.string().optional(),
    propertyInDotNotation: z.boolean().optional(),
    type: z.enum(['body', 'query']),
    value: z.string().optional(),
});
export const INodePropertyRoutingSchema = z.object({
    operations: IN8nRequestOperationsSchema.optional(),
    output: INodeRequestOutputSchema.optional(),
    request: HttpRequestOptionsSchema.optional(),
    send: INodeRequestSendSchema.optional(),
});
export const NumberOrStringSchema = z.union([z.number(), z.string()]);
export const DisplayConditionSchema = z.union([
    z.object({ _cnd: z.object({ eq: RequiredNodeParameterValueSchema }) }),
    z.object({ _cnd: z.object({ not: RequiredNodeParameterValueSchema }) }),
    z.object({ _cnd: z.object({ gte: NumberOrStringSchema }) }),
    z.object({ _cnd: z.object({ lte: NumberOrStringSchema }) }),
    z.object({ _cnd: z.object({ gt: NumberOrStringSchema }) }),
    z.object({ _cnd: z.object({ lt: NumberOrStringSchema }) }),
    z.object({
        _cnd: z.object({
            between: z.object({ from: NumberOrStringSchema, to: NumberOrStringSchema }),
        }),
    }),
    z.object({ _cnd: z.object({ startsWith: z.string() }) }),
    z.object({ _cnd: z.object({ endsWith: z.string() }) }),
    z.object({ _cnd: z.object({ includes: z.string() }) }),
    z.object({ _cnd: z.object({ regex: z.string() }) }),
    z.object({ _cnd: z.object({ exists: z.literal(true) }) }),
]);
export const IDisplayOptionsSchema = z.object({
    show: z
        .object({
        '@version': z.array(z.union([z.number(), DisplayConditionSchema])).optional(),
        '@feature': z.array(z.union([z.string(), DisplayConditionSchema])).optional(),
        '@tool': z.array(z.boolean()).optional(),
    })
        .catchall(z.union([
        z.array(z.union([NodeParameterValueSchema, DisplayConditionSchema])),
        z.undefined(),
    ])),
    hide: z.record(z.string(), z.union([z.array(z.union([NodeParameterValueSchema, DisplayConditionSchema])), z.undefined()])),
    hideOnCloud: z.boolean().optional(),
});
export const NodeConnectionTypeSchema = z.enum([
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
export const INodePropertyOptionsSchema = z.object({
    name: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
    action: z.string().optional(),
    description: z.string().optional(),
    routing: INodePropertyRoutingSchema.optional(),
    outputConnectionType: NodeConnectionTypeSchema.optional(),
    inputSchema: z.any().optional(),
    displayOptions: IDisplayOptionsSchema.optional(),
    disabledOptions: z.literal(undefined).optional(),
});
export const ResourceMapperFieldSchema = z.object({
    id: z.string(),
    displayName: z.string(),
    defaultMatch: z.boolean(),
    canBeUsedToMatch: z.boolean().optional(),
    required: z.boolean(),
    display: z.boolean(),
    type: FieldTypeSchema.optional(),
    removed: z.boolean().optional(),
    options: z.array(INodePropertyOptionsSchema),
    readOnly: z.boolean().optional(),
});
export const ResourceMapperValueSchema = z.object({
    mappingMode: z.string(),
    value: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
    matchingColumns: z.array(z.string()),
    schema: z.array(ResourceMapperFieldSchema),
    attemptToConvertTypes: z.boolean(),
    convertFieldsToString: z.boolean(),
});
export const FilterOptionsValueSchema = z.object({
    caseSensitive: z.boolean(),
    leftValue: z.string(),
    typeValidation: z.enum(['strict', 'loose']),
    version: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});
export const FilterOperatorTypeSchema = z.enum([
    'string',
    'number',
    'boolean',
    'array',
    'object',
    'dateTime',
    'any',
]);
export const FilterOperatorValueSchema = z.object({
    type: FilterOperatorTypeSchema,
    operation: z.string(),
    rightType: FilterOperatorTypeSchema.optional(),
    singleValue: z.boolean().optional(),
});
export const FilterConditionValueSchema = z.object({
    id: z.string(),
    leftValue: z.union([RequiredNodeParameterValueSchema, z.array(RequiredNodeParameterValueSchema)]),
    operator: FilterOperatorValueSchema,
    rightValue: z.union([
        RequiredNodeParameterValueSchema,
        z.array(RequiredNodeParameterValueSchema),
    ]),
});
export const FilterTypeCombinatorSchema = z.enum(['and', 'or']);
export const FilterValueSchema = z.object({
    options: FilterOptionsValueSchema,
    conditions: z.array(FilterConditionValueSchema),
    combinator: FilterTypeCombinatorSchema,
});
export const AssignmentValueSchema = z.object({
    id: z.string(),
    name: z.string(),
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    type: z.string().optional(),
});
export const AssignmentCollectionValueSchema = z.object({
    assignments: z.array(AssignmentValueSchema),
});
export const IconOrEmojiSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('icon'), value: z.string() }),
    z.object({ type: z.literal('emoji'), value: z.string() }),
]);
export const NodeParameterValueTypeSchema = z.lazy(() => z.union([
    NodeParameterValueSchema,
    INodeParameterResourceLocatorSchema,
    ResourceMapperValueSchema,
    FilterValueSchema,
    AssignmentCollectionValueSchema,
    IconOrEmojiSchema,
    INodeParametersSchema,
    // only the shapes allowed by the TS union
    z.array(NodeParameterValueSchema),
    z.array(INodeParametersSchema),
    z.array(INodeParameterResourceLocatorSchema),
    z.array(ResourceMapperValueSchema),
]));
export const INodeParametersSchema = z.record(z.string(), NodeParameterValueTypeSchema);
export const OnErrorSchema = z.enum([
    'continueErrorOutput',
    'continueRegularOutput',
    'stopWorkflow',
]);
export const INodeCredentialsDetailsSchema = z.object({
    id: z.string().nullable(),
    name: z.string(),
});
export const INodeCredentialsSchema = z.record(z.string(), INodeCredentialsDetailsSchema);
export const INodeSchema = z.object({
    id: z.string(),
    name: z.string(),
    typeVersion: z.number(),
    type: z.string(),
    position: z.tuple([z.number(), z.number()]),
    disabled: z.boolean().optional(),
    notes: z.string().optional(),
    notesInFlow: z.boolean().optional(),
    retryOnFail: z.boolean().optional(),
    maxTries: z.number().optional(),
    waitBetweenTries: z.number().optional(),
    alwaysOutputData: z.boolean().optional(),
    executeOnce: z.boolean().optional(),
    onError: OnErrorSchema.optional(),
    continueOnFail: z.boolean().optional(),
    webhookId: z.string().optional(),
    extendsCredential: z.string().optional(),
    rewireOutputLogTo: NodeConnectionTypeSchema.optional(),
    parameters: INodeParametersSchema,
    credentials: INodeCredentialsSchema.optional(),
    forceCustomOperation: z
        .object({
        resource: z.string(),
        operation: z.string(),
    })
        .optional(),
});
export const INodesSchema = z.array(INodeSchema);
//# sourceMappingURL=schemas.js.map