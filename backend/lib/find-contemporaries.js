function overlapYears(
  personA,
  personB
) {

  const start =
    Math.max(
      personA.birthYear,
      personB.birthYear
    );

  const end =
    Math.min(
      personA.deathYear,
      personB.deathYear
    );

  return end - start;
}

function findContemporaries(
  targetQid,
  peopleByQid,
  centuryIndex,
  options = {}
) {

  const target =
    peopleByQid[
      targetQid
    ];

  if (!target) {

    throw new Error(
      `Person ${targetQid} nicht gefunden`
    );
  }

  const minOverlap =
    options.minOverlapYears || 10;

  const candidateIds =
    new Set();

  for (
    const century
    of (
      target.centuries || []
    )
  ) {

    const candidates =
      centuryIndex[
        century
      ] || [];

    for (
      const qid
      of candidates
    ) {

      candidateIds.add(
        qid
      );
    }
  }

  const result =
    [];

  for (
    const qid
    of candidateIds
  ) {

    if (
      qid === targetQid
    ) {

      continue;
    }

    const person =
      peopleByQid[qid];

    if (
      !person
    ) {

      continue;
    }

    if (
      person.birthYear ==
      null
    ) {

      continue;
    }

    if (
      person.deathYear ==
      null
    ) {

      continue;
    }

    const overlap =
      overlapYears(
        target,
        person
      );

    if (
      overlap <
      minOverlap
    ) {

      continue;
    }

    result.push({

      qid,
      pageid:
       String(person.pageid),

      title:
        person.title,

      birthYear:
        person.birthYear,

      deathYear:
        person.deathYear,

      overlapYears:
        overlap,

      articleLength:
        person.articleLength,

      nationalityIds:
        person.nationalityIds || [],

      occupationIds:
        person.occupationIds || []
    });
  }

  result.sort(
    (a, b) =>
      b.articleLength -
      a.articleLength
  );

  return result;
}

module.exports = {
  findContemporaries
};