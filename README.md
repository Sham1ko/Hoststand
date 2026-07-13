# Qolay Admin

Интерактивный модуль управления столами и бронями ресторана на Next.js.

## Запуск

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`.

## Данные

Активный источник данных - client-side `RestaurantProvider`. Он хранит этажи,
зоны, столы, брони и активный этаж в `localStorage` по версионированному ключу
`qolay:restaurant:v1`. Кнопка «Сбросить демо» восстанавливает полный сид.

По умолчанию provider использует `localStorage`. Mock HTTP API уже реализует
тот же контракт: `GET`/`PUT /api/restaurant` и `POST /api/restaurant/reset`.
Чтобы включить HTTP adapter, задай переменную окружения:

```bash
NEXT_PUBLIC_RESTAURANT_REPOSITORY=http
```

`HttpRestaurantRepository` не зависит от компонентов, поэтому реальный backend
должен сохранить эти ответы и контракт `RestaurantRepository`.

## Следующие шаги

- Интерактивная карта: pan/zoom, Pointer Events, выбор и перемещение столов.
- Редактор плана: snapshot, Save/Cancel, зоны, resize и rotate.
- Бронирование: редактирование, проверка пересечений и переход от карточки к
  выбранному столу на карте.
