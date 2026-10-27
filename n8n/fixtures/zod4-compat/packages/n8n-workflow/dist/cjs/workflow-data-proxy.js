"use strict";
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/no-unsafe-return */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowDataProxy = void 0;
const jmespath = __importStar(require("jmespath"));
const luxon_1 = require("luxon");
const augment_object_1 = require("./augment-object.js");
const constants_1 = require("./constants.js");
const errors_1 = require("./errors/index.js");
const expression_error_1 = require("./errors/expression.error.js");
const global_state_1 = require("./global-state.js");
const interfaces_1 = require("./interfaces.js");
const NodeHelpers = __importStar(require("./node-helpers.js"));
const result_1 = require("./result.js");
const type_guards_1 = require("./type-guards.js");
const utils_1 = require("./utils.js");
const workflow_data_proxy_env_provider_1 = require("./workflow-data-proxy-env-provider.js");
const workflow_data_proxy_helpers_1 = require("./workflow-data-proxy-helpers.js");
const isScriptingNode = (nodeName, workflow) => {
    const node = workflow.getNode(nodeName);
    return node && constants_1.SCRIPTING_NODE_TYPES.includes(node.type);
};
const PAIRED_ITEM_METHOD = {
    PAIRED_ITEM: 'pairedItem',
    ITEM_MATCHING: 'itemMatching',
    ITEM: 'item',
    $GET_PAIRED_ITEM: '$getPairedItem',
};
/**
 * Whether the runtime can compile expressions. The expression engine compiles
 * expressions via `new Function`, which throws when the process is started with
 * `--disallow-code-generation-from-strings` — as the secure-mode task runner is.
 * This is a process-wide invariant, so we probe once and cache the result.
 */
let codeGenerationAllowed;
const isCodeGenerationAllowed = () => {
    if (codeGenerationAllowed === undefined) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
            new Function('return 1');
            codeGenerationAllowed = true;
        }
        catch {
            codeGenerationAllowed = false;
        }
    }
    return codeGenerationAllowed;
};
class WorkflowDataProxy {
    workflow;
    runIndex;
    itemIndex;
    activeNodeName;
    siblingParameters;
    mode;
    additionalKeys;
    executeData;
    defaultReturnRunIndex;
    selfData;
    contextNodeName;
    envProviderState;
    runExecutionData;
    connectionInputData;
    timezone;
    // TODO: Clean that up at some point and move all the options into an options object
    constructor(workflow, runExecutionData, runIndex, itemIndex, activeNodeName, connectionInputData, siblingParameters, mode, additionalKeys, executeData, defaultReturnRunIndex = -1, selfData = {}, contextNodeName = activeNodeName, envProviderState) {
        this.workflow = workflow;
        this.runIndex = runIndex;
        this.itemIndex = itemIndex;
        this.activeNodeName = activeNodeName;
        this.siblingParameters = siblingParameters;
        this.mode = mode;
        this.additionalKeys = additionalKeys;
        this.executeData = executeData;
        this.defaultReturnRunIndex = defaultReturnRunIndex;
        this.selfData = selfData;
        this.contextNodeName = contextNodeName;
        this.envProviderState = envProviderState;
        this.runExecutionData = isScriptingNode(this.contextNodeName, workflow)
            ? runExecutionData !== null
                ? (0, augment_object_1.augmentObject)(runExecutionData)
                : null
            : runExecutionData;
        this.connectionInputData = isScriptingNode(this.contextNodeName, workflow)
            ? (0, augment_object_1.augmentArray)(connectionInputData)
            : connectionInputData;
        this.timezone = workflow.settings?.timezone ?? (0, global_state_1.getGlobalState)().defaultTimezone;
        luxon_1.Settings.defaultZone = this.timezone;
    }
    /**
     * Returns execution data, conditionally extracting only 'json' from the item based on workflow 'binaryMode' setting.
     * When binary mode is 'combined', this method returns only the 'json' from the item unless 'fullItem' is true.
     *
     * @private
     * @param {INodeExecutionData | INodeExecutionData[]} data - The execution data to process
     * @param {boolean} fullItem - If true, always returns the complete item data
     * @returns The full execution data or only the json property, depending on workflow 'binaryMode' setting
     */
    returnExecutionData(data, fullItem = false) {
        if (fullItem)
            return data;
        if (this.workflow.settings?.binaryMode !== constants_1.BINARY_MODE_COMBINED)
            return data;
        if (Array.isArray(data)) {
            return data.map((i) => i.json);
        }
        return data.json;
    }
    /**
     * Returns a proxy which allows to query context data of a given node
     *
     * @private
     * @param {string} nodeName The name of the node to get the context from
     */
    nodeContextGetter(nodeName) {
        const that = this;
        const node = this.workflow.nodes[nodeName];
        if (!that.runExecutionData?.executionData && that.connectionInputData.length > 0) {
            return {}; // incoming connection has pinned data, so stub context object
        }
        if (!that.runExecutionData?.executionData && !that.runExecutionData?.resultData) {
            throw new expression_error_1.ExpressionError("The workflow hasn't been executed yet, so you can't reference any context data", {
                runIndex: that.runIndex,
                itemIndex: that.itemIndex,
                type: 'no_execution_data',
            });
        }
        return new Proxy({}, {
            has: () => true,
            ownKeys(target) {
                if (Reflect.ownKeys(target).length === 0) {
                    // Target object did not get set yet
                    Object.assign(target, NodeHelpers.getContext(that.runExecutionData, 'node', node));
                }
                return Reflect.ownKeys(target);
            },
            getOwnPropertyDescriptor() {
                return {
                    enumerable: true,
                    configurable: true,
                };
            },
            get(_, name) {
                if (name === 'isProxy')
                    return true;
                name = name.toString();
                const contextData = NodeHelpers.getContext(that.runExecutionData, 'node', node);
                return contextData[name];
            },
        });
    }
    selfGetter() {
        const that = this;
        return new Proxy({}, {
            has: () => true,
            ownKeys(target) {
                return Reflect.ownKeys(target);
            },
            get(_, name) {
                if (name === 'isProxy')
                    return true;
                name = name.toString();
                return that.selfData[name];
            },
        });
    }
    buildAgentToolInfo(node) {
        const nodeType = this.workflow.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
        if (!nodeType) {
            return {
                name: node.name,
                type: node.type,
            };
        }
        const type = nodeType.description.displayName;
        const params = NodeHelpers.getNodeParameters(nodeType.description.properties, node.parameters, true, false, node, nodeType.description);
        const resourceKey = params?.resource;
        const operationKey = params?.operation;
        const resource = nodeType.description.properties
            .find((nodeProperties) => nodeProperties.name === 'resource')
            ?.options?.find((option) => 'value' in option && option.value === resourceKey)?.name ??
            null;
        const operation = nodeType.description.properties
            .find((nodeProperty) => nodeProperty.name === 'operation' &&
            nodeProperty.displayOptions?.show?.resource?.some((y) => y === resourceKey))
            ?.options?.find((y) => 'value' in y && y.value === operationKey)?.name ?? null;
        const hasCredentials = !(0, utils_1.isObjectEmpty)(node.credentials ?? {});
        const hasValidCalendar = nodeType.description.name.includes('googleCalendar')
            ? (0, type_guards_1.isResourceLocatorValue)(node.parameters.calendar) && node.parameters.calendar.value !== ''
            : undefined;
        const aiDefinedFields = Object.entries(node.parameters)
            .map(([key, value]) => [key, (0, type_guards_1.isResourceLocatorValue)(value) ? value.value : value])
            .filter(([_, value]) => value?.toString().toLowerCase().includes('$fromai'))
            .map(([key]) => nodeType.description.properties.find((property) => property.name === key)?.displayName);
        return {
            name: node.name,
            type,
            resource,
            operation,
            hasCredentials,
            hasValidCalendar,
            aiDefinedFields,
        };
    }
    agentInfo() {
        const agentNode = this.workflow.getNode(this.activeNodeName);
        if (!agentNode || agentNode.type !== constants_1.AGENT_LANGCHAIN_NODE_TYPE)
            return undefined;
        const connectedTools = this.workflow
            .getParentNodes(this.activeNodeName, interfaces_1.NodeConnectionTypes.AiTool)
            .map((nodeName) => this.workflow.getNode(nodeName))
            .filter((node) => node);
        const memoryConnectedToAgent = this.workflow.getParentNodes(this.activeNodeName, interfaces_1.NodeConnectionTypes.AiMemory).length > 0;
        const allTools = this.workflow.queryNodes((nodeType) => {
            return nodeType.description.name.toLowerCase().includes('tool');
        });
        const unconnectedTools = allTools
            .filter((node) => this.workflow.getChildNodes(node.name, interfaces_1.NodeConnectionTypes.AiTool, 1).length === 0)
            .filter((node) => !connectedTools.includes(node));
        return {
            memoryConnectedToAgent,
            tools: [
                ...connectedTools.map((node) => ({ connected: true, ...this.buildAgentToolInfo(node) })),
                ...unconnectedTools.map((node) => ({ connected: false, ...this.buildAgentToolInfo(node) })),
            ],
        };
    }
    /**
     * Returns a proxy which allows to query parameter data of a given node
     *
     * @private
     * @param {string} nodeName The name of the node to query data from
     * @param {boolean} [resolveValue=true] If the expression value should get resolved
     */
    nodeParameterGetter(nodeName, resolveValue = true) {
        const that = this;
        const node = this.workflow.nodes[nodeName];
        // `node` is `undefined` only in expressions in credentials
        return new Proxy(node?.parameters ?? {}, {
            has: () => true,
            ownKeys(target) {
                return Reflect.ownKeys(target);
            },
            getOwnPropertyDescriptor() {
                return {
                    enumerable: true,
                    configurable: true,
                };
            },
            get(target, name) {
                if (name === 'isProxy')
                    return true;
                if (name === 'toJSON')
                    return () => (0, utils_1.deepCopy)(target);
                name = name.toString();
                let returnValue;
                if (name[0] === '&') {
                    const key = name.slice(1);
                    if (!that.siblingParameters.hasOwnProperty(key)) {
                        throw new errors_1.UnexpectedError('Could not find sibling parameter on node', {
                            extra: { nodeName, parameter: key },
                        });
                    }
                    returnValue = that.siblingParameters[key];
                }
                else {
                    if (!node.parameters.hasOwnProperty(name)) {
                        // Parameter does not exist on node
                        return undefined;
                    }
                    returnValue = node.parameters[name];
                }
                // Avoid recursion
                if (returnValue === `={{ $parameter.${name} }}`)
                    return undefined;
                if ((0, type_guards_1.isResourceLocatorValue)(returnValue)) {
                    if (returnValue.__regex && typeof returnValue.value === 'string') {
                        const expr = new RegExp(returnValue.__regex);
                        const extracted = expr.exec(returnValue.value);
                        if (extracted && extracted.length >= 2) {
                            returnValue = extracted[1];
                        }
                        else {
                            return returnValue.value;
                        }
                    }
                    else {
                        returnValue = returnValue.value;
                    }
                }
                if (resolveValue && typeof returnValue === 'string' && returnValue.charAt(0) === '=') {
                    // The found value is an expression so resolve it
                    return that.workflow.expression.getParameterValue(returnValue, that.runExecutionData, that.runIndex, that.itemIndex, that.activeNodeName, that.connectionInputData, that.mode, that.additionalKeys, that.executeData, false, {}, that.contextNodeName);
                }
                return returnValue;
            },
        });
    }
    getNodeExecutionOrPinnedData({ nodeName, branchIndex, runIndex, shortSyntax = false, }) {
        try {
            return this.getNodeExecutionData(nodeName, shortSyntax, branchIndex, runIndex);
        }
        catch (e) {
            const pinData = (0, workflow_data_proxy_helpers_1.getPinDataIfManualExecution)(this.workflow, nodeName, this.mode);
            if (pinData) {
                return pinData;
            }
            throw e;
        }
    }
    /**
     * Returns the node ExecutionData
     *
     * @private
     * @param {string} nodeName The name of the node query data from
     * @param {boolean} [shortSyntax=false] If short syntax got used
     * @param {number} [outputIndex] The index of the output, if not given the first one gets used
     * @param {number} [runIndex] The index of the run, if not given the current one does get used
     */
    getNodeExecutionData(nodeName, shortSyntax = false, outputIndex, runIndex) {
        const that = this;
        let executionData;
        if (!shortSyntax) {
            // Long syntax got used to return data from node in path
            if (that.runExecutionData === null) {
                throw new expression_error_1.ExpressionError("The workflow hasn't been executed yet, so you can't reference any output data", {
                    runIndex: that.runIndex,
                    itemIndex: that.itemIndex,
                });
            }
            if (!that.workflow.getNode(nodeName)) {
                throw new expression_error_1.ExpressionError("Referenced node doesn't exist", {
                    runIndex: that.runIndex,
                    itemIndex: that.itemIndex,
                    nodeCause: nodeName,
                    descriptionKey: 'nodeNotFound',
                });
            }
            if (!that.runExecutionData.resultData.runData.hasOwnProperty(nodeName) &&
                !(0, workflow_data_proxy_helpers_1.getPinDataIfManualExecution)(that.workflow, nodeName, that.mode)) {
                throw new expression_error_1.ExpressionError(`Node '${nodeName}' hasn't been executed`, {
                    messageTemplate: 'An expression references this node, but the node is unexecuted. Consider re-wiring your nodes or checking for execution first, i.e. {{ $if( $("{{nodeName}}").isExecuted, <action_if_executed>, "") }}',
                    functionality: 'pairedItem',
                    descriptionKey: isScriptingNode(nodeName, that.workflow)
                        ? 'pairedItemNoConnectionCodeNode'
                        : 'pairedItemNoConnection',
                    type: 'no_execution_data',
                    nodeCause: nodeName,
                    runIndex: that.runIndex,
                    itemIndex: that.itemIndex,
                });
            }
            runIndex = runIndex === undefined ? that.defaultReturnRunIndex : runIndex;
            runIndex =
                runIndex === -1 ? that.runExecutionData.resultData.runData[nodeName].length - 1 : runIndex;
            if (that.runExecutionData.resultData.runData[nodeName].length <= runIndex) {
                throw new expression_error_1.ExpressionError(`Run ${runIndex} of node "${nodeName}" not found`, {
                    runIndex: that.runIndex,
                    itemIndex: that.itemIndex,
                });
            }
            const taskData = that.runExecutionData.resultData.runData[nodeName][runIndex].data;
            if (!taskData.main?.length || taskData.main[0] === null) {
                // throw new ApplicationError('No data found for item-index', { extra: { itemIndex } });
                throw new expression_error_1.ExpressionError('No data found from `main` input', {
                    runIndex: that.runIndex,
                    itemIndex: that.itemIndex,
                });
            }
            // Check from which output to read the data.
            // Depends on how the nodes are connected.
            // (example "IF" node. If node is connected to "true" or to "false" output)
            if (outputIndex === undefined) {
                const nodeConnection = that.workflow.getNodeConnectionIndexes(that.contextNodeName, nodeName, interfaces_1.NodeConnectionTypes.Main);
                if (nodeConnection === undefined) {
                    throw new expression_error_1.ExpressionError(`connect "${that.contextNodeName}" to "${nodeName}"`, {
                        runIndex: that.runIndex,
                        itemIndex: that.itemIndex,
                    });
                }
                outputIndex = nodeConnection.sourceIndex;
            }
            if (outputIndex === undefined) {
                outputIndex = 0;
            }
            if (taskData.main.length <= outputIndex) {
                throw new expression_error_1.ExpressionError(`Node "${nodeName}" has no branch with index ${outputIndex}.`, {
                    runIndex: that.runIndex,
                    itemIndex: that.itemIndex,
                });
            }
            executionData = taskData.main[outputIndex];
        }
        else {
            // Short syntax got used to return data from active node
            executionData = that.connectionInputData;
        }
        return executionData;
    }
    /**
     * Returns a proxy which allows to query data of a given node
     *
     * @private
     * @param {string} nodeName The name of the node query data from
     * @param {boolean} [shortSyntax=false] If short syntax got used
     * @param {boolean} [throwOnMissingExecutionData=true] If an error should get thrown if no execution data is available
     */
    nodeDataGetter(nodeName, shortSyntax = false, throwOnMissingExecutionData = true) {
        const that = this;
        const node = this.workflow.nodes[nodeName];
        return new Proxy({ binary: undefined, data: undefined, json: undefined }, {
            has: () => true,
            get(target, name, receiver) {
                if (name === 'isProxy')
                    return true;
                name = name.toString();
                if (!node) {
                    throw new expression_error_1.ExpressionError('Referenced node does not exist', {
                        messageTemplate: 'Make sure to double-check the node name for typos',
                        functionality: 'pairedItem',
                        descriptionKey: isScriptingNode(nodeName, that.workflow)
                            ? 'pairedItemNoConnectionCodeNode'
                            : 'pairedItemNoConnection',
                        type: 'paired_item_no_connection',
                        nodeCause: nodeName,
                        runIndex: that.runIndex,
                        itemIndex: that.itemIndex,
                    });
                }
                if (['binary', 'data', 'json'].includes(name)) {
                    const executionData = that.getNodeExecutionOrPinnedData({
                        nodeName,
                        shortSyntax,
                    });
                    if (executionData.length === 0 && !throwOnMissingExecutionData) {
                        return undefined;
                    }
                    // Ultra-simple execution-based validation: if no execution data exists, throw error
                    if (executionData.length === 0) {
                        throw new expression_error_1.ExpressionError(`Node '${nodeName}' hasn't been executed`, {
                            messageTemplate: 'An expression references this node, but the node is unexecuted. Consider re-wiring your nodes or checking for execution first, i.e. {{ $if( $("{{nodeName}}").isExecuted, <action_if_executed>, "") }}',
                            functionality: 'pairedItem',
                            descriptionKey: isScriptingNode(nodeName, that.workflow)
                                ? 'pairedItemNoConnectionCodeNode'
                                : 'pairedItemNoConnection',
                            type: 'no_execution_data',
                            nodeCause: nodeName,
                            runIndex: that.runIndex,
                            itemIndex: that.itemIndex,
                        });
                    }
                    if (executionData.length <= that.itemIndex) {
                        throw new expression_error_1.ExpressionError(`"${nodeName}" node has ${executionData.length} item(s) but you're trying to access item ${that.itemIndex}`, {
                            messageTemplate: 'Adjust your expression to access an existing item index (0-{{maxIndex}})',
                            functionality: 'pairedItem',
                            descriptionKey: 'pairedItemInvalidIndex',
                            type: 'no_execution_data',
                            nodeCause: nodeName,
                            runIndex: that.runIndex,
                            itemIndex: that.itemIndex,
                        });
                    }
                    if (['data', 'json'].includes(name)) {
                        // JSON-Data
                        return executionData[that.itemIndex].json;
                    }
                    if (name === 'binary') {
                        // Binary-Data
                        const returnData = {};
                        if (!executionData[that.itemIndex].binary) {
                            return returnData;
                        }
                        const binaryKeyData = executionData[that.itemIndex].binary;
                        for (const keyName of Object.keys(binaryKeyData)) {
                            returnData[keyName] = {};
                            const binaryData = binaryKeyData[keyName];
                            for (const propertyName in binaryData) {
                                if (propertyName === 'data') {
                                    // Skip the data property
                                    continue;
                                }
                                returnData[keyName][propertyName] = binaryData[propertyName];
                            }
                        }
                        return returnData;
                    }
                }
                else if (name === 'context') {
                    return that.nodeContextGetter(nodeName);
                }
                else if (name === 'parameter') {
                    // Get node parameter data
                    return that.nodeParameterGetter(nodeName);
                }
                else if (name === 'runIndex') {
                    if (!that.runExecutionData?.resultData.runData[nodeName]) {
                        return -1;
                    }
                    return that.runExecutionData.resultData.runData[nodeName].length - 1;
                }
                return Reflect.get(target, name, receiver);
            },
        });
    }
    prevNodeGetter() {
        const allowedValues = ['name', 'outputIndex', 'runIndex'];
        const that = this;
        return new Proxy({}, {
            has: () => true,
            ownKeys() {
                return allowedValues;
            },
            getOwnPropertyDescriptor() {
                return {
                    enumerable: true,
                    configurable: true,
                };
            },
            get(target, name, receiver) {
                if (name === 'isProxy')
                    return true;
                if (!that.executeData?.source) {
                    // Means the previous node did not get executed yet
                    return undefined;
                }
                const sourceData = that.executeData.source.main[0];
                if (name === 'name') {
                    return sourceData.previousNode;
                }
                if (name === 'outputIndex') {
                    return sourceData.previousNodeOutput || 0;
                }
                if (name === 'runIndex') {
                    return sourceData.previousNodeRun || 0;
                }
                return Reflect.get(target, name, receiver);
            },
        });
    }
    /**
     * Returns a proxy to query data from the workflow
     *
     * @private
     */
    workflowGetter() {
        const allowedValues = ['active', 'id', 'name'];
        const that = this;
        return new Proxy({}, {
            has: () => true,
            ownKeys() {
                return allowedValues;
            },
            getOwnPropertyDescriptor() {
                return {
                    enumerable: true,
                    configurable: true,
                };
            },
            get(target, name, receiver) {
                if (name === 'isProxy')
                    return true;
                if (allowedValues.includes(name.toString())) {
                    const value = that.workflow[name];
                    if (value === undefined && name === 'id') {
                        throw new expression_error_1.ExpressionError('save workflow to view', {
                            description: 'Please save the workflow first to use $workflow',
                            runIndex: that.runIndex,
                            itemIndex: that.itemIndex,
                        });
                    }
                    return value;
                }
                return Reflect.get(target, name, receiver);
            },
        });
    }
    /**
     * Returns a proxy to query data of all nodes
     *
     * @private
     */
    nodeGetter() {
        const that = this;
        return new Proxy({}, {
            has: () => true,
            get(_, name) {
                if (name === 'isProxy')
                    return true;
                const nodeName = name.toString();
                if (that.workflow.getNode(nodeName) === null) {
                    throw new expression_error_1.ExpressionError("Referenced node doesn't exist", {
                        runIndex: that.runIndex,
                        itemIndex: that.itemIndex,
                        nodeCause: nodeName,
                        descriptionKey: 'nodeNotFound',
                    });
                }
                return that.nodeDataGetter(nodeName);
            },
        });
    }
    /**
     * Returns the data proxy object which allows to query data from current run
     *
     */
    getDataProxy(opts) {
        const that = this;
        // replacing proxies with the actual data.
        const jmespathWrapper = (data, query) => {
            if (typeof data !== 'object' || typeof query !== 'string') {
                throw new expression_error_1.ExpressionError('expected two arguments (Object, string) for this function', {
                    runIndex: that.runIndex,
                    itemIndex: that.itemIndex,
                });
            }
            // jmespath decodes escape sequences inside quoted identifiers, so
            // the token check below must run against an unescaped query. Reject
            // any backslash up front to keep the property-name match meaningful.
            if (query.includes('\\') || (0, utils_1.containsUnsafeObjectPropertyToken)(query)) {
                throw new expression_error_1.ExpressionError('Cannot access this property in a jmespath query due to security concerns', {
                    runIndex: that.runIndex,
                    itemIndex: that.itemIndex,
                });
            }
            if (!Array.isArray(data) && typeof data === 'object') {
                return jmespath.search({ ...data }, query);
            }
            return jmespath.search(data, query);
        };
        const createExpressionError = (message, context) => {
            if (isScriptingNode(that.activeNodeName, that.workflow) && context?.functionOverrides) {
                // If the node in which the error is thrown is a function node,
                // display a different error message in case there is one defined
                message = context.functionOverrides.message || message;
                context.description = context.functionOverrides.description || context.description;
                // The error will be in the code and not on an expression on a parameter
                // so remove the messageTemplate as it would overwrite the message
                context.messageTemplate = undefined;
            }
            if (context?.nodeCause) {
                const nodeName = context.nodeCause;
                const pinData = (0, workflow_data_proxy_helpers_1.getPinDataIfManualExecution)(that.workflow, nodeName, that.mode);
                if (pinData) {
                    if (!context) {
                        context = {};
                    }
                    message = `Unpin '${nodeName}' to execute`;
                    context.messageTemplate = undefined;
                    context.descriptionKey = 'pairedItemPinned';
                }
                if (context.moreInfoLink && (pinData || isScriptingNode(nodeName, that.workflow))) {
                    const moreInfoLink = ' <a target="_blank" href="https://docs.n8n.io/data/data-mapping/data-item-linking/item-linking-errors/">More info</a>';
                    context.description += moreInfoLink;
                    if (context.descriptionTemplate)
                        context.descriptionTemplate += moreInfoLink;
                }
            }
            return new expression_error_1.ExpressionError(message, {
                runIndex: that.runIndex,
                itemIndex: that.itemIndex,
                ...context,
            });
        };
        const createMissingPairedItemError = (nodeCause, usedMethodName = PAIRED_ITEM_METHOD.PAIRED_ITEM) => {
            const pinData = (0, workflow_data_proxy_helpers_1.getPinDataIfManualExecution)(that.workflow, nodeCause, that.mode);
            const message = pinData
                ? `Using the ${usedMethodName} method doesn't work with pinned data in this scenario. Please unpin '${nodeCause}' and try again.`
                : `Paired item data for ${usedMethodName} from node '${nodeCause}' is unavailable. Ensure '${nodeCause}' is providing the required output.`;
            return new expression_error_1.ExpressionError(message, {
                runIndex: that.runIndex,
                itemIndex: that.itemIndex,
                functionality: 'pairedItem',
                descriptionKey: isScriptingNode(nodeCause, that.workflow)
                    ? 'pairedItemNoInfoCodeNode'
                    : 'pairedItemNoInfo',
                nodeCause,
                causeDetailed: `Missing pairedItem data (node '${nodeCause}' probably didn't supply it)`,
                type: 'paired_item_no_info',
            });
        };
        const createNoConnectionError = (nodeCause) => {
            return createExpressionError('Invalid expression', {
                messageTemplate: 'No path back to referenced node',
                functionality: 'pairedItem',
                descriptionKey: isScriptingNode(nodeCause, that.workflow)
                    ? 'pairedItemNoConnectionCodeNode'
                    : 'pairedItemNoConnection',
                type: 'paired_item_no_connection',
                moreInfoLink: true,
                nodeCause,
            });
        };
        function createBranchNotFoundError(node, item, cause) {
            return createExpressionError('Branch not found', {
                messageTemplate: 'Paired item references non-existent branch',
                functionality: 'pairedItem',
                nodeCause: cause,
                functionOverrides: { message: 'Invalid branch reference' },
                description: `Item ${item} in node ${node} references a branch that doesn't exist.`,
                type: 'paired_item_invalid_info',
            });
        }
        function createPairedItemNotFound(destNode, cause) {
            return createExpressionError('Paired item resolution failed', {
                messageTemplate: 'Unable to find paired item source',
                functionality: 'pairedItem',
                nodeCause: cause,
                functionOverrides: { message: 'Data not found' },
                description: `Could not trace back to node '${destNode}'`,
                type: 'paired_item_no_info',
                moreInfoLink: true,
            });
        }
        function createPairedItemMultipleItemsFound(destNode, itemIndex) {
            return createExpressionError('Multiple matches found', {
                messageTemplate: `Multiple matching items for item [${itemIndex}]`,
                functionality: 'pairedItem',
                functionOverrides: { message: 'Multiple matches' },
                nodeCause: destNode,
                descriptionKey: isScriptingNode(destNode, that.workflow)
                    ? 'pairedItemMultipleMatchesCodeNode'
                    : 'pairedItemMultipleMatches',
                type: 'paired_item_multiple_matches',
            });
        }
        function normalizeInputs(pairedItem, sourceData) {
            if (typeof pairedItem === 'number') {
                pairedItem = { item: pairedItem };
            }
            const finalSource = pairedItem.sourceOverwrite || sourceData;
            return [pairedItem, finalSource];
        }
        function pinDataToTask(pinData) {
            if (!pinData)
                return undefined;
            return {
                data: { main: [pinData] },
                startTime: 0,
                executionTime: 0,
                executionIndex: 0,
                source: [],
            };
        }
        function getTaskData(source) {
            return (that.runExecutionData?.resultData?.runData?.[source.previousNode]?.[source.previousNodeRun || 0] ??
                pinDataToTask((0, workflow_data_proxy_helpers_1.getPinDataIfManualExecution)(that.workflow, source.previousNode, that.mode)));
        }
        function getNodeOutput(taskData, source, nodeCause) {
            const outputIndex = source.previousNodeOutput || 0;
            const outputs = taskData?.data?.main?.[outputIndex];
            if (!outputs) {
                throw createExpressionError('Can’t get data for expression', {
                    messageTemplate: 'Missing output data',
                    functionOverrides: { message: 'Missing output' },
                    nodeCause,
                    description: `Expected output #${outputIndex} from node ${source.previousNode}`,
                    type: 'internal',
                });
            }
            return outputs;
        }
        const normalizePairedItem = (paired) => {
            if (paired === null || paired === undefined) {
                return [];
            }
            const pairedItems = Array.isArray(paired) ? paired : [paired];
            return pairedItems.map((p) => (typeof p === 'number' ? { item: p } : p));
        };
        const getPairedItem = (destinationNodeName, incomingSourceData, initialPairedItem, usedMethodName = PAIRED_ITEM_METHOD.$GET_PAIRED_ITEM, nodeBeforeLast) => {
            // Normalize inputs
            const [pairedItem, sourceData] = normalizeInputs(initialPairedItem, incomingSourceData);
            if (!sourceData) {
                throw createPairedItemNotFound(destinationNodeName, nodeBeforeLast);
            }
            const taskData = getTaskData(sourceData);
            const outputData = getNodeOutput(taskData, sourceData, nodeBeforeLast);
            const item = outputData[pairedItem.item];
            const sourceArray = taskData?.source ?? [];
            // Done: reached the destination node in the ancestry chain
            if (sourceData.previousNode === destinationNodeName) {
                if (pairedItem.item >= outputData.length) {
                    throw createMissingPairedItemError(sourceData.previousNode, usedMethodName);
                }
                return item;
            }
            // Normalize paired item to always be IPairedItemData[]
            const nextPairedItems = normalizePairedItem(item.pairedItem);
            if (nextPairedItems.length === 0) {
                throw createMissingPairedItemError(sourceData.previousNode, usedMethodName);
            }
            // Recursively traverse ancestry to find the destination node + paired item
            const results = nextPairedItems.flatMap((nextPairedItem) => {
                const inputIndex = nextPairedItem.input ?? 0;
                if (inputIndex >= sourceArray.length)
                    return [];
                const nextSource = nextPairedItem.sourceOverwrite ?? sourceArray[inputIndex];
                try {
                    return (0, result_1.createResultOk)(getPairedItem(destinationNodeName, nextSource, { ...nextPairedItem, input: inputIndex }, usedMethodName, sourceData.previousNode));
                }
                catch (error) {
                    return (0, result_1.createResultError)(error);
                }
            });
            if (results.every((result) => !result.ok)) {
                throw results[0].error;
            }
            const matchedItems = results.filter((result) => result.ok).map((result) => result.result);
            if (matchedItems.length === 0) {
                if (sourceArray.length === 0)
                    throw createNoConnectionError(destinationNodeName);
                throw createBranchNotFoundError(sourceData.previousNode, pairedItem.item, nodeBeforeLast);
            }
            const [first, ...rest] = matchedItems;
            if (rest.some((r) => r !== first)) {
                throw createPairedItemMultipleItemsFound(destinationNodeName, pairedItem.item);
            }
            return first;
        };
        const handleFromAi = (name, _description, _type = 'string', defaultValue) => {
            const { itemIndex, runIndex } = that;
            if (!name || name === '') {
                throw new expression_error_1.ExpressionError("Add a key, e.g. $fromAI('placeholder_name')", {
                    runIndex,
                    itemIndex,
                });
            }
            const nameValidationRegex = /^[a-zA-Z0-9_-]{0,64}$/;
            if (!nameValidationRegex.test(name)) {
                throw new expression_error_1.ExpressionError('Invalid parameter key, must be between 1 and 64 characters long and only contain lowercase letters, uppercase letters, numbers, underscores, and hyphens', {
                    runIndex,
                    itemIndex,
                });
            }
            const resultData = that.runExecutionData?.resultData?.runData?.[that.activeNodeName]?.[runIndex];
            let inputData;
            let placeholdersDataInputData;
            if (!resultData) {
                inputData = this.connectionInputData?.[runIndex];
                placeholdersDataInputData = inputData?.json;
            }
            else {
                inputData =
                    that.runExecutionData?.resultData.runData[that.activeNodeName]?.[runIndex].inputOverride;
                placeholdersDataInputData = inputData?.[interfaces_1.NodeConnectionTypes.AiTool]?.[0]?.[itemIndex].json;
            }
            if (!placeholdersDataInputData) {
                throw new expression_error_1.ExpressionError('No execution data available', {
                    runIndex,
                    itemIndex,
                    type: 'no_execution_data',
                });
            }
            return (
            // TS does not know that the key exists, we need to address this in refactor
            placeholdersDataInputData?.query?.[name] ??
                placeholdersDataInputData?.[name] ??
                defaultValue);
        };
        const handleTool = (throwOnError = true) => {
            const fallbackValue = that.additionalKeys?.['$tool'];
            try {
                const toolName = handleFromAi('tool', '');
                const toolParameters = handleFromAi('toolParameters', '');
                return {
                    name: toolName ?? fallbackValue?.name,
                    parameters: toolParameters ?? fallbackValue?.parameters,
                };
            }
            catch (error) {
                const isNoExecutionDataError = error instanceof expression_error_1.ExpressionError && error.context.type === 'no_execution_data';
                // always suppress no_execution_data error
                // $tool can get accessed in some cases where no execution data is available, e.g. task runners
                if (isNoExecutionDataError) {
                    return fallbackValue;
                }
                if (throwOnError) {
                    throw error;
                }
                return undefined;
            }
        };
        const base = {
            $: (nodeName, resolveFullItem) => {
                if (!nodeName) {
                    nodeName = that.prevNodeGetter().name;
                    if (!nodeName) {
                        throw createExpressionError('When calling $(), please specify a node');
                    }
                }
                const referencedNode = that.workflow.getNode(nodeName);
                if (referencedNode === null) {
                    throw createExpressionError("Referenced node doesn't exist", {
                        runIndex: that.runIndex,
                        itemIndex: that.itemIndex,
                        nodeCause: nodeName,
                        descriptionKey: 'nodeNotFound',
                    });
                }
                const ensureNodeExecutionData = () => {
                    if (!that?.runExecutionData?.resultData?.runData.hasOwnProperty(nodeName) &&
                        !(0, workflow_data_proxy_helpers_1.getPinDataIfManualExecution)(that.workflow, nodeName, that.mode)) {
                        throw createExpressionError(`Node '${nodeName}' hasn't been executed`, {
                            messageTemplate: 'An expression references this node, but the node is unexecuted. Consider re-wiring your nodes or checking for execution first, i.e. {{ $if( $("{{nodeName}}").isExecuted, <action_if_executed>, "") }}',
                            functionality: 'pairedItem',
                            descriptionKey: isScriptingNode(nodeName, that.workflow)
                                ? 'pairedItemNoConnectionCodeNode'
                                : 'pairedItemNoConnection',
                            type: 'no_execution_data',
                            nodeCause: nodeName,
                            runIndex: that.runIndex,
                            itemIndex: that.itemIndex,
                        });
                    }
                };
                return new Proxy({}, {
                    has: () => true,
                    ownKeys() {
                        return [
                            PAIRED_ITEM_METHOD.PAIRED_ITEM,
                            'isExecuted',
                            PAIRED_ITEM_METHOD.ITEM_MATCHING,
                            PAIRED_ITEM_METHOD.ITEM,
                            'first',
                            'last',
                            'all',
                            'context',
                            'params',
                        ];
                    },
                    get(target, property, receiver) {
                        if (property === 'isProxy')
                            return true;
                        if (property === 'isExecuted') {
                            return (that?.runExecutionData?.resultData?.runData.hasOwnProperty(nodeName) ?? false);
                        }
                        if (property === PAIRED_ITEM_METHOD.PAIRED_ITEM ||
                            property === PAIRED_ITEM_METHOD.ITEM_MATCHING ||
                            property === PAIRED_ITEM_METHOD.ITEM) {
                            // Before resolving the pairedItem make sure that the requested node comes in the
                            // graph before the current one
                            const activeNode = that.workflow.getNode(that.activeNodeName);
                            let contextNode = that.contextNodeName;
                            if (activeNode) {
                                const parentMainInputNode = that.workflow.getParentMainInputNode(activeNode);
                                contextNode = parentMainInputNode?.name ?? contextNode;
                            }
                            // Check if the node has any children and check parents for them instead of the activeNodeName
                            const children = that.workflow.getChildNodes(that.activeNodeName, 'ALL_NON_MAIN');
                            if (children.length === 0) {
                                // Node has no children, check parent of context node
                                const parents = that.workflow.getParentNodes(contextNode);
                                if (!parents.includes(nodeName)) {
                                    throw createNoConnectionError(nodeName);
                                }
                            }
                            else {
                                // Node has children, check parent of children
                                const parents = children.flatMap((child) => that.workflow.getParentNodes(child, 'ALL'));
                                if (!parents.includes(nodeName)) {
                                    throw createNoConnectionError(nodeName);
                                }
                            }
                            ensureNodeExecutionData();
                            const pairedItemMethod = (itemIndex) => {
                                if (itemIndex === undefined) {
                                    if (property === PAIRED_ITEM_METHOD.ITEM_MATCHING) {
                                        throw createExpressionError('Missing item index for .itemMatching()', {
                                            itemIndex,
                                        });
                                    }
                                    itemIndex = that.itemIndex;
                                }
                                if (!that.connectionInputData.length) {
                                    const pinnedData = (0, workflow_data_proxy_helpers_1.getPinDataIfManualExecution)(that.workflow, nodeName, that.mode);
                                    if (pinnedData) {
                                        return that.returnExecutionData(pinnedData[itemIndex], resolveFullItem);
                                    }
                                    // The active node has not run yet (e.g. partial execution),
                                    // so paired item resolution cannot trace through the chain.
                                    // Fall back to reading directly from the referenced node's
                                    // run data, which is what first()/last()/all() do.
                                    const nodeRunData = that.getNodeExecutionOrPinnedData({
                                        nodeName,
                                    });
                                    if (nodeRunData.length) {
                                        // In the UI preview itemIndex is always 0, but guard against
                                        // out-of-bounds access in case that assumption ever changes.
                                        if (itemIndex >= nodeRunData.length) {
                                            throw createExpressionError(`"${nodeName}" node has ${nodeRunData.length} item(s) but expression references item ${itemIndex}`, { itemIndex });
                                        }
                                        return that.returnExecutionData(nodeRunData[itemIndex], resolveFullItem);
                                    }
                                }
                                const executionData = that.connectionInputData;
                                const input = executionData?.[itemIndex];
                                if (!input) {
                                    throw createExpressionError('Can’t get data for expression', {
                                        messageTemplate: 'Can’t get data for expression under ‘%%PARAMETER%%’ field',
                                        functionality: 'pairedItem',
                                        functionOverrides: {
                                            description: `Some intermediate nodes between ‘<strong>${nodeName}</strong>‘ and  ‘<strong>${that.activeNodeName}</strong>‘ have not executed yet.`,
                                            message: 'Can’t get data',
                                        },
                                        description: `Some intermediate nodes between ‘<strong>${nodeName}</strong>‘ and  ‘<strong>${that.activeNodeName}</strong>‘ have not executed yet.`,
                                        causeDetailed: `pairedItem can\'t be found when intermediate nodes between ‘<strong>${nodeName}</strong>‘ and  ‘<strong>${that.activeNodeName}</strong> have not executed yet.`,
                                        itemIndex,
                                        type: 'paired_item_intermediate_nodes',
                                    });
                                }
                                // As we operate on the incoming item we can be sure that pairedItem is not an
                                // array. After all can it only come from exactly one previous node via a certain
                                // input. For that reason do we not have to consider the array case.
                                const pairedItem = input.pairedItem;
                                if (pairedItem === undefined) {
                                    throw createMissingPairedItemError(that.activeNodeName, property);
                                }
                                if (!that.executeData?.source) {
                                    throw createExpressionError('Can’t get data for expression', {
                                        messageTemplate: 'Can’t get data for expression under ‘%%PARAMETER%%’ field',
                                        functionality: 'pairedItem',
                                        functionOverrides: {
                                            message: 'Can’t get data',
                                        },
                                        description: 'Apologies, this is an internal error. See details for more information',
                                        causeDetailed: 'Missing sourceData (probably an internal error)',
                                        itemIndex,
                                    });
                                }
                                const sourceData = that.executeData.source.main[pairedItem.input || 0] ??
                                    that.executeData.source.main[0];
                                return that.returnExecutionData(getPairedItem(nodeName, sourceData, pairedItem, property), resolveFullItem);
                            };
                            if (property === PAIRED_ITEM_METHOD.ITEM) {
                                return pairedItemMethod();
                            }
                            return pairedItemMethod;
                        }
                        if (property === 'first') {
                            ensureNodeExecutionData();
                            return (branchIndex, runIndex) => {
                                branchIndex =
                                    branchIndex ??
                                        // default to the output the active node is connected to
                                        that.workflow.getNodeConnectionIndexes(that.activeNodeName, nodeName)
                                            ?.sourceIndex ??
                                        0;
                                const executionData = that.getNodeExecutionOrPinnedData({
                                    nodeName,
                                    branchIndex,
                                    runIndex,
                                });
                                if (executionData[0])
                                    return that.returnExecutionData(executionData[0], resolveFullItem);
                                return undefined;
                            };
                        }
                        if (property === 'last') {
                            ensureNodeExecutionData();
                            return (branchIndex, runIndex) => {
                                branchIndex =
                                    branchIndex ??
                                        // default to the output the active node is connected to
                                        that.workflow.getNodeConnectionIndexes(that.activeNodeName, nodeName)
                                            ?.sourceIndex ??
                                        0;
                                const executionData = that.getNodeExecutionOrPinnedData({
                                    nodeName,
                                    branchIndex,
                                    runIndex,
                                });
                                if (!executionData.length)
                                    return undefined;
                                if (executionData[executionData.length - 1]) {
                                    return that.returnExecutionData(executionData[executionData.length - 1], resolveFullItem);
                                }
                                return undefined;
                            };
                        }
                        if (property === 'all') {
                            ensureNodeExecutionData();
                            return (branchIndex, runIndex) => {
                                branchIndex =
                                    branchIndex ??
                                        // default to the output the active node is connected to
                                        that.workflow.getNodeConnectionIndexes(that.activeNodeName, nodeName)
                                            ?.sourceIndex ??
                                        0;
                                return that.returnExecutionData(that.getNodeExecutionOrPinnedData({
                                    nodeName,
                                    branchIndex,
                                    runIndex,
                                }), resolveFullItem);
                            };
                        }
                        if (property === 'context') {
                            return that.nodeContextGetter(nodeName);
                        }
                        if (property === 'params') {
                            return that.workflow.getNode(nodeName)?.parameters;
                        }
                        return Reflect.get(target, property, receiver);
                    },
                });
            },
            $input: new Proxy({}, {
                has: () => true,
                ownKeys() {
                    return ['all', 'context', 'first', 'item', 'last', 'params'];
                },
                getOwnPropertyDescriptor() {
                    return {
                        enumerable: true,
                        configurable: true,
                    };
                },
                get(target, property, receiver) {
                    if (property === 'isProxy')
                        return true;
                    if (that.connectionInputData.length === 0) {
                        throw createExpressionError('No execution data available', {
                            runIndex: that.runIndex,
                            itemIndex: that.itemIndex,
                            type: 'no_execution_data',
                        });
                    }
                    if (property === 'item') {
                        return that.returnExecutionData(that.connectionInputData[that.itemIndex]);
                    }
                    if (property === 'first') {
                        return (...args) => {
                            if (args.length) {
                                throw createExpressionError("$input.first() takes no arguments. To get items from a specific upstream node, use $('NodeName').first() (or $('NodeName').all() for every item).");
                            }
                            const result = that.connectionInputData;
                            if (result[0]) {
                                return that.returnExecutionData(result[0]);
                            }
                            return undefined;
                        };
                    }
                    if (property === 'last') {
                        return (...args) => {
                            if (args.length) {
                                throw createExpressionError("$input.last() takes no arguments. To get items from a specific upstream node, use $('NodeName').last() (or $('NodeName').all() for every item).");
                            }
                            const result = that.connectionInputData;
                            if (result.length && result[result.length - 1]) {
                                return that.returnExecutionData(result[result.length - 1]);
                            }
                            return undefined;
                        };
                    }
                    if (property === 'all') {
                        return () => {
                            const result = that.connectionInputData;
                            if (result.length) {
                                return that.returnExecutionData(result);
                            }
                            return [];
                        };
                    }
                    if (['context', 'params'].includes(property)) {
                        // For the following properties we need the source data so fail in case it is missing
                        // for some reason (even though that should actually never happen)
                        if (!that.executeData?.source) {
                            throw createExpressionError('Can’t get data for expression', {
                                messageTemplate: 'Can’t get data for expression under ‘%%PARAMETER%%’ field',
                                functionOverrides: {
                                    message: 'Can’t get data',
                                },
                                description: 'Apologies, this is an internal error. See details for more information',
                                causeDetailed: 'Missing sourceData (probably an internal error)',
                                runIndex: that.runIndex,
                            });
                        }
                        const sourceData = that.executeData.source.main[0];
                        if (property === 'context') {
                            return that.nodeContextGetter(sourceData.previousNode);
                        }
                        if (property === 'params') {
                            return that.workflow.getNode(sourceData.previousNode)?.parameters;
                        }
                    }
                    return Reflect.get(target, property, receiver);
                },
            }),
            $binary: {}, // Placeholder
            $data: {}, // Placeholder
            $env: (0, workflow_data_proxy_env_provider_1.createEnvProvider)(that.runIndex, that.itemIndex, that.envProviderState ?? (0, workflow_data_proxy_env_provider_1.createEnvProviderState)()),
            $evaluateExpression: (expression, itemIndex) => {
                if (!isCodeGenerationAllowed()) {
                    throw new expression_error_1.ExpressionError("$evaluateExpression can't be used in the Code node while task runners run in secure mode", {
                        description: 'Secure-mode task runners disable evaluating strings as code, which expressions rely on. Evaluate the expression in a node field instead, for example an Edit Fields (Set) node before the Code node.',
                    });
                }
                itemIndex = itemIndex || that.itemIndex;
                return that.workflow.expression.getParameterValue(`=${expression}`, that.runExecutionData, that.runIndex, itemIndex, that.activeNodeName, that.connectionInputData, that.mode, that.additionalKeys, that.executeData, false, {}, that.contextNodeName);
            },
            // this is legacy syntax that is not documented
            $item: (itemIndex, runIndex) => {
                const defaultReturnRunIndex = runIndex === undefined ? -1 : runIndex;
                const dataProxy = new WorkflowDataProxy(this.workflow, this.runExecutionData, this.runIndex, itemIndex, this.activeNodeName, this.connectionInputData, that.siblingParameters, that.mode, that.additionalKeys, that.executeData, defaultReturnRunIndex, {}, that.contextNodeName);
                return dataProxy.getDataProxy();
            },
            $fromAI: handleFromAi,
            // Make sure mis-capitalized $fromAI is handled correctly even though we don't auto-complete it
            $fromai: handleFromAi,
            $fromAi: handleFromAi,
            // this is a legacy syntax that is not documented
            $items: (nodeName, outputIndex, runIndex) => {
                if (nodeName === undefined) {
                    nodeName = that.prevNodeGetter().name;
                    const node = this.workflow.nodes[nodeName];
                    let result = that.connectionInputData;
                    if (node.executeOnce === true) {
                        result = result.slice(0, 1);
                    }
                    if (result.length) {
                        return result;
                    }
                    return [];
                }
                outputIndex = outputIndex || 0;
                runIndex = runIndex === undefined ? -1 : runIndex;
                return that.getNodeExecutionData(nodeName, false, outputIndex, runIndex);
            },
            $tool: {}, // Placeholder
            $json: {}, // Placeholder
            $node: this.nodeGetter(),
            $self: this.selfGetter(),
            $parameter: this.nodeParameterGetter(this.activeNodeName),
            $rawParameter: this.nodeParameterGetter(this.activeNodeName, false),
            $prevNode: this.prevNodeGetter(),
            $runIndex: this.runIndex,
            $mode: this.mode,
            $workflow: this.workflowGetter(),
            $itemIndex: this.itemIndex,
            $now: luxon_1.DateTime.now(),
            $today: luxon_1.DateTime.now().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }),
            $jmesPath: jmespathWrapper,
            DateTime: luxon_1.DateTime,
            Interval: luxon_1.Interval,
            Duration: luxon_1.Duration,
            ...that.additionalKeys,
            $getPairedItem: getPairedItem,
            // deprecated
            $jmespath: jmespathWrapper,
            $position: this.itemIndex,
            $thisItem: that.connectionInputData[that.itemIndex],
            $thisItemIndex: this.itemIndex,
            $thisRunIndex: this.runIndex,
            $nodeVersion: that.workflow.getNode(that.activeNodeName)?.typeVersion,
            $nodeId: that.workflow.getNode(that.activeNodeName)?.id,
            $agentInfo: this.agentInfo(),
            $webhookId: that.workflow.getNode(that.activeNodeName)?.webhookId,
        };
        const throwOnMissingExecutionData = opts?.throwOnMissingExecutionData ?? true;
        return new Proxy(base, {
            has: () => true,
            get(target, name, receiver) {
                if (name === 'isProxy')
                    return true;
                const JSON_ACCESS_KEYS = ['$data', '$json'];
                if (that.workflow.settings?.binaryMode === constants_1.BINARY_MODE_COMBINED) {
                    JSON_ACCESS_KEYS.push('$item');
                }
                if (typeof name === 'string' && JSON_ACCESS_KEYS.includes(name)) {
                    return that.nodeDataGetter(that.contextNodeName, true, throwOnMissingExecutionData)?.json;
                }
                if (name === '$binary') {
                    return that.nodeDataGetter(that.contextNodeName, true, throwOnMissingExecutionData)
                        ?.binary;
                }
                if (name === '$tool') {
                    return handleTool(throwOnMissingExecutionData);
                }
                return Reflect.get(target, name, receiver);
            },
        });
    }
}
exports.WorkflowDataProxy = WorkflowDataProxy;
//# sourceMappingURL=workflow-data-proxy.js.map