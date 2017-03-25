'use strict';

import { readFileSync } from 'fs';

let current: RubicCatalog.Root;
let template: RubicCatalog.Root;

// Read current catalog.json content
try {
    current = <RubicCatalog.Root>JSON.parse(readFileSync("catalog.json", "utf8"));
} catch (error) {
    // Ignore errors
}

// Read template
template = <RubicCatalog.Root>JSON.parse(readFileSync("catalog.template.json", "utf8"));


