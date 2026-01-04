const Framework = require('./Framework')
const fs = require('fs').promises
const path = require('path')

const app = new Framework()

const BOOKS_FILE = path.join(__dirname, 'books.json')
const AUTHORS_FILE = path.join(__dirname, 'authors.json')
const PRODUCTS_FILE = path.join(__dirname, 'products.json')
const BRANDS_FILE = path.join(__dirname, 'brands.json')

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
async function readJSON(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        return []
    }
}

async function writeJSON(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}
function generateRandomBook() {
    const titles = ["Мастер и Маргарита", "1984", "Гарри Поттер", "Дюна"]
    return {
        title: titles[Math.floor(Math.random() * titles.length)] + " (Random)",
        authorId: 1,
        genre: "Fantasy",
        year: 2024,
        isAvailable: true,
        rating: 5,
        tags: ["random"],
        publishedDate: new Date().toISOString()
    }
}

function generateRandomAuthor() {
    return {
        name: "Случайный Автор",
        birthYear: 1990,
        nationality: "Unknown",
        isAlive: true,
        awards: [],
        booksCount: 0
    }
}
function generateRandomProduct() {
    const names = ['Увлажняющий крем', 'Матовая помада', 'Тушь для ресниц']
    return {
        name: names[Math.floor(Math.random() * names.length)],
        brandId: 1,
        price: Math.floor(Math.random() * 5000),
        category: "Косметика",
        isOrganic: Math.random() > 0.5,
        rating: 4.5,
        manufactureDate: new Date().toISOString().split('T')[0],
        tags: ["random", "new"]
    }
}

function generateRandomBrand() {
    return {
        name: "New Cosmetic Brand",
        country: "France",
        tier: "Lux"
    }
}

app.get('/books', async (ctx) => {
    const books = await readJSON(BOOKS_FILE)
    ctx.send(books)
})

app.get('/books/:id', async (ctx) => {
    const books = await readJSON(BOOKS_FILE)
    const book = books.find(b => b.id == ctx.req.params.id)
    book ? ctx.send(book) : ctx.sendError('Книга не найдена', 404)
})

app.post('/books', async (ctx) => {
    const books = await readJSON(BOOKS_FILE)
    const newBook = Object.keys(ctx.req.body).length === 0 ? generateRandomBook() : ctx.req.body
    newBook.id = books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1
    books.push(newBook)
    await writeJSON(BOOKS_FILE, books)
    ctx.send(newBook, 201)
})

app.delete('/books/:id', async (ctx) => {
    let books = await readJSON(BOOKS_FILE)
    books = books.filter(b => b.id != ctx.req.params.id)
    await writeJSON(BOOKS_FILE, books)
    ctx.send({ message: 'Книга удалена' })
})

app.get('/products', async (ctx) => {
    const products = await readJSON(PRODUCTS_FILE)
    ctx.send(products)
})

app.get('/products/:id', async (ctx) => {
    const products = await readJSON(PRODUCTS_FILE)
    const product = products.find(p => p.id == ctx.req.params.id)
    product ? ctx.send(product) : ctx.sendError('Товар не найден', 404)
})

app.post('/products', async (ctx) => {
    const products = await readJSON(PRODUCTS_FILE)
    const newProduct = Object.keys(ctx.req.body).length === 0 ? generateRandomProduct() : ctx.req.body
    newProduct.id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1
    products.push(newProduct)
    await writeJSON(PRODUCTS_FILE, products)
    ctx.send(newProduct, 201)
})

app.get('/brands', async (ctx) => {
    const brands = await readJSON(BRANDS_FILE)
    ctx.send(brands)
})

app.post('/brands', async (ctx) => {
    const brands = await readJSON(BRANDS_FILE)
    const newBrand = Object.keys(ctx.req.body).length === 0 ? generateRandomBrand() : ctx.req.body
    newBrand.id = brands.length > 0 ? Math.max(...brands.map(b => b.id)) + 1 : 1
    brands.push(newBrand)
    await writeJSON(BRANDS_FILE, brands)
    ctx.send(newBrand, 201)
})

app.delete('/products/:id', async (ctx) => {
    let products = await readJSON(PRODUCTS_FILE)
    products = products.filter(p => p.id != ctx.req.params.id)
    await writeJSON(PRODUCTS_FILE, products)
    ctx.send({ message: 'Товар удален' })
})
app.get('/', (ctx) => {
    ctx.send({
        message: 'Добро пожаловать в объединенный API!',
        modules: {
            library: ['/books', '/authors'],
            cosmetics: ['/products', '/brands']
        },
        features: [
            'POST без тела = случайные данные',
            'PATCH для частичного обновления',
            'CORS включен'
        ]
    })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`)
})