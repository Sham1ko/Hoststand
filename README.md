# Qolay Admin

Интерактивный модуль управления столами и бронями ресторана на Next.js.

## Запуск

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`.

## Данные

Активный источник данных - HTTP API. `RestaurantProvider` загружает начальный
`RestaurantState` через `GET /api/restaurant`, а изменения отправляет
ресурсными запросами к `/api/tables`, `/api/zones` и `/api/reservations`.
Выбор активного этажа остаётся локальным состоянием интерфейса. Кнопка
«Сбросить демо» вызывает `POST /api/restaurant/reset`.

Сейчас API использует in-memory mock в `restaurant-store.ts`, поэтому данные
сбрасываются после перезапуска сервера. При подключении реального backend нужно
сохранить ответы этих endpoint-ов и контракт `RestaurantRepository`; provider и
компоненты менять не потребуется.

## Следующие шаги

- Интерактивная карта: pan/zoom, Pointer Events, выбор и перемещение столов.
- Редактор плана: snapshot, Save/Cancel, зоны, resize и rotate.
- Бронирование: редактирование, проверка пересечений и переход от карточки к
  выбранному столу на карте.
