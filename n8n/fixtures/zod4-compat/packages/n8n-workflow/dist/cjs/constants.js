"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MANUAL_CHAT_TRIGGER_LANGCHAIN_NODE_TYPE = exports.NODES_WITH_RENAMEABLE_TOPLEVEL_HTML_CONTENT = exports.NODES_WITH_RENAMABLE_FORM_HTML_CONTENT = exports.NODES_WITH_RENAMABLE_CONTENT = exports.ADD_FORM_NOTICE = exports.DATA_TABLE_NODE_TYPES = exports.SCRIPTING_NODE_TYPES = exports.STARTING_NODE_TYPES = exports.DATA_TABLE_TOOL_NODE_TYPE = exports.DATA_TABLE_NODE_TYPE = exports.SCHEDULE_TRIGGER_NODE_TYPE = exports.MICROSOFT_AGENT365_TRIGGER_NODE_TYPE = exports.MYSQL_NODE_TYPE = exports.POSTGRES_NODE_TYPE = exports.MAILGUN_NODE_TYPE = exports.HTML_NODE_TYPE = exports.RESPOND_TO_WEBHOOK_NODE_TYPE = exports.WAIT_NODE_TYPE = exports.FORM_TRIGGER_NODE_TYPE = exports.FORM_NODE_TYPE = exports.AI_TRANSFORM_NODE_TYPE = exports.MERGE_NODE_TYPE = exports.FUNCTION_ITEM_NODE_TYPE = exports.FUNCTION_NODE_TYPE = exports.CODE_NODE_TYPE = exports.EXECUTE_WORKFLOW_TRIGGER_NODE_TYPE = exports.EXECUTE_WORKFLOW_NODE_TYPE = exports.ERROR_TRIGGER_NODE_TYPE = exports.EVALUATION_NODE_TYPE = exports.EVALUATION_TRIGGER_NODE_TYPE = exports.MANUAL_TRIGGER_NODE_TYPE = exports.WEBHOOK_NODE_TYPE = exports.HTTP_REQUEST_NODE_TYPE = exports.NO_OP_NODE_TYPE = exports.STICKY_NODE_TYPE = exports.UNKNOWN_ERROR_MESSAGE_CRED = exports.UNKNOWN_ERROR_DESCRIPTION = exports.UNKNOWN_ERROR_MESSAGE = exports.FORM_TRIGGER_PATH_IDENTIFIER = exports.CREDENTIAL_BLANKING_VALUE = exports.CREDENTIAL_EMPTY_VALUE = exports.CODE_EXECUTION_MODES = exports.CODE_LANGUAGES = exports.LOG_LEVELS = exports.WAIT_INDEFINITELY = exports.BINARY_ENCODING = exports.ALPHABET = exports.LOWERCASE_LETTERS = exports.UPPERCASE_LETTERS = exports.DIGITS = void 0;
exports.BINARY_MODE_COMBINED = exports.BINARY_MODE_SEPARATE = exports.BINARY_IN_JSON_PROPERTY = exports.FREE_TEXT_CHAT_RESPONSE_TYPE = exports.CHAT_WAIT_USER_REPLY = exports.WAITING_FORMS_EXECUTION_STATUS = exports.PROJECT_ROOT = exports.FROM_AI_AUTO_GENERATED_MARKER = exports.FREE_AI_CREDITS_USED_ALL_CREDITS_ERROR_CODE = exports.FREE_AI_CREDITS_ERROR_TYPE = exports.OPEN_AI_API_CREDENTIAL_TYPE = exports.TRIMMED_TASK_DATA_CONNECTIONS_KEY = exports.AI_TRANSFORM_JS_CODE = exports.AI_TRANSFORM_CODE_GENERATED_FOR_PROMPT = exports.SEND_AND_WAIT_OPERATION = exports.LANGCHAIN_CUSTOM_TOOLS = exports.DOCUMENT_DEFAULT_DATA_LOADER_NODE_TYPE = exports.CHAT_HUB_VECTOR_STORE_PINECONE_NODE_TYPE = exports.CHAT_HUB_VECTOR_STORE_QDRANT_NODE_TYPE = exports.CHAT_HUB_VECTOR_STORE_PG_VECTOR_NODE_TYPE = exports.LANGCHAIN_LM_NODE_TYPE_PREFIX = exports.AI_VENDOR_NODE_TYPES = exports.MANUAL_TRIGGER_NODE_TYPES = exports.MINIMAX_LANGCHAIN_NODE_TYPE = exports.MOONSHOT_LANGCHAIN_NODE_TYPE = exports.ALIBABA_CLOUD_LANGCHAIN_NODE_TYPE = exports.GOOGLE_GEMINI_LANGCHAIN_NODE_TYPE = exports.OLLAMA_LANGCHAIN_NODE_TYPE = exports.ANTHROPIC_LANGCHAIN_NODE_TYPE = exports.MCP_TRIGGER_NODE_TYPE = exports.MCP_CLIENT_NODE_TYPE = exports.MCP_CLIENT_TOOL_NODE_TYPE = exports.GUARDRAILS_NODE_TYPE = exports.MEMORY_BUFFER_WINDOW_NODE_TYPE = exports.MEMORY_MANAGER_NODE_TYPE = exports.CHAT_TOOL_NODE_TYPE = exports.CHAT_NODE_TYPE = exports.CHAT_TRIGGER_NODE_TYPE = exports.HTTP_REQUEST_TOOL_LANGCHAIN_NODE_TYPE = exports.WORKFLOW_TOOL_LANGCHAIN_NODE_TYPE = exports.CODE_TOOL_LANGCHAIN_NODE_TYPE = exports.AGENT_TOOL_LANGCHAIN_NODE_TYPE = exports.CHAIN_SUMMARIZATION_LANGCHAIN_NODE_TYPE = exports.OPENAI_CHAT_LANGCHAIN_NODE_TYPE = exports.OPENAI_LANGCHAIN_NODE_TYPE = exports.CHAIN_LLM_LANGCHAIN_NODE_TYPE = exports.AGENT_LANGCHAIN_NODE_TYPE = void 0;
exports.DIGITS = '0123456789';
exports.UPPERCASE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
exports.LOWERCASE_LETTERS = exports.UPPERCASE_LETTERS.toLowerCase();
exports.ALPHABET = [exports.DIGITS, exports.UPPERCASE_LETTERS, exports.LOWERCASE_LETTERS].join('');
exports.BINARY_ENCODING = 'base64';
exports.WAIT_INDEFINITELY = new Date('3000-01-01T00:00:00.000Z');
exports.LOG_LEVELS = ['silent', 'error', 'warn', 'info', 'debug'];
exports.CODE_LANGUAGES = ['javaScript', 'python', 'json', 'html'];
exports.CODE_EXECUTION_MODES = ['runOnceForAllItems', 'runOnceForEachItem'];
// Arbitrary value to represent an empty credential value
exports.CREDENTIAL_EMPTY_VALUE = '__n8n_EMPTY_VALUE_7b1af746-3729-4c60-9b9b-e08eb29e58da';
// Value used when redacting sensitive credential data for the client (never sent decrypted)
exports.CREDENTIAL_BLANKING_VALUE = '__n8n_BLANK_VALUE_e5362baf-c777-4d57-a609-6eaf1f9e87f6';
exports.FORM_TRIGGER_PATH_IDENTIFIER = 'n8n-form';
exports.UNKNOWN_ERROR_MESSAGE = 'There was an unknown issue while executing the node';
exports.UNKNOWN_ERROR_DESCRIPTION = 'Double-check the node configuration and the service it connects to. Check the error details below and refer to the <a href="https://docs.n8n.io" target="_blank">n8n documentation</a> to troubleshoot the issue.';
exports.UNKNOWN_ERROR_MESSAGE_CRED = 'UNKNOWN ERROR';
//n8n-nodes-base
exports.STICKY_NODE_TYPE = 'n8n-nodes-base.stickyNote';
exports.NO_OP_NODE_TYPE = 'n8n-nodes-base.noOp';
exports.HTTP_REQUEST_NODE_TYPE = 'n8n-nodes-base.httpRequest';
exports.WEBHOOK_NODE_TYPE = 'n8n-nodes-base.webhook';
exports.MANUAL_TRIGGER_NODE_TYPE = 'n8n-nodes-base.manualTrigger';
exports.EVALUATION_TRIGGER_NODE_TYPE = 'n8n-nodes-base.evaluationTrigger';
exports.EVALUATION_NODE_TYPE = 'n8n-nodes-base.evaluation';
exports.ERROR_TRIGGER_NODE_TYPE = 'n8n-nodes-base.errorTrigger';
exports.EXECUTE_WORKFLOW_NODE_TYPE = 'n8n-nodes-base.executeWorkflow';
exports.EXECUTE_WORKFLOW_TRIGGER_NODE_TYPE = 'n8n-nodes-base.executeWorkflowTrigger';
exports.CODE_NODE_TYPE = 'n8n-nodes-base.code';
exports.FUNCTION_NODE_TYPE = 'n8n-nodes-base.function';
exports.FUNCTION_ITEM_NODE_TYPE = 'n8n-nodes-base.functionItem';
exports.MERGE_NODE_TYPE = 'n8n-nodes-base.merge';
exports.AI_TRANSFORM_NODE_TYPE = 'n8n-nodes-base.aiTransform';
exports.FORM_NODE_TYPE = 'n8n-nodes-base.form';
exports.FORM_TRIGGER_NODE_TYPE = 'n8n-nodes-base.formTrigger';
exports.WAIT_NODE_TYPE = 'n8n-nodes-base.wait';
exports.RESPOND_TO_WEBHOOK_NODE_TYPE = 'n8n-nodes-base.respondToWebhook';
exports.HTML_NODE_TYPE = 'n8n-nodes-base.html';
exports.MAILGUN_NODE_TYPE = 'n8n-nodes-base.mailgun';
exports.POSTGRES_NODE_TYPE = 'n8n-nodes-base.postgres';
exports.MYSQL_NODE_TYPE = 'n8n-nodes-base.mySql';
exports.MICROSOFT_AGENT365_TRIGGER_NODE_TYPE = '@n8n/n8n-nodes-langchain.microsoftAgent365Trigger';
exports.SCHEDULE_TRIGGER_NODE_TYPE = 'n8n-nodes-base.scheduleTrigger';
exports.DATA_TABLE_NODE_TYPE = 'n8n-nodes-base.dataTable';
exports.DATA_TABLE_TOOL_NODE_TYPE = 'n8n-nodes-base.dataTableTool';
exports.STARTING_NODE_TYPES = [
    exports.MANUAL_TRIGGER_NODE_TYPE,
    exports.EXECUTE_WORKFLOW_TRIGGER_NODE_TYPE,
    exports.ERROR_TRIGGER_NODE_TYPE,
    exports.EVALUATION_TRIGGER_NODE_TYPE,
    exports.FORM_TRIGGER_NODE_TYPE,
];
exports.SCRIPTING_NODE_TYPES = [
    exports.FUNCTION_NODE_TYPE,
    exports.FUNCTION_ITEM_NODE_TYPE,
    exports.CODE_NODE_TYPE,
    exports.AI_TRANSFORM_NODE_TYPE,
];
exports.DATA_TABLE_NODE_TYPES = [
    exports.DATA_TABLE_NODE_TYPE,
    exports.DATA_TABLE_TOOL_NODE_TYPE,
    exports.EVALUATION_TRIGGER_NODE_TYPE,
    exports.EVALUATION_NODE_TYPE,
];
exports.ADD_FORM_NOTICE = 'addFormPage';
/**
 * Nodes whose parameter values may refer to other nodes without expressions.
 * Their content may need to be updated when the referenced node is renamed.
 */
exports.NODES_WITH_RENAMABLE_CONTENT = new Set([
    exports.CODE_NODE_TYPE,
    exports.FUNCTION_NODE_TYPE,
    exports.FUNCTION_ITEM_NODE_TYPE,
    exports.AI_TRANSFORM_NODE_TYPE,
]);
exports.NODES_WITH_RENAMABLE_FORM_HTML_CONTENT = new Set([exports.FORM_NODE_TYPE]);
exports.NODES_WITH_RENAMEABLE_TOPLEVEL_HTML_CONTENT = new Set([
    exports.MAILGUN_NODE_TYPE,
    exports.HTML_NODE_TYPE,
]);
//@n8n/n8n-nodes-langchain
exports.MANUAL_CHAT_TRIGGER_LANGCHAIN_NODE_TYPE = '@n8n/n8n-nodes-langchain.manualChatTrigger';
exports.AGENT_LANGCHAIN_NODE_TYPE = '@n8n/n8n-nodes-langchain.agent';
exports.CHAIN_LLM_LANGCHAIN_NODE_TYPE = '@n8n/n8n-nodes-langchain.chainLlm';
exports.OPENAI_LANGCHAIN_NODE_TYPE = '@n8n/n8n-nodes-langchain.openAi';
exports.OPENAI_CHAT_LANGCHAIN_NODE_TYPE = '@n8n/n8n-nodes-langchain.lmChatOpenAi';
exports.CHAIN_SUMMARIZATION_LANGCHAIN_NODE_TYPE = '@n8n/n8n-nodes-langchain.chainSummarization';
exports.AGENT_TOOL_LANGCHAIN_NODE_TYPE = '@n8n/n8n-nodes-langchain.agentTool';
exports.CODE_TOOL_LANGCHAIN_NODE_TYPE = '@n8n/n8n-nodes-langchain.toolCode';
exports.WORKFLOW_TOOL_LANGCHAIN_NODE_TYPE = '@n8n/n8n-nodes-langchain.toolWorkflow';
exports.HTTP_REQUEST_TOOL_LANGCHAIN_NODE_TYPE = '@n8n/n8n-nodes-langchain.toolHttpRequest';
exports.CHAT_TRIGGER_NODE_TYPE = '@n8n/n8n-nodes-langchain.chatTrigger';
exports.CHAT_NODE_TYPE = '@n8n/n8n-nodes-langchain.chat';
exports.CHAT_TOOL_NODE_TYPE = '@n8n/n8n-nodes-langchain.chatTool';
exports.MEMORY_MANAGER_NODE_TYPE = '@n8n/n8n-nodes-langchain.memoryManager';
exports.MEMORY_BUFFER_WINDOW_NODE_TYPE = '@n8n/n8n-nodes-langchain.memoryBufferWindow';
exports.GUARDRAILS_NODE_TYPE = '@n8n/n8n-nodes-langchain.guardrails';
exports.MCP_CLIENT_TOOL_NODE_TYPE = '@n8n/n8n-nodes-langchain.mcpClientTool';
exports.MCP_CLIENT_NODE_TYPE = '@n8n/n8n-nodes-langchain.mcpClient';
exports.MCP_TRIGGER_NODE_TYPE = '@n8n/n8n-nodes-langchain.mcpTrigger';
exports.ANTHROPIC_LANGCHAIN_NODE_TYPE = '@n8n/n8n-nodes-langchain.anthropic';
exports.OLLAMA_LANGCHAIN_NODE_TYPE = '@n8n/n8n-nodes-langchain.ollama';
exports.GOOGLE_GEMINI_LANGCHAIN_NODE_TYPE = '@n8n/n8n-nodes-langchain.googleGemini';
exports.ALIBABA_CLOUD_LANGCHAIN_NODE_TYPE = '@n8n/n8n-nodes-langchain.alibabaCloud';
exports.MOONSHOT_LANGCHAIN_NODE_TYPE = '@n8n/n8n-nodes-langchain.moonshot';
exports.MINIMAX_LANGCHAIN_NODE_TYPE = '@n8n/n8n-nodes-langchain.minimax';
// Trigger types that execute with a manual-user identity. Used to gate
// features (like private credentials) that depend on per-user runtime state.
exports.MANUAL_TRIGGER_NODE_TYPES = [
    exports.MANUAL_TRIGGER_NODE_TYPE,
    exports.MANUAL_CHAT_TRIGGER_LANGCHAIN_NODE_TYPE,
    exports.CHAT_TRIGGER_NODE_TYPE,
    exports.MCP_TRIGGER_NODE_TYPE,
];
exports.AI_VENDOR_NODE_TYPES = [
    exports.OPENAI_LANGCHAIN_NODE_TYPE,
    exports.ANTHROPIC_LANGCHAIN_NODE_TYPE,
    exports.OLLAMA_LANGCHAIN_NODE_TYPE,
    exports.GOOGLE_GEMINI_LANGCHAIN_NODE_TYPE,
    exports.ALIBABA_CLOUD_LANGCHAIN_NODE_TYPE,
    exports.MOONSHOT_LANGCHAIN_NODE_TYPE,
    exports.MINIMAX_LANGCHAIN_NODE_TYPE,
];
exports.LANGCHAIN_LM_NODE_TYPE_PREFIX = '@n8n/n8n-nodes-langchain.lm';
exports.CHAT_HUB_VECTOR_STORE_PG_VECTOR_NODE_TYPE = '@n8n/n8n-nodes-langchain.chatHubVectorStorePGVector';
exports.CHAT_HUB_VECTOR_STORE_QDRANT_NODE_TYPE = '@n8n/n8n-nodes-langchain.chatHubVectorStoreQdrant';
exports.CHAT_HUB_VECTOR_STORE_PINECONE_NODE_TYPE = '@n8n/n8n-nodes-langchain.chatHubVectorStorePinecone';
exports.DOCUMENT_DEFAULT_DATA_LOADER_NODE_TYPE = '@n8n/n8n-nodes-langchain.documentDefaultDataLoader';
exports.LANGCHAIN_CUSTOM_TOOLS = [
    exports.CODE_TOOL_LANGCHAIN_NODE_TYPE,
    exports.WORKFLOW_TOOL_LANGCHAIN_NODE_TYPE,
    exports.HTTP_REQUEST_TOOL_LANGCHAIN_NODE_TYPE,
];
exports.SEND_AND_WAIT_OPERATION = 'sendAndWait';
exports.AI_TRANSFORM_CODE_GENERATED_FOR_PROMPT = 'codeGeneratedForPrompt';
exports.AI_TRANSFORM_JS_CODE = 'jsCode';
/**
 * Key for an item standing in for a manual execution data item too large to be
 * sent live via pubsub. See {@link TRIMMED_TASK_DATA_CONNECTIONS} in constants
 * in `cli` package.
 */
exports.TRIMMED_TASK_DATA_CONNECTIONS_KEY = '__isTrimmedManualExecutionDataItem';
exports.OPEN_AI_API_CREDENTIAL_TYPE = 'openAiApi';
exports.FREE_AI_CREDITS_ERROR_TYPE = 'free_ai_credits_request_error';
exports.FREE_AI_CREDITS_USED_ALL_CREDITS_ERROR_CODE = 400;
exports.FROM_AI_AUTO_GENERATED_MARKER = '/*n8n-auto-generated-fromAI-override*/';
exports.PROJECT_ROOT = '0';
exports.WAITING_FORMS_EXECUTION_STATUS = 'n8n-execution-status';
exports.CHAT_WAIT_USER_REPLY = 'waitUserReply';
exports.FREE_TEXT_CHAT_RESPONSE_TYPE = 'freeTextChat';
exports.BINARY_IN_JSON_PROPERTY = '_files';
exports.BINARY_MODE_SEPARATE = 'separate';
exports.BINARY_MODE_COMBINED = 'combined';
//# sourceMappingURL=constants.js.map