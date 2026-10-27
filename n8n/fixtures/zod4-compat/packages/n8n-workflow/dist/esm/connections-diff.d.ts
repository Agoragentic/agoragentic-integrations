import type { IConnection, IConnections } from "./index.js";
type ConnectionEntry = {
    sourceIndex: number;
    value: {
        index: number;
        connection: IConnection;
    } | null;
};
export type INodeConnectionsDiff = Record<string, ConnectionEntry[]>;
export type ConnectionsDiff = {
    added: Record<string, INodeConnectionsDiff>;
    removed: Record<string, INodeConnectionsDiff>;
};
export declare function compareConnections(prev: IConnections, next: IConnections): ConnectionsDiff;
export {};
//# sourceMappingURL=connections-diff.d.ts.map