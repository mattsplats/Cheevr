'use strict';

// Modules
const express = require('express'),
      expsse  = require('express-sse'),

      // Local dependencies
      models  = require('../models'),

      // Const vars
      sse     = new expsse(['keepAlive']),
      router  = express.Router();

// Input verification for POST/UPDATE routes
function verifyName (req, res, success) {
  if (/[^a-z0-9.,:!?' ]/gi.test(req.body.name)) {
    res.json({status: 1});  // Status 1: string contains invalid characters

  // If all tests pass
  } else {
    success();
  }
}



// Server-sent events API
router.get('/stream', sse.init);
function keepAlive () { sse.send('keepAlive') }
setInterval(keepAlive, 50000);



// Web API
// View GET routes
router.get('/', (req, res) => res.render('index'));

// GET quiz data (accepts quiz id or quiz name)
router.get('/api/quiz/:quiz', (req, res) => {
  const input          = +req.params.quiz ? +req.params.quiz : req.params.quiz,    // Coerce to number if input string would not become NaN
        whereCondition = typeof input === 'number' ? {id: input} : {name: input};  // Create object based on input type

  models.Quiz.findOne(
    {
      where: whereCondition
    }
  ).then(quiz => 
    models.User.findOne(
      {
        where: {id: quiz.OwnerId}
      }
    ).then(user => {
      quiz.dataValues.username = user.username;
      
      quiz.getQuestions().then(questions => {
        quiz.dataValues.questions = questions;
        
        res.json(quiz);
      })
    })
  )
});
// GET user data (accepts user id or username)
router.get('/api/user/:user', (req, res) => {
  const input          = +req.params.user ? +req.params.user : req.params.user,        // Coerce to number if input string would not become NaN
        whereCondition = typeof input === 'number' ? {id: input} : {username: input};  // Create object based on input type

  models.User.findOne(
    {
      where: whereCondition
    }
  ).then(user => 
    user.getQuizzes(
      {
        where: {OwnerId: user.id}
      }
    ).then(quizzes => {
      user.dataValues.quizzes = quizzes;

      res.json(user);
    })
  )
});

// Add new quiz
router.post('/', (req, res) => {
  
  // Check input, if it passes run 2nd param
  verifyName(req, res, () => {

    // Add new quiz to current user
    models.User.findOne(
      {
        where: {username: 'dummyUser'}
      }
    ).then(user => 
      models.Quiz.create({
        name: req.body.name,
        type: req.body.type,
        OwnerId: user.id
      })
    ).then(quiz => {
      for (var i = 0; i < req.body.quiz.length; i++) {
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
  })
});

// Modify quiz
router.put('/', (req, res) => {

  // Check input, if it passes run callback
  verifyName(req, res, () => {

    // Update quiz for current user
    models.User.findOne(
      {
        where: {username: 'dummyUser'}
      }
    ).then(user => 
      models.Quiz.findOne(
        {
          where: {id: req.body.id}
        }
      ).then(quiz => {
        
        // Update Quiz table
        quiz.update({
          name: req.body.name,
          type: req.body.type,
        }).then(() => 
          models.Question.destroy(
            {
              where: {QuizId: quiz.id}
            }
          )
        ).then(() => {
          for (var i = 0; i < req.body.quiz.length; i++) {
            models.Question.create({
              q: req.body.quiz[i].q,
              a: req.body.quiz[i].a,
              choiceA: req.body.quiz[i].choiceA,
              choiceB: req.body.quiz[i].choiceB,
              choiceC: req.body.quiz[i].choiceC,
              choiceD: req.body.quiz[i].choiceD
            }).then(question => quiz.addQuestion(question))
          }
        })
      })
    ).then(() => 
      res.json({status: 0})  // Status 0: OK
    )
  })
});

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
  ).then(quiz => {
    if (quiz.length > 0) {
      models.Question.findAll(
        {
          attributes: ['id', 'q', 'a', 'choiceA', 'choiceB', 'choiceC', 'choiceD'],
          where: {QuizID: quiz[0].dataValues.id}
        }
      ).then(questions => {
        res.json(
          {
            questions: questions,
            name: quiz[0].dataValues.name,
            type: quiz[0].dataValues.type
          }
        );
      });

    } else {
      res.json(
        {
          name: false
        }
      );
    }
  });
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
