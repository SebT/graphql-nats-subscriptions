"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterall_1 = require("iterall");
const nats_pubsub_1 = require("../nats-pubsub");
const nats = require("nats");
const graphql_1 = require("graphql");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const subscription_1 = require("graphql/subscription");
const logger_1 = require("./logger");
const FIRST_EVENT = 'FIRST_EVENT';
function buildSchema(iterator) {
    return new graphql_1.GraphQLSchema({
        query: new graphql_1.GraphQLObjectType({
            name: 'Query',
            fields: {
                testString: {
                    type: graphql_1.GraphQLString,
                    resolve: function (_, args) {
                        return 'works';
                    },
                },
            },
        }),
        subscription: new graphql_1.GraphQLObjectType({
            name: 'Subscription',
            fields: {
                testSubscription: {
                    type: graphql_1.GraphQLString,
                    subscribe: graphql_subscriptions_1.withFilter(() => iterator, () => true),
                    resolve: root => {
                        return 'FIRST_EVENT';
                    },
                },
            },
        }),
    });
}
describe('GraphQL-JS asyncIterator', () => {
    const query = graphql_1.parse(`
    subscription S1 {
        testSubscription
    }
    `);
    const pubsub = new nats_pubsub_1.NatsPubSub({ logger: logger_1.logger });
    const origIterator = pubsub.asyncIterator(FIRST_EVENT);
    const returnSpy = jest.spyOn(origIterator, 'return');
    const schema = buildSchema(origIterator);
    const results = subscription_1.subscribe(schema, query);
    it('should allow subscriptions', () => results
        .then(ai => {
        expect(iterall_1.isAsyncIterable(ai)).toBeTruthy();
        const r = ai.next();
        pubsub.publish(FIRST_EVENT, {});
        return r;
    })
        .then(res => {
        expect(res.value.data.testSubscription).toEqual('FIRST_EVENT');
    }));
    it('should clear event handlers', () => results
        .then(ai => {
        expect(iterall_1.isAsyncIterable(ai)).toBeTruthy();
        pubsub.publish(FIRST_EVENT, {});
        return ai.return();
    })
        .then(res => {
        expect(returnSpy.mockImplementationOnce).toBeTruthy();
    }));
});
describe('GraphQL-JS asyncIterator with client', () => {
    const query = graphql_1.parse(`
  subscription S1 {
      testSubscription
  }
  `);
    const client = nats.connect({
        url: 'nats://localhost:4222',
        reconnectTimeWait: 1000,
    });
    const pubsub = new nats_pubsub_1.NatsPubSub({ logger: logger_1.logger, client });
    const origIterator = pubsub.asyncIterator(FIRST_EVENT);
    const returnSpy = jest.spyOn(origIterator, 'return');
    const schema = buildSchema(origIterator);
    const results = subscription_1.subscribe(schema, query);
    it('should allow subscriptions', () => results
        .then(ai => {
        expect(iterall_1.isAsyncIterable(ai)).toBeTruthy();
        const r = ai.next();
        pubsub.publish(FIRST_EVENT, {});
        return r;
    })
        .then(res => {
        expect(res.value.data.testSubscription).toEqual('FIRST_EVENT');
    }));
    it('should clear event handlers', () => results
        .then(ai => {
        expect(iterall_1.isAsyncIterable(ai)).toBeTruthy();
        pubsub.publish(FIRST_EVENT, {});
        return ai.return();
    })
        .then(res => {
        expect(returnSpy.mockImplementationOnce).toBeTruthy();
    }));
});
//# sourceMappingURL=integration.test.js.map