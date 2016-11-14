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

// Add new quiz
router.post('/', (req, res) => {

  // If name string contains invalid characters
  if (/[^a-z0-9.,:!?' ]/gi.test(req.body.name)) {
    res.json({status: 1})  // Status 1: string contains invalid characters

  // If all tests pass
  } else {

    // Add new quiz to current user
    models.User.findOne(
      {
        where: {username: 'dummyUser'}
      }
    ).then(user => 
      models.Quiz.create({
        name: req.body.name,
        type: req.body.type,
        OwnerId: user.id,
        timesAttempted: 0,
        timesSucceeded: 0
      })
    ).then(quiz => {
      for (var i = 0; i < req.body.quiz.length; i++) {
        if (req.body.type === 'trueFalse') req.body.quiz[i].q = 'True or false: ' + req.body.quiz[i].q;

        models.Question.create({
          q: req.body.quiz[i].q,
          a: req.body.quiz[i].a,
          choiceA: req.body.quiz[i].choiceA,
          choiceB: req.body.quiz[i].choiceB,
          choiceC: req.body.quiz[i].choiceC,
          choiceD: req.body.quiz[i].choiceD
        }).then(question => quiz.addQuestion(question))
      }
    }).then(() => 
      res.json({status: 0})  // Status 0: OK
    )
  }
});

// Modify quiz
// router.put('/', (req, res) => {
//   models.Task.update({ desc: req.body.desc }, { where: { id: req.body.id }}).then(result => res.json(result));
// });

// Delete quiz
router.delete('/', (req, res) => {
  models.Quiz.findOne(
    {
      where: {name: req.body.name}
    }
  ).then(quiz => 
     models.Question.destroy(
      {
        where: {QuizId: quiz.id}
      }
    )
  ).then(() =>
    models.Quiz.destroy(
      {
        where: {name: req.body.name}
      }
    )
  ).then(result =>
    res.json({result: result})
  );
});



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

  // Update database  
  models.User.findOne(
    {
      where: {username: 'dummyUser'}
    }
  ).then(user => {

    // Update Quiz tables
    models.Quiz.findOne(
      {
        where: {name: req.body.name}
      }
    ).then(quiz => {
      // Update Quiz table
      if (quiz.timesAttempted === null) quiz.timesAttempted = 0;
      if (quiz.timesSucceeded === null) quiz.timesSucceeded = 0;

      quiz.timesAttempted += req.body.results.length;
      quiz.timesSucceeded += req.body.results.reduce((a,b) => b ? a + 1 : a, 0);
      quiz.accuracy = 100 * quiz.timesSucceeded / quiz.timesAttempted;

      models.Quiz.update({
        timesAttempted: quiz.timesAttempted,
        timesSucceeded: quiz.timesSucceeded,
        accuracy: quiz.accuracy
      }, {
        where: {id: quiz.id}
      })

      // Update UserQuiz table
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
    });

    // Update UserQuestion table
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
