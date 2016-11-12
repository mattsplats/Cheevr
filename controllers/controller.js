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
        q: 'Austin is the capital of Texas',
        a: true
      },
      {
        q: 'Chicago is the capital of Illinois',
        a: false
      }
    ];
  }

  res.json({quiz: quiz, name: req.params.quizName, type: 'trueFalse'});
});

router.put('/alexa', (req, res) => {
  console.log(req.body);
  res.json({OK: true});
});

module.exports = router;
