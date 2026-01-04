Anastasia
GET / — Информация о API и доступные маршруты.
PUT — Полностью заменяет ресурс (требует передачи всех полей объекта).
PATCH — Частично обновляет ресурс (изменяет только те поля, которые присланы в body).
POST — Создание новой записи.
      Рандомайзер: Если отправить POST запрос с пустым телом, сервер автоматически сгенерирует случайную косметическую единицу или бренд со всеми необходимыми типами данных (string, number, boolean, Date, Array).

GET http://localhost:3000/products
POST http://localhost:3000/products Content-Type: application/json
PATCH http://localhost:3000/products/1
{
  "price": 2400,
  "rating": 5.0
}

DELETE http://localhost:3000/brands/2


Товары (Products)
GET /products — Получить список всех товаров.
GET /products/:id — Получить конкретный товар по его ID.
POST /products — Добавить новый товар (или сгенерировать случайный).
PUT /products/:id — Полное обновление данных товара.
PATCH /products/:id — Изменение части данных товара.
DELETE /products/:id — Удалить товар из базы.

Бренды (Brands)
GET /brands — Список всех косметических брендов.
GET /brands/:id — Информация о бренде по ID (включая его товары).
POST /brands — Добавить новый бренд (поддерживает рандом).
PUT /brands/:id — Полное редактирование бренда.
PATCH /brands/:id — Частичное редактирование данных бренда.
DELETE /brands/:id — Удалить бренд.

Anastasia