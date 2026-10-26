"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowExpression = void 0;
const expression_1 = require("./expression.js");
const expression_helpers_1 = require("./expressions/expression-helpers.js");
const run_execution_data_factory_1 = require("./run-execution-data-factory.js");
const workflow_data_proxy_1 = require("./workflow-data-proxy.js");
class WorkflowExpression {
    workflow;
    expression;
    constructor(workflow) {
        this.workflow = workflow;
        this.expression = new expression_1.Expression(workflow.timezone);
    }
    /**
     * Resolves the parameter value.  If it is an expression it will execute it and
     * return the result. For everything simply the supplied value will be returned.
     */
    resolveSimpleParameterValue(parameterValue, siblingParameters, runExecutionData, runIndex, itemIndex, activeNodeName, connectionInputData, mode, additionalKeys, executeData, returnObjectAsString = false, selfData = {}, contextNodeName) {
        if (!(0, expression_helpers_1.isExpression)(parameterValue)) {
            return parameterValue;
        }
        const dataProxy = new workflow_data_proxy_1.WorkflowDataProxy(this.workflow, runExecutionData, runIndex, itemIndex, activeNodeName, connectionInputData, siblingParameters, mode, additionalKeys, executeData, -1, selfData, contextNodeName);
        const data = dataProxy.getDataProxy();
        return this.expression.resolveSimpleParameterValue(parameterValue, data, returnObjectAsString);
    }
    /**
     * Returns the resolved node parameter value. If it is an expression it will execute it and
     * return the result. If the value to resolve is an array or object it will do the same
     * for all of the items and values.
     */
    getParameterValue(parameterValue, runExecutionData, runIndex, itemIndex, activeNodeName, connectionInputData, mode, additionalKeys, executeData, returnObjectAsString = false, selfData = {}, contextNodeName) {
        // Helper function which returns true when the parameter is a complex one or array
        const isComplexParameter = (value) => {
            return typeof value === 'object';
        };
        // Helper function which resolves a parameter value depending on if it is simply or not
        const resolveParameterValue = (value, siblingParameters) => {
            if (isComplexParameter(value)) {
                return this.getParameterValue(value, runExecutionData, runIndex, itemIndex, activeNodeName, connectionInputData, mode, additionalKeys, executeData, returnObjectAsString, selfData, contextNodeName);
            }
            return this.resolveSimpleParameterValue(value, siblingParameters, runExecutionData, runIndex, itemIndex, activeNodeName, connectionInputData, mode, additionalKeys, executeData, returnObjectAsString, selfData, contextNodeName);
        };
        // Early return for simple non-expression values (performance optimization + timezone correctness)
        if (!isComplexParameter(parameterValue)) {
            return this.resolveSimpleParameterValue(parameterValue, {}, runExecutionData, runIndex, itemIndex, activeNodeName, connectionInputData, mode, additionalKeys, executeData, returnObjectAsString, selfData, contextNodeName);
        }
        // Handle arrays - recursively resolve each element
        if (Array.isArray(parameterValue)) {
            // Data is an array
            const returnData = parameterValue.map((item) => resolveParameterValue(item, {}));
            return returnData;
        }
        // Handle null/undefined
        if (parameterValue === null || parameterValue === undefined) {
            return parameterValue;
        }
        if (typeof parameterValue !== 'object') {
            return {};
        }
        // Data is an object
        const returnData = {};
        for (const [key, value] of Object.entries(parameterValue)) {
            returnData[key] = resolveParameterValue(value, parameterValue);
        }
        if (returnObjectAsString && typeof returnData === 'object') {
            return this.convertObjectValueToString(returnData);
        }
        return returnData;
    }
    /**
     * Resolves value of parameter. But does not work for workflow-data.
     */
    getSimpleParameterValue(node, parameterValue, mode, additionalKeys, executeData, defaultValue) {
        if (parameterValue === undefined) {
            return defaultValue;
        }
        const runIndex = 0;
        const itemIndex = 0;
        const connectionInputData = [];
        const runData = (0, run_execution_data_factory_1.createEmptyRunExecutionData)();
        return this.getParameterValue(parameterValue, runData, runIndex, itemIndex, node.name, connectionInputData, mode, additionalKeys, executeData);
    }
    /**
     * Resolves value of complex parameter. But does not work for workflow-data.
     */
    getComplexParameterValue(node, parameterValue, mode, additionalKeys, executeData, defaultValue = undefined, selfData = {}) {
        if (parameterValue === undefined) {
            return defaultValue;
        }
        const runIndex = 0;
        const itemIndex = 0;
        const connectionInputData = [];
        const runData = (0, run_execution_data_factory_1.createEmptyRunExecutionData)();
        const returnData = this.getParameterValue(parameterValue, runData, runIndex, itemIndex, node.name, connectionInputData, mode, additionalKeys, executeData, false, selfData);
        return this.getParameterValue(returnData, runData, runIndex, itemIndex, node.name, connectionInputData, mode, additionalKeys, executeData, false, selfData);
    }
    convertObjectValueToString(value) {
        return this.expression.convertObjectValueToString(value);
    }
    async acquireIsolate() {
        await this.expression.acquireIsolate();
    }
    async releaseIsolate() {
        await this.expression.releaseIsolate();
    }
}
exports.WorkflowExpression = WorkflowExpression;
//# sourceMappingURL=workflow-expression.js.map