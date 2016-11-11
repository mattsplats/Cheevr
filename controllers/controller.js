'use strict';

const express = require('express'),
      router  = express.Router(),
      models  = require('../models');

// Display page
router.get('/', (req, res) => res.render('index'));


// Alexa API
router.get('/alexa/:quizName', (req, res) => {
  let quiz = [{q: 'Nope', a: 'poop'}];

  if (req.params.quizName === 'capital' || req.params.quizName === 'capitals') {
    quiz = [
      {
        q: 'Texas',
        a: 'Austin'
      },
      {
        q: 'Illinois',
        a: 'Springfield'
      }
    ];
  }

  res.json({quiz: quiz});
});

router.put('/alexa', (req, res) => res.json({OK: true}));

module.exports = router;
