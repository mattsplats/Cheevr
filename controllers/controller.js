'use strict';

const express = require('express'),
      router  = express.Router(),
      models  = require('../models');

// Display page
router.get('/', (req, res) => res.render('index'));


// Alexa API
router.get('/alexa/:quizName', (req, res) => {
  // Modify question output depending on quiz type
  const preprocessQuiz = {
    'trueFalse': function (quiz) {
      for (const obj of quiz) obj.q = 'True or false: ' + obj.q;
      return quiz;
    }
  }
  let quiz = [{q: 'Nope', a: true}],
      type = 'trueFalse';

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

  res.json({quiz: preprocessQuiz[type](quiz), name: req.params.quizName, type: type});
});

router.post('/alexa', (req, res) => {
  console.log(req.body);
  res.json({OK: true});
});

module.exports = router;
