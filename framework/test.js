const Framework=require('./Framework')
const app =new Framework()

app.use((ctx,next)=>{
    ctx.body={message: 'Hi there'}
    return next()
})

app.listen(8080, ()=>console.log('Server has been started'))