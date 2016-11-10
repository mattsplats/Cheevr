'use strict';

const express = require('express'),
      router  = express.Router(),
      models  = require('../models');

// Display page
router.get('/', (req, res) =>
  res.render('index')
);

module.exports = router;
