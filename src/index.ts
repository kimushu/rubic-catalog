/// <reference path="../node_modules/@rubic/catalog-fetcher/lib/catalog.d.ts" />
import * as fs from "fs";
import * as path from "path";
import * as CJSON from "comment-json";
import * as Ajv from "ajv";
import { v4 as uuidV4 } from "uuid";
import { CATALOG_JSON, JSON_ENCODING, RubicCatalogFetcher, getValidator, RubicCatalogFetcherOptions } from "@rubic/catalog-fetcher";

const AUTH_JSON: string = "auth.json";
const TEMPLATE_JSON: string = "template.json";

function validate(obj: any, title: string, name?: string): void {
    let validator = getValidator(name);
    console.log(`Validating ${title}`);
    if (!validator(obj)) {
        let { errors } = validator;
        console.error(`${title} has ${errors.length} error(s).`);
        for (let error of errors) {
            console.error(`- (${error.keyword}) ${error.dataPath}:${error.message}`);
        }
        throw new Error(`invalid ${title}`);
    }
}

function repoName(repo: RubicCatalog.RepositorySummary): string {
    return `${repo.host}:${repo.owner}/${repo.repo}#${repo.branch} (${repo.uuid})`;
}

function update(fetchAll: boolean = false): Promise<void> {
    let f: RubicCatalogFetcher;
    let tmplFile = path.join(__dirname, "..", TEMPLATE_JSON);
    let destFile = path.join(__dirname, "..", CATALOG_JSON);
    let root: RubicCatalog.Root;
    let oldText: string;

    return Promise.resolve()
    .then(() => {
        // Construct fetcher
        let options: RubicCatalogFetcherOptions = {};
        let authFile = path.join(__dirname, "..", AUTH_JSON);
        if (fs.existsSync(authFile)) {
            options.auth = JSON.parse(fs.readFileSync(authFile, JSON_ENCODING));
        }
        f = new RubicCatalogFetcher(options);
        if (options.auth == null) {
            f.logger.warn("GitHub API will be used in unauthorized mode");
        }
    })
    .then(() => {
        // Load TEMPLATE_JSON
        f.logger.log(`Loading ${TEMPLATE_JSON}`);
        root = CJSON.parse(
            fs.readFileSync(path.join(__dirname, "..", TEMPLATE_JSON), JSON_ENCODING)
        );

        // Assign new UUID to new repositories
        let assigned = 0;
        root.boards.forEach((board) => {
            board.repositories.forEach((repo) => {
                if (!repo.uuid) {
                    repo.uuid = uuidV4();
                    ++assigned;
                    f.logger.info(`Assigned a new UUID: ${repo.host}:${repo.owner}/${repo.repo}#${repo.branch} => ${repo.uuid}`);
                }
            });
        });
        if (assigned > 0) {
            fs.writeFileSync(CJSON.stringify(root), JSON_ENCODING);
        }

        // Validate TEMPLATE_JSON (comments removed)
        root = CJSON.parse(CJSON.stringify(root), null, true);
        root.lastModified = 0;  // This property is not required in TEMPLATE_JSON
        validate(root, TEMPLATE_JSON);

        // Check UUID conflicts
        let uuids = [];
        root.boards.forEach((board) => {
            board.repositories.forEach((repo) => {
                if (uuids.indexOf(repo.uuid) >= 0) {
                    f.logger.error(`UUID confliction detected: ${repo.uuid}`);
                    throw new Error(`invalid ${TEMPLATE_JSON}`);
                }
                uuids.push(repo.uuid);
            });
        });
    })
    .then(() => {
        if (fetchAll || !fs.existsSync(destFile)) {
            return;
        }

        // Load CATALOG_JSON
        f.logger.log(`Loading ${CATALOG_JSON}`);
        oldText = fs.readFileSync(destFile, JSON_ENCODING);
        let oldRoot: RubicCatalog.Root = JSON.parse(oldText);

        try {
            // Varidate CATALOG_JSON
            validate(oldRoot, `${CATALOG_JSON} (old)`);
        } catch (error) {
            // Ignore errors
            f.logger.warn(`Continue merging with invalid ${CATALOG_JSON}`);
        }

        // Copy lastModified (this field will be updated after)
        root.lastModified = oldRoot.lastModified;

        // Merge boards
        return root.boards.reduce((promise, board) => {
            let oldIndex = oldRoot.boards.findIndex((oldBoard) => oldBoard.class === board.class);
            let oldBoard: RubicCatalog.Board;
            if (oldIndex >= 0) {
                oldBoard = oldRoot.boards.splice(oldIndex, 1)[0];
            }
            return promise
            .then(() => {
                f.logger.log(`${oldBoard == null ? "Adding" : "Merging"} board: ${board.class}`);

                // Merge repositories
                return board.repositories.reduce((promise, repo) => {
                    return promise
                    .then(() => {
                        let name = repoName(repo);
                        let oldIndex = oldBoard.repositories.findIndex((oldRepo) => oldRepo.uuid === repo.uuid);
                        let oldRepo: RubicCatalog.RepositorySummary;
                        if (oldIndex >= 0) {
                            oldRepo = oldBoard.repositories.splice(oldIndex, 1)[0];
                        }
                        f.logger.log(`${oldRepo == null ? "Adding" : "Merging"} repository: ${name}`);
                        if (repo.cache == null) {
                            repo.cache = oldRepo.cache;
                        }
                        return f.fetchRepository(repo, repo).then(() => {});
                    });
                }, Promise.resolve());
            })
            .then(() => {
                if (oldBoard != null) {
                    oldBoard.repositories.forEach((repo) => {
                        let name = repoName(repo);
                        f.logger.warn(`Removed repository: ${name}`);
                    });
                }
            });
        }, Promise.resolve())
        .then(() => {
            oldRoot.boards.forEach((board) => {
                f.logger.warn(`Removed board: ${board.class}`);
            });
        });
    })
    .then(() => {
        if (JSON.stringify(root) !== oldText) {
            // Update lastModified value
            root.lastModified = Date.now();

            // Varidate final output
            validate(root, `${CATALOG_JSON} (new)`);

            // Save
            f.logger.log(`Saving ${CATALOG_JSON}`);
            fs.writeFileSync(destFile, JSON.stringify(root), JSON_ENCODING);
        } else {
            f.logger.log("No change detected");
        }
    })
    .then(() => {
        f.reportRateLimit();
    }, (reason) => {
        f.reportRateLimit();
        throw reason;
    });
}

let fetchAll = (process.argv.indexOf("--fetch-all") >= 0);
update().then((fetchAll) => {
    console.log("==== Finished ====");
    process.exit(0);
}, (reason) => {
    console.error("==== Aborted ====");
    console.error(reason);
    process.exit(1);
});
