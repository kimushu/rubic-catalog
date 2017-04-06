'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const merger_1 = require("./merger");
const uuidV4 = require("uuid/v4");
const GitHub = require("github");
const pify = require("pify");
const decompress = require("decompress");
const request = pify(require('request'));
const AUTH_JSON = "auth.json";
const CATALOG_JSON = "catalog.json";
const TEMPLATE_JSON = "template.json";
const REPOSITORY_JSON = "rubic-repository.json";
const RELEASE_JSON = "release.json";
const ASSET_PATTERN = /\.(zip|tar\.gz|tgz)$/i;
let github = new GitHub({
    protocol: "https",
    headers: {
        "user-agent": "rubic-catalog/update"
    },
    Promise: Promise
});
function toDateNumber(from) {
    if (typeof (from) == "number") {
        return from;
    }
    return Date.parse(from);
}
let ghlimit = { limit: 0, remaining: 0, reset: 0 };
function monitorGH(promise) {
    return promise.then((data) => {
        let meta = (data && data.meta);
        if (meta) {
            ghlimit.limit = parseInt(meta["x-ratelimit-limit"]);
            ghlimit.remaining = parseInt(meta["x-ratelimit-remaining"]);
            ghlimit.reset = parseInt(meta["x-ratelimit-reset"]);
        }
        return data;
    });
}
function reportGH() {
    console.info(`GitHub API RateLimit: ${ghlimit.remaining} / ${ghlimit.limit}`);
    console.info(`GitHub API RateLimit Reset: ${new Date(ghlimit.reset * 1000).toString()}`);
}
let old;
let ref;
// Read GitHub authentication
try {
    let auth = JSON.parse(fs_1.readFileSync(AUTH_JSON, "utf8"));
    github.authenticate(auth);
}
catch (error) {
    console.warn("GitHub authentication is not enabled. API limit may be too small!");
}
// Read current catalog.json content
try {
    old = JSON.parse(fs_1.readFileSync(CATALOG_JSON, "utf8"));
}
catch (error) {
    // Ignore errors
}
// Read template
ref = JSON.parse(fs_1.readFileSync(TEMPLATE_JSON, "utf8"));
// GitHub access parameters
let ghopt = {};
// Merge rule definitions
let relSummaryMergeRules = {
    published_at: toDateNumber,
    updated_at: toDateNumber,
    cache: (ref, old, refSummary, oldSummary) => {
        if (!old && !ref) {
            console.info(`Downloading asset archive (${refSummary.url})`);
            return request({
                url: refSummary.url,
                encoding: null
            }).then((response) => {
                return decompress(response.body);
            }).then((files) => {
                let jsonFile = files.find((file) => file.path === RELEASE_JSON);
                if (!jsonFile) {
                    return Promise.reject(Error(`${RELEASE_JSON} not found in (${refSummary.url})`));
                }
                return JSON.parse(jsonFile.data.toString());
            });
        }
        return ref || old;
    }
};
let firmDetailMergeRules = {
    releases: (refArray, oldArray) => {
        let promise;
        if (!refArray) {
            promise = Promise.resolve({}).then(() => {
                return monitorGH(github.repos.getReleases(ghopt));
            }).then((releases) => {
                refArray = [];
                releases.data.forEach((rel) => {
                    if (rel.draft) {
                        return;
                    } // Do not include draft releases
                    let url;
                    let updated_at;
                    (rel.assets || []).forEach((asset) => {
                        if (!url && ASSET_PATTERN.test(asset.name)) {
                            url = asset.browser_download_url;
                            updated_at = asset.updated_at;
                        }
                    });
                    refArray.push({
                        tag: rel.tag_name,
                        name: rel.name,
                        description: rel.body,
                        published_at: rel.published_at,
                        updated_at: updated_at,
                        author: rel.author.login,
                        url: url,
                        cache: null
                    });
                });
            });
        }
        else {
            promise = Promise.resolve();
        }
        return promise.then(() => {
            return merger_1.mergeObjectArray((relSummary) => relSummary.tag, relSummaryMergeRules, refArray, oldArray);
        });
    }
};
let firmSummaryMergeRules = {
    cache: (ignored, old, refSummary) => {
        if (refSummary.host !== "github") {
            return Promise.reject(Error(`Unknown service host: ${refSummary.host}`));
        }
        if (refSummary.disabled) {
            return Promise.resolve();
        }
        ghopt = { owner: refSummary.owner, repo: refSummary.repo };
        console.info(`Receiving catalog from GitHub (${ghopt.owner}/${ghopt.repo})`);
        return Promise.resolve({}).then(() => {
            return monitorGH(github.gitdata.getReference(Object.assign({
                ref: `heads/${refSummary.branch || "master"}`
            }, ghopt)));
        }).then((reference) => {
            return monitorGH(github.gitdata.getCommit(Object.assign({
                sha: reference.data.object.sha
            }, ghopt)));
        }).then((commit) => {
            return monitorGH(github.gitdata.getTree(Object.assign({
                sha: commit.data.tree.sha
            }, ghopt)));
        }).then((tree) => {
            let file = tree.data.tree.find((item) => item.path === REPOSITORY_JSON);
            if (!file) {
                return Promise.reject(Error(`This repository does not have ${REPOSITORY_JSON}`));
            }
            return monitorGH(github.gitdata.getBlob(Object.assign({
                sha: file.sha
            }, ghopt)));
        }).then((blob) => {
            let { content, encoding } = blob.data;
            let jsonText = Buffer.from(content, encoding).toString();
            return JSON.parse(jsonText);
        }).then((ref) => {
            return merger_1.mergeObject(firmDetailMergeRules, ref, old);
        });
    }
};
let boardMergeRules = {
    repositories: merger_1.mergeObjectArray.bind(null, (firmSummary) => {
        if (firmSummary.uuid) {
            return firmSummary.uuid;
        }
        let { owner, repo, branch } = firmSummary;
        throw Error(`UUID required for ${owner}/${repo}/${branch || "master"}.
Add a new one (${uuidV4()}) to ${TEMPLATE_JSON}`);
    }, firmSummaryMergeRules)
};
let rootMergeRules = {
    boards: merger_1.mergeObjectArray.bind(null, (board) => {
        return board.class;
    }, boardMergeRules),
    lastModified: (ref, old) => {
        if (old == null || merger_1.getUpdatedCount() > 0) {
            return Date.now();
        }
        return old;
    }
};
// Merge
merger_1.mergeObject(rootMergeRules, ref, old).then((newObj) => {
    reportGH();
    fs_1.writeFileSync(CATALOG_JSON, JSON.stringify(newObj, null));
    console.info(`Update complete (${CATALOG_JSON})`);
    process.exit(0);
}).catch((error) => {
    reportGH();
    console.dir(error);
    process.exit(1);
});
//# sourceMappingURL=update.js.map