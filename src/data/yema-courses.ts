/*
Yema static German A1/A2 course seed data.
Original copyright-safe content inspired only by CEFR-style progression.
Do not copy commercial textbook text/images/exercises.
No AI runtime generation required.
*/

export const yemaStaticGermanCourses = [
  {
    "id": "german-a1",
    "level": "A1",
    "title_fr": "Allemand A1 — Premiers pas",
    "title_en": "German A1 — First steps",
    "description_fr": "Se présenter, comprendre des phrases simples et gérer des situations de base.",
    "description_en": "Introduce yourself, understand simple sentences and handle basic situations.",
    "status": "available",
    "estimatedDuration": "12 weeks",
    "cefrAligned": true,
    "totalXp": 1500,
    "lessons": [
      {
        "id": "willkommen",
        "order": 1,
        "title_de": "Willkommen",
        "title_fr": "Premiers pas",
        "title_en": "First steps",
        "description_fr": "Salutations et présentations",
        "description_en": "Greetings and introductions",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : salutations et présentations.",
        "objective_en": "Understand and use simple phrases for: greetings and introductions.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "sein, heißen, pronoms personnels",
          "en": "sein, heißen, personal pronouns"
        },
        "vocabulary": [
          "Guten Tag",
          "Hallo",
          "Ich heiße",
          "Ich komme aus",
          "Kamerun",
          "Deutschland",
          "Deutsch",
          "Freut mich",
          "Wie heißen Sie?",
          "Woher kommen Sie?"
        ],
        "modules": [
          {
            "id": "willkommen-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Salutations et présentations.",
              "objective_en": "Objective: Greetings and introductions.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "willkommen-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Amara",
                  "text_de": "Guten Tag. Ich heiße Amara."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Ich komme aus Kamerun."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Ich lerne Deutsch."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Freut mich, Frau Bauer."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "willkommen-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Guten Tag",
                  "fr": "Bonjour (formel)",
                  "en": "Good day (formal)"
                },
                {
                  "de": "Hallo",
                  "fr": "Salut / Bonjour",
                  "en": "Hello / Hi"
                },
                {
                  "de": "Ich heiße",
                  "fr": "Je m'appelle",
                  "en": "My name is"
                },
                {
                  "de": "Ich komme aus",
                  "fr": "Je viens de",
                  "en": "I come from"
                },
                {
                  "de": "Kamerun",
                  "fr": "Cameroun",
                  "en": "Cameroon"
                },
                {
                  "de": "Deutschland",
                  "fr": "Allemagne",
                  "en": "Germany"
                },
                {
                  "de": "Deutsch",
                  "fr": "l'allemand",
                  "en": "German (language)"
                },
                {
                  "de": "Freut mich",
                  "fr": "Enchanté(e)",
                  "en": "Nice to meet you"
                },
                {
                  "de": "Wie heißen Sie?",
                  "fr": "Comment vous appelez-vous ?",
                  "en": "What is your name?"
                },
                {
                  "de": "Woher kommen Sie?",
                  "fr": "D'où venez-vous ?",
                  "en": "Where are you from?"
                }
              ]
            }
          },
          {
            "id": "willkommen-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : sein, heißen, pronoms personnels. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: sein, heißen, personal pronouns. Observe the examples and create your own sentence.",
              "examples_de": [
                "Guten Tag. Ich heiße Amara.",
                "Ich komme aus Kamerun.",
                "Ich lerne Deutsch.",
                "Freut mich, Frau Bauer."
              ]
            }
          },
          {
            "id": "willkommen-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à salutations et présentations.",
              "prompt_en": "Introduce yourself or answer a question related to greetings and introductions.",
              "starter_de": [
                "Guten Tag. Ich heiße Amara.",
                "Ich komme aus Kamerun.",
                "Ich lerne Deutsch."
              ]
            }
          },
          {
            "id": "willkommen-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Salutations et présentations.",
              "prompt_en": "Write 3 to 5 simple sentences about: Greetings and introductions.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "willkommen-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "willkommen-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "willkommen-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Guten Tag' ?",
                "question_en": "What does 'Guten Tag' mean?",
                "prompt_de": "Guten Tag",
                "options": [
                  "Bonjour (formel)",
                  "Bonne nuit",
                  "Au revoir",
                  "Bonsoir"
                ],
                "correctAnswer": "Bonjour (formel)",
                "explanation_fr": "'Guten Tag' est une salutation formelle utilisée en journée.",
                "explanation_en": "'Guten Tag' is a formal daytime greeting.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "willkommen-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "willkommen-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "willkommen-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "willkommen-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              }
            ]
          },
          {
            "id": "willkommen-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "willkommen-cartoon-video",
              "title_fr": "Vidéo cartoon — Premiers pas",
              "title_en": "Cartoon video — First steps",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Premiers pas.",
              "objective_en": "Understand a simple situation related to First steps.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Guten Tag. Ich heiße Amara. » dans une situation quotidienne liée à Premiers pas.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Guten Tag. Ich heiße Amara.” in an everyday situation related to First steps.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour premiers pas.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for first steps.",
                  "dialogue_de": "Guten Tag. Ich heiße Amara.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Guten"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich komme aus Kamerun. » dans une situation quotidienne liée à Premiers pas.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich komme aus Kamerun.” in an everyday situation related to First steps.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour premiers pas.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for first steps.",
                  "dialogue_de": "Ich komme aus Kamerun.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich lerne Deutsch. » dans une situation quotidienne liée à Premiers pas.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich lerne Deutsch.” in an everyday situation related to First steps.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour premiers pas.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for first steps.",
                  "dialogue_de": "Ich lerne Deutsch.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Freut mich, Frau Bauer. » dans une situation quotidienne liée à Premiers pas.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Freut mich, Frau Bauer.” in an everyday situation related to First steps.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour premiers pas.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for first steps.",
                  "dialogue_de": "Freut mich, Frau Bauer.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Freut"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "meine-familie",
        "order": 2,
        "title_de": "Meine Familie",
        "title_fr": "Ma famille",
        "title_en": "My family",
        "description_fr": "Famille et informations personnelles",
        "description_en": "Family and personal information",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : famille et informations personnelles.",
        "objective_en": "Understand and use simple phrases for: family and personal information.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "mein/meine, dein/deine",
          "en": "mein/meine, dein/deine"
        },
        "vocabulary": [
          "Mutter",
          "Vater",
          "Bruder",
          "Schwester",
          "Familie",
          "Sohn",
          "Tochter",
          "Eltern",
          "Jahre alt",
          "verheiratet"
        ],
        "modules": [
          {
            "id": "meine-familie-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Famille et informations personnelles.",
              "objective_en": "Objective: Family and personal information.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "meine-familie-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Amara",
                  "text_de": "Das ist meine Mutter."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Mein Bruder heißt David."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Ich habe eine Schwester."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Meine Familie wohnt in Douala."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "meine-familie-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Mutter",
                  "fr": "mère",
                  "en": "mother"
                },
                {
                  "de": "Vater",
                  "fr": "père",
                  "en": "father"
                },
                {
                  "de": "Bruder",
                  "fr": "frère",
                  "en": "brother"
                },
                {
                  "de": "Schwester",
                  "fr": "sœur",
                  "en": "sister"
                },
                {
                  "de": "Familie",
                  "fr": "famille",
                  "en": "family"
                },
                {
                  "de": "Sohn",
                  "fr": "fils",
                  "en": "son"
                },
                {
                  "de": "Tochter",
                  "fr": "fille",
                  "en": "daughter"
                },
                {
                  "de": "Eltern",
                  "fr": "parents",
                  "en": "parents"
                },
                {
                  "de": "Jahre alt",
                  "fr": "ans (âge)",
                  "en": "years old"
                },
                {
                  "de": "verheiratet",
                  "fr": "marié(e)",
                  "en": "married"
                }
              ]
            }
          },
          {
            "id": "meine-familie-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : mein/meine, dein/deine. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: mein/meine, dein/deine. Observe the examples and create your own sentence.",
              "examples_de": [
                "Das ist meine Mutter.",
                "Mein Bruder heißt David.",
                "Ich habe eine Schwester.",
                "Meine Familie wohnt in Douala."
              ]
            }
          },
          {
            "id": "meine-familie-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à famille et informations personnelles.",
              "prompt_en": "Introduce yourself or answer a question related to family and personal information.",
              "starter_de": [
                "Das ist meine Mutter.",
                "Mein Bruder heißt David.",
                "Ich habe eine Schwester."
              ]
            }
          },
          {
            "id": "meine-familie-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Famille et informations personnelles.",
              "prompt_en": "Write 3 to 5 simple sentences about: Family and personal information.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "meine-familie-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "meine-familie-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "meine-familie-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Mutter' ?",
                "question_en": "What does 'Mutter' mean?",
                "prompt_de": "Eltern",
                "options": [
                  "mère",
                  "père",
                  "sœur",
                  "frère"
                ],
                "correctAnswer": "mère",
                "explanation_fr": "'Mutter' signifie 'mère' en allemand.",
                "explanation_en": "'Mutter' means 'mother' in German.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "meine-familie-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "meine-familie-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "meine-familie-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "meine-familie-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              }
            ]
          },
          {
            "id": "meine-familie-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "meine-familie-cartoon-video",
              "title_fr": "Vidéo cartoon — Ma famille",
              "title_en": "Cartoon video — My family",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Ma famille.",
              "objective_en": "Understand a simple situation related to My family.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Das ist meine Mutter. » dans une situation quotidienne liée à Ma famille.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Das ist meine Mutter.” in an everyday situation related to My family.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour ma famille.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for my family.",
                  "dialogue_de": "Das ist meine Mutter.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Das"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Mein Bruder heißt David. » dans une situation quotidienne liée à Ma famille.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Mein Bruder heißt David.” in an everyday situation related to My family.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour ma famille.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for my family.",
                  "dialogue_de": "Mein Bruder heißt David.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Mein"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich habe eine Schwester. » dans une situation quotidienne liée à Ma famille.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich habe eine Schwester.” in an everyday situation related to My family.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour ma famille.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for my family.",
                  "dialogue_de": "Ich habe eine Schwester.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Meine Familie wohnt in Douala. » dans une situation quotidienne liée à Ma famille.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Meine Familie wohnt in Douala.” in an everyday situation related to My family.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour ma famille.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for my family.",
                  "dialogue_de": "Meine Familie wohnt in Douala.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Meine"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "mein-alltag",
        "order": 3,
        "title_de": "Mein Alltag",
        "title_fr": "Mon quotidien",
        "title_en": "My daily routine",
        "description_fr": "Routine quotidienne et heure",
        "description_en": "Daily routine and time",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : routine quotidienne et heure.",
        "objective_en": "Understand and use simple phrases for: daily routine and time.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "présent des verbes réguliers, position du verbe",
          "en": "regular verbs, verb position"
        },
        "vocabulary": [
          "aufstehen",
          "arbeiten",
          "lernen",
          "essen",
          "trinken",
          "schlafen",
          "Uhr",
          "Morgen",
          "Abend",
          "Montag"
        ],
        "modules": [
          {
            "id": "mein-alltag-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Routine quotidienne et heure.",
              "objective_en": "Objective: Daily routine and time.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "mein-alltag-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Amara",
                  "text_de": "Ich stehe um sieben Uhr auf."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Ich lerne jeden Abend Deutsch."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Am Montag arbeite ich."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Ich esse um zwölf Uhr."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "mein-alltag-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "aufstehen",
                  "fr": "se lever",
                  "en": "to get up"
                },
                {
                  "de": "arbeiten",
                  "fr": "travailler",
                  "en": "to work"
                },
                {
                  "de": "lernen",
                  "fr": "apprendre",
                  "en": "to learn"
                },
                {
                  "de": "essen",
                  "fr": "manger",
                  "en": "to eat"
                },
                {
                  "de": "trinken",
                  "fr": "boire",
                  "en": "to drink"
                },
                {
                  "de": "schlafen",
                  "fr": "dormir",
                  "en": "to sleep"
                },
                {
                  "de": "Uhr",
                  "fr": "heure",
                  "en": "o'clock / hour"
                },
                {
                  "de": "Morgen",
                  "fr": "matin",
                  "en": "morning"
                },
                {
                  "de": "Abend",
                  "fr": "soir",
                  "en": "evening"
                },
                {
                  "de": "Montag",
                  "fr": "lundi",
                  "en": "Monday"
                }
              ]
            }
          },
          {
            "id": "mein-alltag-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : présent des verbes réguliers, position du verbe. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: regular verbs, verb position. Observe the examples and create your own sentence.",
              "examples_de": [
                "Ich stehe um sieben Uhr auf.",
                "Ich lerne jeden Abend Deutsch.",
                "Am Montag arbeite ich.",
                "Ich esse um zwölf Uhr."
              ]
            }
          },
          {
            "id": "mein-alltag-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à routine quotidienne et heure.",
              "prompt_en": "Introduce yourself or answer a question related to daily routine and time.",
              "starter_de": [
                "Ich stehe um sieben Uhr auf.",
                "Ich lerne jeden Abend Deutsch.",
                "Am Montag arbeite ich."
              ]
            }
          },
          {
            "id": "mein-alltag-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Routine quotidienne et heure.",
              "prompt_en": "Write 3 to 5 simple sentences about: Daily routine and time.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "mein-alltag-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "mein-alltag-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "mein-alltag-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'aufstehen' ?",
                "question_en": "What does 'aufstehen' mean?",
                "prompt_de": "essen",
                "options": [
                  "se lever",
                  "se coucher",
                  "manger",
                  "travailler"
                ],
                "correctAnswer": "se lever",
                "explanation_fr": "'aufstehen' signifie 'se lever' — action du matin.",
                "explanation_en": "'aufstehen' means 'to get up' — a morning action.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "mein-alltag-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "mein-alltag-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "mein-alltag-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "mein-alltag-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              }
            ]
          },
          {
            "id": "mein-alltag-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "mein-alltag-cartoon-video",
              "title_fr": "Vidéo cartoon — Mon quotidien",
              "title_en": "Cartoon video — My daily routine",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Mon quotidien.",
              "objective_en": "Understand a simple situation related to My daily routine.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich stehe um sieben Uhr auf. » dans une situation quotidienne liée à Mon quotidien.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich stehe um sieben Uhr auf.” in an everyday situation related to My daily routine.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour mon quotidien.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for my daily routine.",
                  "dialogue_de": "Ich stehe um sieben Uhr auf.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich lerne jeden Abend Deutsch. » dans une situation quotidienne liée à Mon quotidien.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich lerne jeden Abend Deutsch.” in an everyday situation related to My daily routine.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour mon quotidien.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for my daily routine.",
                  "dialogue_de": "Ich lerne jeden Abend Deutsch.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Am Montag arbeite ich. » dans une situation quotidienne liée à Mon quotidien.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Am Montag arbeite ich.” in an everyday situation related to My daily routine.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour mon quotidien.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for my daily routine.",
                  "dialogue_de": "Am Montag arbeite ich.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Am"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich esse um zwölf Uhr. » dans une situation quotidienne liée à Mon quotidien.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich esse um zwölf Uhr.” in an everyday situation related to My daily routine.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour mon quotidien.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for my daily routine.",
                  "dialogue_de": "Ich esse um zwölf Uhr.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "essen-einkaufen",
        "order": 4,
        "title_de": "Essen und Einkaufen",
        "title_fr": "Manger et faire les courses",
        "title_en": "Food and shopping",
        "description_fr": "Nourriture, prix et achats",
        "description_en": "Food, prices and shopping",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : nourriture, prix et achats.",
        "objective_en": "Understand and use simple phrases for: food, prices and shopping.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "haben, möchten, accusatif simple",
          "en": "haben, möchten, simple accusative"
        },
        "vocabulary": [
          "Brot",
          "Wasser",
          "Reis",
          "Obst",
          "Gemüse",
          "Kaffee",
          "Preis",
          "Euro",
          "kaufen",
          "kosten"
        ],
        "modules": [
          {
            "id": "essen-einkaufen-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Nourriture, prix et achats.",
              "objective_en": "Objective: Food, prices and shopping.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "essen-einkaufen-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Amara",
                  "text_de": "Ich möchte Brot."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Wie viel kostet das?"
                },
                {
                  "speaker": "Amara",
                  "text_de": "Das kostet drei Euro."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Ich habe Wasser und Reis."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "essen-einkaufen-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Brot",
                  "fr": "pain",
                  "en": "bread"
                },
                {
                  "de": "Wasser",
                  "fr": "eau",
                  "en": "water"
                },
                {
                  "de": "Reis",
                  "fr": "riz",
                  "en": "rice"
                },
                {
                  "de": "Obst",
                  "fr": "fruits",
                  "en": "fruit"
                },
                {
                  "de": "Gemüse",
                  "fr": "légumes",
                  "en": "vegetables"
                },
                {
                  "de": "Kaffee",
                  "fr": "café",
                  "en": "coffee"
                },
                {
                  "de": "Preis",
                  "fr": "prix",
                  "en": "price"
                },
                {
                  "de": "Euro",
                  "fr": "euro",
                  "en": "euro"
                },
                {
                  "de": "kaufen",
                  "fr": "acheter",
                  "en": "to buy"
                },
                {
                  "de": "kosten",
                  "fr": "coûter",
                  "en": "to cost"
                }
              ]
            }
          },
          {
            "id": "essen-einkaufen-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : haben, möchten, accusatif simple. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: haben, möchten, simple accusative. Observe the examples and create your own sentence.",
              "examples_de": [
                "Ich möchte Brot.",
                "Wie viel kostet das?",
                "Das kostet drei Euro.",
                "Ich habe Wasser und Reis."
              ]
            }
          },
          {
            "id": "essen-einkaufen-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à nourriture, prix et achats.",
              "prompt_en": "Introduce yourself or answer a question related to food, prices and shopping.",
              "starter_de": [
                "Ich möchte Brot.",
                "Wie viel kostet das?",
                "Das kostet drei Euro."
              ]
            }
          },
          {
            "id": "essen-einkaufen-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Nourriture, prix et achats.",
              "prompt_en": "Write 3 to 5 simple sentences about: Food, prices and shopping.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "essen-einkaufen-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "essen-einkaufen-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "essen-einkaufen-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Brot' ?",
                "question_en": "What does 'Brot' mean?",
                "prompt_de": "Gemüse",
                "options": [
                  "pain",
                  "eau",
                  "riz",
                  "café"
                ],
                "correctAnswer": "pain",
                "explanation_fr": "'Brot' est un aliment de base en Allemagne — le pain.",
                "explanation_en": "'Brot' means 'bread', a staple in Germany.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "essen-einkaufen-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "essen-einkaufen-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "essen-einkaufen-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "essen-einkaufen-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              }
            ]
          },
          {
            "id": "essen-einkaufen-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "essen-einkaufen-cartoon-video",
              "title_fr": "Vidéo cartoon — Manger et faire les courses",
              "title_en": "Cartoon video — Food and shopping",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Manger et faire les courses.",
              "objective_en": "Understand a simple situation related to Food and shopping.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich möchte Brot. » dans une situation quotidienne liée à Manger et faire les courses.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich möchte Brot.” in an everyday situation related to Food and shopping.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour manger et faire les courses.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for food and shopping.",
                  "dialogue_de": "Ich möchte Brot.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Wie viel kostet das? » dans une situation quotidienne liée à Manger et faire les courses.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Wie viel kostet das?” in an everyday situation related to Food and shopping.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour manger et faire les courses.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for food and shopping.",
                  "dialogue_de": "Wie viel kostet das?",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Wie"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Das kostet drei Euro. » dans une situation quotidienne liée à Manger et faire les courses.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Das kostet drei Euro.” in an everyday situation related to Food and shopping.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour manger et faire les courses.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for food and shopping.",
                  "dialogue_de": "Das kostet drei Euro.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Das"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich habe Wasser und Reis. » dans une situation quotidienne liée à Manger et faire les courses.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich habe Wasser und Reis.” in an everyday situation related to Food and shopping.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour manger et faire les courses.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for food and shopping.",
                  "dialogue_de": "Ich habe Wasser und Reis.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "unterwegs",
        "order": 5,
        "title_de": "Unterwegs",
        "title_fr": "Se déplacer",
        "title_en": "Getting around",
        "description_fr": "Transport et orientation",
        "description_en": "Transport and orientation",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : transport et orientation.",
        "objective_en": "Understand and use simple phrases for: transport and orientation.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "wo, wohin, prépositions simples",
          "en": "wo, wohin, simple prepositions"
        },
        "vocabulary": [
          "Bahnhof",
          "Bus",
          "Zug",
          "Flughafen",
          "links",
          "rechts",
          "geradeaus",
          "Ticket",
          "Straße",
          "Hilfe"
        ],
        "modules": [
          {
            "id": "unterwegs-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Transport et orientation.",
              "objective_en": "Objective: Transport and orientation.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "unterwegs-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Amara",
                  "text_de": "Wo ist der Bahnhof?"
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Gehen Sie geradeaus."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Ich fahre mit dem Bus."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Ich brauche ein Ticket."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "unterwegs-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Bahnhof",
                  "fr": "gare",
                  "en": "train station"
                },
                {
                  "de": "Bus",
                  "fr": "bus",
                  "en": "bus"
                },
                {
                  "de": "Zug",
                  "fr": "train",
                  "en": "train"
                },
                {
                  "de": "Flughafen",
                  "fr": "aéroport",
                  "en": "airport"
                },
                {
                  "de": "links",
                  "fr": "à gauche",
                  "en": "left"
                },
                {
                  "de": "rechts",
                  "fr": "à droite",
                  "en": "right"
                },
                {
                  "de": "geradeaus",
                  "fr": "tout droit",
                  "en": "straight ahead"
                },
                {
                  "de": "Ticket",
                  "fr": "billet",
                  "en": "ticket"
                },
                {
                  "de": "Straße",
                  "fr": "rue / chemin",
                  "en": "street"
                },
                {
                  "de": "Hilfe",
                  "fr": "aide / au secours",
                  "en": "help"
                }
              ]
            }
          },
          {
            "id": "unterwegs-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : wo, wohin, prépositions simples. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: wo, wohin, simple prepositions. Observe the examples and create your own sentence.",
              "examples_de": [
                "Wo ist der Bahnhof?",
                "Gehen Sie geradeaus.",
                "Ich fahre mit dem Bus.",
                "Ich brauche ein Ticket."
              ]
            }
          },
          {
            "id": "unterwegs-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à transport et orientation.",
              "prompt_en": "Introduce yourself or answer a question related to transport and orientation.",
              "starter_de": [
                "Wo ist der Bahnhof?",
                "Gehen Sie geradeaus.",
                "Ich fahre mit dem Bus."
              ]
            }
          },
          {
            "id": "unterwegs-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Transport et orientation.",
              "prompt_en": "Write 3 to 5 simple sentences about: Transport and orientation.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "unterwegs-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "unterwegs-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "unterwegs-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Bahnhof' ?",
                "question_en": "What does 'Bahnhof' mean?",
                "prompt_de": "links",
                "options": [
                  "gare",
                  "aéroport",
                  "bus",
                  "rue"
                ],
                "correctAnswer": "gare",
                "explanation_fr": "'Bahnhof' désigne la gare ferroviaire.",
                "explanation_en": "'Bahnhof' means 'train station'.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "unterwegs-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "unterwegs-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "unterwegs-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "unterwegs-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              }
            ]
          },
          {
            "id": "unterwegs-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "unterwegs-cartoon-video",
              "title_fr": "Vidéo cartoon — Se déplacer",
              "title_en": "Cartoon video — Getting around",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Se déplacer.",
              "objective_en": "Understand a simple situation related to Getting around.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Wo ist der Bahnhof? » dans une situation quotidienne liée à Se déplacer.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Wo ist der Bahnhof?” in an everyday situation related to Getting around.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour se déplacer.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for getting around.",
                  "dialogue_de": "Wo ist der Bahnhof?",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Wo"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Gehen Sie geradeaus. » dans une situation quotidienne liée à Se déplacer.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Gehen Sie geradeaus.” in an everyday situation related to Getting around.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour se déplacer.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for getting around.",
                  "dialogue_de": "Gehen Sie geradeaus.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Gehen"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich fahre mit dem Bus. » dans une situation quotidienne liée à Se déplacer.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich fahre mit dem Bus.” in an everyday situation related to Getting around.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour se déplacer.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for getting around.",
                  "dialogue_de": "Ich fahre mit dem Bus.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich brauche ein Ticket. » dans une situation quotidienne liée à Se déplacer.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich brauche ein Ticket.” in an everyday situation related to Getting around.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour se déplacer.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for getting around.",
                  "dialogue_de": "Ich brauche ein Ticket.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "ein-termin",
        "order": 6,
        "title_de": "Ein Termin",
        "title_fr": "Un rendez-vous",
        "title_en": "An appointment",
        "description_fr": "Communication polie et rendez-vous",
        "description_en": "Polite communication and appointments",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : communication polie et rendez-vous.",
        "objective_en": "Understand and use simple phrases for: polite communication and appointments.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "Sie, questions polies",
          "en": "formal Sie, polite questions"
        },
        "vocabulary": [
          "Termin",
          "Dokument",
          "Pass",
          "Bitte",
          "Warten",
          "Name",
          "Adresse",
          "Formular",
          "Unterschrift",
          "heute"
        ],
        "modules": [
          {
            "id": "ein-termin-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Communication polie et rendez-vous.",
              "objective_en": "Objective: Polite communication and appointments.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "ein-termin-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Amara",
                  "text_de": "Ich habe einen Termin."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Hier ist mein Pass."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Können Sie mir helfen?"
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Danke für Ihre Hilfe."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "ein-termin-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Termin",
                  "fr": "rendez-vous",
                  "en": "appointment"
                },
                {
                  "de": "Dokument",
                  "fr": "document",
                  "en": "document"
                },
                {
                  "de": "Pass",
                  "fr": "passeport",
                  "en": "passport"
                },
                {
                  "de": "Bitte",
                  "fr": "s'il vous plaît",
                  "en": "please"
                },
                {
                  "de": "Warten",
                  "fr": "attendre",
                  "en": "to wait"
                },
                {
                  "de": "Name",
                  "fr": "nom",
                  "en": "name"
                },
                {
                  "de": "Adresse",
                  "fr": "adresse",
                  "en": "address"
                },
                {
                  "de": "Formular",
                  "fr": "formulaire",
                  "en": "form"
                },
                {
                  "de": "Unterschrift",
                  "fr": "signature",
                  "en": "signature"
                },
                {
                  "de": "heute",
                  "fr": "aujourd'hui",
                  "en": "today"
                }
              ]
            }
          },
          {
            "id": "ein-termin-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : Sie, questions polies. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: formal Sie, polite questions. Observe the examples and create your own sentence.",
              "examples_de": [
                "Ich habe einen Termin.",
                "Hier ist mein Pass.",
                "Können Sie mir helfen?",
                "Danke für Ihre Hilfe."
              ]
            }
          },
          {
            "id": "ein-termin-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à communication polie et rendez-vous.",
              "prompt_en": "Introduce yourself or answer a question related to polite communication and appointments.",
              "starter_de": [
                "Ich habe einen Termin.",
                "Hier ist mein Pass.",
                "Können Sie mir helfen?"
              ]
            }
          },
          {
            "id": "ein-termin-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Communication polie et rendez-vous.",
              "prompt_en": "Write 3 to 5 simple sentences about: Polite communication and appointments.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "ein-termin-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "ein-termin-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "ein-termin-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Termin' ?",
                "question_en": "What does 'Termin' mean?",
                "prompt_de": "Pass",
                "options": [
                  "rendez-vous",
                  "formulaire",
                  "signature",
                  "document"
                ],
                "correctAnswer": "rendez-vous",
                "explanation_fr": "'Termin' signifie 'rendez-vous' — mot clé pour l'administration.",
                "explanation_en": "'Termin' means 'appointment' — key word at official offices.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "ein-termin-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "ein-termin-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "ein-termin-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "ein-termin-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              }
            ]
          },
          {
            "id": "ein-termin-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "ein-termin-cartoon-video",
              "title_fr": "Vidéo cartoon — Un rendez-vous",
              "title_en": "Cartoon video — An appointment",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Un rendez-vous.",
              "objective_en": "Understand a simple situation related to An appointment.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich habe einen Termin. » dans une situation quotidienne liée à Un rendez-vous.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich habe einen Termin.” in an everyday situation related to An appointment.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour un rendez-vous.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for an appointment.",
                  "dialogue_de": "Ich habe einen Termin.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Hier ist mein Pass. » dans une situation quotidienne liée à Un rendez-vous.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Hier ist mein Pass.” in an everyday situation related to An appointment.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour un rendez-vous.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for an appointment.",
                  "dialogue_de": "Hier ist mein Pass.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Hier"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Können Sie mir helfen? » dans une situation quotidienne liée à Un rendez-vous.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Können Sie mir helfen?” in an everyday situation related to An appointment.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour un rendez-vous.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for an appointment.",
                  "dialogue_de": "Können Sie mir helfen?",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Können"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Danke für Ihre Hilfe. » dans une situation quotidienne liée à Un rendez-vous.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Danke für Ihre Hilfe.” in an everyday situation related to An appointment.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour un rendez-vous.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for an appointment.",
                  "dialogue_de": "Danke für Ihre Hilfe.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Danke"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "wohnen",
        "order": 7,
        "title_de": "Wohnen",
        "title_fr": "Habiter",
        "title_en": "Housing",
        "description_fr": "Logement et pièces",
        "description_en": "Housing and rooms",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : logement et pièces.",
        "objective_en": "Understand and use simple phrases for: housing and rooms.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "articles der/die/das, kein/keine",
          "en": "articles der/die/das, kein/keine"
        },
        "vocabulary": [
          "Wohnung",
          "Zimmer",
          "Küche",
          "Bad",
          "Miete",
          "Tisch",
          "Stuhl",
          "Bett",
          "klein",
          "groß"
        ],
        "modules": [
          {
            "id": "wohnen-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Logement et pièces.",
              "objective_en": "Objective: Housing and rooms.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "wohnen-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Amara",
                  "text_de": "Das ist mein Zimmer."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Die Wohnung ist klein."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Ich habe kein Bett."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Die Küche ist sauber."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "wohnen-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Wohnung",
                  "fr": "appartement",
                  "en": "apartment"
                },
                {
                  "de": "Zimmer",
                  "fr": "pièce / chambre",
                  "en": "room"
                },
                {
                  "de": "Küche",
                  "fr": "cuisine",
                  "en": "kitchen"
                },
                {
                  "de": "Bad",
                  "fr": "salle de bain",
                  "en": "bathroom"
                },
                {
                  "de": "Miete",
                  "fr": "loyer",
                  "en": "rent"
                },
                {
                  "de": "Tisch",
                  "fr": "table",
                  "en": "table"
                },
                {
                  "de": "Stuhl",
                  "fr": "chaise",
                  "en": "chair"
                },
                {
                  "de": "Bett",
                  "fr": "lit",
                  "en": "bed"
                },
                {
                  "de": "klein",
                  "fr": "petit(e)",
                  "en": "small"
                },
                {
                  "de": "groß",
                  "fr": "grand(e)",
                  "en": "large"
                }
              ]
            }
          },
          {
            "id": "wohnen-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : articles der/die/das, kein/keine. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: articles der/die/das, kein/keine. Observe the examples and create your own sentence.",
              "examples_de": [
                "Das ist mein Zimmer.",
                "Die Wohnung ist klein.",
                "Ich habe kein Bett.",
                "Die Küche ist sauber."
              ]
            }
          },
          {
            "id": "wohnen-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à logement et pièces.",
              "prompt_en": "Introduce yourself or answer a question related to housing and rooms.",
              "starter_de": [
                "Das ist mein Zimmer.",
                "Die Wohnung ist klein.",
                "Ich habe kein Bett."
              ]
            }
          },
          {
            "id": "wohnen-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Logement et pièces.",
              "prompt_en": "Write 3 to 5 simple sentences about: Housing and rooms.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "wohnen-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "wohnen-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "wohnen-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Wohnung' ?",
                "question_en": "What does 'Wohnung' mean?",
                "prompt_de": "Küche",
                "options": [
                  "appartement",
                  "cuisine",
                  "chambre",
                  "loyer"
                ],
                "correctAnswer": "appartement",
                "explanation_fr": "'Wohnung' désigne l'appartement ou le logement.",
                "explanation_en": "'Wohnung' means 'apartment' or 'flat'.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "wohnen-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "wohnen-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "wohnen-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "wohnen-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              }
            ]
          },
          {
            "id": "wohnen-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "wohnen-cartoon-video",
              "title_fr": "Vidéo cartoon — Habiter",
              "title_en": "Cartoon video — Housing",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Habiter.",
              "objective_en": "Understand a simple situation related to Housing.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Das ist mein Zimmer. » dans une situation quotidienne liée à Habiter.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Das ist mein Zimmer.” in an everyday situation related to Housing.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour habiter.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for housing.",
                  "dialogue_de": "Das ist mein Zimmer.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Das"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Die Wohnung ist klein. » dans une situation quotidienne liée à Habiter.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Die Wohnung ist klein.” in an everyday situation related to Housing.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour habiter.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for housing.",
                  "dialogue_de": "Die Wohnung ist klein.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Die"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich habe kein Bett. » dans une situation quotidienne liée à Habiter.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich habe kein Bett.” in an everyday situation related to Housing.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour habiter.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for housing.",
                  "dialogue_de": "Ich habe kein Bett.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Die Küche ist sauber. » dans une situation quotidienne liée à Habiter.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Die Küche ist sauber.” in an everyday situation related to Housing.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour habiter.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for housing.",
                  "dialogue_de": "Die Küche ist sauber.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Die"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "gesundheit",
        "order": 8,
        "title_de": "Gesundheit",
        "title_fr": "Santé",
        "title_en": "Health",
        "description_fr": "Santé et pharmacie",
        "description_en": "Health and pharmacy",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : santé et pharmacie.",
        "objective_en": "Understand and use simple phrases for: health and pharmacy.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "müssen",
          "en": "modal verb müssen"
        },
        "vocabulary": [
          "Kopf",
          "Bauch",
          "Schmerz",
          "Arzt",
          "Apotheke",
          "Medikament",
          "krank",
          "müde",
          "Termin",
          "Hilfe"
        ],
        "modules": [
          {
            "id": "gesundheit-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Santé et pharmacie.",
              "objective_en": "Objective: Health and pharmacy.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "gesundheit-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Amara",
                  "text_de": "Ich habe Kopfschmerzen."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Ich muss zum Arzt."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Wo ist die Apotheke?"
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Ich bin heute müde."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "gesundheit-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Kopf",
                  "fr": "tête",
                  "en": "head"
                },
                {
                  "de": "Bauch",
                  "fr": "ventre",
                  "en": "stomach"
                },
                {
                  "de": "Schmerz",
                  "fr": "douleur",
                  "en": "pain"
                },
                {
                  "de": "Arzt",
                  "fr": "médecin",
                  "en": "doctor"
                },
                {
                  "de": "Apotheke",
                  "fr": "pharmacie",
                  "en": "pharmacy"
                },
                {
                  "de": "Medikament",
                  "fr": "médicament",
                  "en": "medication"
                },
                {
                  "de": "krank",
                  "fr": "malade",
                  "en": "sick"
                },
                {
                  "de": "müde",
                  "fr": "fatigué(e)",
                  "en": "tired"
                },
                {
                  "de": "Termin",
                  "fr": "rendez-vous",
                  "en": "appointment"
                },
                {
                  "de": "Hilfe",
                  "fr": "aide",
                  "en": "help"
                }
              ]
            }
          },
          {
            "id": "gesundheit-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : müssen. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: modal verb müssen. Observe the examples and create your own sentence.",
              "examples_de": [
                "Ich habe Kopfschmerzen.",
                "Ich muss zum Arzt.",
                "Wo ist die Apotheke?",
                "Ich bin heute müde."
              ]
            }
          },
          {
            "id": "gesundheit-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à santé et pharmacie.",
              "prompt_en": "Introduce yourself or answer a question related to health and pharmacy.",
              "starter_de": [
                "Ich habe Kopfschmerzen.",
                "Ich muss zum Arzt.",
                "Wo ist die Apotheke?"
              ]
            }
          },
          {
            "id": "gesundheit-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Santé et pharmacie.",
              "prompt_en": "Write 3 to 5 simple sentences about: Health and pharmacy.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "gesundheit-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "gesundheit-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "gesundheit-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Arzt' ?",
                "question_en": "What does 'Arzt' mean?",
                "prompt_de": "Bauch",
                "options": [
                  "médecin",
                  "pharmacie",
                  "médicament",
                  "douleur"
                ],
                "correctAnswer": "médecin",
                "explanation_fr": "'Arzt' désigne le médecin.",
                "explanation_en": "'Arzt' means 'doctor'.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "gesundheit-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "gesundheit-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "gesundheit-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "gesundheit-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              }
            ]
          },
          {
            "id": "gesundheit-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "gesundheit-cartoon-video",
              "title_fr": "Vidéo cartoon — Santé",
              "title_en": "Cartoon video — Health",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Santé.",
              "objective_en": "Understand a simple situation related to Health.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich habe Kopfschmerzen. » dans une situation quotidienne liée à Santé.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich habe Kopfschmerzen.” in an everyday situation related to Health.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour santé.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for health.",
                  "dialogue_de": "Ich habe Kopfschmerzen.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich muss zum Arzt. » dans une situation quotidienne liée à Santé.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich muss zum Arzt.” in an everyday situation related to Health.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour santé.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for health.",
                  "dialogue_de": "Ich muss zum Arzt.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Wo ist die Apotheke? » dans une situation quotidienne liée à Santé.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Wo ist die Apotheke?” in an everyday situation related to Health.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour santé.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for health.",
                  "dialogue_de": "Wo ist die Apotheke?",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Wo"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich bin heute müde. » dans une situation quotidienne liée à Santé.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich bin heute müde.” in an everyday situation related to Health.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour santé.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for health.",
                  "dialogue_de": "Ich bin heute müde.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "im-deutschkurs",
        "order": 9,
        "title_de": "Im Deutschkurs",
        "title_fr": "Au cours d’allemand",
        "title_en": "In German class",
        "description_fr": "Langage de classe",
        "description_en": "Classroom language",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : langage de classe.",
        "objective_en": "Understand and use simple phrases for: classroom language.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "impératif et phrases de classe",
          "en": "imperatives and classroom phrases"
        },
        "vocabulary": [
          "Frage",
          "Antwort",
          "Übung",
          "Buch",
          "Heft",
          "sprechen",
          "hören",
          "lesen",
          "schreiben",
          "verstehen"
        ],
        "modules": [
          {
            "id": "im-deutschkurs-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Langage de classe.",
              "objective_en": "Objective: Classroom language.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "im-deutschkurs-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Amara",
                  "text_de": "Ich habe eine Frage."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Bitte wiederholen Sie."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Ich verstehe das nicht."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Wir sprechen Deutsch."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "im-deutschkurs-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Frage",
                  "fr": "question",
                  "en": "question"
                },
                {
                  "de": "Antwort",
                  "fr": "réponse",
                  "en": "answer"
                },
                {
                  "de": "Übung",
                  "fr": "exercice",
                  "en": "exercise"
                },
                {
                  "de": "Buch",
                  "fr": "livre",
                  "en": "book"
                },
                {
                  "de": "Heft",
                  "fr": "cahier",
                  "en": "notebook"
                },
                {
                  "de": "sprechen",
                  "fr": "parler",
                  "en": "to speak"
                },
                {
                  "de": "hören",
                  "fr": "écouter",
                  "en": "to listen"
                },
                {
                  "de": "lesen",
                  "fr": "lire",
                  "en": "to read"
                },
                {
                  "de": "schreiben",
                  "fr": "écrire",
                  "en": "to write"
                },
                {
                  "de": "verstehen",
                  "fr": "comprendre",
                  "en": "to understand"
                }
              ]
            }
          },
          {
            "id": "im-deutschkurs-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : impératif et phrases de classe. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: imperatives and classroom phrases. Observe the examples and create your own sentence.",
              "examples_de": [
                "Ich habe eine Frage.",
                "Bitte wiederholen Sie.",
                "Ich verstehe das nicht.",
                "Wir sprechen Deutsch."
              ]
            }
          },
          {
            "id": "im-deutschkurs-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à langage de classe.",
              "prompt_en": "Introduce yourself or answer a question related to classroom language.",
              "starter_de": [
                "Ich habe eine Frage.",
                "Bitte wiederholen Sie.",
                "Ich verstehe das nicht."
              ]
            }
          },
          {
            "id": "im-deutschkurs-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Langage de classe.",
              "prompt_en": "Write 3 to 5 simple sentences about: Classroom language.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "im-deutschkurs-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "im-deutschkurs-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "im-deutschkurs-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Frage' ?",
                "question_en": "What does 'Frage' mean?",
                "prompt_de": "Übung",
                "options": [
                  "question",
                  "réponse",
                  "exercice",
                  "livre"
                ],
                "correctAnswer": "question",
                "explanation_fr": "'Frage' signifie 'question' — mot essentiel en classe.",
                "explanation_en": "'Frage' means 'question' — essential in the classroom.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "im-deutschkurs-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "im-deutschkurs-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "im-deutschkurs-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "im-deutschkurs-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              }
            ]
          },
          {
            "id": "im-deutschkurs-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "im-deutschkurs-cartoon-video",
              "title_fr": "Vidéo cartoon — Au cours d’allemand",
              "title_en": "Cartoon video — In German class",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Au cours d’allemand.",
              "objective_en": "Understand a simple situation related to In German class.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich habe eine Frage. » dans une situation quotidienne liée à Au cours d’allemand.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich habe eine Frage.” in an everyday situation related to In German class.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour au cours d’allemand.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for in german class.",
                  "dialogue_de": "Ich habe eine Frage.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Bitte wiederholen Sie. » dans une situation quotidienne liée à Au cours d’allemand.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Bitte wiederholen Sie.” in an everyday situation related to In German class.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour au cours d’allemand.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for in german class.",
                  "dialogue_de": "Bitte wiederholen Sie.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Bitte"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich verstehe das nicht. » dans une situation quotidienne liée à Au cours d’allemand.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich verstehe das nicht.” in an everyday situation related to In German class.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour au cours d’allemand.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for in german class.",
                  "dialogue_de": "Ich verstehe das nicht.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Wir sprechen Deutsch. » dans une situation quotidienne liée à Au cours d’allemand.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Wir sprechen Deutsch.” in an everyday situation related to In German class.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour au cours d’allemand.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for in german class.",
                  "dialogue_de": "Wir sprechen Deutsch.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Wir"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "arbeit-beruf",
        "order": 10,
        "title_de": "Arbeit und Beruf",
        "title_fr": "Travail et métier",
        "title_en": "Work and jobs",
        "description_fr": "Métiers et compétences",
        "description_en": "Jobs and skills",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : métiers et compétences.",
        "objective_en": "Understand and use simple phrases for: jobs and skills.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "können",
          "en": "modal verb können"
        },
        "vocabulary": [
          "Arbeit",
          "Beruf",
          "Lehrer",
          "Krankenschwester",
          "Ingenieur",
          "Computer",
          "Büro",
          "helfen",
          "kochen",
          "fahren"
        ],
        "modules": [
          {
            "id": "arbeit-beruf-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Métiers et compétences.",
              "objective_en": "Objective: Jobs and skills.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "arbeit-beruf-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Amara",
                  "text_de": "Ich bin Lehrer."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Ich kann gut kochen."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Ich arbeite im Büro."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Was machen Sie beruflich?"
                },
                {
                  "speaker": "Amara",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "arbeit-beruf-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Arbeit",
                  "fr": "travail",
                  "en": "work"
                },
                {
                  "de": "Beruf",
                  "fr": "métier",
                  "en": "profession"
                },
                {
                  "de": "Lehrer",
                  "fr": "professeur",
                  "en": "teacher"
                },
                {
                  "de": "Krankenschwester",
                  "fr": "infirmière",
                  "en": "nurse"
                },
                {
                  "de": "Ingenieur",
                  "fr": "ingénieur",
                  "en": "engineer"
                },
                {
                  "de": "Computer",
                  "fr": "ordinateur",
                  "en": "computer"
                },
                {
                  "de": "Büro",
                  "fr": "bureau",
                  "en": "office"
                },
                {
                  "de": "helfen",
                  "fr": "aider",
                  "en": "to help"
                },
                {
                  "de": "kochen",
                  "fr": "cuisiner",
                  "en": "to cook"
                },
                {
                  "de": "fahren",
                  "fr": "conduire",
                  "en": "to drive"
                }
              ]
            }
          },
          {
            "id": "arbeit-beruf-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : können. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: modal verb können. Observe the examples and create your own sentence.",
              "examples_de": [
                "Ich bin Lehrer.",
                "Ich kann gut kochen.",
                "Ich arbeite im Büro.",
                "Was machen Sie beruflich?"
              ]
            }
          },
          {
            "id": "arbeit-beruf-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à métiers et compétences.",
              "prompt_en": "Introduce yourself or answer a question related to jobs and skills.",
              "starter_de": [
                "Ich bin Lehrer.",
                "Ich kann gut kochen.",
                "Ich arbeite im Büro."
              ]
            }
          },
          {
            "id": "arbeit-beruf-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Métiers et compétences.",
              "prompt_en": "Write 3 to 5 simple sentences about: Jobs and skills.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "arbeit-beruf-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "arbeit-beruf-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "arbeit-beruf-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Beruf' ?",
                "question_en": "What does 'Beruf' mean?",
                "prompt_de": "Computer",
                "options": [
                  "métier",
                  "travail",
                  "bureau",
                  "professeur"
                ],
                "correctAnswer": "métier",
                "explanation_fr": "'Beruf' signifie 'métier' ou 'profession'.",
                "explanation_en": "'Beruf' means 'profession' or 'occupation'.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "arbeit-beruf-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "arbeit-beruf-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "arbeit-beruf-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "arbeit-beruf-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              }
            ]
          },
          {
            "id": "arbeit-beruf-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "arbeit-beruf-cartoon-video",
              "title_fr": "Vidéo cartoon — Travail et métier",
              "title_en": "Cartoon video — Work and jobs",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Travail et métier.",
              "objective_en": "Understand a simple situation related to Work and jobs.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich bin Lehrer. » dans une situation quotidienne liée à Travail et métier.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich bin Lehrer.” in an everyday situation related to Work and jobs.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour travail et métier.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for work and jobs.",
                  "dialogue_de": "Ich bin Lehrer.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich kann gut kochen. » dans une situation quotidienne liée à Travail et métier.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich kann gut kochen.” in an everyday situation related to Work and jobs.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour travail et métier.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for work and jobs.",
                  "dialogue_de": "Ich kann gut kochen.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich arbeite im Büro. » dans une situation quotidienne liée à Travail et métier.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich arbeite im Büro.” in an everyday situation related to Work and jobs.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour travail et métier.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for work and jobs.",
                  "dialogue_de": "Ich arbeite im Büro.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Was machen Sie beruflich? » dans une situation quotidienne liée à Travail et métier.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Was machen Sie beruflich?” in an everyday situation related to Work and jobs.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour travail et métier.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for work and jobs.",
                  "dialogue_de": "Was machen Sie beruflich?",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Was"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "freizeit-freunde",
        "order": 11,
        "title_de": "Freizeit und Freunde",
        "title_fr": "Loisirs et amis",
        "title_en": "Free time and friends",
        "description_fr": "Loisirs et invitations",
        "description_en": "Hobbies and invitations",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : loisirs et invitations.",
        "objective_en": "Understand and use simple phrases for: hobbies and invitations.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "verbes séparables intro",
          "en": "separable verbs intro"
        },
        "vocabulary": [
          "Freizeit",
          "Freund",
          "Kino",
          "Musik",
          "Fußball",
          "einladen",
          "mitkommen",
          "anrufen",
          "Wochenende",
          "Zeit"
        ],
        "modules": [
          {
            "id": "freizeit-freunde-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Loisirs et invitations.",
              "objective_en": "Objective: Hobbies and invitations.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "freizeit-freunde-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Amara",
                  "text_de": "Kommst du mit?"
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Ich lade meine Freunde ein."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Am Wochenende spiele ich Fußball."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Ich rufe dich morgen an."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "freizeit-freunde-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Freizeit",
                  "fr": "temps libre",
                  "en": "free time"
                },
                {
                  "de": "Freund",
                  "fr": "ami(e)",
                  "en": "friend"
                },
                {
                  "de": "Kino",
                  "fr": "cinéma",
                  "en": "cinema"
                },
                {
                  "de": "Musik",
                  "fr": "musique",
                  "en": "music"
                },
                {
                  "de": "Fußball",
                  "fr": "football",
                  "en": "football"
                },
                {
                  "de": "einladen",
                  "fr": "inviter",
                  "en": "to invite"
                },
                {
                  "de": "mitkommen",
                  "fr": "venir avec",
                  "en": "to come along"
                },
                {
                  "de": "anrufen",
                  "fr": "appeler",
                  "en": "to call"
                },
                {
                  "de": "Wochenende",
                  "fr": "week-end",
                  "en": "weekend"
                },
                {
                  "de": "Zeit",
                  "fr": "temps",
                  "en": "time"
                }
              ]
            }
          },
          {
            "id": "freizeit-freunde-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : verbes séparables intro. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: separable verbs intro. Observe the examples and create your own sentence.",
              "examples_de": [
                "Kommst du mit?",
                "Ich lade meine Freunde ein.",
                "Am Wochenende spiele ich Fußball.",
                "Ich rufe dich morgen an."
              ]
            }
          },
          {
            "id": "freizeit-freunde-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à loisirs et invitations.",
              "prompt_en": "Introduce yourself or answer a question related to hobbies and invitations.",
              "starter_de": [
                "Kommst du mit?",
                "Ich lade meine Freunde ein.",
                "Am Wochenende spiele ich Fußball."
              ]
            }
          },
          {
            "id": "freizeit-freunde-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Loisirs et invitations.",
              "prompt_en": "Write 3 to 5 simple sentences about: Hobbies and invitations.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "freizeit-freunde-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "freizeit-freunde-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "freizeit-freunde-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Freizeit' ?",
                "question_en": "What does 'Freizeit' mean?",
                "prompt_de": "Freund",
                "options": [
                  "temps libre",
                  "ami",
                  "week-end",
                  "cinéma"
                ],
                "correctAnswer": "temps libre",
                "explanation_fr": "'Freizeit' désigne le temps libre — les moments hors travail.",
                "explanation_en": "'Freizeit' means 'free time' — time outside work.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "freizeit-freunde-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "freizeit-freunde-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "freizeit-freunde-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "freizeit-freunde-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              }
            ]
          },
          {
            "id": "freizeit-freunde-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "freizeit-freunde-cartoon-video",
              "title_fr": "Vidéo cartoon — Loisirs et amis",
              "title_en": "Cartoon video — Free time and friends",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Loisirs et amis.",
              "objective_en": "Understand a simple situation related to Free time and friends.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Kommst du mit? » dans une situation quotidienne liée à Loisirs et amis.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Kommst du mit?” in an everyday situation related to Free time and friends.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour loisirs et amis.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for free time and friends.",
                  "dialogue_de": "Kommst du mit?",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Kommst"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich lade meine Freunde ein. » dans une situation quotidienne liée à Loisirs et amis.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich lade meine Freunde ein.” in an everyday situation related to Free time and friends.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour loisirs et amis.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for free time and friends.",
                  "dialogue_de": "Ich lade meine Freunde ein.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Am Wochenende spiele ich Fußball. » dans une situation quotidienne liée à Loisirs et amis.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Am Wochenende spiele ich Fußball.” in an everyday situation related to Free time and friends.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour loisirs et amis.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for free time and friends.",
                  "dialogue_de": "Am Wochenende spiele ich Fußball.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Am"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich rufe dich morgen an. » dans une situation quotidienne liée à Loisirs et amis.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich rufe dich morgen an.” in an everyday situation related to Free time and friends.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour loisirs et amis.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for free time and friends.",
                  "dialogue_de": "Ich rufe dich morgen an.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "a1-wiederholung",
        "order": 12,
        "title_de": "A1 Wiederholung",
        "title_fr": "Révision A1",
        "title_en": "A1 review",
        "description_fr": "Révision pratique A1",
        "description_en": "Practical A1 review",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : révision pratique a1.",
        "objective_en": "Understand and use simple phrases for: practical a1 review.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "révision mixte",
          "en": "mixed review"
        },
        "vocabulary": [
          "Name",
          "Land",
          "Familie",
          "Termin",
          "Einkaufen",
          "Wohnen",
          "Gesundheit",
          "Arbeit",
          "Freizeit",
          "Kurs"
        ],
        "modules": [
          {
            "id": "a1-wiederholung-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Révision pratique A1.",
              "objective_en": "Objective: Practical A1 review.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "a1-wiederholung-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Amara",
                  "text_de": "Ich heiße Paul und komme aus Kamerun."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Ich habe morgen einen Termin."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Ich möchte Wasser kaufen."
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Ich lerne Deutsch für meinen Alltag."
                },
                {
                  "speaker": "Amara",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Lisa",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "a1-wiederholung-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Name",
                  "fr": "nom",
                  "en": "name"
                },
                {
                  "de": "Land",
                  "fr": "pays",
                  "en": "country"
                },
                {
                  "de": "Familie",
                  "fr": "famille",
                  "en": "family"
                },
                {
                  "de": "Termin",
                  "fr": "rendez-vous",
                  "en": "appointment"
                },
                {
                  "de": "Einkaufen",
                  "fr": "faire les courses",
                  "en": "shopping"
                },
                {
                  "de": "Wohnen",
                  "fr": "habiter / logement",
                  "en": "living / housing"
                },
                {
                  "de": "Gesundheit",
                  "fr": "santé",
                  "en": "health"
                },
                {
                  "de": "Arbeit",
                  "fr": "travail",
                  "en": "work"
                },
                {
                  "de": "Freizeit",
                  "fr": "temps libre",
                  "en": "free time"
                },
                {
                  "de": "Kurs",
                  "fr": "cours",
                  "en": "course"
                }
              ]
            }
          },
          {
            "id": "a1-wiederholung-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : révision mixte. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: mixed review. Observe the examples and create your own sentence.",
              "examples_de": [
                "Ich heiße Paul und komme aus Kamerun.",
                "Ich habe morgen einen Termin.",
                "Ich möchte Wasser kaufen.",
                "Ich lerne Deutsch für meinen Alltag."
              ]
            }
          },
          {
            "id": "a1-wiederholung-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à révision pratique a1.",
              "prompt_en": "Introduce yourself or answer a question related to practical a1 review.",
              "starter_de": [
                "Ich heiße Paul und komme aus Kamerun.",
                "Ich habe morgen einen Termin.",
                "Ich möchte Wasser kaufen."
              ]
            }
          },
          {
            "id": "a1-wiederholung-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Révision pratique A1.",
              "prompt_en": "Write 3 to 5 simple sentences about: Practical A1 review.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "a1-wiederholung-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "a1-wiederholung-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "a1-wiederholung-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Land' ?",
                "question_en": "What does 'Land' mean?",
                "prompt_de": "Land",
                "options": [
                  "pays",
                  "famille",
                  "cours",
                  "travail"
                ],
                "correctAnswer": "pays",
                "explanation_fr": "'Land' signifie 'pays' — mot vu dès la leçon 1.",
                "explanation_en": "'Land' means 'country' — used from lesson 1.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "a1-wiederholung-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "a1-wiederholung-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "a1-wiederholung-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "a1-wiederholung-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              }
            ]
          },
          {
            "id": "a1-wiederholung-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "a1-wiederholung-cartoon-video",
              "title_fr": "Vidéo cartoon — Révision A1",
              "title_en": "Cartoon video — A1 review",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Révision A1.",
              "objective_en": "Understand a simple situation related to A1 review.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich heiße Paul und komme aus Kamerun. » dans une situation quotidienne liée à Révision A1.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich heiße Paul und komme aus Kamerun.” in an everyday situation related to A1 review.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour révision a1.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for a1 review.",
                  "dialogue_de": "Ich heiße Paul und komme aus Kamerun.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich habe morgen einen Termin. » dans une situation quotidienne liée à Révision A1.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich habe morgen einen Termin.” in an everyday situation related to A1 review.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour révision a1.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for a1 review.",
                  "dialogue_de": "Ich habe morgen einen Termin.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich möchte Wasser kaufen. » dans une situation quotidienne liée à Révision A1.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich möchte Wasser kaufen.” in an everyday situation related to A1 review.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour révision a1.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for a1 review.",
                  "dialogue_de": "Ich möchte Wasser kaufen.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Amara and Lisa utilisent la phrase « Ich lerne Deutsch für meinen Alltag. » dans une situation quotidienne liée à Révision A1.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Amara and Lisa use the phrase “Ich lerne Deutsch für meinen Alltag.” in an everyday situation related to A1 review.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour révision a1.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for a1 review.",
                  "dialogue_de": "Ich lerne Deutsch für meinen Alltag.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "id": "german-a2",
    "level": "A2",
    "title_fr": "Allemand A2 — Vie réelle",
    "title_en": "German A2 — Real-life situations",
    "description_fr": "Communiquer dans des situations courantes, expliquer ses besoins et parler du passé.",
    "description_en": "Communicate in routine situations, explain needs and talk about the past.",
    "status": "available",
    "estimatedDuration": "12 weeks",
    "cefrAligned": true,
    "totalXp": 1500,
    "lessons": [
      {
        "id": "wieder-ankommen",
        "order": 1,
        "title_de": "Wieder ankommen",
        "title_fr": "Reprendre et raconter",
        "title_en": "Arriving again",
        "description_fr": "Raconter ce qu’on a fait",
        "description_en": "Talking about recent events",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : raconter ce qu’on a fait.",
        "objective_en": "Understand and use simple phrases for: talking about recent events.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "Perfekt avec haben/sein",
          "en": "Perfekt with haben/sein"
        },
        "vocabulary": [
          "angekommen",
          "gearbeitet",
          "gelernt",
          "gereist",
          "besucht",
          "gemacht",
          "gestern",
          "letzte Woche",
          "Erfahrung",
          "neu"
        ],
        "modules": [
          {
            "id": "wieder-ankommen-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Raconter ce qu’on a fait.",
              "objective_en": "Objective: Talking about recent events.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "wieder-ankommen-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Paul",
                  "text_de": "Ich bin gestern angekommen."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Ich habe viel gelernt."
                },
                {
                  "speaker": "Paul",
                  "text_de": "Letzte Woche habe ich gearbeitet."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Die Reise war lang."
                },
                {
                  "speaker": "Paul",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Mira",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "wieder-ankommen-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "angekommen",
                  "fr": "arrivé(e)",
                  "en": "arrived"
                },
                {
                  "de": "gearbeitet",
                  "fr": "travaillé",
                  "en": "worked"
                },
                {
                  "de": "gelernt",
                  "fr": "appris",
                  "en": "learned"
                },
                {
                  "de": "gereist",
                  "fr": "voyagé",
                  "en": "travelled"
                },
                {
                  "de": "besucht",
                  "fr": "visité",
                  "en": "visited"
                },
                {
                  "de": "gemacht",
                  "fr": "fait",
                  "en": "done"
                },
                {
                  "de": "gestern",
                  "fr": "hier",
                  "en": "yesterday"
                },
                {
                  "de": "letzte Woche",
                  "fr": "la semaine dernière",
                  "en": "last week"
                },
                {
                  "de": "Erfahrung",
                  "fr": "expérience",
                  "en": "experience"
                },
                {
                  "de": "neu",
                  "fr": "nouveau / nouvelle",
                  "en": "new"
                }
              ]
            }
          },
          {
            "id": "wieder-ankommen-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : Perfekt avec haben/sein. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: Perfekt with haben/sein. Observe the examples and create your own sentence.",
              "examples_de": [
                "Ich bin gestern angekommen.",
                "Ich habe viel gelernt.",
                "Letzte Woche habe ich gearbeitet.",
                "Die Reise war lang."
              ]
            }
          },
          {
            "id": "wieder-ankommen-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à raconter ce qu’on a fait.",
              "prompt_en": "Introduce yourself or answer a question related to talking about recent events.",
              "starter_de": [
                "Ich bin gestern angekommen.",
                "Ich habe viel gelernt.",
                "Letzte Woche habe ich gearbeitet."
              ]
            }
          },
          {
            "id": "wieder-ankommen-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Raconter ce qu’on a fait.",
              "prompt_en": "Write 3 to 5 simple sentences about: Talking about recent events.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "wieder-ankommen-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "wieder-ankommen-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "wieder-ankommen-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'angekommen' ?",
                "question_en": "What does 'angekommen' mean?",
                "prompt_de": "Erfahrung",
                "options": [
                  "arrivé(e)",
                  "parti(e)",
                  "appris",
                  "voyagé"
                ],
                "correctAnswer": "arrivé(e)",
                "explanation_fr": "'angekommen' est le participe passé de 'ankommen' — arriver.",
                "explanation_en": "'angekommen' is the past participle of 'ankommen' — to arrive.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "wieder-ankommen-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "wieder-ankommen-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "wieder-ankommen-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "wieder-ankommen-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              },
              {
                "id": "wieder-ankommen-q7",
                "type": "multiple_choice",
                "question_fr": "Choisissez la structure correcte.",
                "question_en": "Choose the correct structure.",
                "prompt_de": "Ich lerne Deutsch, ___ ich in Deutschland arbeiten möchte.",
                "options": [
                  "weil",
                  "und",
                  "aber",
                  "oder"
                ],
                "correctAnswer": "weil",
                "explanation_fr": "Weil introduit une raison et place le verbe conjugué à la fin.",
                "explanation_en": "Weil introduces a reason and sends the conjugated verb to the end.",
                "skill": "grammar",
                "difficulty": "medium"
              },
              {
                "id": "wieder-ankommen-q8",
                "type": "multiple_choice",
                "question_fr": "Choisissez la phrase au Perfekt.",
                "question_en": "Choose the sentence in Perfekt.",
                "prompt_de": "Parler d'hier",
                "options": [
                  "Ich habe gestern gelernt.",
                  "Ich lerne gestern.",
                  "Ich lernen gestern.",
                  "Ich bin lernen gestern."
                ],
                "correctAnswer": "Ich habe gestern gelernt.",
                "explanation_fr": "Le Perfekt utilise souvent haben + participe II.",
                "explanation_en": "Perfekt often uses haben + participle II.",
                "skill": "grammar",
                "difficulty": "medium"
              }
            ]
          },
          {
            "id": "wieder-ankommen-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "wieder-ankommen-cartoon-video",
              "title_fr": "Vidéo cartoon — Reprendre et raconter",
              "title_en": "Cartoon video — Arriving again",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Reprendre et raconter.",
              "objective_en": "Understand a simple situation related to Arriving again.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich bin gestern angekommen. » dans une situation quotidienne liée à Reprendre et raconter.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich bin gestern angekommen.” in an everyday situation related to Arriving again.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour reprendre et raconter.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for arriving again.",
                  "dialogue_de": "Ich bin gestern angekommen.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich habe viel gelernt. » dans une situation quotidienne liée à Reprendre et raconter.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich habe viel gelernt.” in an everyday situation related to Arriving again.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour reprendre et raconter.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for arriving again.",
                  "dialogue_de": "Ich habe viel gelernt.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Letzte Woche habe ich gearbeitet. » dans une situation quotidienne liée à Reprendre et raconter.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Letzte Woche habe ich gearbeitet.” in an everyday situation related to Arriving again.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour reprendre et raconter.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for arriving again.",
                  "dialogue_de": "Letzte Woche habe ich gearbeitet.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Letzte"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Die Reise war lang. » dans une situation quotidienne liée à Reprendre et raconter.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Die Reise war lang.” in an everyday situation related to Arriving again.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour reprendre et raconter.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for arriving again.",
                  "dialogue_de": "Die Reise war lang.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Die"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "termine-dokumente",
        "order": 2,
        "title_de": "Termine und Dokumente",
        "title_fr": "Rendez-vous et documents",
        "title_en": "Appointments and documents",
        "description_fr": "Administration pratique",
        "description_en": "Practical administration",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : administration pratique.",
        "objective_en": "Understand and use simple phrases for: practical administration.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "modaux révision, demandes polies",
          "en": "modal review, polite requests"
        },
        "vocabulary": [
          "Ausweis",
          "Antrag",
          "Formular",
          "Termin",
          "Behörde",
          "Kopie",
          "Unterschrift",
          "Gebühr",
          "Bestätigung",
          "Unterlagen"
        ],
        "modules": [
          {
            "id": "termine-dokumente-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Administration pratique.",
              "objective_en": "Objective: Practical administration.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "termine-dokumente-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Paul",
                  "text_de": "Ich möchte einen Termin vereinbaren."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Welche Dokumente brauche ich?"
                },
                {
                  "speaker": "Paul",
                  "text_de": "Ich muss das Formular ausfüllen."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Könnten Sie das wiederholen?"
                },
                {
                  "speaker": "Paul",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Mira",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "termine-dokumente-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Ausweis",
                  "fr": "carte d'identité",
                  "en": "ID card"
                },
                {
                  "de": "Antrag",
                  "fr": "demande / dossier",
                  "en": "application"
                },
                {
                  "de": "Formular",
                  "fr": "formulaire",
                  "en": "form"
                },
                {
                  "de": "Termin",
                  "fr": "rendez-vous",
                  "en": "appointment"
                },
                {
                  "de": "Behörde",
                  "fr": "administration",
                  "en": "authority / office"
                },
                {
                  "de": "Kopie",
                  "fr": "copie",
                  "en": "copy"
                },
                {
                  "de": "Unterschrift",
                  "fr": "signature",
                  "en": "signature"
                },
                {
                  "de": "Gebühr",
                  "fr": "frais / taxe",
                  "en": "fee"
                },
                {
                  "de": "Bestätigung",
                  "fr": "confirmation",
                  "en": "confirmation"
                },
                {
                  "de": "Unterlagen",
                  "fr": "documents justificatifs",
                  "en": "documents"
                }
              ]
            }
          },
          {
            "id": "termine-dokumente-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : modaux révision, demandes polies. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: modal review, polite requests. Observe the examples and create your own sentence.",
              "examples_de": [
                "Ich möchte einen Termin vereinbaren.",
                "Welche Dokumente brauche ich?",
                "Ich muss das Formular ausfüllen.",
                "Könnten Sie das wiederholen?"
              ]
            }
          },
          {
            "id": "termine-dokumente-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à administration pratique.",
              "prompt_en": "Introduce yourself or answer a question related to practical administration.",
              "starter_de": [
                "Ich möchte einen Termin vereinbaren.",
                "Welche Dokumente brauche ich?",
                "Ich muss das Formular ausfüllen."
              ]
            }
          },
          {
            "id": "termine-dokumente-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Administration pratique.",
              "prompt_en": "Write 3 to 5 simple sentences about: Practical administration.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "termine-dokumente-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "termine-dokumente-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "termine-dokumente-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Ausweis' ?",
                "question_en": "What does 'Ausweis' mean?",
                "prompt_de": "Antrag",
                "options": [
                  "carte d'identité",
                  "formulaire",
                  "signature",
                  "demande"
                ],
                "correctAnswer": "carte d'identité",
                "explanation_fr": "'Ausweis' est la carte d'identité — document indispensable.",
                "explanation_en": "'Ausweis' means 'ID card' — an essential document.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "termine-dokumente-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "termine-dokumente-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "termine-dokumente-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "termine-dokumente-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              },
              {
                "id": "termine-dokumente-q7",
                "type": "multiple_choice",
                "question_fr": "Choisissez la structure correcte.",
                "question_en": "Choose the correct structure.",
                "prompt_de": "Ich lerne Deutsch, ___ ich in Deutschland arbeiten möchte.",
                "options": [
                  "weil",
                  "und",
                  "aber",
                  "oder"
                ],
                "correctAnswer": "weil",
                "explanation_fr": "Weil introduit une raison et place le verbe conjugué à la fin.",
                "explanation_en": "Weil introduces a reason and sends the conjugated verb to the end.",
                "skill": "grammar",
                "difficulty": "medium"
              },
              {
                "id": "termine-dokumente-q8",
                "type": "multiple_choice",
                "question_fr": "Choisissez la phrase au Perfekt.",
                "question_en": "Choose the sentence in Perfekt.",
                "prompt_de": "Parler d'hier",
                "options": [
                  "Ich habe gestern gelernt.",
                  "Ich lerne gestern.",
                  "Ich lernen gestern.",
                  "Ich bin lernen gestern."
                ],
                "correctAnswer": "Ich habe gestern gelernt.",
                "explanation_fr": "Le Perfekt utilise souvent haben + participe II.",
                "explanation_en": "Perfekt often uses haben + participle II.",
                "skill": "grammar",
                "difficulty": "medium"
              }
            ]
          },
          {
            "id": "termine-dokumente-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "termine-dokumente-cartoon-video",
              "title_fr": "Vidéo cartoon — Rendez-vous et documents",
              "title_en": "Cartoon video — Appointments and documents",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Rendez-vous et documents.",
              "objective_en": "Understand a simple situation related to Appointments and documents.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich möchte einen Termin vereinbaren. » dans une situation quotidienne liée à Rendez-vous et documents.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich möchte einen Termin vereinbaren.” in an everyday situation related to Appointments and documents.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour rendez-vous et documents.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for appointments and documents.",
                  "dialogue_de": "Ich möchte einen Termin vereinbaren.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Welche Dokumente brauche ich? » dans une situation quotidienne liée à Rendez-vous et documents.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Welche Dokumente brauche ich?” in an everyday situation related to Appointments and documents.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour rendez-vous et documents.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for appointments and documents.",
                  "dialogue_de": "Welche Dokumente brauche ich?",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Welche"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich muss das Formular ausfüllen. » dans une situation quotidienne liée à Rendez-vous et documents.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich muss das Formular ausfüllen.” in an everyday situation related to Appointments and documents.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour rendez-vous et documents.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for appointments and documents.",
                  "dialogue_de": "Ich muss das Formular ausfüllen.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Könnten Sie das wiederholen? » dans une situation quotidienne liée à Rendez-vous et documents.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Könnten Sie das wiederholen?” in an everyday situation related to Appointments and documents.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour rendez-vous et documents.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for appointments and documents.",
                  "dialogue_de": "Könnten Sie das wiederholen?",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Könnten"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "arbeit-suchen",
        "order": 3,
        "title_de": "Arbeit suchen",
        "title_fr": "Chercher un travail",
        "title_en": "Looking for work",
        "description_fr": "Recherche d’emploi",
        "description_en": "Job search",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : recherche d’emploi.",
        "objective_en": "Understand and use simple phrases for: job search.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "weil",
          "en": "weil clauses"
        },
        "vocabulary": [
          "Lebenslauf",
          "Bewerbung",
          "Stelle",
          "Erfahrung",
          "Fähigkeit",
          "Vorstellungsgespräch",
          "Team",
          "pünktlich",
          "zuverlässig",
          "suchen"
        ],
        "modules": [
          {
            "id": "arbeit-suchen-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Recherche d’emploi.",
              "objective_en": "Objective: Job search.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "arbeit-suchen-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Paul",
                  "text_de": "Ich suche eine Stelle."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Ich bewerbe mich, weil ich Erfahrung habe."
                },
                {
                  "speaker": "Paul",
                  "text_de": "Mein Lebenslauf ist fertig."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Ich arbeite gern im Team."
                },
                {
                  "speaker": "Paul",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Mira",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "arbeit-suchen-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Lebenslauf",
                  "fr": "CV",
                  "en": "CV / résumé"
                },
                {
                  "de": "Bewerbung",
                  "fr": "candidature",
                  "en": "application"
                },
                {
                  "de": "Stelle",
                  "fr": "poste / emploi",
                  "en": "position / job"
                },
                {
                  "de": "Erfahrung",
                  "fr": "expérience",
                  "en": "experience"
                },
                {
                  "de": "Fähigkeit",
                  "fr": "compétence",
                  "en": "skill"
                },
                {
                  "de": "Vorstellungsgespräch",
                  "fr": "entretien d'embauche",
                  "en": "job interview"
                },
                {
                  "de": "Team",
                  "fr": "équipe",
                  "en": "team"
                },
                {
                  "de": "pünktlich",
                  "fr": "ponctuel(le)",
                  "en": "punctual"
                },
                {
                  "de": "zuverlässig",
                  "fr": "fiable / sérieux(se)",
                  "en": "reliable"
                },
                {
                  "de": "suchen",
                  "fr": "chercher",
                  "en": "to look for"
                }
              ]
            }
          },
          {
            "id": "arbeit-suchen-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : weil. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: weil clauses. Observe the examples and create your own sentence.",
              "examples_de": [
                "Ich suche eine Stelle.",
                "Ich bewerbe mich, weil ich Erfahrung habe.",
                "Mein Lebenslauf ist fertig.",
                "Ich arbeite gern im Team."
              ]
            }
          },
          {
            "id": "arbeit-suchen-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à recherche d’emploi.",
              "prompt_en": "Introduce yourself or answer a question related to job search.",
              "starter_de": [
                "Ich suche eine Stelle.",
                "Ich bewerbe mich, weil ich Erfahrung habe.",
                "Mein Lebenslauf ist fertig."
              ]
            }
          },
          {
            "id": "arbeit-suchen-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Recherche d’emploi.",
              "prompt_en": "Write 3 to 5 simple sentences about: Job search.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "arbeit-suchen-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "arbeit-suchen-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "arbeit-suchen-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Lebenslauf' ?",
                "question_en": "What does 'Lebenslauf' mean?",
                "prompt_de": "suchen",
                "options": [
                  "CV",
                  "candidature",
                  "entretien",
                  "poste"
                ],
                "correctAnswer": "CV",
                "explanation_fr": "'Lebenslauf' désigne le CV — document clé pour postuler.",
                "explanation_en": "'Lebenslauf' means 'CV' — the key document for job applications.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "arbeit-suchen-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "arbeit-suchen-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "arbeit-suchen-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "arbeit-suchen-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              },
              {
                "id": "arbeit-suchen-q7",
                "type": "multiple_choice",
                "question_fr": "Choisissez la structure correcte.",
                "question_en": "Choose the correct structure.",
                "prompt_de": "Ich lerne Deutsch, ___ ich in Deutschland arbeiten möchte.",
                "options": [
                  "weil",
                  "und",
                  "aber",
                  "oder"
                ],
                "correctAnswer": "weil",
                "explanation_fr": "Weil introduit une raison et place le verbe conjugué à la fin.",
                "explanation_en": "Weil introduces a reason and sends the conjugated verb to the end.",
                "skill": "grammar",
                "difficulty": "medium"
              },
              {
                "id": "arbeit-suchen-q8",
                "type": "multiple_choice",
                "question_fr": "Choisissez la phrase au Perfekt.",
                "question_en": "Choose the sentence in Perfekt.",
                "prompt_de": "Parler d'hier",
                "options": [
                  "Ich habe gestern gelernt.",
                  "Ich lerne gestern.",
                  "Ich lernen gestern.",
                  "Ich bin lernen gestern."
                ],
                "correctAnswer": "Ich habe gestern gelernt.",
                "explanation_fr": "Le Perfekt utilise souvent haben + participe II.",
                "explanation_en": "Perfekt often uses haben + participle II.",
                "skill": "grammar",
                "difficulty": "medium"
              }
            ]
          },
          {
            "id": "arbeit-suchen-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "arbeit-suchen-cartoon-video",
              "title_fr": "Vidéo cartoon — Chercher un travail",
              "title_en": "Cartoon video — Looking for work",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Chercher un travail.",
              "objective_en": "Understand a simple situation related to Looking for work.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich suche eine Stelle. » dans une situation quotidienne liée à Chercher un travail.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich suche eine Stelle.” in an everyday situation related to Looking for work.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour chercher un travail.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for looking for work.",
                  "dialogue_de": "Ich suche eine Stelle.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich bewerbe mich, weil ich Erfahrung habe. » dans une situation quotidienne liée à Chercher un travail.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich bewerbe mich, weil ich Erfahrung habe.” in an everyday situation related to Looking for work.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour chercher un travail.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for looking for work.",
                  "dialogue_de": "Ich bewerbe mich, weil ich Erfahrung habe.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Mein Lebenslauf ist fertig. » dans une situation quotidienne liée à Chercher un travail.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Mein Lebenslauf ist fertig.” in an everyday situation related to Looking for work.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour chercher un travail.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for looking for work.",
                  "dialogue_de": "Mein Lebenslauf ist fertig.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Mein"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich arbeite gern im Team. » dans une situation quotidienne liée à Chercher un travail.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich arbeite gern im Team.” in an everyday situation related to Looking for work.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour chercher un travail.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for looking for work.",
                  "dialogue_de": "Ich arbeite gern im Team.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "ausbildung-studium",
        "order": 4,
        "title_de": "Ausbildung und Studium",
        "title_fr": "Formation et études",
        "title_en": "Training and studies",
        "description_fr": "Projets d’études",
        "description_en": "Study plans",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : projets d’études.",
        "objective_en": "Understand and use simple phrases for: study plans.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "dass",
          "en": "dass clauses"
        },
        "vocabulary": [
          "Ausbildung",
          "Studium",
          "Universität",
          "Kurs",
          "Prüfung",
          "Abschluss",
          "Bewerbung",
          "Fach",
          "Plan",
          "Zukunft"
        ],
        "modules": [
          {
            "id": "ausbildung-studium-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Projets d’études.",
              "objective_en": "Objective: Study plans.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "ausbildung-studium-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Paul",
                  "text_de": "Ich glaube, dass Deutsch wichtig ist."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Ich möchte eine Ausbildung machen."
                },
                {
                  "speaker": "Paul",
                  "text_de": "Die Prüfung ist im Juni."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Mein Ziel ist ein Studium."
                },
                {
                  "speaker": "Paul",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Mira",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "ausbildung-studium-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Ausbildung",
                  "fr": "formation professionnelle",
                  "en": "vocational training"
                },
                {
                  "de": "Studium",
                  "fr": "études (universitaires)",
                  "en": "university studies"
                },
                {
                  "de": "Universität",
                  "fr": "université",
                  "en": "university"
                },
                {
                  "de": "Kurs",
                  "fr": "cours",
                  "en": "course"
                },
                {
                  "de": "Prüfung",
                  "fr": "examen",
                  "en": "exam"
                },
                {
                  "de": "Abschluss",
                  "fr": "diplôme",
                  "en": "degree / diploma"
                },
                {
                  "de": "Bewerbung",
                  "fr": "candidature",
                  "en": "application"
                },
                {
                  "de": "Fach",
                  "fr": "matière / discipline",
                  "en": "subject"
                },
                {
                  "de": "Plan",
                  "fr": "plan / projet",
                  "en": "plan"
                },
                {
                  "de": "Zukunft",
                  "fr": "avenir",
                  "en": "future"
                }
              ]
            }
          },
          {
            "id": "ausbildung-studium-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : dass. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: dass clauses. Observe the examples and create your own sentence.",
              "examples_de": [
                "Ich glaube, dass Deutsch wichtig ist.",
                "Ich möchte eine Ausbildung machen.",
                "Die Prüfung ist im Juni.",
                "Mein Ziel ist ein Studium."
              ]
            }
          },
          {
            "id": "ausbildung-studium-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à projets d’études.",
              "prompt_en": "Introduce yourself or answer a question related to study plans.",
              "starter_de": [
                "Ich glaube, dass Deutsch wichtig ist.",
                "Ich möchte eine Ausbildung machen.",
                "Die Prüfung ist im Juni."
              ]
            }
          },
          {
            "id": "ausbildung-studium-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Projets d’études.",
              "prompt_en": "Write 3 to 5 simple sentences about: Study plans.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "ausbildung-studium-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "ausbildung-studium-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "ausbildung-studium-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Prüfung' ?",
                "question_en": "What does 'Prüfung' mean?",
                "prompt_de": "Fach",
                "options": [
                  "examen",
                  "cours",
                  "diplôme",
                  "université"
                ],
                "correctAnswer": "examen",
                "explanation_fr": "'Prüfung' signifie 'examen' — moment de vérification des connaissances.",
                "explanation_en": "'Prüfung' means 'exam' — a test of knowledge.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "ausbildung-studium-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "ausbildung-studium-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "ausbildung-studium-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "ausbildung-studium-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              },
              {
                "id": "ausbildung-studium-q7",
                "type": "multiple_choice",
                "question_fr": "Choisissez la structure correcte.",
                "question_en": "Choose the correct structure.",
                "prompt_de": "Ich lerne Deutsch, ___ ich in Deutschland arbeiten möchte.",
                "options": [
                  "weil",
                  "und",
                  "aber",
                  "oder"
                ],
                "correctAnswer": "weil",
                "explanation_fr": "Weil introduit une raison et place le verbe conjugué à la fin.",
                "explanation_en": "Weil introduces a reason and sends the conjugated verb to the end.",
                "skill": "grammar",
                "difficulty": "medium"
              },
              {
                "id": "ausbildung-studium-q8",
                "type": "multiple_choice",
                "question_fr": "Choisissez la phrase au Perfekt.",
                "question_en": "Choose the sentence in Perfekt.",
                "prompt_de": "Parler d'hier",
                "options": [
                  "Ich habe gestern gelernt.",
                  "Ich lerne gestern.",
                  "Ich lernen gestern.",
                  "Ich bin lernen gestern."
                ],
                "correctAnswer": "Ich habe gestern gelernt.",
                "explanation_fr": "Le Perfekt utilise souvent haben + participe II.",
                "explanation_en": "Perfekt often uses haben + participle II.",
                "skill": "grammar",
                "difficulty": "medium"
              }
            ]
          },
          {
            "id": "ausbildung-studium-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "ausbildung-studium-cartoon-video",
              "title_fr": "Vidéo cartoon — Formation et études",
              "title_en": "Cartoon video — Training and studies",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Formation et études.",
              "objective_en": "Understand a simple situation related to Training and studies.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich glaube, dass Deutsch wichtig ist. » dans une situation quotidienne liée à Formation et études.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich glaube, dass Deutsch wichtig ist.” in an everyday situation related to Training and studies.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour formation et études.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for training and studies.",
                  "dialogue_de": "Ich glaube, dass Deutsch wichtig ist.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich möchte eine Ausbildung machen. » dans une situation quotidienne liée à Formation et études.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich möchte eine Ausbildung machen.” in an everyday situation related to Training and studies.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour formation et études.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for training and studies.",
                  "dialogue_de": "Ich möchte eine Ausbildung machen.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Die Prüfung ist im Juni. » dans une situation quotidienne liée à Formation et études.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Die Prüfung ist im Juni.” in an everyday situation related to Training and studies.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour formation et études.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for training and studies.",
                  "dialogue_de": "Die Prüfung ist im Juni.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Die"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Mein Ziel ist ein Studium. » dans une situation quotidienne liée à Formation et études.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Mein Ziel ist ein Studium.” in an everyday situation related to Training and studies.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour formation et études.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for training and studies.",
                  "dialogue_de": "Mein Ziel ist ein Studium.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Mein"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "gesundheit-versicherung",
        "order": 5,
        "title_de": "Gesundheit und Versicherung",
        "title_fr": "Santé et assurance",
        "title_en": "Health and insurance",
        "description_fr": "Santé et assurance",
        "description_en": "Health and insurance",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : santé et assurance.",
        "objective_en": "Understand and use simple phrases for: health and insurance.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "datif bases",
          "en": "dative basics"
        },
        "vocabulary": [
          "Versicherung",
          "Krankenkasse",
          "Chipkarte",
          "Rezept",
          "Praxis",
          "Symptom",
          "Rücken",
          "Fieber",
          "Termin",
          "Notfall"
        ],
        "modules": [
          {
            "id": "gesundheit-versicherung-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Santé et assurance.",
              "objective_en": "Objective: Health and insurance.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "gesundheit-versicherung-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Paul",
                  "text_de": "Ich bin bei der Krankenkasse versichert."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Ich gebe dem Arzt meine Karte."
                },
                {
                  "speaker": "Paul",
                  "text_de": "Ich habe seit zwei Tagen Fieber."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Brauche ich ein Rezept?"
                },
                {
                  "speaker": "Paul",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Mira",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "gesundheit-versicherung-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Versicherung",
                  "fr": "assurance",
                  "en": "insurance"
                },
                {
                  "de": "Krankenkasse",
                  "fr": "caisse d'assurance maladie",
                  "en": "health insurance fund"
                },
                {
                  "de": "Chipkarte",
                  "fr": "carte à puce médicale",
                  "en": "health card"
                },
                {
                  "de": "Rezept",
                  "fr": "ordonnance",
                  "en": "prescription"
                },
                {
                  "de": "Praxis",
                  "fr": "cabinet médical",
                  "en": "medical practice"
                },
                {
                  "de": "Symptom",
                  "fr": "symptôme",
                  "en": "symptom"
                },
                {
                  "de": "Rücken",
                  "fr": "dos",
                  "en": "back"
                },
                {
                  "de": "Fieber",
                  "fr": "fièvre",
                  "en": "fever"
                },
                {
                  "de": "Termin",
                  "fr": "rendez-vous",
                  "en": "appointment"
                },
                {
                  "de": "Notfall",
                  "fr": "urgence",
                  "en": "emergency"
                }
              ]
            }
          },
          {
            "id": "gesundheit-versicherung-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : datif bases. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: dative basics. Observe the examples and create your own sentence.",
              "examples_de": [
                "Ich bin bei der Krankenkasse versichert.",
                "Ich gebe dem Arzt meine Karte.",
                "Ich habe seit zwei Tagen Fieber.",
                "Brauche ich ein Rezept?"
              ]
            }
          },
          {
            "id": "gesundheit-versicherung-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à santé et assurance.",
              "prompt_en": "Introduce yourself or answer a question related to health and insurance.",
              "starter_de": [
                "Ich bin bei der Krankenkasse versichert.",
                "Ich gebe dem Arzt meine Karte.",
                "Ich habe seit zwei Tagen Fieber."
              ]
            }
          },
          {
            "id": "gesundheit-versicherung-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Santé et assurance.",
              "prompt_en": "Write 3 to 5 simple sentences about: Health and insurance.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "gesundheit-versicherung-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "gesundheit-versicherung-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "gesundheit-versicherung-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Rezept' ?",
                "question_en": "What does 'Rezept' mean?",
                "prompt_de": "Notfall",
                "options": [
                  "ordonnance",
                  "assurance",
                  "urgence",
                  "symptôme"
                ],
                "correctAnswer": "ordonnance",
                "explanation_fr": "'Rezept' signifie 'ordonnance' médicale — document du médecin.",
                "explanation_en": "'Rezept' means 'prescription' — the document from the doctor.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "gesundheit-versicherung-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "gesundheit-versicherung-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "gesundheit-versicherung-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "gesundheit-versicherung-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              },
              {
                "id": "gesundheit-versicherung-q7",
                "type": "multiple_choice",
                "question_fr": "Choisissez la structure correcte.",
                "question_en": "Choose the correct structure.",
                "prompt_de": "Ich lerne Deutsch, ___ ich in Deutschland arbeiten möchte.",
                "options": [
                  "weil",
                  "und",
                  "aber",
                  "oder"
                ],
                "correctAnswer": "weil",
                "explanation_fr": "Weil introduit une raison et place le verbe conjugué à la fin.",
                "explanation_en": "Weil introduces a reason and sends the conjugated verb to the end.",
                "skill": "grammar",
                "difficulty": "medium"
              },
              {
                "id": "gesundheit-versicherung-q8",
                "type": "multiple_choice",
                "question_fr": "Choisissez la phrase au Perfekt.",
                "question_en": "Choose the sentence in Perfekt.",
                "prompt_de": "Parler d'hier",
                "options": [
                  "Ich habe gestern gelernt.",
                  "Ich lerne gestern.",
                  "Ich lernen gestern.",
                  "Ich bin lernen gestern."
                ],
                "correctAnswer": "Ich habe gestern gelernt.",
                "explanation_fr": "Le Perfekt utilise souvent haben + participe II.",
                "explanation_en": "Perfekt often uses haben + participle II.",
                "skill": "grammar",
                "difficulty": "medium"
              }
            ]
          },
          {
            "id": "gesundheit-versicherung-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "gesundheit-versicherung-cartoon-video",
              "title_fr": "Vidéo cartoon — Santé et assurance",
              "title_en": "Cartoon video — Health and insurance",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Santé et assurance.",
              "objective_en": "Understand a simple situation related to Health and insurance.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich bin bei der Krankenkasse versichert. » dans une situation quotidienne liée à Santé et assurance.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich bin bei der Krankenkasse versichert.” in an everyday situation related to Health and insurance.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour santé et assurance.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for health and insurance.",
                  "dialogue_de": "Ich bin bei der Krankenkasse versichert.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich gebe dem Arzt meine Karte. » dans une situation quotidienne liée à Santé et assurance.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich gebe dem Arzt meine Karte.” in an everyday situation related to Health and insurance.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour santé et assurance.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for health and insurance.",
                  "dialogue_de": "Ich gebe dem Arzt meine Karte.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich habe seit zwei Tagen Fieber. » dans une situation quotidienne liée à Santé et assurance.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich habe seit zwei Tagen Fieber.” in an everyday situation related to Health and insurance.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour santé et assurance.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for health and insurance.",
                  "dialogue_de": "Ich habe seit zwei Tagen Fieber.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Brauche ich ein Rezept? » dans une situation quotidienne liée à Santé et assurance.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Brauche ich ein Rezept?” in an everyday situation related to Health and insurance.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour santé et assurance.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for health and insurance.",
                  "dialogue_de": "Brauche ich ein Rezept?",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Brauche"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "wohnung-nachbarn",
        "order": 6,
        "title_de": "Wohnung und Nachbarn",
        "title_fr": "Logement et voisins",
        "title_en": "Housing and neighbours",
        "description_fr": "Problèmes de logement",
        "description_en": "Housing issues",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : problèmes de logement.",
        "objective_en": "Understand and use simple phrases for: housing issues.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "prépositions avec datif",
          "en": "prepositions with dative"
        },
        "vocabulary": [
          "Nachbar",
          "Lärm",
          "Reparatur",
          "Heizung",
          "Mietvertrag",
          "Vermieter",
          "Flur",
          "unter",
          "neben",
          "zwischen"
        ],
        "modules": [
          {
            "id": "wohnung-nachbarn-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Problèmes de logement.",
              "objective_en": "Objective: Housing issues.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "wohnung-nachbarn-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Paul",
                  "text_de": "Die Heizung funktioniert nicht."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Ich spreche mit dem Vermieter."
                },
                {
                  "speaker": "Paul",
                  "text_de": "Der Schlüssel liegt auf dem Tisch."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Mein Nachbar ist freundlich."
                },
                {
                  "speaker": "Paul",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Mira",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "wohnung-nachbarn-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Nachbar",
                  "fr": "voisin(e)",
                  "en": "neighbour"
                },
                {
                  "de": "Lärm",
                  "fr": "bruit",
                  "en": "noise"
                },
                {
                  "de": "Reparatur",
                  "fr": "réparation",
                  "en": "repair"
                },
                {
                  "de": "Heizung",
                  "fr": "chauffage",
                  "en": "heating"
                },
                {
                  "de": "Mietvertrag",
                  "fr": "contrat de location",
                  "en": "rental contract"
                },
                {
                  "de": "Vermieter",
                  "fr": "propriétaire / bailleur",
                  "en": "landlord"
                },
                {
                  "de": "Flur",
                  "fr": "couloir",
                  "en": "hallway"
                },
                {
                  "de": "unter",
                  "fr": "en dessous de",
                  "en": "under / below"
                },
                {
                  "de": "neben",
                  "fr": "à côté de",
                  "en": "next to"
                },
                {
                  "de": "zwischen",
                  "fr": "entre",
                  "en": "between"
                }
              ]
            }
          },
          {
            "id": "wohnung-nachbarn-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : prépositions avec datif. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: prepositions with dative. Observe the examples and create your own sentence.",
              "examples_de": [
                "Die Heizung funktioniert nicht.",
                "Ich spreche mit dem Vermieter.",
                "Der Schlüssel liegt auf dem Tisch.",
                "Mein Nachbar ist freundlich."
              ]
            }
          },
          {
            "id": "wohnung-nachbarn-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à problèmes de logement.",
              "prompt_en": "Introduce yourself or answer a question related to housing issues.",
              "starter_de": [
                "Die Heizung funktioniert nicht.",
                "Ich spreche mit dem Vermieter.",
                "Der Schlüssel liegt auf dem Tisch."
              ]
            }
          },
          {
            "id": "wohnung-nachbarn-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Problèmes de logement.",
              "prompt_en": "Write 3 to 5 simple sentences about: Housing issues.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "wohnung-nachbarn-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "wohnung-nachbarn-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "wohnung-nachbarn-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Nachbar' ?",
                "question_en": "What does 'Nachbar' mean?",
                "prompt_de": "Flur",
                "options": [
                  "voisin",
                  "propriétaire",
                  "couloir",
                  "bruit"
                ],
                "correctAnswer": "voisin",
                "explanation_fr": "'Nachbar' désigne le voisin.",
                "explanation_en": "'Nachbar' means 'neighbour'.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "wohnung-nachbarn-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "wohnung-nachbarn-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "wohnung-nachbarn-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "wohnung-nachbarn-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              },
              {
                "id": "wohnung-nachbarn-q7",
                "type": "multiple_choice",
                "question_fr": "Choisissez la structure correcte.",
                "question_en": "Choose the correct structure.",
                "prompt_de": "Ich lerne Deutsch, ___ ich in Deutschland arbeiten möchte.",
                "options": [
                  "weil",
                  "und",
                  "aber",
                  "oder"
                ],
                "correctAnswer": "weil",
                "explanation_fr": "Weil introduit une raison et place le verbe conjugué à la fin.",
                "explanation_en": "Weil introduces a reason and sends the conjugated verb to the end.",
                "skill": "grammar",
                "difficulty": "medium"
              },
              {
                "id": "wohnung-nachbarn-q8",
                "type": "multiple_choice",
                "question_fr": "Choisissez la phrase au Perfekt.",
                "question_en": "Choose the sentence in Perfekt.",
                "prompt_de": "Parler d'hier",
                "options": [
                  "Ich habe gestern gelernt.",
                  "Ich lerne gestern.",
                  "Ich lernen gestern.",
                  "Ich bin lernen gestern."
                ],
                "correctAnswer": "Ich habe gestern gelernt.",
                "explanation_fr": "Le Perfekt utilise souvent haben + participe II.",
                "explanation_en": "Perfekt often uses haben + participle II.",
                "skill": "grammar",
                "difficulty": "medium"
              }
            ]
          },
          {
            "id": "wohnung-nachbarn-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "wohnung-nachbarn-cartoon-video",
              "title_fr": "Vidéo cartoon — Logement et voisins",
              "title_en": "Cartoon video — Housing and neighbours",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Logement et voisins.",
              "objective_en": "Understand a simple situation related to Housing and neighbours.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Die Heizung funktioniert nicht. » dans une situation quotidienne liée à Logement et voisins.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Die Heizung funktioniert nicht.” in an everyday situation related to Housing and neighbours.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour logement et voisins.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for housing and neighbours.",
                  "dialogue_de": "Die Heizung funktioniert nicht.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Die"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich spreche mit dem Vermieter. » dans une situation quotidienne liée à Logement et voisins.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich spreche mit dem Vermieter.” in an everyday situation related to Housing and neighbours.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour logement et voisins.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for housing and neighbours.",
                  "dialogue_de": "Ich spreche mit dem Vermieter.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Der Schlüssel liegt auf dem Tisch. » dans une situation quotidienne liée à Logement et voisins.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Der Schlüssel liegt auf dem Tisch.” in an everyday situation related to Housing and neighbours.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour logement et voisins.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for housing and neighbours.",
                  "dialogue_de": "Der Schlüssel liegt auf dem Tisch.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Der"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Mein Nachbar ist freundlich. » dans une situation quotidienne liée à Logement et voisins.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Mein Nachbar ist freundlich.” in an everyday situation related to Housing and neighbours.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour logement et voisins.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for housing and neighbours.",
                  "dialogue_de": "Mein Nachbar ist freundlich.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Mein"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "mobilitaet-stadt",
        "order": 7,
        "title_de": "Mobilität in der Stadt",
        "title_fr": "Mobilité en ville",
        "title_en": "City mobility",
        "description_fr": "Transports et ville",
        "description_en": "Transport and city life",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : transports et ville.",
        "objective_en": "Understand and use simple phrases for: transport and city life.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "comparatif",
          "en": "comparatives"
        },
        "vocabulary": [
          "Straßenbahn",
          "U-Bahn",
          "Fahrplan",
          "Haltestelle",
          "schneller",
          "billiger",
          "näher",
          "umsteigen",
          "Verspätung",
          "Verbindung"
        ],
        "modules": [
          {
            "id": "mobilitaet-stadt-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Transports et ville.",
              "objective_en": "Objective: Transport and city life.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "mobilitaet-stadt-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Paul",
                  "text_de": "Die U-Bahn ist schneller als der Bus."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Welche Verbindung ist besser?"
                },
                {
                  "speaker": "Paul",
                  "text_de": "Ich muss zweimal umsteigen."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Die Haltestelle ist näher."
                },
                {
                  "speaker": "Paul",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Mira",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "mobilitaet-stadt-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Straßenbahn",
                  "fr": "tramway",
                  "en": "tram"
                },
                {
                  "de": "U-Bahn",
                  "fr": "métro",
                  "en": "metro"
                },
                {
                  "de": "Fahrplan",
                  "fr": "horaire (transport)",
                  "en": "timetable"
                },
                {
                  "de": "Haltestelle",
                  "fr": "arrêt (bus/tram)",
                  "en": "stop"
                },
                {
                  "de": "schneller",
                  "fr": "plus rapide",
                  "en": "faster"
                },
                {
                  "de": "billiger",
                  "fr": "moins cher",
                  "en": "cheaper"
                },
                {
                  "de": "näher",
                  "fr": "plus proche",
                  "en": "closer"
                },
                {
                  "de": "umsteigen",
                  "fr": "changer de transport",
                  "en": "to change (transport)"
                },
                {
                  "de": "Verspätung",
                  "fr": "retard",
                  "en": "delay"
                },
                {
                  "de": "Verbindung",
                  "fr": "correspondance",
                  "en": "connection"
                }
              ]
            }
          },
          {
            "id": "mobilitaet-stadt-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : comparatif. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: comparatives. Observe the examples and create your own sentence.",
              "examples_de": [
                "Die U-Bahn ist schneller als der Bus.",
                "Welche Verbindung ist besser?",
                "Ich muss zweimal umsteigen.",
                "Die Haltestelle ist näher."
              ]
            }
          },
          {
            "id": "mobilitaet-stadt-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à transports et ville.",
              "prompt_en": "Introduce yourself or answer a question related to transport and city life.",
              "starter_de": [
                "Die U-Bahn ist schneller als der Bus.",
                "Welche Verbindung ist besser?",
                "Ich muss zweimal umsteigen."
              ]
            }
          },
          {
            "id": "mobilitaet-stadt-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Transports et ville.",
              "prompt_en": "Write 3 to 5 simple sentences about: Transport and city life.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "mobilitaet-stadt-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "mobilitaet-stadt-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "mobilitaet-stadt-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Verspätung' ?",
                "question_en": "What does 'Verspätung' mean?",
                "prompt_de": "umsteigen",
                "options": [
                  "retard",
                  "arrêt",
                  "horaire",
                  "métro"
                ],
                "correctAnswer": "retard",
                "explanation_fr": "'Verspätung' signifie 'retard' — fréquent dans les transports.",
                "explanation_en": "'Verspätung' means 'delay' — frequently heard in public transport.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "mobilitaet-stadt-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "mobilitaet-stadt-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "mobilitaet-stadt-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "mobilitaet-stadt-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              },
              {
                "id": "mobilitaet-stadt-q7",
                "type": "multiple_choice",
                "question_fr": "Choisissez la structure correcte.",
                "question_en": "Choose the correct structure.",
                "prompt_de": "Ich lerne Deutsch, ___ ich in Deutschland arbeiten möchte.",
                "options": [
                  "weil",
                  "und",
                  "aber",
                  "oder"
                ],
                "correctAnswer": "weil",
                "explanation_fr": "Weil introduit une raison et place le verbe conjugué à la fin.",
                "explanation_en": "Weil introduces a reason and sends the conjugated verb to the end.",
                "skill": "grammar",
                "difficulty": "medium"
              },
              {
                "id": "mobilitaet-stadt-q8",
                "type": "multiple_choice",
                "question_fr": "Choisissez la phrase au Perfekt.",
                "question_en": "Choose the sentence in Perfekt.",
                "prompt_de": "Parler d'hier",
                "options": [
                  "Ich habe gestern gelernt.",
                  "Ich lerne gestern.",
                  "Ich lernen gestern.",
                  "Ich bin lernen gestern."
                ],
                "correctAnswer": "Ich habe gestern gelernt.",
                "explanation_fr": "Le Perfekt utilise souvent haben + participe II.",
                "explanation_en": "Perfekt often uses haben + participle II.",
                "skill": "grammar",
                "difficulty": "medium"
              }
            ]
          },
          {
            "id": "mobilitaet-stadt-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "mobilitaet-stadt-cartoon-video",
              "title_fr": "Vidéo cartoon — Mobilité en ville",
              "title_en": "Cartoon video — City mobility",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Mobilité en ville.",
              "objective_en": "Understand a simple situation related to City mobility.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Die U-Bahn ist schneller als der Bus. » dans une situation quotidienne liée à Mobilité en ville.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Die U-Bahn ist schneller als der Bus.” in an everyday situation related to City mobility.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour mobilité en ville.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for city mobility.",
                  "dialogue_de": "Die U-Bahn ist schneller als der Bus.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Die"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Welche Verbindung ist besser? » dans une situation quotidienne liée à Mobilité en ville.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Welche Verbindung ist besser?” in an everyday situation related to City mobility.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour mobilité en ville.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for city mobility.",
                  "dialogue_de": "Welche Verbindung ist besser?",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Welche"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich muss zweimal umsteigen. » dans une situation quotidienne liée à Mobilité en ville.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich muss zweimal umsteigen.” in an everyday situation related to City mobility.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour mobilité en ville.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for city mobility.",
                  "dialogue_de": "Ich muss zweimal umsteigen.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Die Haltestelle ist näher. » dans une situation quotidienne liée à Mobilité en ville.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Die Haltestelle ist näher.” in an everyday situation related to City mobility.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour mobilité en ville.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for city mobility.",
                  "dialogue_de": "Die Haltestelle ist näher.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Die"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "geld-vertraege",
        "order": 8,
        "title_de": "Geld und Verträge",
        "title_fr": "Argent et contrats",
        "title_en": "Money and contracts",
        "description_fr": "Argent, factures, contrats",
        "description_en": "Money, bills, contracts",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : argent, factures, contrats.",
        "objective_en": "Understand and use simple phrases for: money, bills, contracts.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "dates, nombres, formules formelles",
          "en": "dates, numbers, formal phrases"
        },
        "vocabulary": [
          "Konto",
          "Rechnung",
          "Vertrag",
          "Gebühr",
          "monatlich",
          "kündigen",
          "bezahlen",
          "überweisen",
          "Datum",
          "Betrag"
        ],
        "modules": [
          {
            "id": "geld-vertraege-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Argent, factures, contrats.",
              "objective_en": "Objective: Money, bills, contracts.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "geld-vertraege-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Paul",
                  "text_de": "Ich möchte ein Konto eröffnen."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Die Rechnung ist am 15. Juni fällig."
                },
                {
                  "speaker": "Paul",
                  "text_de": "Der Vertrag kostet monatlich 20 Euro."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Wie kann ich kündigen?"
                },
                {
                  "speaker": "Paul",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Mira",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "geld-vertraege-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Konto",
                  "fr": "compte bancaire",
                  "en": "bank account"
                },
                {
                  "de": "Rechnung",
                  "fr": "facture",
                  "en": "invoice / bill"
                },
                {
                  "de": "Vertrag",
                  "fr": "contrat",
                  "en": "contract"
                },
                {
                  "de": "Gebühr",
                  "fr": "frais / taxe",
                  "en": "fee"
                },
                {
                  "de": "monatlich",
                  "fr": "mensuel(le)",
                  "en": "monthly"
                },
                {
                  "de": "kündigen",
                  "fr": "résilier",
                  "en": "to cancel / terminate"
                },
                {
                  "de": "bezahlen",
                  "fr": "payer",
                  "en": "to pay"
                },
                {
                  "de": "überweisen",
                  "fr": "virer (argent)",
                  "en": "to transfer (money)"
                },
                {
                  "de": "Datum",
                  "fr": "date",
                  "en": "date"
                },
                {
                  "de": "Betrag",
                  "fr": "montant",
                  "en": "amount"
                }
              ]
            }
          },
          {
            "id": "geld-vertraege-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : dates, nombres, formules formelles. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: dates, numbers, formal phrases. Observe the examples and create your own sentence.",
              "examples_de": [
                "Ich möchte ein Konto eröffnen.",
                "Die Rechnung ist am 15. Juni fällig.",
                "Der Vertrag kostet monatlich 20 Euro.",
                "Wie kann ich kündigen?"
              ]
            }
          },
          {
            "id": "geld-vertraege-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à argent, factures, contrats.",
              "prompt_en": "Introduce yourself or answer a question related to money, bills, contracts.",
              "starter_de": [
                "Ich möchte ein Konto eröffnen.",
                "Die Rechnung ist am 15. Juni fällig.",
                "Der Vertrag kostet monatlich 20 Euro."
              ]
            }
          },
          {
            "id": "geld-vertraege-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Argent, factures, contrats.",
              "prompt_en": "Write 3 to 5 simple sentences about: Money, bills, contracts.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "geld-vertraege-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "geld-vertraege-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "geld-vertraege-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Rechnung' ?",
                "question_en": "What does 'Rechnung' mean?",
                "prompt_de": "Vertrag",
                "options": [
                  "facture",
                  "contrat",
                  "montant",
                  "compte"
                ],
                "correctAnswer": "facture",
                "explanation_fr": "'Rechnung' signifie 'facture' ou 'note'.",
                "explanation_en": "'Rechnung' means 'invoice' or 'bill'.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "geld-vertraege-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "geld-vertraege-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "geld-vertraege-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "geld-vertraege-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              },
              {
                "id": "geld-vertraege-q7",
                "type": "multiple_choice",
                "question_fr": "Choisissez la structure correcte.",
                "question_en": "Choose the correct structure.",
                "prompt_de": "Ich lerne Deutsch, ___ ich in Deutschland arbeiten möchte.",
                "options": [
                  "weil",
                  "und",
                  "aber",
                  "oder"
                ],
                "correctAnswer": "weil",
                "explanation_fr": "Weil introduit une raison et place le verbe conjugué à la fin.",
                "explanation_en": "Weil introduces a reason and sends the conjugated verb to the end.",
                "skill": "grammar",
                "difficulty": "medium"
              },
              {
                "id": "geld-vertraege-q8",
                "type": "multiple_choice",
                "question_fr": "Choisissez la phrase au Perfekt.",
                "question_en": "Choose the sentence in Perfekt.",
                "prompt_de": "Parler d'hier",
                "options": [
                  "Ich habe gestern gelernt.",
                  "Ich lerne gestern.",
                  "Ich lernen gestern.",
                  "Ich bin lernen gestern."
                ],
                "correctAnswer": "Ich habe gestern gelernt.",
                "explanation_fr": "Le Perfekt utilise souvent haben + participe II.",
                "explanation_en": "Perfekt often uses haben + participle II.",
                "skill": "grammar",
                "difficulty": "medium"
              }
            ]
          },
          {
            "id": "geld-vertraege-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "geld-vertraege-cartoon-video",
              "title_fr": "Vidéo cartoon — Argent et contrats",
              "title_en": "Cartoon video — Money and contracts",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Argent et contrats.",
              "objective_en": "Understand a simple situation related to Money and contracts.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich möchte ein Konto eröffnen. » dans une situation quotidienne liée à Argent et contrats.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich möchte ein Konto eröffnen.” in an everyday situation related to Money and contracts.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour argent et contrats.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for money and contracts.",
                  "dialogue_de": "Ich möchte ein Konto eröffnen.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Die Rechnung ist am 15. Juni fällig. » dans une situation quotidienne liée à Argent et contrats.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Die Rechnung ist am 15. Juni fällig.” in an everyday situation related to Money and contracts.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour argent et contrats.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for money and contracts.",
                  "dialogue_de": "Die Rechnung ist am 15. Juni fällig.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Die"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Der Vertrag kostet monatlich 20 Euro. » dans une situation quotidienne liée à Argent et contrats.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Der Vertrag kostet monatlich 20 Euro.” in an everyday situation related to Money and contracts.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour argent et contrats.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for money and contracts.",
                  "dialogue_de": "Der Vertrag kostet monatlich 20 Euro.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Der"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Wie kann ich kündigen? » dans une situation quotidienne liée à Argent et contrats.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Wie kann ich kündigen?” in an everyday situation related to Money and contracts.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour argent et contrats.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for money and contracts.",
                  "dialogue_de": "Wie kann ich kündigen?",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Wie"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "kultur-zusammenleben",
        "order": 9,
        "title_de": "Kultur und Zusammenleben",
        "title_fr": "Culture et vie ensemble",
        "title_en": "Culture and living together",
        "description_fr": "Culture et règles sociales",
        "description_en": "Culture and social rules",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : culture et règles sociales.",
        "objective_en": "Understand and use simple phrases for: culture and social rules.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "adjectifs bases",
          "en": "adjective basics"
        },
        "vocabulary": [
          "pünktlich",
          "höflich",
          "Regel",
          "Ruhe",
          "Respekt",
          "Nachbarschaft",
          "Termin",
          "Gewohnheit",
          "direkt",
          "freundlich"
        ],
        "modules": [
          {
            "id": "kultur-zusammenleben-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Culture et règles sociales.",
              "objective_en": "Objective: Culture and social rules.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "kultur-zusammenleben-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Paul",
                  "text_de": "Pünktlichkeit ist wichtig."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Ein kurzer Gruß ist höflich."
                },
                {
                  "speaker": "Paul",
                  "text_de": "In der Nacht ist es ruhig."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Ich respektiere die Regeln."
                },
                {
                  "speaker": "Paul",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Mira",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "kultur-zusammenleben-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "pünktlich",
                  "fr": "ponctuel(le)",
                  "en": "punctual"
                },
                {
                  "de": "höflich",
                  "fr": "poli(e)",
                  "en": "polite"
                },
                {
                  "de": "Regel",
                  "fr": "règle",
                  "en": "rule"
                },
                {
                  "de": "Ruhe",
                  "fr": "calme / silence",
                  "en": "quiet / calm"
                },
                {
                  "de": "Respekt",
                  "fr": "respect",
                  "en": "respect"
                },
                {
                  "de": "Nachbarschaft",
                  "fr": "voisinage",
                  "en": "neighbourhood"
                },
                {
                  "de": "Termin",
                  "fr": "rendez-vous",
                  "en": "appointment"
                },
                {
                  "de": "Gewohnheit",
                  "fr": "habitude",
                  "en": "habit"
                },
                {
                  "de": "direkt",
                  "fr": "direct(e)",
                  "en": "direct"
                },
                {
                  "de": "freundlich",
                  "fr": "aimable / sympathique",
                  "en": "friendly"
                }
              ]
            }
          },
          {
            "id": "kultur-zusammenleben-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : adjectifs bases. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: adjective basics. Observe the examples and create your own sentence.",
              "examples_de": [
                "Pünktlichkeit ist wichtig.",
                "Ein kurzer Gruß ist höflich.",
                "In der Nacht ist es ruhig.",
                "Ich respektiere die Regeln."
              ]
            }
          },
          {
            "id": "kultur-zusammenleben-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à culture et règles sociales.",
              "prompt_en": "Introduce yourself or answer a question related to culture and social rules.",
              "starter_de": [
                "Pünktlichkeit ist wichtig.",
                "Ein kurzer Gruß ist höflich.",
                "In der Nacht ist es ruhig."
              ]
            }
          },
          {
            "id": "kultur-zusammenleben-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Culture et règles sociales.",
              "prompt_en": "Write 3 to 5 simple sentences about: Culture and social rules.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "kultur-zusammenleben-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "kultur-zusammenleben-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "kultur-zusammenleben-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'höflich' ?",
                "question_en": "What does 'höflich' mean?",
                "prompt_de": "höflich",
                "options": [
                  "poli(e)",
                  "ponctuel(le)",
                  "direct(e)",
                  "aimable"
                ],
                "correctAnswer": "poli(e)",
                "explanation_fr": "'höflich' signifie 'poli' — valeur importante en Allemagne.",
                "explanation_en": "'höflich' means 'polite' — an important value in Germany.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "kultur-zusammenleben-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "kultur-zusammenleben-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "kultur-zusammenleben-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "kultur-zusammenleben-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              },
              {
                "id": "kultur-zusammenleben-q7",
                "type": "multiple_choice",
                "question_fr": "Choisissez la structure correcte.",
                "question_en": "Choose the correct structure.",
                "prompt_de": "Ich lerne Deutsch, ___ ich in Deutschland arbeiten möchte.",
                "options": [
                  "weil",
                  "und",
                  "aber",
                  "oder"
                ],
                "correctAnswer": "weil",
                "explanation_fr": "Weil introduit une raison et place le verbe conjugué à la fin.",
                "explanation_en": "Weil introduces a reason and sends the conjugated verb to the end.",
                "skill": "grammar",
                "difficulty": "medium"
              },
              {
                "id": "kultur-zusammenleben-q8",
                "type": "multiple_choice",
                "question_fr": "Choisissez la phrase au Perfekt.",
                "question_en": "Choose the sentence in Perfekt.",
                "prompt_de": "Parler d'hier",
                "options": [
                  "Ich habe gestern gelernt.",
                  "Ich lerne gestern.",
                  "Ich lernen gestern.",
                  "Ich bin lernen gestern."
                ],
                "correctAnswer": "Ich habe gestern gelernt.",
                "explanation_fr": "Le Perfekt utilise souvent haben + participe II.",
                "explanation_en": "Perfekt often uses haben + participle II.",
                "skill": "grammar",
                "difficulty": "medium"
              }
            ]
          },
          {
            "id": "kultur-zusammenleben-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "kultur-zusammenleben-cartoon-video",
              "title_fr": "Vidéo cartoon — Culture et vie ensemble",
              "title_en": "Cartoon video — Culture and living together",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Culture et vie ensemble.",
              "objective_en": "Understand a simple situation related to Culture and living together.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Pünktlichkeit ist wichtig. » dans une situation quotidienne liée à Culture et vie ensemble.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Pünktlichkeit ist wichtig.” in an everyday situation related to Culture and living together.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour culture et vie ensemble.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for culture and living together.",
                  "dialogue_de": "Pünktlichkeit ist wichtig.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Pünktlichkeit"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ein kurzer Gruß ist höflich. » dans une situation quotidienne liée à Culture et vie ensemble.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ein kurzer Gruß ist höflich.” in an everyday situation related to Culture and living together.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour culture et vie ensemble.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for culture and living together.",
                  "dialogue_de": "Ein kurzer Gruß ist höflich.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ein"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « In der Nacht ist es ruhig. » dans une situation quotidienne liée à Culture et vie ensemble.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “In der Nacht ist es ruhig.” in an everyday situation related to Culture and living together.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour culture et vie ensemble.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for culture and living together.",
                  "dialogue_de": "In der Nacht ist es ruhig.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "In"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich respektiere die Regeln. » dans une situation quotidienne liée à Culture et vie ensemble.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich respektiere die Regeln.” in an everyday situation related to Culture and living together.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour culture et vie ensemble.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for culture and living together.",
                  "dialogue_de": "Ich respektiere die Regeln.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "familie-zukunft",
        "order": 10,
        "title_de": "Familie und Zukunft",
        "title_fr": "Famille et avenir",
        "title_en": "Family and future",
        "description_fr": "Plans et avenir",
        "description_en": "Plans and future",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : plans et avenir.",
        "objective_en": "Understand and use simple phrases for: plans and future.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "werden futur intro",
          "en": "future with werden"
        },
        "vocabulary": [
          "Zukunft",
          "Plan",
          "Ziel",
          "Familie",
          "umziehen",
          "arbeiten",
          "lernen",
          "sparen",
          "später",
          "nächstes Jahr"
        ],
        "modules": [
          {
            "id": "familie-zukunft-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Plans et avenir.",
              "objective_en": "Objective: Plans and future.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "familie-zukunft-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Paul",
                  "text_de": "Ich werde nächstes Jahr mehr Deutsch sprechen."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Wir werden nach Deutschland reisen."
                },
                {
                  "speaker": "Paul",
                  "text_de": "Mein Ziel ist klar."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Ich möchte für meine Familie planen."
                },
                {
                  "speaker": "Paul",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Mira",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "familie-zukunft-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Zukunft",
                  "fr": "avenir",
                  "en": "future"
                },
                {
                  "de": "Plan",
                  "fr": "plan / projet",
                  "en": "plan"
                },
                {
                  "de": "Ziel",
                  "fr": "objectif / but",
                  "en": "goal"
                },
                {
                  "de": "Familie",
                  "fr": "famille",
                  "en": "family"
                },
                {
                  "de": "umziehen",
                  "fr": "déménager",
                  "en": "to move (house)"
                },
                {
                  "de": "arbeiten",
                  "fr": "travailler",
                  "en": "to work"
                },
                {
                  "de": "lernen",
                  "fr": "apprendre",
                  "en": "to learn"
                },
                {
                  "de": "sparen",
                  "fr": "épargner / économiser",
                  "en": "to save (money)"
                },
                {
                  "de": "später",
                  "fr": "plus tard",
                  "en": "later"
                },
                {
                  "de": "nächstes Jahr",
                  "fr": "l'année prochaine",
                  "en": "next year"
                }
              ]
            }
          },
          {
            "id": "familie-zukunft-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : werden futur intro. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: future with werden. Observe the examples and create your own sentence.",
              "examples_de": [
                "Ich werde nächstes Jahr mehr Deutsch sprechen.",
                "Wir werden nach Deutschland reisen.",
                "Mein Ziel ist klar.",
                "Ich möchte für meine Familie planen."
              ]
            }
          },
          {
            "id": "familie-zukunft-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à plans et avenir.",
              "prompt_en": "Introduce yourself or answer a question related to plans and future.",
              "starter_de": [
                "Ich werde nächstes Jahr mehr Deutsch sprechen.",
                "Wir werden nach Deutschland reisen.",
                "Mein Ziel ist klar."
              ]
            }
          },
          {
            "id": "familie-zukunft-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Plans et avenir.",
              "prompt_en": "Write 3 to 5 simple sentences about: Plans and future.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "familie-zukunft-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "familie-zukunft-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "familie-zukunft-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Zukunft' ?",
                "question_en": "What does 'Zukunft' mean?",
                "prompt_de": "Plan",
                "options": [
                  "avenir",
                  "famille",
                  "objectif",
                  "projet"
                ],
                "correctAnswer": "avenir",
                "explanation_fr": "'Zukunft' signifie 'avenir'.",
                "explanation_en": "'Zukunft' means 'future'.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "familie-zukunft-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "familie-zukunft-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "familie-zukunft-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "familie-zukunft-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              },
              {
                "id": "familie-zukunft-q7",
                "type": "multiple_choice",
                "question_fr": "Choisissez la structure correcte.",
                "question_en": "Choose the correct structure.",
                "prompt_de": "Ich lerne Deutsch, ___ ich in Deutschland arbeiten möchte.",
                "options": [
                  "weil",
                  "und",
                  "aber",
                  "oder"
                ],
                "correctAnswer": "weil",
                "explanation_fr": "Weil introduit une raison et place le verbe conjugué à la fin.",
                "explanation_en": "Weil introduces a reason and sends the conjugated verb to the end.",
                "skill": "grammar",
                "difficulty": "medium"
              },
              {
                "id": "familie-zukunft-q8",
                "type": "multiple_choice",
                "question_fr": "Choisissez la phrase au Perfekt.",
                "question_en": "Choose the sentence in Perfekt.",
                "prompt_de": "Parler d'hier",
                "options": [
                  "Ich habe gestern gelernt.",
                  "Ich lerne gestern.",
                  "Ich lernen gestern.",
                  "Ich bin lernen gestern."
                ],
                "correctAnswer": "Ich habe gestern gelernt.",
                "explanation_fr": "Le Perfekt utilise souvent haben + participe II.",
                "explanation_en": "Perfekt often uses haben + participle II.",
                "skill": "grammar",
                "difficulty": "medium"
              }
            ]
          },
          {
            "id": "familie-zukunft-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "familie-zukunft-cartoon-video",
              "title_fr": "Vidéo cartoon — Famille et avenir",
              "title_en": "Cartoon video — Family and future",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Famille et avenir.",
              "objective_en": "Understand a simple situation related to Family and future.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich werde nächstes Jahr mehr Deutsch sprechen. » dans une situation quotidienne liée à Famille et avenir.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich werde nächstes Jahr mehr Deutsch sprechen.” in an everyday situation related to Family and future.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour famille et avenir.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for family and future.",
                  "dialogue_de": "Ich werde nächstes Jahr mehr Deutsch sprechen.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Wir werden nach Deutschland reisen. » dans une situation quotidienne liée à Famille et avenir.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Wir werden nach Deutschland reisen.” in an everyday situation related to Family and future.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour famille et avenir.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for family and future.",
                  "dialogue_de": "Wir werden nach Deutschland reisen.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Wir"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Mein Ziel ist klar. » dans une situation quotidienne liée à Famille et avenir.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Mein Ziel ist klar.” in an everyday situation related to Family and future.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour famille et avenir.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for family and future.",
                  "dialogue_de": "Mein Ziel ist klar.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Mein"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich möchte für meine Familie planen. » dans une situation quotidienne liée à Famille et avenir.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich möchte für meine Familie planen.” in an everyday situation related to Family and future.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour famille et avenir.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for family and future.",
                  "dialogue_de": "Ich möchte für meine Familie planen.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "probleme-loesen",
        "order": 11,
        "title_de": "Probleme höflich lösen",
        "title_fr": "Résoudre les problèmes",
        "title_en": "Solving problems politely",
        "description_fr": "Conflits et solutions",
        "description_en": "Conflicts and solutions",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : conflits et solutions.",
        "objective_en": "Understand and use simple phrases for: conflicts and solutions.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "hätte/würde",
          "en": "polite hätte/würde"
        },
        "vocabulary": [
          "Problem",
          "Entschuldigung",
          "Lösung",
          "Beschwerde",
          "ruhig",
          "klären",
          "helfen",
          "vorschlagen",
          "wäre",
          "könnte"
        ],
        "modules": [
          {
            "id": "probleme-loesen-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Conflits et solutions.",
              "objective_en": "Objective: Conflicts and solutions.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "probleme-loesen-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Paul",
                  "text_de": "Ich hätte eine Frage."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Könnten Sie mir bitte helfen?"
                },
                {
                  "speaker": "Paul",
                  "text_de": "Es tut mir leid."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Wir können eine Lösung finden."
                },
                {
                  "speaker": "Paul",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Mira",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "probleme-loesen-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Problem",
                  "fr": "problème",
                  "en": "problem"
                },
                {
                  "de": "Entschuldigung",
                  "fr": "excuse / pardon",
                  "en": "excuse me / sorry"
                },
                {
                  "de": "Lösung",
                  "fr": "solution",
                  "en": "solution"
                },
                {
                  "de": "Beschwerde",
                  "fr": "plainte / réclamation",
                  "en": "complaint"
                },
                {
                  "de": "ruhig",
                  "fr": "calme",
                  "en": "calm"
                },
                {
                  "de": "klären",
                  "fr": "clarifier / résoudre",
                  "en": "to clarify"
                },
                {
                  "de": "helfen",
                  "fr": "aider",
                  "en": "to help"
                },
                {
                  "de": "vorschlagen",
                  "fr": "proposer / suggérer",
                  "en": "to suggest"
                },
                {
                  "de": "wäre",
                  "fr": "serait (conditionnel)",
                  "en": "would be"
                },
                {
                  "de": "könnte",
                  "fr": "pourrait (conditionnel)",
                  "en": "could"
                }
              ]
            }
          },
          {
            "id": "probleme-loesen-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : hätte/würde. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: polite hätte/würde. Observe the examples and create your own sentence.",
              "examples_de": [
                "Ich hätte eine Frage.",
                "Könnten Sie mir bitte helfen?",
                "Es tut mir leid.",
                "Wir können eine Lösung finden."
              ]
            }
          },
          {
            "id": "probleme-loesen-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à conflits et solutions.",
              "prompt_en": "Introduce yourself or answer a question related to conflicts and solutions.",
              "starter_de": [
                "Ich hätte eine Frage.",
                "Könnten Sie mir bitte helfen?",
                "Es tut mir leid."
              ]
            }
          },
          {
            "id": "probleme-loesen-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Conflits et solutions.",
              "prompt_en": "Write 3 to 5 simple sentences about: Conflicts and solutions.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "probleme-loesen-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "probleme-loesen-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "probleme-loesen-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Lösung' ?",
                "question_en": "What does 'Lösung' mean?",
                "prompt_de": "Beschwerde",
                "options": [
                  "solution",
                  "problème",
                  "plainte",
                  "excuse"
                ],
                "correctAnswer": "solution",
                "explanation_fr": "'Lösung' signifie 'solution'.",
                "explanation_en": "'Lösung' means 'solution'.",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "probleme-loesen-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "probleme-loesen-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "probleme-loesen-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "probleme-loesen-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              },
              {
                "id": "probleme-loesen-q7",
                "type": "multiple_choice",
                "question_fr": "Choisissez la structure correcte.",
                "question_en": "Choose the correct structure.",
                "prompt_de": "Ich lerne Deutsch, ___ ich in Deutschland arbeiten möchte.",
                "options": [
                  "weil",
                  "und",
                  "aber",
                  "oder"
                ],
                "correctAnswer": "weil",
                "explanation_fr": "Weil introduit une raison et place le verbe conjugué à la fin.",
                "explanation_en": "Weil introduces a reason and sends the conjugated verb to the end.",
                "skill": "grammar",
                "difficulty": "medium"
              },
              {
                "id": "probleme-loesen-q8",
                "type": "multiple_choice",
                "question_fr": "Choisissez la phrase au Perfekt.",
                "question_en": "Choose the sentence in Perfekt.",
                "prompt_de": "Parler d'hier",
                "options": [
                  "Ich habe gestern gelernt.",
                  "Ich lerne gestern.",
                  "Ich lernen gestern.",
                  "Ich bin lernen gestern."
                ],
                "correctAnswer": "Ich habe gestern gelernt.",
                "explanation_fr": "Le Perfekt utilise souvent haben + participe II.",
                "explanation_en": "Perfekt often uses haben + participle II.",
                "skill": "grammar",
                "difficulty": "medium"
              }
            ]
          },
          {
            "id": "probleme-loesen-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "probleme-loesen-cartoon-video",
              "title_fr": "Vidéo cartoon — Résoudre les problèmes",
              "title_en": "Cartoon video — Solving problems politely",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Résoudre les problèmes.",
              "objective_en": "Understand a simple situation related to Solving problems politely.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich hätte eine Frage. » dans une situation quotidienne liée à Résoudre les problèmes.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich hätte eine Frage.” in an everyday situation related to Solving problems politely.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour résoudre les problèmes.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for solving problems politely.",
                  "dialogue_de": "Ich hätte eine Frage.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Könnten Sie mir bitte helfen? » dans une situation quotidienne liée à Résoudre les problèmes.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Könnten Sie mir bitte helfen?” in an everyday situation related to Solving problems politely.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour résoudre les problèmes.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for solving problems politely.",
                  "dialogue_de": "Könnten Sie mir bitte helfen?",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Könnten"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Es tut mir leid. » dans une situation quotidienne liée à Résoudre les problèmes.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Es tut mir leid.” in an everyday situation related to Solving problems politely.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour résoudre les problèmes.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for solving problems politely.",
                  "dialogue_de": "Es tut mir leid.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Es"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Wir können eine Lösung finden. » dans une situation quotidienne liée à Résoudre les problèmes.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Wir können eine Lösung finden.” in an everyday situation related to Solving problems politely.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour résoudre les problèmes.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for solving problems politely.",
                  "dialogue_de": "Wir können eine Lösung finden.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Wir"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "id": "a2-wiederholung",
        "order": 12,
        "title_de": "A2 Wiederholung",
        "title_fr": "Révision A2",
        "title_en": "A2 review",
        "description_fr": "Scénarios d’intégration",
        "description_en": "Integration scenarios",
        "objective_fr": "Comprendre et utiliser des phrases simples pour : scénarios d’intégration.",
        "objective_en": "Understand and use simple phrases for: integration scenarios.",
        "realLifeGoal_fr": "Gagner en confiance dans une situation de vie réelle.",
        "realLifeGoal_en": "Build confidence in a real-life situation.",
        "grammar": {
          "fr": "révision mixte",
          "en": "mixed review"
        },
        "vocabulary": [
          "Termin",
          "Arbeit",
          "Studium",
          "Gesundheit",
          "Wohnung",
          "Vertrag",
          "Kultur",
          "Problem",
          "Zukunft",
          "Erfahrung"
        ],
        "modules": [
          {
            "id": "a2-wiederholung-intro",
            "order": 1,
            "type": "lesson",
            "title_fr": "Introduction",
            "title_en": "Introduction",
            "duration": "5 min",
            "xp": 10,
            "content": {
              "objective_fr": "Objectif : Scénarios d’intégration.",
              "objective_en": "Objective: Integration scenarios.",
              "realLifeGoal_fr": "Utiliser l’allemand dans une situation réelle simple.",
              "realLifeGoal_en": "Use German in a simple real-life situation."
            }
          },
          {
            "id": "a2-wiederholung-dialogue",
            "order": 2,
            "type": "dialogue",
            "title_fr": "Dialogue original",
            "title_en": "Original dialogue",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "dialogue": [
                {
                  "speaker": "Paul",
                  "text_de": "Ich habe letzte Woche einen Termin gemacht."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Ich suche Arbeit, weil ich Erfahrung habe."
                },
                {
                  "speaker": "Paul",
                  "text_de": "Ich möchte mich gut integrieren."
                },
                {
                  "speaker": "Mira",
                  "text_de": "Könnten Sie mir helfen?"
                },
                {
                  "speaker": "Paul",
                  "text_de": "Können Sie das bitte wiederholen?"
                },
                {
                  "speaker": "Mira",
                  "text_de": "Danke, das hilft mir."
                }
              ],
              "note_fr": "Lisez lentement puis répétez chaque phrase.",
              "note_en": "Read slowly, then repeat each sentence."
            }
          },
          {
            "id": "a2-wiederholung-vocabulary",
            "order": 3,
            "type": "vocabulary",
            "title_fr": "Vocabulaire",
            "title_en": "Vocabulary",
            "duration": "10 min",
            "xp": 15,
            "content": {
              "items": [
                {
                  "de": "Termin",
                  "fr": "rendez-vous",
                  "en": "appointment"
                },
                {
                  "de": "Arbeit",
                  "fr": "travail",
                  "en": "work"
                },
                {
                  "de": "Studium",
                  "fr": "études",
                  "en": "studies"
                },
                {
                  "de": "Gesundheit",
                  "fr": "santé",
                  "en": "health"
                },
                {
                  "de": "Wohnung",
                  "fr": "appartement",
                  "en": "apartment"
                },
                {
                  "de": "Vertrag",
                  "fr": "contrat",
                  "en": "contract"
                },
                {
                  "de": "Kultur",
                  "fr": "culture",
                  "en": "culture"
                },
                {
                  "de": "Problem",
                  "fr": "problème",
                  "en": "problem"
                },
                {
                  "de": "Zukunft",
                  "fr": "avenir",
                  "en": "future"
                },
                {
                  "de": "Erfahrung",
                  "fr": "expérience",
                  "en": "experience"
                }
              ]
            }
          },
          {
            "id": "a2-wiederholung-grammar",
            "order": 4,
            "type": "grammar",
            "title_fr": "Grammaire",
            "title_en": "Grammar",
            "duration": "12 min",
            "xp": 20,
            "content": {
              "explanation_fr": "Point de grammaire : révision mixte. Observez les exemples et créez une phrase personnelle.",
              "explanation_en": "Grammar point: mixed review. Observe the examples and create your own sentence.",
              "examples_de": [
                "Ich habe letzte Woche einen Termin gemacht.",
                "Ich suche Arbeit, weil ich Erfahrung habe.",
                "Ich möchte mich gut integrieren.",
                "Könnten Sie mir helfen?"
              ]
            }
          },
          {
            "id": "a2-wiederholung-speaking",
            "order": 5,
            "type": "speaking",
            "title_fr": "Expression orale",
            "title_en": "Speaking practice",
            "duration": "8 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Présentez-vous ou répondez à une question liée à scénarios d’intégration.",
              "prompt_en": "Introduce yourself or answer a question related to integration scenarios.",
              "starter_de": [
                "Ich habe letzte Woche einen Termin gemacht.",
                "Ich suche Arbeit, weil ich Erfahrung habe.",
                "Ich möchte mich gut integrieren."
              ]
            }
          },
          {
            "id": "a2-wiederholung-writing",
            "order": 6,
            "type": "writing",
            "title_fr": "Écriture",
            "title_en": "Writing",
            "duration": "10 min",
            "xp": 20,
            "content": {
              "prompt_fr": "Écrivez 3 à 5 phrases simples sur : Scénarios d’intégration.",
              "prompt_en": "Write 3 to 5 simple sentences about: Integration scenarios.",
              "minWords": 20,
              "maxWords": 60
            }
          },
          {
            "id": "a2-wiederholung-quiz",
            "order": 7,
            "type": "quiz",
            "title_fr": "Quiz",
            "title_en": "Quiz",
            "duration": "8 min",
            "xp": 30,
            "quiz": [
              {
                "id": "a2-wiederholung-q1",
                "type": "multiple_choice",
                "question_fr": "Choisissez la bonne réponse.",
                "question_en": "Choose the correct answer.",
                "prompt_de": "Ich ___ aus Kamerun.",
                "options": [
                  "komme",
                  "kommst",
                  "kommt",
                  "kommen"
                ],
                "correctAnswer": "komme",
                "explanation_fr": "Avec ich, le verbe kommen devient komme.",
                "explanation_en": "With ich, kommen becomes komme.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "a2-wiederholung-q2",
                "type": "multiple_choice",
                "question_fr": "Que signifie 'Gesundheit' ?",
                "question_en": "What does 'Gesundheit' mean?",
                "prompt_de": "Arbeit",
                "options": [
                  "santé",
                  "travail",
                  "culture",
                  "avenir"
                ],
                "correctAnswer": "santé",
                "explanation_fr": "'Gesundheit' signifie 'santé' — aussi dit après un éternuement !",
                "explanation_en": "'Gesundheit' means 'health' — also said after a sneeze!",
                "skill": "vocabulary",
                "difficulty": "easy"
              },
              {
                "id": "a2-wiederholung-q3",
                "type": "word_order",
                "question_fr": "Mettez les mots dans le bon ordre.",
                "question_en": "Put the words in the correct order.",
                "prompt_de": "heiße / Ich / Amara",
                "options": [
                  "Ich heiße Amara",
                  "Heiße ich Amara",
                  "Amara ich heiße"
                ],
                "correctAnswer": "Ich heiße Amara",
                "explanation_fr": "En phrase simple, le verbe est en deuxième position.",
                "explanation_en": "In a simple statement, the verb is in second position.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "a2-wiederholung-q4",
                "type": "fill_blank",
                "question_fr": "Complétez la phrase.",
                "question_en": "Complete the sentence.",
                "prompt_de": "Guten Tag. Ich ___ Paul.",
                "options": [
                  "heiße",
                  "heißt",
                  "heißen",
                  "heißt du"
                ],
                "correctAnswer": "heiße",
                "explanation_fr": "Avec ich, on dit ich heiße.",
                "explanation_en": "With ich, say ich heiße.",
                "skill": "grammar",
                "difficulty": "easy"
              },
              {
                "id": "a2-wiederholung-q5",
                "type": "situation_response",
                "question_fr": "Quelle phrase convient dans cette situation ?",
                "question_en": "Which sentence fits this situation?",
                "prompt_de": "Vous rencontrez une personne pour la première fois.",
                "options": [
                  "Freut mich.",
                  "Ich habe Hunger.",
                  "Das kostet drei Euro.",
                  "Ich schlafe."
                ],
                "correctAnswer": "Freut mich.",
                "explanation_fr": "Freut mich est utilisé pour dire enchanté.",
                "explanation_en": "Freut mich is used to say nice to meet you.",
                "skill": "speaking_preparation",
                "difficulty": "easy"
              },
              {
                "id": "a2-wiederholung-q6",
                "type": "translation_short",
                "question_fr": "Traduisez l'idée en allemand.",
                "question_en": "Translate the idea into German.",
                "prompt_de": "Je viens du Cameroun.",
                "options": [
                  "Ich komme aus Kamerun.",
                  "Ich bin Kamerun.",
                  "Ich habe Kamerun.",
                  "Ich lerne Kamerun."
                ],
                "correctAnswer": "Ich komme aus Kamerun.",
                "explanation_fr": "Pour dire venir de, on utilise kommen aus.",
                "explanation_en": "To say come from, use kommen aus.",
                "skill": "writing",
                "difficulty": "easy"
              },
              {
                "id": "a2-wiederholung-q7",
                "type": "multiple_choice",
                "question_fr": "Choisissez la structure correcte.",
                "question_en": "Choose the correct structure.",
                "prompt_de": "Ich lerne Deutsch, ___ ich in Deutschland arbeiten möchte.",
                "options": [
                  "weil",
                  "und",
                  "aber",
                  "oder"
                ],
                "correctAnswer": "weil",
                "explanation_fr": "Weil introduit une raison et place le verbe conjugué à la fin.",
                "explanation_en": "Weil introduces a reason and sends the conjugated verb to the end.",
                "skill": "grammar",
                "difficulty": "medium"
              },
              {
                "id": "a2-wiederholung-q8",
                "type": "multiple_choice",
                "question_fr": "Choisissez la phrase au Perfekt.",
                "question_en": "Choose the sentence in Perfekt.",
                "prompt_de": "Parler d'hier",
                "options": [
                  "Ich habe gestern gelernt.",
                  "Ich lerne gestern.",
                  "Ich lernen gestern.",
                  "Ich bin lernen gestern."
                ],
                "correctAnswer": "Ich habe gestern gelernt.",
                "explanation_fr": "Le Perfekt utilise souvent haben + participe II.",
                "explanation_en": "Perfekt often uses haben + participle II.",
                "skill": "grammar",
                "difficulty": "medium"
              }
            ]
          },
          {
            "id": "a2-wiederholung-video",
            "order": 8,
            "type": "video",
            "title_fr": "Vidéo cartoon",
            "title_en": "Cartoon video",
            "duration": "2 min",
            "xp": 10,
            "video": {
              "id": "a2-wiederholung-cartoon-video",
              "title_fr": "Vidéo cartoon — Révision A2",
              "title_en": "Cartoon video — A2 review",
              "durationSeconds": 75,
              "style": "simple 2D cartoon, warm, modern, diverse characters, clear gestures, everyday settings, Yema green accent",
              "objective_fr": "Comprendre une situation simple liée à Révision A2.",
              "objective_en": "Understand a simple situation related to A2 review.",
              "scenes": [
                {
                  "sceneNumber": 1,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich habe letzte Woche einen Termin gemacht. » dans une situation quotidienne liée à Révision A2.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich habe letzte Woche einen Termin gemacht.” in an everyday situation related to A2 review.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour révision a2.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for a2 review.",
                  "dialogue_de": "Ich habe letzte Woche einen Termin gemacht.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 2,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich suche Arbeit, weil ich Erfahrung habe. » dans une situation quotidienne liée à Révision A2.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich suche Arbeit, weil ich Erfahrung habe.” in an everyday situation related to A2 review.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour révision a2.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for a2 review.",
                  "dialogue_de": "Ich suche Arbeit, weil ich Erfahrung habe.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 3,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Ich möchte mich gut integrieren. » dans une situation quotidienne liée à Révision A2.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Ich möchte mich gut integrieren.” in an everyday situation related to A2 review.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour révision a2.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for a2 review.",
                  "dialogue_de": "Ich möchte mich gut integrieren.",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Ich"
                  ]
                },
                {
                  "sceneNumber": 4,
                  "visualPrompt_fr": "Scène cartoon 2D simple: Paul and a friendly local contact utilisent la phrase « Könnten Sie mir helfen? » dans une situation quotidienne liée à Révision A2.",
                  "visualPrompt_en": "Simple 2D cartoon scene: Paul and a friendly local contact use the phrase “Könnten Sie mir helfen?” in an everyday situation related to A2 review.",
                  "narration_fr": "Dans cette scène, l’apprenant découvre une phrase utile pour révision a2.",
                  "narration_en": "In this scene, the learner discovers a useful phrase for a2 review.",
                  "dialogue_de": "Könnten Sie mir helfen?",
                  "caption_fr": "Phrase utile pour la vraie vie.",
                  "caption_en": "Useful phrase for real life.",
                  "keyVocabulary": [
                    "Könnten"
                  ]
                },
                {
                  "sceneNumber": 6,
                  "visualPrompt_fr": "Écran de récapitulatif Yema avec fond sombre, accents verts et grandes sous-titres lisibles.",
                  "visualPrompt_en": "Yema recap screen with dark background, green accents and large readable subtitles.",
                  "narration_fr": "Répétez lentement les phrases. Vous n’avez pas besoin d’être parfait.",
                  "narration_en": "Repeat the phrases slowly. You do not need to be perfect.",
                  "dialogue_de": "Wiederholen Sie bitte.",
                  "caption_fr": "Répétez et gagnez en confiance.",
                  "caption_en": "Repeat and build confidence.",
                  "keyVocabulary": [
                    "wiederholen"
                  ]
                }
              ]
            }
          }
        ]
      }
    ]
  }
] as const;
