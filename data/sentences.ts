export type Tier = 1 | 2 | 3;

export type Sentence = {
  id: string;
  ru: string;
  en: string;          // primary target
  accepted: string[];  // valid translations incl. contractions
  tier: Tier;
  tags: string[]; // grammar/vocab tags for SRS gap detection
};

export const SENTENCES: Sentence[] = [
  // ─── TIER 1 (A1–A2 Core) ─────────────────────────────────────────────
  { id: "t1-01", ru: "Я изучаю английский каждый день.", en: "I study English every day", accepted: ["I study English every day", "I'm studying English every day"], tier: 1, tags: ["present-simple", "adverbs-frequency"] },
  { id: "t1-02", ru: "Она живёт в Москве.", en: "She lives in Moscow", accepted: ["She lives in Moscow", "She is living in Moscow"], tier: 1, tags: ["present-simple", "prepositions"] },
  { id: "t1-03", ru: "У меня есть собака.", en: "I have a dog", accepted: ["I have a dog", "I've got a dog"], tier: 1, tags: ["have-got", "articles"] },
  { id: "t1-04", ru: "Мне нравится кофе.", en: "I like coffee", accepted: ["I like coffee"], tier: 1, tags: ["verb-like", "uncountable"] },
  { id: "t1-05", ru: "Он не работает по выходным.", en: "He doesn't work on weekends", accepted: ["He doesn't work on weekends", "He does not work at weekends", "He doesn't work at the weekend"], tier: 1, tags: ["present-simple-negative", "prepositions-time"] },
  { id: "t1-06", ru: "Сколько тебе лет?", en: "How old are you", accepted: ["How old are you"], tier: 1, tags: ["questions", "to-be"] },
  { id: "t1-07", ru: "Я встаю в семь часов утра.", en: "I get up at seven in the morning", accepted: ["I get up at seven in the morning", "I wake up at seven in the morning"], tier: 1, tags: ["phrasal-verbs", "prepositions-time", "present-simple"] },
  { id: "t1-08", ru: "Это моя книга.", en: "This is my book", accepted: ["This is my book", "It is my book"], tier: 1, tags: ["possessives", "to-be", "demonstratives"] },
  { id: "t1-09", ru: "Вчера я был занят.", en: "I was busy yesterday", accepted: ["I was busy yesterday"], tier: 1, tags: ["past-simple", "to-be", "adjectives"] },
  { id: "t1-10", ru: "Мы поедем в Париж летом.", en: "We will go to Paris in summer", accepted: ["We will go to Paris in summer", "We're going to Paris in summer", "We are going to Paris in the summer"], tier: 1, tags: ["future-simple", "prepositions-time"] },
  { id: "t1-11", ru: "Она покупает молоко в магазине.", en: "She buys milk at the store", accepted: ["She buys milk at the store", "She is buying milk at the shop"], tier: 1, tags: ["present-simple", "articles"] },
  { id: "t1-12", ru: "Я не понимаю этот вопрос.", en: "I don't understand this question", accepted: ["I don't understand this question", "I do not understand this question"], tier: 1, tags: ["present-simple-negative", "demonstratives"] },
  { id: "t1-13", ru: "Ты можешь помочь мне?", en: "Can you help me", accepted: ["Can you help me", "Could you help me"], tier: 1, tags: ["modals", "questions"] },
  { id: "t1-14", ru: "У них двое детей.", en: "They have two children", accepted: ["They have two children", "They've got two children"], tier: 1, tags: ["have-got", "plurals"] },
  { id: "t1-15", ru: "Сегодня холодно.", en: "It is cold today", accepted: ["It is cold today", "It's cold today"], tier: 1, tags: ["to-be", "weather", "it-subject"] },

  // ─── TIER 2 (B1–B2 Practical / Exam) ─────────────────────────────────
  { id: "t2-01", ru: "Она уже видела этот фильм.", en: "She has already seen this film", accepted: ["She has already seen this film", "She has already seen this movie"], tier: 2, tags: ["present-perfect", "adverbs-position"] },
  { id: "t2-02", ru: "Если бы у меня было время, я бы поехал.", en: "If I had time, I would go", accepted: ["If I had time, I would go", "If I had the time, I would go"], tier: 2, tags: ["conditionals-second", "subjunctive"] },
  { id: "t2-03", ru: "Я работаю здесь уже пять лет.", en: "I have been working here for five years", accepted: ["I have been working here for five years", "I've worked here for five years", "I have worked here for five years"], tier: 2, tags: ["present-perfect-continuous", "for-since"] },
  { id: "t2-04", ru: "Он попросил меня помочь ему.", en: "He asked me to help him", accepted: ["He asked me to help him"], tier: 2, tags: ["infinitive", "object-pronouns", "reported-speech-light"] },
  { id: "t2-05", ru: "Это зависит от погоды.", en: "It depends on the weather", accepted: ["It depends on the weather"], tier: 2, tags: ["phrasal-verbs", "prepositions"] },
  { id: "t2-06", ru: "Мне надоело ждать.", en: "I'm tired of waiting", accepted: ["I'm tired of waiting", "I am tired of waiting", "I got tired of waiting"], tier: 2, tags: ["gerund", "adjectives-tired-bored"] },
  { id: "t2-07", ru: "Чем больше я практикуюсь, тем лучше получается.", en: "The more I practice, the better it gets", accepted: ["The more I practice, the better it gets", "The more I practise, the better I get"], tier: 2, tags: ["comparatives-correlative"] },
  { id: "t2-08", ru: "Она отложила встречу на пятницу.", en: "She put off the meeting until Friday", accepted: ["She put off the meeting until Friday", "She postponed the meeting until Friday"], tier: 2, tags: ["phrasal-verbs", "prepositions-time"] },
  { id: "t2-09", ru: "Я не привык вставать так рано.", en: "I'm not used to getting up so early", accepted: ["I'm not used to getting up so early", "I am not used to getting up this early"], tier: 2, tags: ["used-to", "gerund"] },
  { id: "t2-10", ru: "Это стоило дешевле, чем я ожидал.", en: "It cost less than I expected", accepted: ["It cost less than I expected", "It was cheaper than I expected"], tier: 2, tags: ["comparatives", "past-simple"] },
  { id: "t2-11", ru: "Он ушёл, не сказав ни слова.", en: "He left without saying a word", accepted: ["He left without saying a word", "He went out without saying a word"], tier: 2, tags: ["gerund-after-preposition", "articles"] },
  { id: "t2-12", ru: "Я хотел бы забронировать столик на двоих.", en: "I would like to book a table for two", accepted: ["I would like to book a table for two", "I'd like to reserve a table for two"], tier: 2, tags: ["polite-requests", "infinitive", "restaurant"] },
  { id: "t2-13", ru: "К тому времени, как мы приехали, фильм уже начался.", en: "By the time we arrived, the film had already started", accepted: ["By the time we arrived, the film had already started", "By the time we got there, the movie had already begun"], tier: 2, tags: ["past-perfect", "time-clauses"] },
  { id: "t2-14", ru: "Меня раздражает, когда люди опаздывают.", en: "It annoys me when people are late", accepted: ["It annoys me when people are late", "I get annoyed when people are late"], tier: 2, tags: ["it-cleft", "adjectives-ed-ing"] },
  { id: "t2-15", ru: "Несмотря на дождь, они пошли гулять.", en: "Despite the rain, they went for a walk", accepted: ["Despite the rain, they went for a walk", "In spite of the rain, they went for a walk"], tier: 2, tags: ["contrast-connectors", "prepositions"] },

  // ─── TIER 3 (C1 / IT / Idiomatic) ────────────────────────────────────
  { id: "t3-01", ru: "Прежде чем деплоить, убедитесь, что тесты проходят.", en: "Before deploying, make sure the tests pass", accepted: ["Before deploying, make sure the tests pass", "Make sure the tests pass before you deploy"], tier: 3, tags: ["it-terminology", "gerund", "imperatives"] },
  { id: "t3-02", ru: "Этот баг тянется уже три спринта.", en: "This bug has been dragging on for three sprints", accepted: ["This bug has been dragging on for three sprints", "This bug has dragged on for three sprints"], tier: 3, tags: ["it-terminology", "present-perfect-continuous", "phrasal-verbs"] },
  { id: "t3-03", ru: "Он разбирается в распределённых системах.", en: "He knows his way around distributed systems", accepted: ["He knows his way around distributed systems", "He is well versed in distributed systems"], tier: 3, tags: ["it-terminology", "idioms"] },
  { id: "t3-04", ru: "Не стоит оптимизировать преждевременно.", en: "Don't optimize prematurely", accepted: ["Don't optimize prematurely", "It's not worth optimizing prematurely"], tier: 3, tags: ["it-terminology", "worth-gerund"] },
  { id: "t3-05", ru: "Рефакторинг окупился — код стал намного читабельнее.", en: "The refactoring paid off — the code became much more readable", accepted: ["The refactoring paid off — the code became much more readable", "The refactor paid off and the code is far more readable now"], tier: 3, tags: ["it-terminology", "phrasal-verbs", "comparatives"] },
  { id: "t3-06", ru: "Судя по всему, дедлайн сдвинут.", en: "Apparently, the deadline will be pushed back", accepted: ["Apparently, the deadline will be pushed back", "It looks like the deadline is going to be pushed back"], tier: 3, tags: ["hedging", "passive-voice", "phrasal-verbs"] },
  { id: "t3-07", ru: "Я бы на твоём месте не стал этого делать.", en: "If I were you, I wouldn't do it", accepted: ["If I were you, I wouldn't do it", "I wouldn't do that if I were in your shoes"], tier: 3, tags: ["conditionals-second", "idioms", "subjunctive"] },
  { id: "t3-08", ru: "Это не имеет никакого отношения к задаче.", en: "It has nothing to do with the task", accepted: ["It has nothing to do with the task", "It's completely unrelated to the task"], tier: 3, tags: ["idioms", "prepositions"] },
  { id: "t3-09", ru: "Как бы мы ни старались, трафик не падает.", en: "No matter how hard we try, the traffic isn't dropping", accepted: ["No matter how hard we try, the traffic isn't dropping", "However hard we try, traffic keeps failing to drop"], tier: 3, tags: ["concessions", "inversion-light"] },
  { id: "t3-10", ru: "Сервис лёг посреди презентации.", en: "The service went down in the middle of the presentation", accepted: ["The service went down in the middle of the presentation", "The service crashed midway through the demo"], tier: 3, tags: ["it-terminology", "phrasal-verbs", "idioms"] },
  { id: "t3-11", ru: "Он склонен переусложнять простые вещи.", en: "He tends to overcomplicate simple things", accepted: ["He tends to overcomplicate simple things", "He has a tendency to overcomplicate simple matters"], tier: 3, tags: ["tendency", "word-formation", "prefixes"] },
  { id: "t3-12", ru: "Пока рано делать выводы.", en: "It's too early to draw conclusions", accepted: ["It's too early to draw conclusions", "It's premature to jump to conclusions"], tier: 3, tags: ["idioms", "too-enough", "infinitive"] },
  { id: "t3-13", ru: "Мы исходим из предположения, что пользователь честен.", en: "We assume that the user is honest", accepted: ["We assume that the user is honest", "We operate on the assumption that the user is honest"], tier: 3, tags: ["formal-register", "noun-clauses"] },
  { id: "t3-14", ru: "Она неизменно опаздывает на стендапы.", en: "She invariably shows up late to standups", accepted: ["She invariably shows up late to standups", "She is consistently late for standups"], tier: 3, tags: ["it-terminology", "adverbs-manner", "phrasal-verbs"] },
  { id: "t3-15", ru: "Нам пришлось откатить изменения из-за регресса.", en: "We had to roll back the changes due to a regression", accepted: ["We had to roll back the changes due to a regression", "We were forced to roll back the changes because of the regression"], tier: 3, tags: ["it-terminology", "phrasal-verbs", "causative-have"] },
];
