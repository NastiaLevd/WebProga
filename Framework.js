const http = require('http')
const url = require('url')

module.exports = class Framework {
    constructor() {
        this.middleware = []
        this.routes = {
            GET: {},
            POST: {},
            PUT: {},
            PATCH: {},
            DELETE: {},
            OPTIONS: {}
        }
        this.paramRoutes = {
            GET: [],
            POST: [],
            PUT: [],
            PATCH: [],
            DELETE: [],
            OPTIONS: []
        }
    }

    use(fn) {
        this.middleware.push(fn)
    }

    get(path, handler) {
        if (path.includes(':')) {
            this.paramRoutes.GET.push({ pattern: this.pathToRegex(path), path, handler })
        } else {
            this.routes.GET[path] = handler
        }
    }

    post(path, handler) {
        if (path.includes(':')) {
            this.paramRoutes.POST.push({ pattern: this.pathToRegex(path), path, handler })
        } else {
            this.routes.POST[path] = handler
        }
    }

    put(path, handler) {
        if (path.includes(':')) {
            this.paramRoutes.PUT.push({ pattern: this.pathToRegex(path), path, handler })
        } else {
            this.routes.PUT[path] = handler
        }
    }

    patch(path, handler) {
        if (path.includes(':')) {
            this.paramRoutes.PATCH.push({ pattern: this.pathToRegex(path), path, handler })
        } else {
            this.routes.PATCH[path] = handler
        }
    }

    delete(path, handler) {
        if (path.includes(':')) {
            this.paramRoutes.DELETE.push({ pattern: this.pathToRegex(path), path, handler })
        } else {
            this.routes.DELETE[path] = handler
        }
    }

    options(path, handler) {
        if (path.includes(':')) {
            this.paramRoutes.OPTIONS.push({ pattern: this.pathToRegex(path), path, handler })
        } else {
            this.routes.OPTIONS[path] = handler
        }
    }

    listen(port, callback) {
        const server = http.createServer(this.handle())
        return server.listen(port, callback)
    }

    handle() {
        return async (req, res) => {
            const parsedUrl = url.parse(req.url, true)
            
            req.query = parsedUrl.query
            req.params = {}
            
            res.send = (data) => {
                if (!res.headersSent) {
                    const contentType = res.getHeader('Content-Type') || 'text/plain'
                    const isJson = contentType === 'application/json'
                    
                    res.writeHead(res.statusCode || 200, { 
                        'Content-Type': contentType
                    })
                    
                    const responseBody = isJson && typeof data === 'object' 
                        ? JSON.stringify(data) 
                        : data.toString()
                    
                    res.end(responseBody)
                }
            }
            
            res.json = (data) => {
                if (!res.headersSent) {
                    res.setHeader('Content-Type', 'application/json')
                    res.statusCode = res.statusCode || 200
                    res.send(data)
                }
            }
            
            res.status = (code) => {
                if (!res.headersSent) {
                    res.statusCode = code
                }
                return res
            }
            
            const ctx = { 
                req, 
                res,
                method: req.method,
                path: parsedUrl.pathname,
                query: parsedUrl.query,
                params: {},
                body: null,
                status: 200,
                contentType: 'application/json',
                send: null,
                sendError: null
            }
            
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
                try {
                    ctx.body = await this.parseBody(req)
                    req.body = ctx.body
                } catch (error) {
                    return res.status(400).json({ error: 'Invalid JSON body' })
                }
            }

            try {
                await this.executeMiddleware(ctx)
                
                if (res.headersSent) {
                    return
                }
                
                const routeHandler = this.findRoute(ctx.method, ctx.path)
                
                if (routeHandler) {
                    const { handler, params } = routeHandler
                    ctx.params = params || {}
                    req.params = params || {}
                    
                    const result = await handler(ctx)
                    
                    if (result !== undefined && ctx.body === null) {
                        ctx.body = result
                    }
                } else {
                    return res.status(404).json({ error: 'Not found' })
                }
                
                if (!res.headersSent) {
                    if (ctx.body !== undefined && ctx.body !== null) {
                        const responseBody = ctx.contentType === 'application/json' 
                            ? JSON.stringify(ctx.body) 
                            : ctx.body.toString()
                        
                        res.writeHead(ctx.status, { 'Content-Type': ctx.contentType })
                        res.end(responseBody)
                    } else {
                        res.writeHead(ctx.status)
                        res.end()
                    }
                }
            } catch (error) {
                console.error('Server error:', error)
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Internal server error' })
                }
            }
        }
    }

    async executeMiddleware(ctx) {
        let index = -1
        
        const dispatch = async (i) => {
            if (i <= index) {
                throw new Error('next() called multiple times')
            }
            index = i
            
            const fn = i < this.middleware.length ? this.middleware[i] : null
            
            if (!fn) {
                return
            }
            
            try {
                await fn(ctx, () => dispatch(i + 1))
            } catch (err) {
                throw err
            }
        }
        
        await dispatch(0)
    }

    parseBody(req) {
        return new Promise((resolve, reject) => {
            let body = ''
            req.on('data', chunk => {
                body += chunk.toString()
            })
            req.on('end', () => {
                try {
                    if (body.trim()) {
                        resolve(JSON.parse(body))
                    } else {
                        resolve({})
                    }
                } catch (error) {
                    reject(error)
                }
            })
            req.on('error', reject)
        })
    }

    findRoute(method, path) {
        const normalizedMethod = method.toUpperCase()
        const methodRoutes = this.routes[normalizedMethod]
        const methodParamRoutes = this.paramRoutes[normalizedMethod]
        
        if (methodRoutes && methodRoutes[path]) {
            return { handler: methodRoutes[path], params: {} }
        }
        
        if (methodParamRoutes) {
            for (const route of methodParamRoutes) {
                const match = path.match(route.pattern)
                if (match) {
                    const params = this.extractParams(route.path, path)
                    return { handler: route.handler, params }
                }
            }
        }
        
        return null
    }

    pathToRegex(path) {
        const pattern = path
            .replace(/:\w+/g, '([^/]+)')
            .replace(/\//g, '\\/')
        return new RegExp(`^${pattern}$`)
    }

    extractParams(routePath, actualPath) {
        const params = {}
        const routeParts = routePath.split('/')
        const pathParts = actualPath.split('/')
        
        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                const paramName = routeParts[i].substring(1)
                params[paramName] = pathParts[i]
            }
        }
        
        return params
    }
}