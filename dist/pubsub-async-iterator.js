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
const iterall_1 = require("iterall");
class PubSubAsyncIterator {
    constructor(pubsub, eventNames, logger) {
        this.logger = logger.child({ className: 'pubsub-async-iterator' });
        this.pubsub = pubsub;
        this.pullQueue = [];
        this.pushQueue = [];
        this.listening = true;
        this.eventsArray = typeof eventNames === 'string' ? [eventNames] : eventNames;
        this.allSubscribed = this.subscribeAll();
    }
    next() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.trace('next has been called, current state [ pullQueue: (%j) pushQueue: (%j)]', this.pullQueue, this.pushQueue);
            yield this.allSubscribed;
            return this.listening ? this.pullValue() : this.return();
        });
    }
    return() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.trace('calling [return]');
            this.emptyQueue(yield this.allSubscribed);
            return { value: undefined, done: true };
        });
    }
    throw(error) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.trace('throwing error');
            this.emptyQueue(yield this.allSubscribed);
            return Promise.reject(error);
        });
    }
    [iterall_1.$$asyncIterator]() {
        this.logger.trace('[$$asyncIterator]');
        return this;
    }
    pushValue(event) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.trace('[pushValue] with event (%j)', event);
            yield this.allSubscribed;
            if (this.pullQueue.length !== 0) {
                this.logger.trace('pull event (%j) from pullQueue (%j)', event, this.pullQueue);
                this.pullQueue.shift()({ value: event, done: false });
            }
            else {
                this.pushQueue.push(event);
                this.logger.trace('push event (%j) to pushQueue (%j)', event, this.pullQueue);
            }
        });
    }
    pullValue() {
        this.logger.trace('[pullValue] ');
        return new Promise((resolve => {
            if (this.pushQueue.length !== 0) {
                this.logger.trace('pluck last event from pushQueue (%j)', this.pushQueue);
                resolve({ value: this.pushQueue.shift(), done: false });
            }
            else {
                this.pullQueue.push(resolve);
                this.logger.trace('push Promise.resolve into pullQueue (%j)', this.pullQueue);
            }
        }));
    }
    emptyQueue(subscriptionIds) {
        this.logger.trace('[emptyQueue] ');
        if (this.listening) {
            this.logger.trace('listening is true, it will unsubscribeAll, will empty all elements in pullQueue (%j)', this.pullQueue);
            this.listening = false;
            this.unsubscribeAll(subscriptionIds);
            this.pullQueue.forEach(resolve => resolve({ value: undefined, done: true }));
            this.pullQueue.length = 0;
            this.pushQueue.length = 0;
        }
    }
    subscribeAll() {
        this.logger.trace('[subscribeAll] ');
        return Promise.all(this.eventsArray.map(eventName => {
            this.logger.trace('subscribing to eventName (%j) with onMessage as this.pushValue', eventName);
            return this.pubsub.subscribe(eventName, this.pushValue.bind(this), {});
        }));
    }
    unsubscribeAll(subscriptionIds) {
        this.logger.trace('unsubscribeAll to all subIds (%j)', subscriptionIds);
        for (const subscriptionId of subscriptionIds) {
            this.pubsub.unsubscribe(subscriptionId);
        }
    }
}
exports.PubSubAsyncIterator = PubSubAsyncIterator;
//# sourceMappingURL=pubsub-async-iterator.js.map