var express = require('express');
var path = require('path');

var sequelize = require('./db');
sequelize.sync().then(() => console.log('db is ready'));
var app = express();