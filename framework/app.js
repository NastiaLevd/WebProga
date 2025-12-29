const Framework = require('./Framework')
const fs = require('fs').promises
const path = require('path')

const app = new Framework()

app.use((ctx, next) => {
    console.log(`${new Date().toISOString()} - ${ctx.method} ${ctx.path}`)
    return next()
})

app.use((ctx, next) => {
    ctx.res.setHeader('Access-Control-Allow-Origin', '*')
    ctx.res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    ctx.res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    if (ctx.method === 'OPTIONS') {
        ctx.status = 200
        ctx.body = {}
        return
    }
    
    return next()
})

app.use(async (ctx, next) => {
    ctx.send = (data, status = 200) => {
        ctx.status = status
        ctx.contentType = 'application/json'
        ctx.body = data
    }
    
    ctx.sendError = (message, status = 400) => {
        ctx.status = status
        ctx.contentType = 'application/json'
        ctx.body = { error: message }
    }
    
    await next()
})

function generateRandomBook() {
    const titles = [
        "Мастер и Маргарита", "Тихий Дон", "Доктор Живаго", 
        "Сто лет одиночества", "1984", "Улисс", "Гарри Поттер",
        "Властелин Колец", "Хоббит", "Анна Каренина"
    ]
    const genres = ["Роман", "Фантастика", "Детектив", "Поэзия", "Драма", "Комедия", "Фэнтези", "Научная литература"]
    const tags = ["классика", "современная", "бестселлер", "лауреат", "экшен", "романтика", "приключения", "мистика"]
    
    const year = Math.floor(Math.random() * 100) + 1900
    const month = Math.floor(Math.random() * 12)
    const day = Math.floor(Math.random() * 28) + 1
    
    return {
        title: titles[Math.floor(Math.random() * titles.length)],
        authorId: Math.floor(Math.random() * 10) + 1,
        year: year,
        genre: genres[Math.floor(Math.random() * genres.length)],
        isAvailable: Math.random() > 0.3,
        publishedDate: new Date(year, month, day).toISOString(),
        tags: tags.slice(0, Math.floor(Math.random() * 3) + 1),
        rating: Math.floor(Math.random() * 5) + 1
    }
}

function generateRandomAuthor() {
    const names = [
        "Александр Пушкин", "Антон Чехов", "Иван Тургенев",
        "Николай Гоголь", "Владимир Набоков", "Михаил Булгаков",
        "Лев Толстой", "Фёдор Достоевский", "Иван Бунин", "Сергей Есенин"
    ]
    const nationalities = ["Русский", "Американский", "Французский", "Английский", "Немецкий", "Испанский", "Итальянский"]
    const awards = [
        "Нобелевская премия", "Пулитцеровская премия", "Букеровская премия",
        "Орден Почётного легиона", "Премия имени Гёте", "Русский Букер"
    ]
    
    return {
        name: names[Math.floor(Math.random() * names.length)],
        birthYear: Math.floor(Math.random() * 200) + 1700,
        isAlive: Math.random() > 0.7,
        nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
        awards: Math.random() > 0.5 ? [awards[Math.floor(Math.random() * awards.length)]] : [],
        booksCount: Math.floor(Math.random() * 100)
    }
}

async function readJsonFile(filename) {
    const filepath = path.join(__dirname, filename)
    try {
        const data = await fs.readFile(filepath, 'utf8')
        return JSON.parse(data)
    } catch (error) {
        return []
    }
}

async function writeJsonFile(filename, data) {
    const filepath = path.join(__dirname, filename)
    try {
        await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8')
        return true
    } catch (error) {
        throw error
    }
}

function validateId(id) {
    const numId = parseInt(id)
    return !isNaN(numId) && numId > 0 ? numId : null
}

app.get('/books', async (ctx) => {
    try {
        const books = await readJsonFile('books.json')
        ctx.send(books)
    } catch (error) {
        ctx.sendError('Ошибка при получении списка книг', 500)
    }
})

app.get('/books/:id', async (ctx) => {
    try {
        const id = validateId(ctx.params.id)
        if (!id) {
            ctx.sendError('Неверный ID книги', 400)
            return
        }
        
        const books = await readJsonFile('books.json')
        const book = books.find(b => b.id === id)
        
        if (book) {
            ctx.send(book)
        } else {
            ctx.sendError('Книга не найдена', 404)
        }
    } catch (error) {
        ctx.sendError('Ошибка при получении книги', 500)
    }
})

app.post('/books', async (ctx) => {
    try {
        const books = await readJsonFile('books.json')
        
        let newBook = ctx.body && Object.keys(ctx.body).length > 0 
            ? ctx.body 
            : generateRandomBook()
        
        if (!newBook.title || newBook.title.trim() === '') {
            ctx.sendError('Отсутствует обязательное поле: title', 400)
            return
        }
        
        if (!newBook.authorId || isNaN(newBook.authorId)) {
            ctx.sendError('Отсутствует или некорректен обязательное поле: authorId', 400)
            return
        }
        
        const maxId = books.length > 0 ? Math.max(...books.map(b => b.id || 0)) : 0
        newBook.id = maxId + 1
        
        newBook.isAvailable = newBook.isAvailable !== undefined ? newBook.isAvailable : true
        newBook.rating = newBook.rating || 0
        newBook.tags = newBook.tags || []
        
        if (!newBook.publishedDate) {
            newBook.publishedDate = new Date().toISOString()
        }
        
        books.push(newBook)
        await writeJsonFile('books.json', books)
        
        ctx.send(newBook, 201)
    } catch (error) {
        ctx.sendError('Ошибка при создании книги', 500)
    }
})

app.put('/books/:id', async (ctx) => {
    try {
        const id = validateId(ctx.params.id)
        if (!id) {
            ctx.sendError('Неверный ID книги', 400)
            return
        }
        
        const books = await readJsonFile('books.json')
        const bookIndex = books.findIndex(b => b.id === id)
        
        if (bookIndex === -1) {
            ctx.sendError('Книга не найдена', 404)
            return
        }
        
        let updateData = ctx.body || {}
        
        if (Object.keys(updateData).length === 0) {
            updateData = generateRandomBook()
        }
        
        if (!updateData.title || updateData.title.trim() === '') {
            ctx.sendError('Отсутствует обязательное поле: title', 400)
            return
        }
        
        if (!updateData.authorId || isNaN(updateData.authorId)) {
            ctx.sendError('Отсутствует или некорректен обязательное поле: authorId', 400)
            return
        }
        
        const updatedBook = {
            id: id,
            title: updateData.title,
            authorId: updateData.authorId,
            year: updateData.year || 0,
            genre: updateData.genre || '',
            isAvailable: updateData.isAvailable !== undefined ? updateData.isAvailable : true,
            publishedDate: updateData.publishedDate || new Date().toISOString(),
            tags: updateData.tags || [],
            rating: updateData.rating || 0
        }
        
        books[bookIndex] = updatedBook
        await writeJsonFile('books.json', books)
        
        ctx.send(updatedBook)
    } catch (error) {
        ctx.sendError('Ошибка при обновлении книги', 500)
    }
})

app.patch('/books/:id', async (ctx) => {
    try {
        const id = validateId(ctx.params.id)
        if (!id) {
            ctx.sendError('Неверный ID книги', 400)
            return
        }
        
        const books = await readJsonFile('books.json')
        const bookIndex = books.findIndex(b => b.id === id)
        
        if (bookIndex === -1) {
            ctx.sendError('Книга не найдена', 404)
            return
        }
        
        const updateData = ctx.body || {}
        
        if (Object.keys(updateData).length === 0) {
            ctx.sendError('Нет данных для обновления', 400)
            return
        }
        
        if (updateData.title !== undefined && updateData.title.trim() === '') {
            ctx.sendError('Поле title не может быть пустым', 400)
            return
        }
        
        if (updateData.authorId !== undefined && isNaN(updateData.authorId)) {
            ctx.sendError('Поле authorId должно быть числом', 400)
            return
        }
        
        const updatedBook = {
            ...books[bookIndex],
            ...updateData,
            id: id
        }
        
        books[bookIndex] = updatedBook
        await writeJsonFile('books.json', books)
        
        ctx.send(updatedBook)
    } catch (error) {
        ctx.sendError('Ошибка при частичном обновлении книги', 500)
    }
})

app.delete('/books/:id', async (ctx) => {
    try {
        const id = validateId(ctx.params.id)
        if (!id) {
            ctx.sendError('Неверный ID книги', 400)
            return
        }
        
        const books = await readJsonFile('books.json')
        const bookIndex = books.findIndex(b => b.id === id)
        
        if (bookIndex === -1) {
            ctx.sendError('Книга не найдена', 404)
            return
        }
        
        const deletedBook = books.splice(bookIndex, 1)[0]
        await writeJsonFile('books.json', books)
        
        ctx.send({ 
            message: 'Книга успешно удалена', 
            deletedBook: deletedBook 
        })
    } catch (error) {
        ctx.sendError('Ошибка при удалении книги', 500)
    }
})

app.get('/authors', async (ctx) => {
    try {
        const authors = await readJsonFile('authors.json')
        ctx.send(authors)
    } catch (error) {
        ctx.sendError('Ошибка при получении списка авторов', 500)
    }
})

app.get('/authors/:id', async (ctx) => {
    try {
        const id = validateId(ctx.params.id)
        if (!id) {
            ctx.sendError('Неверный ID автора', 400)
            return
        }
        
        const authors = await readJsonFile('authors.json')
        const author = authors.find(a => a.id === id)
        
        if (author) {
            ctx.send(author)
        } else {
            ctx.sendError('Автор не найден', 404)
        }
    } catch (error) {
        ctx.sendError('Ошибка при получении автора', 500)
    }
})

app.post('/authors', async (ctx) => {
    try {
        const authors = await readJsonFile('authors.json')
        
        let newAuthor = ctx.body && Object.keys(ctx.body).length > 0 
            ? ctx.body 
            : generateRandomAuthor()
        
        if (!newAuthor.name || newAuthor.name.trim() === '') {
            ctx.sendError('Отсутствует обязательное поле: name', 400)
            return
        }
        
        const maxId = authors.length > 0 ? Math.max(...authors.map(a => a.id || 0)) : 0
        newAuthor.id = maxId + 1
        
        newAuthor.isAlive = newAuthor.isAlive !== undefined ? newAuthor.isAlive : true
        newAuthor.awards = newAuthor.awards || []
        newAuthor.booksCount = newAuthor.booksCount || 0
        
        authors.push(newAuthor)
        await writeJsonFile('authors.json', authors)
        
        ctx.send(newAuthor, 201)
    } catch (error) {
        ctx.sendError('Ошибка при создании автора', 500)
    }
})

app.put('/authors/:id', async (ctx) => {
    try {
        const id = validateId(ctx.params.id)
        if (!id) {
            ctx.sendError('Неверный ID автора', 400)
            return
        }
        
        const authors = await readJsonFile('authors.json')
        const authorIndex = authors.findIndex(a => a.id === id)
        
        if (authorIndex === -1) {
            ctx.sendError('Автор не найден', 404)
            return
        }
        
        let updateData = ctx.body || {}
        
        if (Object.keys(updateData).length === 0) {
            updateData = generateRandomAuthor()
        }
        
        if (!updateData.name || updateData.name.trim() === '') {
            ctx.sendError('Отсутствует обязательное поле: name', 400)
            return
        }
        
        const updatedAuthor = {
            id: id,
            name: updateData.name,
            birthYear: updateData.birthYear || 0,
            isAlive: updateData.isAlive !== undefined ? updateData.isAlive : true,
            nationality: updateData.nationality || '',
            awards: updateData.awards || [],
            booksCount: updateData.booksCount || 0
        }
        
        authors[authorIndex] = updatedAuthor
        await writeJsonFile('authors.json', authors)
        
        ctx.send(updatedAuthor)
    } catch (error) {
        ctx.sendError('Ошибка при обновлении автора', 500)
    }
})

app.patch('/authors/:id', async (ctx) => {
    try {
        const id = validateId(ctx.params.id)
        if (!id) {
            ctx.sendError('Неверный ID автора', 400)
            return
        }
        
        const authors = await readJsonFile('authors.json')
        const authorIndex = authors.findIndex(a => a.id === id)
        
        if (authorIndex === -1) {
            ctx.sendError('Автор не найден', 404)
            return
        }
        
        const updateData = ctx.body || {}
        
        if (Object.keys(updateData).length === 0) {
            ctx.sendError('Нет данных для обновления', 400)
            return
        }
        
        if (updateData.name !== undefined && updateData.name.trim() === '') {
            ctx.sendError('Поле name не может быть пустым', 400)
            return
        }
        
        const updatedAuthor = {
            ...authors[authorIndex],
            ...updateData,
            id: id
        }
        
        authors[authorIndex] = updatedAuthor
        await writeJsonFile('authors.json', authors)
        
        ctx.send(updatedAuthor)
    } catch (error) {
        ctx.sendError('Ошибка при частичном обновлении автора', 500)
    }
})

app.delete('/authors/:id', async (ctx) => {
    try {
        const id = validateId(ctx.params.id)
        if (!id) {
            ctx.sendError('Неверный ID автора', 400)
            return
        }
        
        const authors = await readJsonFile('authors.json')
        const authorIndex = authors.findIndex(a => a.id === id)
        
        if (authorIndex === -1) {
            ctx.sendError('Автор не найден', 404)
            return
        }
        
        const deletedAuthor = authors.splice(authorIndex, 1)[0]
        await writeJsonFile('authors.json', authors)
        
        ctx.send({ 
            message: 'Автор успешно удален', 
            deletedAuthor: deletedAuthor 
        })
    } catch (error) {
        ctx.sendError('Ошибка при удалении автора', 500)
    }
})

app.get('/test-req-res', (ctx) => {
    const { req, res } = ctx
    
    console.log('Query params:', req.query)
    console.log('Path params:', req.params)
    console.log('Body:', req.body)
    
    res.status(200).json({ 
        message: 'Все методы req/res работают!',
        query: req.query,
        params: req.params,
        reqMethods: ['req.body', 'req.params', 'req.query'],
        resMethods: ['res.send()', 'res.json()', 'res.status()']
    })
})

app.get('/', (ctx) => {
    ctx.send({
        message: 'Добро пожаловать в Библиотеку API',
        version: '1.0.0',
        endpoints: {
            books: {
                getAll: 'GET /books',
                getOne: 'GET /books/:id',
                create: 'POST /books',
                update: 'PUT /books/:id',
                patch: 'PATCH /books/:id',
                delete: 'DELETE /books/:id'
            },
            authors: {
                getAll: 'GET /authors',
                getOne: 'GET /authors/:id',
                create: 'POST /authors',
                update: 'PUT /authors/:id',
                patch: 'PATCH /authors/:id',
                delete: 'DELETE /authors/:id'
            },
            test: {
                reqResMethods: 'GET /test-req-res'
            }
        },
        instructions: [
            'Для POST запросов без тела будут сгенерированы случайные данные',
            'PUT полностью заменяет ресурс',
            'PATCH частично обновляет только переданные поля',
            'Все методы req (body, params, query) и res (send, json, status) реализованы'
        ]
    })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`)
    console.log(`Доступен по адресу: http://localhost:${PORT}`)
    console.log('\nДоступные маршруты для книг:')
    console.log('  GET    /books          - Все книги')
    console.log('  GET    /books/:id      - Конкретная книга')
    console.log('  POST   /books          - Создать книгу')
    console.log('  PUT    /books/:id      - Полностью обновить книгу')
    console.log('  PATCH  /books/:id      - Частично обновить книгу')
    console.log('  DELETE /books/:id      - Удалить книгу')
    console.log('\nДоступные маршруты для авторов:')
    console.log('  GET    /authors        - Все авторы')
    console.log('  GET    /authors/:id    - Конкретный автор')
    console.log('  POST   /authors        - Создать автора')
    console.log('  PUT    /authors/:id    - Полностью обновить автора')
    console.log('  PATCH  /authors/:id    - Частично обновить автора')
    console.log('  DELETE /authors/:id    - Удалить автора')
    console.log('\nТестовый маршрут для проверки методов:')
    console.log('  GET    /test-req-res   - Проверка req/res методов')
    console.log('\nДля POST запросов без тела будут сгенерированы случайные данные')
})