var express = require('express');
var router = express.Router();
const db = require('../floppabase.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  const floppas = db.pullFloppa();
  res.render('index', { title: 'Flopparchive', flops: (floppas.entries != null ? floppas.entries.reverse() : null) });
});

module.exports = router;
