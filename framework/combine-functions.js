module.exports = (middleware) => (ctx, next) => {
    let index = -1
    
    function dispatch(i) {
        if (i <= index) {
            return Promise.reject(new Error('next() called multiple times'))
        }
        index = i
        
        let fn = middleware[i]
        if (i === middleware.length) {
            fn = next
        }
        
        if (!fn) {
            return Promise.resolve()
        }
        
        try {
            return Promise.resolve(fn(ctx, () => dispatch(i + 1)))
        } catch (err) {
            return Promise.reject(err)
        }
    }
    
    return dispatch(0)
}