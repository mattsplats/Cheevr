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

  models.sequelize.query(`SELECT id, name, type FROM quizzes WHERE name SOUNDS LIKE ?`,
    {
      replacements: [req.params.quizName],
      model: models.Quiz
    }
  ).then(quiz =>
    models.Question.findAll(
      {
        attributes: ['id', 'q', 'a'],
        where: {QuizID: quiz[0].dataValues.id}
      }
    ).then(questions =>
      res.json(
        {
          quiz: questions,
          name: quiz[0].dataValues.name,
          type: quiz[0].dataValues.type
        }
      )
    )
  );
});

router.post('/alexa', (req, res) => {
  sse.send(req.body);

  models.User.findOne(
    {
      where: {username: 'dummyUser'}
    }
  ).then(user => {
    user.addQuestions(req.body.ids)
    .then(() => {
      for (let i = 0; i < req.body.ids.length; i++) {
        models.Result.findOne(
          {
            where: {QuestionId: req.body.ids[i]}
          }
        ).then(result => {
          if (result.timesAttempted === null) result.timesAttempted = 0;
          if (result.timesSucceeded === null) result.timesSucceeded = 0;

          result.timesAttempted++;
          if (req.body.results[i] === true) result.timesSucceeded++;
          result.accuracy = 100 * result.timesSucceeded / result.timesAttempted;

          models.Result.update({
            timesAttempted: result.timesAttempted,
            timesSucceeded: result.timesSucceeded,
            accuracy: result.accuracy
          }, {
            where: {QuestionId: req.body.ids[i]}
          })
        })
      }
    })
  });

  res.json({OK: true});
});


module.exports = router;
