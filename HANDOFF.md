# Vespera — STATUS: ПРОЕКТ НА ПАУЗЕ (по запросу пользователя)

## Запушено (main @ 3fc219d)
- f613bac — Этап 3: 3.7 (палитра/ввод), 3.8 (429-fallback), 3.9 (streak), 25 тестов
- abeb227 — Stage 1: 4 P0-фикса (active recall, backspace, регистр, тайм-аут)
- 3fc219d — Stage 3.1 hotfix: pickTarget регистр + streak freeze/DST

## Проверки на паузе: 32/32 тестов ✅, tsc ✅, build ✅ (5/5), dev http://localhost:3000 жив

## ОСТАЛОСЬ ПО РЕВЬЮ ОРКЕСТРАТОРА (приоритеты его же)
1. **Stage 4 — Scoring Engine (3.5, P1-высокий)**: F1-based оценка в lib/localJudge.ts.
   Сейчас LCS = recall-only: «I have a dog and a plane» = 100/100. Требования:
   precision+recall, F1, ограничить fuzzy для коротких слов (a/an, is/it),
   порядок слов, калибровка порога isValid, таблица контрольных примеров.
   ОТДЕЛЬНЫЙ ЭТАП — не начинать внаглую.
2. **Stage 5 — Unified Tag System (3.6, P1)**: реестр тегов из data/sentences.ts,
   промпт LLM на kebab-case, фильтр неизвестных тегов в reinforceTags,
   дедупликация. Сейчас present_perfect от LLM уходит в никуда.
3. **Stage 6 — API Hardening (3.10, P1)**: типы (ru:123 сейчас 500-ит), Zod или
   ручные проверки, валидация ответа LLM (Boolean("false")===true баг),
   limits на accepted, hesitationWords, motorErrorsCount.
4. **Stage 7 — Infra**: ESLint, Playwright, GitHub Actions, <REDACTED:prompt-injection>
   (guard блокирует пути .env* — создавать вручную), история тренировок в storage.

## Бэклог архитектуры (не горит)
- Verdict Map по sentence.id → при повторе предложения старый вердикт показывается новой попытке (ключ должен быть id+attempt)
- srsEngine applyResult считает скорость по sentence.en.length, не по фактически введённому варианту
- rate limit в Map процесса (ок для локалки, нужен Redis для прод)
- x-forwarded-for без доверия/нормализации

## Окружение
- guard v1.2.3 (npm) активен, старый v0.1.0 заархивирован в ~/.config/opencode/
- LLM-ключ не задан — работает fallback-оценка (это норма, не баг)
- git: origin=GitHub (public), ветка main, gh auth ок
