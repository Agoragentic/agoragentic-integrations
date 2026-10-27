import type { IContextObject, INode, INodeCredentialDescription, INodeIssues, INodeParameters, INodeProperties, INodePropertyCollection, INodePropertyOptions, INodeType, IParameterDependencies, IVersionedNodeType, NodeParameterValue, INodeTypeDescription, INodeOutputConfiguration, INodeInputConfiguration, DisplayCondition, NodeConnectionType, ICredentialDataDecryptedObject, NodeFeaturesDefinition, NodeFeatures } from "./interfaces.js";
import type { IRunExecutionData } from "./run-execution-data/run-execution-data.js";
import type { Workflow } from "./index.js";
type WorkflowForNodeHelpers = Pick<Workflow, 'expression'>;
export declare const cronNodeOptions: INodePropertyCollection[];
/**
 * Determines if the provided node type has any output types other than the main connection type.
 * @param typeDescription The node's type description to check.
 */
export declare function isSubNodeType(typeDescription: Pick<INodeTypeDescription, 'outputs'> | null): boolean;
/**
 * Evaluates all feature definitions for a node type and returns the computed features.
 * @param featuresDef The feature definitions from the node type description
 * @param nodeVersion The node version to evaluate against
 * @returns A record of feature names to their enabled state
 */
export declare function getNodeFeatures(featuresDef: NodeFeaturesDefinition | undefined, nodeVersion: number): NodeFeatures;
export declare const checkConditions: (conditions: Array<NodeParameterValue | DisplayCondition>, actualValues: NodeParameterValue[]) => boolean;
/**
 * Returns if the parameter should be displayed or not
 *
 * @param {INodeParameters} nodeValues The data on the node which decides if the parameter
 *                                    should be displayed
 * @param {(INodeProperties | INodeCredentialDescription)} parameter The parameter to check if it should be displayed
 * @param {INodeParameters} [nodeValuesRoot] The root node-parameter-data
 */
export declare function displayParameter(nodeValues: INodeParameters | ICredentialDataDecryptedObject, parameter: INodeProperties | INodeCredentialDescription | INodePropertyOptions, node: Pick<INode, 'typeVersion'> | null, // Allow null as it does also get used by credentials and they do not have versioning yet
nodeTypeDescription: INodeTypeDescription | null, nodeValuesRoot?: INodeParameters | ICredentialDataDecryptedObject, displayKey?: 'displayOptions' | 'disabledOptions'): boolean;
/**
 * Returns if the given parameter should be displayed or not considering the path
 * to the properties
 *
 * @param {INodeParameters} nodeValues The data on the node which decides if the parameter
 *                                    should be displayed
 * @param {(INodeProperties | INodeCredentialDescription)} parameter The parameter to check if it should be displayed
 * @param {string} path The path to the property
 */
export declare function displayParameterPath(nodeValues: INodeParameters, parameter: INodeProperties | INodeCredentialDescription | INodePropertyOptions, path: string, node: Pick<INode, 'typeVersion'> | null, nodeTypeDescription: INodeTypeDescription | null, displayKey?: 'displayOptions' | 'disabledOptions'): boolean;
/**
 * Returns the context data
 *
 * @param {IRunExecutionData} runExecutionData The run execution data
 * @param {string} type The data type. "node"/"flow"
 * @param {INode} [node] If type "node" is set the node to return the context of has to be supplied
 */
export declare function getContext(runExecutionData: IRunExecutionData, type: string, node?: INode): IContextObject;
type GetNodeParametersOptions = {
    onlySimpleTypes?: boolean;
    dataIsResolved?: boolean;
    nodeValuesRoot?: INodeParameters;
    parentType?: string;
    parameterDependencies?: IParameterDependencies;
};
/**
 * Returns the node parameter values. Depending on the settings it either just returns the none
 * default values or it applies all the default values.
 *
 * @param {INodeProperties[]} nodePropertiesArray The properties which exist and their settings
 * @param {INodeParameters} nodeValues The node parameter data
 * @param {boolean} returnDefaults If default values get added or only none default values returned
 * @param {boolean} returnNoneDisplayed If also values which should not be displayed should be returned
 * @param {GetNodeParametersOptions} options Optional properties
 */
export declare function getNodeParameters(nodePropertiesArray: INodeProperties[], nodeValues: INodeParameters | null, returnDefaults: boolean, returnNoneDisplayed: boolean, node: Pick<INode, 'typeVersion'> | null, nodeTypeDescription: INodeTypeDescription | null, options?: GetNodeParametersOptions): INodeParameters | null;
/**
 * Returns the webhook path
 */
export declare function getNodeWebhookPath(workflowId: string, node: INode, path: string, isFullPath?: boolean, restartWebhook?: boolean): string;
/**
 * Returns the webhook URL
 */
export declare function getNodeWebhookUrl(baseUrl: string, workflowId: string, node: INode, path: string, isFullPath?: boolean): string;
/**
 * Assigns a webhookId to a node if its type has webhook definitions
 * and the node doesn't already have one.
 */
export declare function resolveNodeWebhookId(node: Pick<INode, 'webhookId'>, nodeTypeDescription: Pick<INodeTypeDescription, 'webhooks'>): void;
export declare function getConnectionTypes(connections: Array<NodeConnectionType | INodeInputConfiguration | INodeOutputConfiguration>): NodeConnectionType[];
export declare function getNodeInputs(workflow: WorkflowForNodeHelpers, node: INode, nodeTypeData: INodeTypeDescription): Array<NodeConnectionType | INodeInputConfiguration>;
export declare function getNodeOutputs(workflow: WorkflowForNodeHelpers, node: INode, nodeTypeData: INodeTypeDescription): Array<NodeConnectionType | INodeOutputConfiguration>;
/**
 * Returns all the parameter-issues of the node
 *
 * @param {INodeProperties[]} nodePropertiesArray The properties of the node
 * @param {INode} node The data of the node
 */
export declare function getNodeParametersIssues(nodePropertiesArray: INodeProperties[], node: INode, nodeTypeDescription: INodeTypeDescription | null, pinDataNodeNames?: string[]): INodeIssues | null;
/**
 * Returns the node's issues as a flat list of human-readable strings,
 * covering execution errors, parameter/credential/input issues, and unknown node types.
 */
export declare function nodeIssuesToString(issues: INodeIssues, node?: INode): string[];
/**
 * Returns the parameter value
 *
 * @param {INodeParameters} nodeValues The values of the node
 * @param {string} parameterName The name of the parameter to return the value of
 * @param {string} path The path to the properties
 */
export declare function getParameterValueByPath(nodeValues: INodeParameters, parameterName: string, path: string): import("./interfaces.js").NodeParameterValueType;
/**
 * Returns all the issues with the given node-values
 *
 * @param {INodeProperties} nodeProperties The properties of the node
 * @param {INodeParameters} nodeValues The values of the node
 * @param {string} path The path to the properties
 */
export declare function getParameterIssues(nodeProperties: INodeProperties, nodeValues: INodeParameters, path: string, node: INode, nodeTypeDescription: INodeTypeDescription | null): INodeIssues;
/**
 * Merges multiple NodeIssues together
 *
 * @param {INodeIssues} destination The issues to merge into
 * @param {(INodeIssues | null)} source The issues to merge
 */
export declare function mergeIssues(destination: INodeIssues, source: INodeIssues | null): void;
/**
 * Merges the given node properties
 */
export declare function mergeNodeProperties(mainProperties: INodeProperties[], addProperties: INodeProperties[]): void;
export declare function getVersionedNodeType(object: IVersionedNodeType | INodeType, version?: number): INodeType;
export declare function isTriggerNode(nodeTypeData: INodeTypeDescription): boolean;
export declare function isExecutable(workflow: WorkflowForNodeHelpers, node: INode, nodeTypeData: INodeTypeDescription): boolean;
export declare function isNodeWithWorkflowSelector(node: INode): boolean;
/**
 * Generates a human-readable description for a node based on its parameters and type definition.
 *
 * This function creates a descriptive string that represents what the node does,
 * based on its resource, operation, and node type information. The description is
 * formatted in one of the following ways:
 *
 * 1. "{action} in {displayName}" if the operation has a defined action
 * 2. "{operation} {resource} in {displayName}" if resource and operation exist
 * 3. The node type's description field as a fallback
 */
export declare function makeDescription(nodeParameters: INodeParameters, nodeTypeDescription: INodeTypeDescription): string;
/**
 * Check if a node type is a trigger
 */
export declare function isTriggerNodeType(type: string): boolean;
export declare function isToolType(nodeType?: string, { includeHitl }?: {
    includeHitl?: boolean;
}): boolean;
export declare function isHitlToolType(nodeType?: string): boolean;
export declare function isTool(nodeTypeDescription: INodeTypeDescription, parameters: INodeParameters): boolean;
/**
 * Generates a resource and operation aware node name.
 *
 * Appends `in {nodeTypeDisplayName}` if nodeType is a tool
 *
 * 1. "{action}" if the operation has a defined action
 * 2. "{operation} {resource}" if resource and operation exist
 * 3. The node type's defaults.name field or displayName as a fallback
 */
export declare function makeNodeName(nodeParameters: INodeParameters, nodeTypeDescription: INodeTypeDescription): string;
/**
 * Returns true if the node name is of format `<defaultNodeName>\d*` , which includes auto-renamed nodes
 */
export declare function isDefaultNodeName(name: string, nodeType: INodeTypeDescription, parameters: INodeParameters): boolean;
/**
 * Determines whether a tool description should be updated and returns the new description if needed.
 * Returns undefined if no update is needed.
 */
export declare const getUpdatedToolDescription: (currentNodeType: INodeTypeDescription | null, newParameters: INodeParameters | null, currentParameters?: INodeParameters) => string | undefined;
/**
 * Generates a tool description for a given node based on its parameters and type.
 *
 * When the user-provided `toolDescription` is an n8n expression (starts with `=`),
 * the optional `resolveToolDescription` callback is used to evaluate it against
 * the upstream input data — matching how other tool nodes (e.g. `toolWorkflow`)
 * resolve their description parameter via `getNodeParameter`. Without a resolver,
 * the raw value is returned unchanged for backward compatibility.
 */
export declare function getToolDescriptionForNode(node: INode, nodeType: INodeType, resolveToolDescription?: () => string): string;
/**
 * Attempts to retrieve the ID of a subworkflow from a execute workflow node.
 */
export declare function getSubworkflowId(node: INode): string | undefined;
/**
 * Check if a node type accepts a specific input connection type
 * @param nodeType - The node type description
 * @param connectionType - The connection type to check (e.g., 'main', 'ai_tool')
 * @returns True if the node accepts the input type
 */
export declare function nodeAcceptsInputType(nodeType: INodeTypeDescription, connectionType: string): boolean;
/**
 * Check if a node type has a specific output connection type
 * @param nodeType - The node type description
 * @param connectionType - The connection type to check (e.g., 'main', 'ai_tool')
 * @returns True if the node supports the output type
 */
export declare function nodeHasOutputType(nodeType: INodeTypeDescription, connectionType: string): boolean;
export {};
//# sourceMappingURL=node-helpers.d.ts.map