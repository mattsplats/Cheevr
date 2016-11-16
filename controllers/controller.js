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
router.get('/selectquiz', (req, res) => res.render('layouts/selectquiz'));
router.get('/createquiz', (req, res) => res.render('layouts/createquiz'));
router.get('/gettingstarted', (req, res) => res.render('layouts/gettingstarted'));


// Alexa API
// Respond to quiz requests
router.get('/alexa/:quizName', (req, res) => {

  models.sequelize.query(`SELECT id, name, type FROM Quizzes WHERE name SOUNDS LIKE ?`,
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

// Update database with results
router.post('/alexa', (req, res) => {

  // Send live updates to webpage
  sse.send(req.body);

  // Update UserQuiz table
  models.User.findOne(
    {
      where: {username: 'dummyUser'}
    }
  ).then(user =>
    models.Quiz.findOne(
      {
        where: {name: req.body.name}
      }
    ).then(quiz =>
      quiz.addUser(user).then(() => {
        models.UserQuiz.findOne(
          {
            where: {QuizId: quiz.id}
          }
        ).then(uq => {
          if (uq.timesAttempted === null) uq.timesAttempted = 0;
          if (uq.timesSucceeded === null) uq.timesSucceeded = 0;

          uq.timesAttempted += req.body.results.length;
          uq.timesSucceeded += req.body.results.reduce((a,b) => b ? a + 1 : a, 0);
          uq.accuracy = 100 * uq.timesSucceeded / uq.timesAttempted;

          models.UserQuiz.update({
            timesAttempted: uq.timesAttempted,
            timesSucceeded: uq.timesSucceeded,
            accuracy: uq.accuracy
          }, {
            where: {QuizId: quiz.id}
          })
        })
      })
    )
  );

  // Update UserQuestion table
  models.User.findOne(
    {
      where: {username: 'dummyUser'}
    }
  ).then(user => {
    user.addQuestions(req.body.ids)
    .then(() => {
      for (let i = 0; i < req.body.ids.length; i++) {
        models.UserQuestion.findOne(
          {
            where: {QuestionId: req.body.ids[i]}
          }
        ).then(uq => {
          if (uq.timesAttempted === null) uq.timesAttempted = 0;
          if (uq.timesSucceeded === null) uq.timesSucceeded = 0;

          uq.timesAttempted++;
          if (req.body.results[i] === true) uq.timesSucceeded++;
          uq.accuracy = 100 * uq.timesSucceeded / uq.timesAttempted;

          models.UserQuestion.update({
            timesAttempted: uq.timesAttempted,
            timesSucceeded: uq.timesSucceeded,
            accuracy: uq.accuracy
          }, {
            where: {QuestionId: req.body.ids[i]}
          })
        })
      }
    })
  });

  // Respond to XHR request
  res.json({OK: true});
});


module.exports = router;
