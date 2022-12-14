// Carregando módulos
    const express = require('express')
    const handlebars = require('express-handlebars')
    const bodyParser = require('body-parser')
    const app = express()
    const admin = require("./routes/admin")
    const path = require('path')
    const mongoose = require('mongoose')
    const session = require('express-session')
    const flash = require('connect-flash')
    require('./models/Post')
    const Post = mongoose.model('postagens')
    require('./models/Categoria')
    const Categoria = mongoose.model('categorias')
    const usuarios = require('./routes/usuario')
    const passport = require('passport')
    require('./config/auth')(passport)

// Configurações
    // Sessão
        app.use(session({
            secret: 'cursonodejs',
            resave: true,
            saveUninitialized: true
        }))
        app.use(passport.initialize())
        app.use(passport.session())
        app.use(flash())
    // Middleware
        app.use((req, res, next) => {
            res.locals.success_msg = req.flash('success_msg')
            res.locals.error_msg = req.flash('error_msg')
            res.locals.error = req.flash('error')
            res.locals.user = req.user || null
            next()
        })
    // Body parser
        app.use(bodyParser.urlencoded({extended: true}))
        app.use(bodyParser.json())
    // Handlebars
        app.engine('handlebars', handlebars.engine({defaultLayout: 'main'}))
        app.set('view engine', 'handlebars')
    // Mongoose
        mongoose.Promise = global.Promise
        mongoose.connect("mongodb://localhost/blogapp").then(() => {
            console.log("Conectado ao mongo.")
        }).catch((err) => {
            console.log("Ocorreu um erro: "+err)
        })
    // Public
        app.use(express.static(path.join(__dirname, "public")))

        app.use((req, res, next) => {
            console.log("Middleware")
            next()
        })

// Rotas
    app.get('/', (req, res) => {
        Post.find().lean().populate('categoria').sort({date: 'desc'}).then((postagens) => {
            res.render('index', {postagens: postagens})
        }).catch((err) => {
            console.log(err)
            req.flash('error_msg', 'Houve um erro interno')
            res.redirect('/404')
        })
    })

    app.get('/postagem/:slug', (req, res) => {
        Post.findOne({slug: req.params.slug}).lean().then((postagens) => {
            if(postagens){
                res.render('postagem/index', {postagens: postagens})
            }else{
                req.flash('error_msg', 'Esta postagem não existe')
                res.redirect('/')
            }
        }).catch((err) =>{
            req.flash('error_msg', 'Houve um erro interno')
            res.redirect('/')
        })
    })

    app.get('/categorias', (req, res) => {
        Categoria.find().then((categorias) => {
            res.render('categoria/index', {categorias: categorias.map(Categoria => Categoria.toJSON())})
        }).catch((err) => {
            console.log(err)
            req.flash('error_msg', 'Houve um erro ao carregar a pagína de categorias')
            res.redirect('/')
        })
    })

    app.get('/categorias/:slug', (req, res) => {
        Categoria.findOne({slug: req.params.slug}).lean().then((categorias) => {
            if(categorias){
                Post.find({categoria: categorias._id}).lean().then((postagens) => {
                    res.render('categoria/postagens', {postagens: postagens, categorias: categorias})
                }).catch((err) => {
                    req.flash('error_msg', 'Houve um erro interno ao carregar a categoria')
                    res.redirect('/categorias')
                })
            }else{
                req.flash('error_msg', 'Esta categoria não existe')
                res.redirect('/categorias')
            }
        }).catch((err) => {
            req.flash('error_msg', 'Houve um erro interno ao carregar a pagina desta categoria')
        })
    })

    app.get('/404', (req, res) => {
        res.send('Erro 404!')
    })

    app.use('/admin', admin)
    app.use('/usuarios', usuarios)
// Outros
const PORT = 8081
app.listen(PORT, () => {
    console.log("Servidor rodando!")
})
