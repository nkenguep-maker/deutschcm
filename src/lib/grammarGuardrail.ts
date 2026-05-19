// Grammar guardrail — A1 German verb conjugation checker (sein / haben)
// Applied client-side before AI correction to catch the most frequent learner errors.

export interface GrammarError {
  input: string
  correction: string
  explanationEN: string
  explanationFR: string
}

export const SEIN_TABLE = [
  { pronoun: "ich",       form: "bin"  },
  { pronoun: "du",        form: "bist" },
  { pronoun: "er/sie/es", form: "ist"  },
  { pronoun: "wir",       form: "sind" },
  { pronoun: "ihr",       form: "seid" },
  { pronoun: "sie/Sie",   form: "sind" },
] as const

export const HABEN_TABLE = [
  { pronoun: "ich",       form: "habe"  },
  { pronoun: "du",        form: "hast"  },
  { pronoun: "er/sie/es", form: "hat"   },
  { pronoun: "wir",       form: "haben" },
  { pronoun: "ihr",       form: "habt"  },
  { pronoun: "sie/Sie",   form: "haben" },
] as const

const RULES: Array<{
  pattern: RegExp
  correction: string
  explanationEN: string
  explanationFR: string
}> = [
  // sein — ich
  { pattern: /\bich\s+ist\b/i,   correction: "Ich bin",  explanationEN: "With 'ich', use 'bin', not 'ist'.",   explanationFR: "Avec 'ich', on utilise 'bin' et non 'ist'."   },
  { pattern: /\bich\s+sind\b/i,  correction: "Ich bin",  explanationEN: "With 'ich', use 'bin', not 'sind'.",  explanationFR: "Avec 'ich', on utilise 'bin' et non 'sind'."  },
  { pattern: /\bich\s+bist\b/i,  correction: "Ich bin",  explanationEN: "With 'ich', use 'bin', not 'bist'.",  explanationFR: "Avec 'ich', on utilise 'bin' et non 'bist'."  },
  { pattern: /\bich\s+seid\b/i,  correction: "Ich bin",  explanationEN: "With 'ich', use 'bin', not 'seid'.",  explanationFR: "Avec 'ich', on utilise 'bin' et non 'seid'."  },
  // sein — du
  { pattern: /\bdu\s+bin\b/i,    correction: "Du bist",  explanationEN: "With 'du', use 'bist', not 'bin'.",   explanationFR: "Avec 'du', on utilise 'bist' et non 'bin'."   },
  { pattern: /\bdu\s+ist\b/i,    correction: "Du bist",  explanationEN: "With 'du', use 'bist', not 'ist'.",   explanationFR: "Avec 'du', on utilise 'bist' et non 'ist'."   },
  { pattern: /\bdu\s+sind\b/i,   correction: "Du bist",  explanationEN: "With 'du', use 'bist', not 'sind'.",  explanationFR: "Avec 'du', on utilise 'bist' et non 'sind'."  },
  { pattern: /\bdu\s+seid\b/i,   correction: "Du bist",  explanationEN: "With 'du', use 'bist', not 'seid'.",  explanationFR: "Avec 'du', on utilise 'bist' et non 'seid'."  },
  // sein — wir
  { pattern: /\bwir\s+bin\b/i,   correction: "Wir sind", explanationEN: "With 'wir', use 'sind', not 'bin'.",  explanationFR: "Avec 'wir', on utilise 'sind' et non 'bin'."  },
  { pattern: /\bwir\s+bist\b/i,  correction: "Wir sind", explanationEN: "With 'wir', use 'sind', not 'bist'.", explanationFR: "Avec 'wir', on utilise 'sind' et non 'bist'." },
  { pattern: /\bwir\s+ist\b/i,   correction: "Wir sind", explanationEN: "With 'wir', use 'sind', not 'ist'.",  explanationFR: "Avec 'wir', on utilise 'sind' et non 'ist'."  },
  { pattern: /\bwir\s+seid\b/i,  correction: "Wir sind", explanationEN: "With 'wir', use 'sind', not 'seid'.", explanationFR: "Avec 'wir', on utilise 'sind' et non 'seid'." },
  // sein — ihr
  { pattern: /\bihr\s+bin\b/i,   correction: "Ihr seid", explanationEN: "With 'ihr', use 'seid', not 'bin'.",  explanationFR: "Avec 'ihr', on utilise 'seid' et non 'bin'."  },
  { pattern: /\bihr\s+ist\b/i,   correction: "Ihr seid", explanationEN: "With 'ihr', use 'seid', not 'ist'.",  explanationFR: "Avec 'ihr', on utilise 'seid' et non 'ist'."  },
  { pattern: /\bihr\s+sind\b/i,  correction: "Ihr seid", explanationEN: "With 'ihr', use 'seid', not 'sind'.", explanationFR: "Avec 'ihr', on utilise 'seid' et non 'sind'." },
  // haben — ich
  { pattern: /\bich\s+hat\b/i,   correction: "Ich habe",   explanationEN: "With 'ich', use 'habe', not 'hat'.",   explanationFR: "Avec 'ich', on utilise 'habe' et non 'hat'."   },
  { pattern: /\bich\s+hast\b/i,  correction: "Ich habe",   explanationEN: "With 'ich', use 'habe', not 'hast'.",  explanationFR: "Avec 'ich', on utilise 'habe' et non 'hast'."  },
  { pattern: /\bich\s+haben\b/i, correction: "Ich habe",   explanationEN: "With 'ich', use 'habe', not 'haben'.", explanationFR: "Avec 'ich', on utilise 'habe' et non 'haben'." },
  { pattern: /\bich\s+habt\b/i,  correction: "Ich habe",   explanationEN: "With 'ich', use 'habe', not 'habt'.",  explanationFR: "Avec 'ich', on utilise 'habe' et non 'habt'."  },
  // haben — du
  { pattern: /\bdu\s+habe\b/i,   correction: "Du hast",    explanationEN: "With 'du', use 'hast', not 'habe'.",  explanationFR: "Avec 'du', on utilise 'hast' et non 'habe'."  },
  { pattern: /\bdu\s+hat\b/i,    correction: "Du hast",    explanationEN: "With 'du', use 'hast', not 'hat'.",   explanationFR: "Avec 'du', on utilise 'hast' et non 'hat'."   },
  { pattern: /\bdu\s+haben\b/i,  correction: "Du hast",    explanationEN: "With 'du', use 'hast', not 'haben'.", explanationFR: "Avec 'du', on utilise 'hast' et non 'haben'." },
  // haben — wir
  { pattern: /\bwir\s+hat\b/i,   correction: "Wir haben",  explanationEN: "With 'wir', use 'haben', not 'hat'.",  explanationFR: "Avec 'wir', on utilise 'haben' et non 'hat'."  },
  { pattern: /\bwir\s+hast\b/i,  correction: "Wir haben",  explanationEN: "With 'wir', use 'haben', not 'hast'.", explanationFR: "Avec 'wir', on utilise 'haben' et non 'hast'." },
  // Modal verb word order
  { pattern: /\bkann\s+sprechen\s+Deutsch\b/i,
    correction: "kann Deutsch sprechen",
    explanationEN: "With modal verbs, the infinitive goes to the END: 'kann Deutsch sprechen'.",
    explanationFR: "Avec les modaux, l'infinitif va en FIN de phrase : 'kann Deutsch sprechen'." },
  { pattern: /\bmuss\s+gehen\s+zum\b/i,
    correction: "muss zum … gehen",
    explanationEN: "With modal verbs, the infinitive goes to the END of the sentence.",
    explanationFR: "Avec les modaux, l'infinitif va en FIN de phrase." },
]

export function checkGermanGrammar(text: string): GrammarError[] {
  const errors: GrammarError[] = []
  for (const rule of RULES) {
    const match = text.match(rule.pattern)
    if (match) {
      errors.push({
        input: match[0],
        correction: rule.correction,
        explanationEN: rule.explanationEN,
        explanationFR: rule.explanationFR,
      })
    }
  }
  return errors
}

// System-prompt addition for Gemini to enforce these guardrails on the AI side.
export const GRAMMAR_GUARDRAIL_SYSTEM_PROMPT = `
GERMAN GRAMMAR GUARDRAILS — A1 LEVEL
Verb "sein" (to be): ich bin · du bist · er/sie/es ist · wir sind · ihr seid · sie/Sie sind
Verb "haben" (to have): ich habe · du hast · er/sie/es hat · wir haben · ihr habt · sie/Sie haben

MANDATORY CORRECTIONS — always apply:
- "ich ist" → "Ich bin" | EN: With 'ich', use 'bin'. | FR: Avec 'ich', on utilise 'bin'.
- "du bin"  → "Du bist" | EN: With 'du', use 'bist'. | FR: Avec 'du', on utilise 'bist'.
- "wir ist" → "Wir sind" | EN: With 'wir', use 'sind'. | FR: Avec 'wir', on utilise 'sind'.
- "ich hat" → "Ich habe" | EN: With 'ich', use 'habe'. | FR: Avec 'ich', on utilise 'habe'.
- Modal verb order: infinitive ALWAYS goes to END of sentence.

Format: Correction: "[corrected sentence]" | EN: "[explanation in English]" | FR: "[explication en français]"
`.trim()
