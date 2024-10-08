require('dotenv').config();

var Database = require('better-sqlite3');
var db = new Database('./my.db');
var express = require('express');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var router = express.Router();
//router.use(bodyParser.urlencoded({extended: false}));
//router.use(bodyParser.json());

var app = express();
app.use(express.json());

var SECRET_KEY = process.env.SECRET_KEY || '';
var PORT = process.env.PORT || 3000;

var createUsersTable = () => {
    var sqlQuery = `
        CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name text,
        email text UNIQUE,
        password text)`;
     db.prepare(sqlQuery).run();
}

var findUserByEmail = (email, cb) => {
    var sqlQuery = `SELECT * FROM users WHERE email = ?`;
    var user = db.prepare(sqlQuery).get(email);
    cb(null, user);
}

var createUser = (user, cb) => {
var query = `INSERT INTO users (name, email, password) VALUES (?,?,?)`;
 try {
    db.prepare(query).run(user);
    cb(null);
 } catch (err) {
    cb(err);
 }
};

createUsersTable();

app.get('/test-db', (req, res) => {
    try {
        var result = db.prepare('SELECT 1').get();
        res.status(200).json({message: 'Database connection is OK', result});
    } catch (err) {
        res.status(500).json({ message: 'Database connection error', err});
    }
})

router.post('/register', (req, res) => {
    console.log('Regiter route');
    var name = req.body.name;
    var email = req.body.email;
    var password = bcrypt.hashSync(req.body.password);

    createUser([name, email, password], (e) => {
        if (e) return res.status(500).send('server error');
        findUserByEmail(email, (e, user) => {
            if (e) return res.status(500).send('server error');
            var expiresIn = 24 * 60 * 60;
            var access_token = jwt.sign({ id: user.id}, SECRET_KEY, {
                expiresIn: expiresIn
            });
            res.status(200).send({
                'user': user, 'access_token': access_token, 'expires_in': expiresIn
            });
            //res.status(200).send({access_token: ''});
        });
    });
});

router.post('/login', (req, res) => {
    var email = req.body.email;
    var password = req.body.password;
    findUserByEmail(email, (err, user) => {
if (err) return res.status(500).send('server error');
if (!user) return res.status(404).send('user not found');
var result = bcrypt.compareSync(password, user.password);
if (!result) return res.status(401).send('password not valid');
var expires_in = 24 * 60 * 60;

var access_token = jwt.sign({id: user.id}, SECRET_KEY, {
expiresIn: expires_in
    });
    res.status(200).send({access_token: ''});
    });
});

router.post('/logout', (req, res) => {
res.status(200).send('logged out successfully');
});

app.use(router);
//var port = process.env.PORT || 3000;
var server = app.listen(PORT, () => {
    console.log('server listening at http://localhost:' + PORT);
})