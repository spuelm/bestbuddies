const fs = require("fs");
const path = require("path");
const readline = require("readline");

const {
    wdataLoadEntities
} = require("../lib/wiki-api");

const {
    sleep
} = require("../lib/sleep");

const {
    loadState,
    saveState
} = require("../lib/state-manager");

const PERSONS_DATAENRICHMENT_FILE =
    path.join(
        __dirname,
        "../data/PERSONS_DATAENRICHMENT_FILE.jsonl"
    );

const OUTPUT_FILE =
    path.join(
        __dirname,
        "../data/PERSONS_DATAENRICHMENT_FILE_WITH_CONTINENT.jsonl"
    );

const STATE_FILE =
    path.join(
        __dirname,
        "../data/add-birth-continent-state.json"
    );

const PLACE_CACHE_FILE =
    path.join(
        __dirname,
        "../data/birthplace-continent-cache.json"
    );

const BATCH_SIZE = 50;

function getEntityIds(
    claims,
    property
) {

    return (
        claims?.[property] || []
    )
        .map(
            entry =>
                entry?.mainsnak
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

async function loadEntitiesWithRetry(
    ids
) {

    while (true) {

        try {

            const entities =
                await wdataLoadEntities(ids);

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

async function getContinentData(
    birthPlaceId,
    cache
) {

    if (
        cache[birthPlaceId]
    ) {

        return cache[
            birthPlaceId
        ];
    }

    const birthPlaceEntities =
        await loadEntitiesWithRetry(
            [birthPlaceId]
        );

    const birthPlace =
        birthPlaceEntities[
        birthPlaceId
        ];

    if (!birthPlace) {

        cache[
            birthPlaceId
        ] = {
            birthCountryId:
                null,
            continentIds:
                [],
            continent:
                []
        };

        return cache[
            birthPlaceId
        ];
    }

    const countryIds =
        getEntityIds(
            birthPlace.claims,
            "P17"
        );

    const birthCountryId =
        countryIds[0] ||
        null;

    if (
        !birthCountryId
    ) {

        cache[
            birthPlaceId
        ] = {
            birthCountryId:
                null,
            continentIds:
                [],
            continent:
                []
        };

        return cache[
            birthPlaceId
        ];
    }

    const countryEntities =
        await loadEntitiesWithRetry(
            [birthCountryId]
        );

    const country =
        countryEntities[
        birthCountryId
        ];

    const continentIds =
        getEntityIds(
            country?.claims,
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
        birthPlaceId
    ] = {
        birthCountryId,
        continentIds,
        continent:
            continentLabels
    };

    return cache[
        birthPlaceId
    ];
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
            PLACE_CACHE_FILE
        )
    ) {

        cache =
            JSON.parse(
                fs.readFileSync(
                    PLACE_CACHE_FILE,
                    "utf8"
                )
            );
    }

    const reader =
        readline.createInterface({
            input:
                fs.createReadStream(
                    PERSONS_DATAENRICHMENT_FILE
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

        const person =
            JSON.parse(line);

        try {

            const birthPlaceId =
                person.birthPlaceId;

            if (!birthPlaceId) {

                output.write(
                    JSON.stringify(
                        person
                    ) + "\n"
                );

                processed++;

                continue;
            }

            const continentData =
                await getContinentData(
                    birthPlaceId,
                    cache
                );

            output.write(
                JSON.stringify({

                    ...person,

                    birthCountryId:
                        continentData.birthCountryId,

                    continentIds:
                        continentData.continentIds,

                    continent:
                        continentData.continent

                }) + "\n"
            );

            processed++;

            if (
                processed % 100 ===
                0
            ) {

                fs.writeFileSync(
                    PLACE_CACHE_FILE,
                    JSON.stringify(
                        cache,
                        null,
                        2
                    )
                );

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
            }

        } catch (err) {

            console.error(
                err.message
            );

            saveState(
                STATE_FILE,
                {
                    lineNumber:
                        lineNumber - 1,
                    processed,
                    updatedAt:
                        new Date()
                            .toISOString()
                }
            );

            break;
        }
    }

    fs.writeFileSync(
        PLACE_CACHE_FILE,
        JSON.stringify(
            cache,
            null,
            2
        )
    );

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

    output.end();

    console.log(
        "Fertig."
    );
}

run().catch(
    console.error
);