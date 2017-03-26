'use strict';

import deepEqual = require('deep-equal');

let hierarchy: string[] = [];
let updated;

function printLog(msg: string, key: string, val?: string): void {
    let msg2 = (msg + "         ").substr(0, 9);
    let path = hierarchy.concat(key).join(".").replace(/\.\[/g, "[");
    if (val && val.length > 80) {
        val = val.substr(0, 80) + "...";
    }
    console.log(`[${msg2}] ${path}: ${val}`);
}

export function mergeObject<T>(rules: Object, ref: T, old: T): Promise<T> {
    let ret: T = <T>{};
    if (old == null) { old = <T>{}; }
    let keys = Object.keys(ref);
    Object.keys(rules).forEach((key) => {
        if (keys.indexOf(key) < 0) { keys.push(key); }
    })
    Object.keys(old).forEach((key) => {
        if (key.startsWith("_")) { return; }
        if (keys.indexOf(key) < 0) {
            printLog("REMOVED", key, JSON.stringify(old[key]))
            ++updated;
        }
    })
    return keys.reduce(
        (promise, key) => { return promise.then(() => {
            if (key.startsWith("_")) { return; }
            let rval = ref[key];
            let oval = old[key];
            if (Object.prototype.hasOwnProperty.call(rules, key)) {
                let rule = rules[<any>key];
                if (rule == null) {
                    // Drop this key
                    if (oval != null) {
                        printLog("DROPPED", key);
                        ++updated;
                    }
                    return;
                } else if (typeof(rule) !== "function") {
                    // Overwrite value
                    rval = rule;
                } else if (rule.length === 1) {
                    // Convert values
                    rval = rule(rval);
                    oval = rule(oval);
                } else {
                    // Transfer another merge function
                    hierarchy.push(key);
                    return Promise.resolve(rule(rval, oval, ref, old)).then((val) => {
                        hierarchy.pop();
                        if (val != null) {
                            ret[key] = val;
                        } else if (oval != null) {
                            printLog("DROPPED", key);
                            ++updated;
                        }
                    });
                }
            }
            // Simple copy
            if (oval == null) {
                printLog("NEW_VALUE", key, JSON.stringify(rval));
                ++updated;
            } else if (!deepEqual(oval, rval, {strict: true})) {
                printLog("UPDATE", key, JSON.stringify(rval));
                ++updated;
            }
            ret[key] = rval;
        }); }, Promise.resolve()
    ).then(() => {
        return ret;
    });
}

export function mergeObjectArray<T>(identifier: (item: T) => any, rules: Object, ref: T[], old: T[]): Promise<T[]> {
    let ret: T[] = [];
    let used: boolean[] = [];
    if (old == null) { old = []; }
    return ref.reduce(
        (promise, rval, i) => { return promise.then(() => {
            let oval: T;
            let rid = identifier(rval);
            if (rid == null) {
                // Ignore this item
                printLog("IGNORED", `[${i}]`);
                return;
            }
            let found = old.findIndex((oval) => identifier(oval) == rid);
            if (found < 0) {
                printLog("NEW_ITEM", `[${i}]`, `(${rid})`);
                ++updated;
            } else {
                used[found] = true;
                oval = old[found];
            }
            hierarchy.push(`[${i}]`);
            return mergeObject(rules, rval, oval).then((val) => {
                ret.push(val);
                hierarchy.pop();
            });
        }); }, Promise.resolve()
    ).then(() => {
        for (let i = 0; i < old.length; ++i) {
            if (!used[i]) {
                let oid = identifier(old[i]);
                if (oid != null) {
                    printLog("REMOVED", "[]", `(${oid})`);
                    ++updated;
                }
            }
        }
        return ret;
    });
}

export function getUpdatedCount(): number {
    return updated;
}
