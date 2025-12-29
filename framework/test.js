const Framework = require('./Framework')
const app = new Framework()

app.use((ctx, next) => {
    console.log('Middleware 1 executed')
    return next()
})

app.use((ctx, next) => {
    console.log('Middleware 2 executed')
    return next()
})

app.get('/', (ctx) => {
    ctx.res.status(200).json({ 
        message: 'Главная страница',
        reqMethods: ['req.body', 'req.params', 'req.query'],
        resMethods: ['res.send()', 'res.json()', 'res.status()']
    })
})

app.get('/test/:id', (ctx) => {
    console.log('req.params.id:', ctx.req.params.id)
    
    console.log('req.query:', ctx.req.query)
    
    ctx.res.json({
        message: 'Тестовый маршрут',
        params: ctx.req.params,
        query: ctx.req.query
    })
})

app.post('/test', (ctx) => {
    console.log('req.body:', ctx.req.body)
    
    ctx.res.status(201).json({
        message: 'Данные получены',
        data: ctx.req.body
    })
})

app.get('/error', (ctx) => {
    throw new Error('Тестовая ошибка')
})

app.get('*', (ctx) => {
    ctx.res.status(404).json({ error: 'Страница не найдена' })
})

const PORT = 8080
app.listen(PORT, () => {
    console.log(`Тестовый сервер запущен на порту ${PORT}`)
    console.log(`Доступен по адресу: http://localhost:${PORT}`)
    console.log('\nПримеры запросов:')
    console.log('  GET  http://localhost:8080/')
    console.log('  GET  http://localhost:8080/test/123?param=value')
    console.log('  POST http://localhost:8080/test с телом JSON')
    console.log('  GET  http://localhost:8080/error (вызовет ошибку 500)')
    console.log('  GET  http://localhost:8080/not-found (вернет 404)')
})