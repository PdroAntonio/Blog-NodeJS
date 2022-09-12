const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require('../models/Usuario')
const Usuario = mongoose.model('usuarios')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const eAdmin = require('../helpers/eAdmin')

router.get('/registro', (req, res) => {
    res.render('usuarios/registro')
})

router.post('/registro', (req, res) => {
    var er = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        er.push({texto: 'Nome inválido'})
    }

    if(!req.body.email || typeof req.body.email == undefined || req.body.email == null){
        er.push({texto: 'Email inválido'})
    }

    if(!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null){
        er.push({texto: 'Senha inválido'})
    }

    if(req.body.senha.length < 4){
        er.push({texto: 'A senha deve conter 4 ou mais caracteres'})
    }

    if(req.body.senha != req.body.senha2){
        er.push({texto: 'As senhas são diferentes, tente novamente!'})
    }

    if(er.length > 0){
        res.render('usuarios/registro', {erros: er})
    }else{
        Usuario.findOne({email: req.body.email}).lean().then((usuarios) => {
            if(usuarios){
                req.flash('error_msg', 'Email indisponível')
                res.redirect('/usuarios/registro')
            }else{
                var salt = bcrypt.genSaltSync(10);
                var hash = bcrypt.hashSync(req.body.senha, salt);

                const novoUsuario = {
                    nome : req.body.nome,
                    email : req.body.email,
                    senha : hash
                }


                new Usuario(novoUsuario).save().then(() => {
                    req.flash('success_msg', 'Usuario cadastrado com sucesso!')
                    res.redirect('/')
                }).catch((err) => {
                    req.flash('error_msg', 'Erro ao cadastrar o usuario')
                    res.redirect("/usuarios/registro")
                })
            }
        }).catch((err) => {
            req.flash('error_msg', 'Houve um erro interno')
            res.redirect('/')
        })
    } 
})

router.get('/login', (req, res) => {
    res.render('usuarios/login')
})

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/usuarios/login',
        failureFlash: true
    })(req, res, next)
})

router.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err) }
        req.flash('success_msg', 'Deslogado com sucesso!')
        res.redirect('/')
      })
})

module.exports = router