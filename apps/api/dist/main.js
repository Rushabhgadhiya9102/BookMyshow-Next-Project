"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = void 0;
console.log("BookMyShow API service scaffold initialized.");
const healthCheck = () => ({
    status: "ok",
    service: "@bookmyshow/api",
    timestamp: new Date().toISOString()
});
exports.healthCheck = healthCheck;
//# sourceMappingURL=main.js.map