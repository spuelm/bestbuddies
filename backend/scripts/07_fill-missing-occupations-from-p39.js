
const {
    PERSONS_LINKSCORE_PASS2_FILE,
    PERSONS_DATAENRICHMENT_FILE,
    PERSONS_DATAENRICHMENT_STATE_FILE
} = require("../lib/config");

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const {
    loadEntities
} = require("../lib/wikidata-api");

const {
    sleep
} = require("../lib/sleep");

const {
    loadState,
    saveState
} = require("../lib/state-manager");

const INPUT_FILE = PERSONS_LINKSCORE_PASS2_FILE;
const OUTPUT_FILE = PERSONS_DATAENRICHMENT_FILE;

const STATE_FILE = PERSONS_DATAENRICHMENT_STATE_FILE;
const BATCH_SIZE = 50;

function getEntityIds(
    claims,
    property
) {

    const entries =
        claims?.[property] || [];

    return entries
        .map(
            entry =>
                entry
                    ?.mainsnak
                    ?.datavalue
                    ?.value
                    ?.id
        )
        .filter(Boolean);
}

async function loadEntitiesWithRetry(
    qids
) {

    while (true) {

        try {

            const entities =
                await loadEntities(
                    qids
                );

            return (
                entities || {}
            );

        } catch (err) {

            if (
                err.response?.status ===
                429
            ) {

                const retryAfter =
                    parseInt(
                        err.response.headers[
                        "retry-after"
                        ]
                    ) || 60;

                console.log(
                    `429 erhalten. Warte ${retryAfter}s`
                );

                await sleep(
                    retryAfter * 1000
                );

                continue;
            }

            throw err;
        }
    }
}

async function run() {

    const state =
        loadState(
            STATE_FILE
        );

    const startLine =
        state.lineNumber || 0;

    let processed =
        state.processed || 0;

    console.log(
        `Fortsetzen bei Zeile ${startLine.toLocaleString("de-DE")}`
    );

    const reader =
        readline.createInterface({
            input:
                fs.createReadStream(
                    INPUT_FILE
                ),
            crlfDelay:
                Infinity
        });

    const output =
        fs.createWriteStream(
            OUTPUT_FILE,
            {
                flags:
                    startLine > 0
                        ? "a"
                        : "w"
            }
        );

    let batch =
        [];

    let lineNumber =
        0;

    for await (
        const line of reader
    ) {

        lineNumber++;

        if (
            lineNumber <=
            startLine
        ) {

            continue;
        }

        const person =
            JSON.parse(
                line
            );

        if (
            Array.isArray(
                person.occupationIds
            ) &&
            person.occupationIds.length > 0
        ) {

            output.write(
                JSON.stringify(
                    person
                ) + "\n"
            );

            processed++;

            saveState(STATE_FILE, {
                lineNumber,
                processed,
                lastTitle:
                    person.title,
                lastQid:
                    person.wikidataId,
                updatedAt:
                    new Date()
                        .toISOString()
            });

            continue;
        }

        batch.push({
            person,
            lineNumber
        });

        if (
            batch.length <
            BATCH_SIZE
        ) {

            continue;
        }

        try {

            const qids =
                batch.map(
                    item =>
                        item.person
                            .wikidataId
                );

            const entities =
                await loadEntitiesWithRetry(
                    qids
                );

            for (
                const item
                of batch
            ) {

                const entity =
                    entities?.[
                    item.person
                        .wikidataId
                    ];

                if (
                    entity
                ) {

                    const claims =
                        entity.claims ||
                        {};

                    const p39Ids =
                        getEntityIds(
                            claims,
                            "P39"
                        );

                    if (
                        p39Ids.length > 0
                    ) {

                        item.person
                            .occupationIds =
                            p39Ids;

                        item.person
                            .occupationSource =
                            "P39";
                    }
                }

                output.write(
                    JSON.stringify(
                        item.person
                    ) + "\n"
                );

                processed++;
            }


            saveState(STATE_FILE, {
                lineNumber,
                processed,
                lastTitle:
                    batch[
                        batch.length - 1
                    ].person.title,

                lastQid:
                    batch[
                        batch.length - 1
                    ].person
                        .wikidataId,

                updatedAt:
                    new Date()
                        .toISOString()
            });

            if (
                processed % 1000 ===
                0
            ) {

                console.log(
                    `${processed.toLocaleString("de-DE")} Personen verarbeitet`
                );
            }

            batch = [];

            await sleep(
                250
            );

        } catch (err) {

            console.error(
                err.message
            );

            saveState(STATE_FILE, {
                lineNumber:
                    lineNumber -
                    batch.length,

                processed,

                lastTitle:
                    batch[0]
                        ?.person
                        ?.title,

                lastQid:
                    batch[0]
                        ?.person
                        ?.wikidataId,

                updatedAt:
                    new Date()
                        .toISOString()
            });

            break;
        }
    }

    output.end();

    console.log(
        "Fertig."
    );
}

run().catch(
    console.error
);