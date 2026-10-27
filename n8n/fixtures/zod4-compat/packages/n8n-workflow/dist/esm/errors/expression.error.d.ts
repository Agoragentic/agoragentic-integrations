import { ExecutionBaseError } from "./abstract/execution-base.error.js";
export interface ExpressionErrorOptions {
    cause?: Error;
    causeDetailed?: string;
    description?: string;
    descriptionKey?: string;
    descriptionTemplate?: string;
    functionality?: 'pairedItem';
    itemIndex?: number;
    messageTemplate?: string;
    nodeCause?: string;
    parameter?: string;
    runIndex?: number;
    type?: 'no_execution_data' | 'no_node_execution_data' | 'no_input_connection' | 'internal' | 'paired_item_invalid_info' | 'paired_item_no_info' | 'paired_item_multiple_matches' | 'paired_item_no_connection' | 'paired_item_intermediate_nodes';
}
/**
 * Class for instantiating an expression error
 */
export declare class ExpressionError extends ExecutionBaseError {
    constructor(message: string, options?: ExpressionErrorOptions);
}
//# sourceMappingURL=expression.error.d.ts.map