"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@cdm-logger/server");
const settings = {
    level: 'trace',
};
exports.logger = server_1.ConsoleLogger.create('nats-subcscription', settings);
//# sourceMappingURL=logger.js.map