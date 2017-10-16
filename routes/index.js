var express = require('express');
var router = express.Router();
console.log('/routes/index.js');

router.get('*', function(req, res, next) {
  console.log('get all');
  res.render('index', {title: 'PureTube - Watch who you want to watch'/*, bodyClass: 'no-padding', navClass: 'with-hero' */});
});
router.get('/:page', function(req, res, next) {
  console.log('PAGE: ' + req.params.page);
  res.render('index', {title: 'PureTube - Watch who you want to watch'/*, bodyClass: 'no-padding', navClass: 'with-hero' */});
});
router.get('/:page/:two', function(req, res, next) {
  console.log('PAGE: ' + req.params.page);
  console.log('PAGETWO: ' + req.params.two);
  res.render('index', {title: 'PureTube - Watch who you want to watch'/*, bodyClass: 'no-padding', navClass: 'with-hero' */});
});
router.get('/:page/:two/:three', function(req, res, next) {
  console.log('PAGE: ' + req.params.page);
  console.log('PAGETWO: ' + req.params.two);
  console.log('PAGETHREE: ' + req.params.three);
  res.render('index', {title: 'PureTube - Watch who you want to watch'/*, bodyClass: 'no-padding', navClass: 'with-hero' */});
});

module.exports = router;
