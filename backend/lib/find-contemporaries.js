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
  let targetAge=target.deathYear - target.birthYear; 

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

const maxArticleLength = result.reduce(
    (max, item) => Math.max(max, item.articleLength),
    0
);

for (const item of result) {

    item.rank = Math.round((item.overlapYears / targetAge * 100) ** 2 
                              + (item.articleLength / maxArticleLength * 100) ** 2 )
}
  // result.sort(
  //   (a, b) =>
  //     b.articleLength -
  //     a.articleLength
  // );


  result.sort(
    (a, b) =>
      b.rank -
      a.rank
  );

  return result;
}

module.exports = {
  findContemporaries
};