module.exports = (middleware) => {
    return async (ctx, next) => {
        let index = -1
        
        const dispatch = async (i) => {
            if (i <= index) {
                return Promise.reject(new Error('next() called multiple times'))
            }
            index = i
            
            const fn = i < middleware.length ? middleware[i] : next
            
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
}