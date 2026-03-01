# Карта API Интеграций TrakerEvo

## 1. TMDB (The Movie Database)

**Базовый URL**: `/api/tmdb` (проксируется на `https://api.themoviedb.org/3`)
**Использование**: Основной источник для западных фильмов и сериалов.

- `GET /search/multi`: Универсальный поиск (фильмы + сериалы).
- `GET /movie/{id}` / `GET /tv/{id}`: Детальная информация.
- `GET /trending/all/day`: Тренды для главной страницы.
- `GET /movie/{id}/watch/providers`: Доступность на стримингах.

## 2. Kinopoisk (Unofficial API)

**Базовый URL**: `/api/kinopoisk` (проксируется на `https://kinopoiskapiunofficial.tech`)
**Использование**: Локализация, рейтинги КП, RU-контент.

- `GET /v2.1/films/search-by-keyword`: Поиск по ключевым словам.
- `GET /v2.2/films/{id}`: Детальные данные фильма.
- `GET /v2.2/films/{id}/videos`: Трейлеры.
- `GET /v2.2/films/{id}/similars`: Похожий контент.
- `GET /v2.2/films/{id}/seasons`: Данные о сезонах и сериях для сериалов.
- `GET /v1/staff?filmId={id}`: Актеры и съемочная группа.

## 3. RAWG (Video Games Database)

**Базовый URL**: `/api/rawg` (проксируется на `https://api.rawg.io/api`)
**Использование**: База данных видеоигр.

- `GET /games`: Поиск игр и списки популярных.
- `GET /games/{id}`: Детальное описание, платформы, скриншоты.

## 4. Google Books

**Базовый URL**: `https://www.googleapis.com/books/v1`
**Использование**: Глобальный поиск книг.

- `GET /volumes?q={query}`: Поиск книг.
- `GET /volumes/{id}`: Детальная информация о книге.

---

## Обработка ответов и Оптимизация

- **Кэширование**: Почти все GET-запросы к деталям кэшируются в Dexie `cache` на 30 дней.
- **Proxy**: Изображения проксируются через `https://wsrv.nl/` для оптимизации размера и обхода ограничений hotlinking.
- **Retries**: `apiClient.ts` реализует экспоненциальный backoff для ошибок 429 и 5xx.
