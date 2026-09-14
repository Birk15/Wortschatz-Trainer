const normalize = value => value.normalize("NFC").trim().toLocaleLowerCase("de");

export function evaluateAnswers(answers, solutions) {
  const expected = new Set(solutions.map(normalize));
  const seen = new Set();
  return answers.map(answer => {
    const value = normalize(answer);
    const correct = expected.has(value) && !seen.has(value);
    seen.add(value);
    return correct;
  });
}

