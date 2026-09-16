import type { RuleTester } from "oxlint/plugins-dev";

export type Rule = Parameters<RuleTester["run"]>[1];
export type Context = Parameters<NonNullable<Rule["create"]>>[0];
