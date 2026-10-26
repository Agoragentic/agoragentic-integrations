import { randomInt } from "./utils.js";
export const toCronExpression = (item) => {
    const randomSecond = randomInt(60);
    if (item.mode === 'everyMinute')
        return `${randomSecond} * * * * *`;
    if (item.mode === 'everyHour')
        return `${randomSecond} ${item.minute} * * * *`;
    if (item.mode === 'everyX') {
        if (item.unit === 'minutes')
            return `${randomSecond} */${item.value} * * * *`;
        const randomMinute = randomInt(60);
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
//# sourceMappingURL=cron.js.map