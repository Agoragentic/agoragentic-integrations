"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeConnectionTypes = exports.NodeConnectionTypes = exports.Node = exports.ChatNodeMessageType = exports.ICredentialsHelper = exports.ICredentials = void 0;
exports.isNodeClassInstance = isNodeClassInstance;
class ICredentials {
    id;
    name;
    type;
    data;
    constructor(nodeCredentials, type, data) {
        this.id = nodeCredentials.id ?? undefined;
        this.name = nodeCredentials.name;
        this.type = type;
        this.data = data;
    }
}
exports.ICredentials = ICredentials;
class ICredentialsHelper {
}
exports.ICredentialsHelper = ICredentialsHelper;
const __brand = Symbol('resolvedFilePath');
exports.ChatNodeMessageType = {
    WITH_BUTTONS: 'with-buttons',
};
/**
 * Tag identifying `Node` subclasses. `Symbol.for` interns into the global symbol
 * registry, so every copy of `n8n-workflow` loaded in the same process resolves the identical
 * symbol, regardless of the dependency tree layout.
 */
const NODE_CLASS_TAG = Symbol.for('n8n.workflow.NodeClass');
/**
 * This class serves as the base for all nodes using the new context API
 * having this as a class enables us to identify these instances at runtime
 */
class Node {
    get [NODE_CLASS_TAG]() {
        return true;
    }
}
exports.Node = Node;
/**
 * Returns `true` when `nodeType` is an instance of a `Node` subclass (a node using the new
 * context API). Prefer this over `nodeType instanceof Node` at runtime: it survives
 * `n8n-workflow` module duplication, which breaks `instanceof`.
 */
function isNodeClassInstance(nodeType) {
    return typeof nodeType === 'object' && nodeType !== null && NODE_CLASS_TAG in nodeType;
}
exports.NodeConnectionTypes = {
    AiAgent: 'ai_agent',
    AiChain: 'ai_chain',
    AiDocument: 'ai_document',
    AiEmbedding: 'ai_embedding',
    AiLanguageModel: 'ai_languageModel',
    AiMemory: 'ai_memory',
    AiOutputParser: 'ai_outputParser',
    AiRetriever: 'ai_retriever',
    AiReranker: 'ai_reranker',
    AiTextSplitter: 'ai_textSplitter',
    AiTool: 'ai_tool',
    AiVectorStore: 'ai_vectorStore',
    Main: 'main',
};
exports.nodeConnectionTypes = Object.values(exports.NodeConnectionTypes);
//# sourceMappingURL=interfaces.js.map