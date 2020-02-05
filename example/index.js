const express = require('express')
const { Router } = require('express');
const app = express();
const controller = require('./controller');

const indexRouter = new Router();


indexRouter.get('/', (req, res)=>{
  controller.run(req, res); 
});


app.use(indexRouter);
app.listen(8080, ()=>{console.log('running')});