"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCronExpression = void 0;
const utils_1 = require("./utils.js");
const toCronExpression = (item) => {
    const randomSecond = (0, utils_1.randomInt)(60);
    if (item.mode === 'everyMinute')
        return `${randomSecond} * * * * *`;
    if (item.mode === 'everyHour')
        return `${randomSecond} ${item.minute} * * * *`;
    if (item.mode === 'everyX') {
        if (item.unit === 'minutes')
            return `${randomSecond} */${item.value} * * * *`;
        const randomMinute = (0, utils_1.randomInt)(60);
        if (item.unit === 'hours')
            return `${randomSecond} ${randomMinute} */${item.value} * * *`;
    }
    if (item.mode === 'everyDay')
        return `${randomSecond} ${item.minute} ${item.hour} * * *`;
    if (item.mode === 'everyWeek')
        return `${randomSecond} ${item.minute} ${item.hour} * * ${item.weekday}`;
    if (item.mode === 'everyMonth')
        return `${randomSecond} ${item.minute} ${item.hour} ${item.dayOfMonth} * *`;
    return item.cronExpression.trim();
};
exports.toCronExpression = toCronExpression;
//# sourceMappingURL=cron.js.map