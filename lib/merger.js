'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const deepEqual = require("deep-equal");
let hierarchy = [];
function printLog(msg, key, val) {
    let msg2 = (msg + "         ").substr(0, 9);
    let path = hierarchy.concat(key).join(".").replace(/\.\[/g, "[");
    if (val && val.length > 80) {
        val = val.substr(0, 80) + "...";
    }
    console.log(`[${msg2}] ${path}: ${val}`);
}
function mergeObject(rules, ref, old) {
    let ret = {};
    if (old == null) {
        old = {};
    }
    let keys = Object.keys(ref);
    Object.keys(rules).forEach((key) => {
        if (keys.indexOf(key) < 0) {
            keys.push(key);
        }
    });
    Object.keys(old).forEach((key) => {
        if (key.startsWith("_")) {
            return;
        }
        if (keys.indexOf(key) < 0) {
            printLog("REMOVED", key, JSON.stringify(old[key]));
        }
    });
    return keys.reduce((promise, key) => {
        return promise.then(() => {
            if (key.startsWith("_")) {
                return;
            }
            let rval = ref[key];
            let oval = old[key];
            if (Object.prototype.hasOwnProperty.call(rules, key)) {
                let rule = rules[key];
                if (rule == null) {
                    // Drop this key
                    printLog("DROPPED", key);
                    return;
                }
                else if (typeof (rule) !== "function") {
                    // Overwrite value
                    rval = rule;
                }
                else if (rule.length === 1) {
                    // Convert values
                    rval = rule(rval);
                    oval = rule(oval);
                }
                else {
                    // Transfer another merge function
                    hierarchy.push(key);
                    return rule(rval, oval, ref, old).then((val) => {
                        hierarchy.pop();
                        if (val != null) {
                            ret[key] = val;
                        }
                        else {
                            printLog("DROPPED", key);
                        }
                    });
                }
            }
            // Simple copy
            if (oval == null) {
                printLog("NEW_VALUE", key, JSON.stringify(rval));
            }
            else if (!deepEqual(oval, rval, { strict: true })) {
                printLog("UPDATE", key, JSON.stringify(rval));
            }
            ret[key] = rval;
        });
    }, Promise.resolve()).then(() => {
        return ret;
    });
}
exports.mergeObject = mergeObject;
function mergeObjectArray(identifier, rules, ref, old) {
    let ret = [];
    let used = [];
    if (old == null) {
        old = [];
    }
    return ref.reduce((promise, rval, i) => {
        return promise.then(() => {
            let oval;
            let rid = identifier(rval);
            if (rid == null) {
                // Drop this item
                printLog("DROPPED", `[${i}]`);
                return;
            }
            let found = old.findIndex((oval) => identifier(oval) == rid);
            if (found < 0) {
                printLog("NEW_ITEM", `[${i}]`, `(${rid})`);
            }
            else {
                used[found] = true;
                oval = old[found];
            }
            hierarchy.push(`[${i}]`);
            return mergeObject(rules, rval, oval).then((val) => {
                ret.push(val);
                hierarchy.pop();
            });
        });
    }, Promise.resolve()).then(() => {
        for (let i = 0; i < old.length; ++i) {
            if (!used[i]) {
                let oid = identifier(old[i]);
                if (oid != null) {
                    printLog("REMOVED", "[]", `(${oid})`);
                }
            }
        }
        return ret;
    });
}
exports.mergeObjectArray = mergeObjectArray;
//# sourceMappingURL=merger.js.map