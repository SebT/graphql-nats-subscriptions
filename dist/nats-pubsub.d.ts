/// <reference types="node" />
import { PubSubEngine } from 'graphql-subscriptions';
import { Client, SubscribeOptions } from 'nats';
import * as Logger from 'bunyan';
export declare type Path = Array<string | number>;
export declare type Trigger = string | Path;
export declare type TriggerTransform = (trigger: Trigger, channelOptions?: object) => string;
export declare type SubscribeOptionsResolver = (trigger: Trigger, channelOptions?: object) => Promise<SubscribeOptions>;
export declare type PublishOptionsResolver = (trigger: Trigger, payload: any) => Promise<any>;
export interface NatsPubSubOptions {
    client?: Client;
    subscribeOptions?: SubscribeOptionsResolver;
    publishOptions?: PublishOptionsResolver;
    connectionListener?: (err: Error) => void;
    triggerTransform?: TriggerTransform;
    parseMessageWithEncoding?: BufferEncoding;
    logger?: Logger;
}
export declare class NatsPubSub implements PubSubEngine {
    private triggerTransform;
    private publishOptionsResolver;
    private subscribeOptionsResolver;
    private natsConnection;
    private subscriptionMap;
    private subsRefsMap;
    private natsSubMap;
    private currentSubscriptionId;
    private logger;
    constructor(options?: NatsPubSubOptions);
    publish(trigger: string, payload: any): Promise<void>;
    subscribe(trigger: string, onMessage: Function, options?: object): Promise<number>;
    unsubscribe(subId: number): void;
    asyncIterator<T>(triggers: string | string[]): AsyncIterator<T>;
    private onMessage;
}
