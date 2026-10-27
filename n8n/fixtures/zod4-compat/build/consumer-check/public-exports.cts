import type { LogMetadata, IWorkflowBase, INode } from 'n8n-workflow';
import type { IExpressionEvaluator } from '@n8n/expression-runtime';
import type { getNodeByName } from 'n8n-workflow/common';

const metadata: LogMetadata = { scopes: ['metrics', 'workflow-publication'] };
declare const workflow: IWorkflowBase;
declare const node: INode;
declare const evaluator: IExpressionEvaluator | undefined;
declare const lookup: typeof getNodeByName;

// @ts-expect-error invalid LogScope must be rejected by the public declaration.
const invalid: LogMetadata = { scopes: ['not-a-real-scope'] };
void metadata; void workflow; void node; void evaluator; void lookup; void invalid;
