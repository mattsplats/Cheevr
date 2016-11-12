'use strict';

// Modules
const express = require('express'),
      expsse  = require('express-sse'),

      // Local dependencies
      models  = require('../models'),

      // Const vars
      sse     = new expsse(['keepAlive']),
      router  = express.Router();

// Server-sent events API
router.get('/stream', sse.init);
function keepAlive () { sse.send('keepAlive') }
setTimeout(keepAlive, 30000);



// Web API
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
  sse.send(req.body);
  res.json({OK: true});
});



module.exports = router;
