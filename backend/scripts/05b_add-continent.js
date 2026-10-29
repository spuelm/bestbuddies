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

const {
    PERSONS_DATAENRICHMENT_FILE,
    PERSONS_DATAENRICHMENT_CONTINENT_FILE,
    PERSONS_DATAENRICHMENT_CONTINENT_STATE_FILE,
    CONTINENT_CACHE_FILE
} = require("../lib/config");

const INPUT_FILE = PERSONS_DATAENRICHMENT_FILE;
const OUTPUT_FILE = PERSONS_DATAENRICHMENT_CONTINENT_FILE;


const STATE_FILE = PERSONS_DATAENRICHMENT_CONTINENT_STATE_FILE;




const BATCH_SIZE = 50;

async function loadEntitiesWithRetry(
    ids
) {

    while (true) {

        try {

            return (
                await loadEntities(
                    ids
                )
            ) || {};

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

function getEntityIds(
    claims,
    property
) {

    return (
        claims?.[property] || []
    )
        .map(
            item =>
                item?.mainsnak
                    ?.datavalue
                    ?.value
                    ?.id
        )
        .filter(Boolean);
}

function getLabel(
    entity
) {

    return (
        entity?.labels?.de
            ?.value ||
        entity?.labels?.en
            ?.value ||
        null
    );
}

async function run() {

    const state =
        loadState(
            STATE_FILE
        );

    let cache =
        {};

    if (
        fs.existsSync(
            CONTINENT_CACHE_FILE
        )
    ) {

        cache =
            JSON.parse(
                fs.readFileSync(
                    CONTINENT_CACHE_FILE,
                    "utf8"
                )
            );
    }

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
                    state.lineNumber > 0
                        ? "a"
                        : "w"
            }
        );

    let lineNumber = 0;
    let processed =
        state.processed || 0;

    let batch = [];

    for await (
        const line of reader
    ) {

        lineNumber++;

        if (
            lineNumber <=
            (
                state.lineNumber ||
                0
            )
        ) {

            continue;
        }

        batch.push({
            lineNumber,
            data:
                JSON.parse(
                    line
                )
        });

        if (
            batch.length <
            BATCH_SIZE
        ) {

            continue;
        }

        const nationalityIds =
            new Set();

        for (
            const item
            of batch
        ) {

            for (
                const nationalityId
                of (
                    item.data
                        .nationalityIds ||
                    []
                )
            ) {

                if (
                    !cache[
                    nationalityId
                    ]
                ) {

                    nationalityIds.add(
                        nationalityId
                    );
                }
            }
        }

        if (
            nationalityIds.size > 0
        ) {

            const nationalityEntities =
                await loadEntitiesWithRetry(
                    [...nationalityIds]
                );

            for (
                const nationalityId
                of nationalityIds
            ) {

                const nationality =
                    nationalityEntities[
                    nationalityId
                    ];

                if (
                    !nationality
                ) {

                    continue;
                }

                const continentIds =
                    getEntityIds(
                        nationality.claims,
                        "P30"
                    );

                let continentLabels =
                    [];

                if (
                    continentIds.length
                ) {

                    const continentEntities =
                        await loadEntitiesWithRetry(
                            continentIds
                        );

                    continentLabels =
                        continentIds
                            .map(
                                id =>
                                    getLabel(
                                        continentEntities[
                                        id
                                        ]
                                    )
                            )
                            .filter(Boolean);
                }

                cache[
                    nationalityId
                ] = {

                    continentIds,

                    continentLabels
                };
            }

            fs.writeFileSync(
                CONTINENT_CACHE_FILE,
                JSON.stringify(
                    cache,
                    null,
                    2
                )
            );
        }

        for (
            const item
            of batch
        ) {

            const continentIds =
                new Set();

            const continentLabels =
                new Set();

            for (
                const nationalityId
                of (
                    item.data
                        .nationalityIds ||
                    []
                )
            ) {

                const entry =
                    cache[
                    nationalityId
                    ];

                if (
                    !entry
                ) {

                    continue;
                }

                entry.continentIds
                    .forEach(
                        id =>
                            continentIds.add(
                                id
                            )
                    );

                entry.continentLabels
                    .forEach(
                        label =>
                            continentLabels.add(
                                label
                            )
                    );
            }

            output.write(
                JSON.stringify({

                    ...item.data,

                    continentIds:
                        [
                            ...continentIds
                        ],

                    continent:
                        [
                            ...continentLabels
                        ]

                }) + "\n"
            );

            processed++;
        }

        saveState(
            STATE_FILE,
            {
                lineNumber,
                processed,
                updatedAt:
                    new Date()
                        .toISOString()
            }
        );

        console.log(
            `${processed.toLocaleString("de-DE")} Personen verarbeitet`
        );

        batch = [];
    }

    output.end();

    console.log(
        "Fertig."
    );
}

run().catch(
    console.error
);