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
setInterval(keepAlive, 50000);



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

  models.Quiz.findOne({where: {name: req.params.quizName}}).then(quiz =>
    models.Question.findAll({where: {QuizID: quiz.id}}).then(questions =>
      res.json({quiz: preprocessQuiz[quiz.type](questions), name: quiz.name, type: quiz.type})
    )
  );
});

router.post('/alexa', (req, res) => {
  sse.send(req.body);
  res.json({OK: true});
});



module.exports = router;
