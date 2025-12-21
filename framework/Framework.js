const http = require('http')
const combineFunctions = require('./combine-functions')

module.exports = class Framework {
    constructor() {
        this.middleware = []
    }

    use(fn) {
        this.middleware.push(fn)
    }

    listen(...args) {
        return http.createServer(this.handle()).listen(...args)
    }

    handle() {
        const fns = combineFunctions(this.middleware)
        return (req, res) => {
            const ctx = { req, res }
            
            // Создаем финальный next, который вызовет finishResponse
            const finalNext = () => this.finishResponse(ctx)
            
            // Передаем ctx и finalNext как next
            fns(ctx, finalNext)
                .then(() => {
                    // Если finishResponse еще не был вызван (middleware не отправили ответ)
                    if (!res.headersSent && ctx.body !== undefined) {
                        this.finishResponse(ctx)
                    }
                })
                .catch((e) => {
                    console.log(e)
                    if (!res.headersSent) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' })
                        res.end('Error')
                    }
                })
        }
    }

    finishResponse(ctx) {
        const { res, status = 200, contentType = 'application/json', body = '' } = ctx
        
        if (res.headersSent) return // Если ответ уже отправлен
        
        res.writeHead(status, { 'Content-Type': contentType })
        res.end(contentType === 'application/json' ? JSON.stringify(body) : body)
    }
}