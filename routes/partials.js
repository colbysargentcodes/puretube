var express = require('express');
var router = express.Router();
console.log('/routes/partials.js');

router.get('/:part', function(req, res, next) {
  var part = req.params.part;
  console.log('PART VARIABLE: ' + part);
  res.render('partials/' + part);
});
/*router.get('/partials/:part', function(req, res, next) {
  var part = req.params.part;
  console.log(part);
  res.render('partials/' + part);
});*/

module.exports = router;
