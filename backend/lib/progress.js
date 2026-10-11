function logProgress(
  articleCount,
  qidCount
) {

  const qidRate =
    (
      qidCount /
      Math.max(
        articleCount,
        1
      ) *
      100
    )
    .toFixed(2);

  console.log(
    `${articleCount.toLocaleString("de-DE")} Artikel`
    + ` | QIDs=${qidCount.toLocaleString("de-DE")}`
    + ` | ${qidRate}%`
  );
}

module.exports = {
  logProgress
};