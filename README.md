# Vespera — Active Recall & Precision Typing

Минималистичный тренажер английского через слепую печать: русская фраза → вы воспроизводите
английский перевод с клавиатуры. Вдохновлено Monkeytype, усилено когнитивной наукой
(SLA / CAF: Complexity, Accuracy, Fluency) и LLM-разбором ошибок.

## Key Features

- **Zero-latency typing engine** — каретка на `translate3d`, состояние в Zustand, метрики на `performance.now()`
- **Hybrid Fast-Path + LLM Judge** — точные совпадения проверяются локально (0 токенов), остальное — OpenAI-compatible JSON-mode API с graceful fallback на LCS-сходство (работает офлайн, без ключа, при таймауте)
- **SRS Tag Weighting** — веса грамматических тегов растут при ошибках и паузах >1200 мс, взвешенная очередь приоритизирует слабые места (`vespera_srs_weights`)
- **Motor vs Cognitive Error Detection** — дифференциация опечаток (QWERTY-расстояние) и реальных языковых пробелов
- **Web Audio API synth** — механический клик, thud ошибки, фанфары завершения; ноль аудио-ассетов
- **Ghost Pacer** — гонка с собственным базовым WPM (per-tier EWMA, `vespera_baseline_wpm`)
- **Keyboard-first UX** — Tab+Enter / Esc — скип, Ctrl+K — командная палитра
- **Daily streak** с механикой заморозки дня (`vespera_streak`)

## Tech Stack

Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS 4 · Zustand · Web Audio API · OpenAI-compatible endpoint

## Local Setup

```bash
git clone <repo> && cd vespera
npm install
npm run dev   # http://localhost:3000
```

### Environment (optional — без ключа работает fallback-оценка)

Создайте `.env.local`:

```
OPENAI_API_KEY=        # OpenAI-compatible ключ (OpenAI, OpenRouter, Gemini-compat, локальный сервер)
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

## Notes

- Все данные — в `localStorage` (SRS, стрик, настройки, per-tier WPM); без логина
- Rate limit: 30 LLM-оценок/мин/IP, входы >300 символов отклоняются (400)
- 45 тегированных предложений: 15 × A1–A2, 15 × B1–B2, 15 × C1/IT
