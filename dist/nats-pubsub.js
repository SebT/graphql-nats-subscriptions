"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const nats_1 = require("nats");
const pubsub_async_iterator_1 = require("./pubsub-async-iterator");
class NatsPubSub {
    constructor(options = {}) {
        this.triggerTransform = options.triggerTransform || (trigger => trigger);
        if (options.client) {
            this.natsConnection = options.client;
        }
        else {
            const brokerUrl = 'nats://127.0.0.1:4222';
            this.natsConnection = nats_1.connect(brokerUrl);
        }
        this.logger = options.logger.child({ className: 'nats-subscription' });
        if (options.connectionListener) {
            this.natsConnection.on('connect', options.connectionListener);
            this.natsConnection.on('error', options.connectionListener);
            this.natsConnection.on('disconnect', options.connectionListener);
            this.natsConnection.on('reconnecting', options.connectionListener);
            this.natsConnection.on('reconnect', options.connectionListener);
            this.natsConnection.on('close', options.connectionListener);
        }
        else {
            this.natsConnection.on('error', this.logger && this.logger.error);
        }
        this.subscriptionMap = {};
        this.subsRefsMap = {};
        this.natsSubMap = {};
        this.currentSubscriptionId = 0;
        this.publishOptionsResolver = options.publishOptions || (() => Promise.resolve({}));
        this.subscribeOptionsResolver = options.subscribeOptions || (() => Promise.resolve({}));
    }
    publish(trigger, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.trace("publishing to queue '%s' (%j)", trigger, payload);
            const message = JSON.stringify(payload);
            yield this.natsConnection.publish(trigger, message);
        });
    }
    subscribe(trigger, onMessage, options) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.trace("subscribing to queue '%s' with onMessage (%j), and options (%j) ", trigger, onMessage, options);
            const triggerName = this.triggerTransform(trigger, options);
            const id = this.currentSubscriptionId++;
            this.subscriptionMap[id] = [triggerName, onMessage];
            let refs = this.subsRefsMap[triggerName];
            if (refs && refs.length > 0) {
                this.logger.trace('relavent topic (%s) is already subscribed', triggerName);
                const newRefs = [...refs, id];
                this.subsRefsMap[triggerName] = newRefs;
                return yield id;
            }
            else {
                this.logger.trace('topic (%s) is new and yet to be subscribed', triggerName);
                this.logger.trace('resolve subscriptionoptions with options (%j)', options);
                const subId = this.natsConnection.subscribe(triggerName, (msg) => this.onMessage(triggerName, msg));
                this.subsRefsMap[triggerName] = [...(this.subsRefsMap[triggerName] || []), id];
                this.natsSubMap[triggerName] = subId;
                return yield id;
            }
        });
    }
    unsubscribe(subId) {
        const [triggerName = null] = this.subscriptionMap[subId] || [];
        const refs = this.subsRefsMap[triggerName];
        const natsSubId = this.natsSubMap[triggerName];
        this.logger.trace("unsubscribing to queue '%s' and natsSid: (%s)", subId, natsSubId);
        if (!refs) {
            this.logger.error('there are no subscriptions for triggerName (%s) and natsSid (%s)', triggerName, natsSubId);
            throw new Error(`There is no subscription of id "${subId}"`);
        }
        if (refs.length === 1) {
            this.natsConnection.unsubscribe(natsSubId);
            delete this.natsSubMap[triggerName];
            delete this.subsRefsMap[triggerName];
            this.logger.trace('unsubscribe on nats for subId (%s) is completed and there is no subscriber to topic (%s)', natsSubId, triggerName);
        }
        else {
            const index = refs.indexOf(subId);
            const newRefs = index === -1 ? refs : [...refs.slice(0, index), ...refs.slice(index + 1)];
            this.subsRefsMap[triggerName] = newRefs;
            this.logger.trace('unsubscribe on nats for subId (%s) is completed and there are still (%s) subscribers', newRefs.length);
        }
        delete this.subscriptionMap[subId];
    }
    asyncIterator(triggers) {
        this.logger.trace('asyncIterator called with trigger (%j)', triggers);
        return new pubsub_async_iterator_1.PubSubAsyncIterator(this, triggers, this.logger);
    }
    onMessage(topic, message) {
        this.logger.trace('triggered onMessage with topic (%s), message (%j)', topic, message);
        const subscribers = this.subsRefsMap[topic];
        if (!subscribers || !subscribers.length) {
            return;
        }
        if (message.hasOwnProperty('toString')) {
            console.warn('not suppose to have `toString` in payload, which likely trying to crash the server', message.toString);
            return;
        }
        let parsedMessage;
        try {
            parsedMessage = JSON.parse(message);
        }
        catch (e) {
            parsedMessage = message;
        }
        for (const subId of subscribers) {
            const listener = this.subscriptionMap[subId][1];
            this.logger.trace('subscription listener to run for subId (%s)', subId);
            listener(parsedMessage);
        }
    }
}
exports.NatsPubSub = NatsPubSub;
//# sourceMappingURL=nats-pubsub.js.map