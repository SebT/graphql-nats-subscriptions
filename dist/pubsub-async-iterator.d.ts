import { PubSubEngine } from 'graphql-subscriptions';
import * as Logger from 'bunyan';
export declare class PubSubAsyncIterator<T> implements AsyncIterator<T> {
    private pullQueue;
    private pushQueue;
    private eventsArray;
    private allSubscribed;
    private listening;
    private pubsub;
    private logger;
    constructor(pubsub: PubSubEngine, eventNames: string | string[], logger?: Logger);
    next(): Promise<IteratorResult<any>>;
    return(): Promise<{
        value: any;
        done: boolean;
    }>;
    throw(error: any): Promise<never>;
    private pushValue;
    private pullValue;
    private emptyQueue;
    private subscribeAll;
    private unsubscribeAll;
}
