import type { CronExpression } from "./interfaces.js";
interface BaseTriggerTime<T extends string> {
    mode: T;
}
interface CustomTrigger extends BaseTriggerTime<'custom'> {
    cronExpression: CronExpression;
}
interface EveryX<U extends string> extends BaseTriggerTime<'everyX'> {
    unit: U;
    value: number;
}
type EveryMinute = BaseTriggerTime<'everyMinute'>;
type EveryXMinutes = EveryX<'minutes'>;
interface EveryHour extends BaseTriggerTime<'everyHour'> {
    minute: number;
}
type EveryXHours = EveryX<'hours'>;
interface EveryDay extends BaseTriggerTime<'everyDay'> {
    hour: number;
    minute: number;
}
interface EveryWeek extends BaseTriggerTime<'everyWeek'> {
    hour: number;
    minute: number;
    weekday: number;
}
interface EveryMonth extends BaseTriggerTime<'everyMonth'> {
    hour: number;
    minute: number;
    dayOfMonth: number;
}
export type TriggerTime = CustomTrigger | EveryMinute | EveryXMinutes | EveryHour | EveryXHours | EveryDay | EveryWeek | EveryMonth;
export declare const toCronExpression: (item: TriggerTime) => CronExpression;
export {};
//# sourceMappingURL=cron.d.ts.map