'use strict';

// Modules
const express = require('express'),
      expsse  = require('express-sse'),

      // Local dependencies
      models  = require('../models'),

      // Const vars
      sse     = new expsse(['keepAlive']),
      router  = express.Router();

Array.prototype.indexOfProp = function (prop, value) {
  for (var i = 0; i < this.length; i++) {
    if (this[i][prop] === value) return i;
  }

  return -1;
}

// Input verification for POST/UPDATE routes
function verifyName (req, res, success) {
  if (/[^a-z0-9.,:!?' ]/gi.test(req.body.name)) {
    res.json({status: 1});  // Status 1: string contains invalid characters

  // If all tests pass
  } else {
    success();
  }
}

// Fisher-Yates shuffle
function shuffle (arr) {
  let j, temp;

  for (let i = 0; i < arr.length - 1; i++) {
    j = Math.floor(Math.random() * (arr.length - i)) + i;
    temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }

  return arr;
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

  models.Quiz.findOne(whereCondition).then(quiz => 
    models.User.findOne({ id: quiz.OwnerId }).then(user => {
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

  models.User.findOne(whereCondition).then(user => 
    user.getQuizzes(
      {
        order: 'UserQuiz.updatedAt DESC'  // Get in order of last quiz taken
      }
    ).then(quizzes => {
      user.dataValues.quizzes = quizzes.sort();
      res.json(user);
    })
  )
});

// Add new quiz
router.post('/api', (req, res) => {
  
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
        OwnerId: user.id,
        numberToAsk: req.body.numberToAsk
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
router.put('/api', (req, res) => {

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
          numberToAsk: req.body.numberToAsk
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
router.delete('/api', (req, res) => {
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

  models.sequelize.query(`SELECT id, name, type, numberToAsk FROM Quizzes WHERE name SOUNDS LIKE ?`,
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
        const numToAsk = quiz[0].dataValues.numberToAsk;
        questions = shuffle(questions);

        // If creator elected to have users take the entire quiz, send a shuffled array of all questions to Alexa
        if (numToAsk === 0 || numToAsk >= questions.length) {
          res.json(
            {
              questions: questions,
              name: quiz[0].dataValues.name,
              type: quiz[0].dataValues.type
            }
          );

        // If we are selecting a subset of questions for users
        } else {

          // Get ids of all questions in quiz
          let ids = [];
          for (let i = 0; i < questions.length; i++) {
            ids.push(questions[i].id);
          }
          
          // Get questions user has already taken
          models.User.findOne(
            {
              where: {username: 'dummyUser'}
            }
          ).then(user => {
            models.UserQuestion.findAll(
              {
                where: {QuestionId: {$in: ids}, UserId: user.id},
                order: ['accuracy']
              }
            ).then(uq => {
              let qArr = [],  // Questions to send
                  i    = 0;

              // Iterate through questions and push questions user has not taken to qArr
              while (i < questions.length && qArr.length < numToAsk) {
                
                // If questions have not been taken (are not in UserQuestion) AND have not been selected already (are not in qArr)
                if (uq.indexOfProp('id', ids[i]) === -1 && qArr.indexOfProp('id', ids[i]) === -1) qArr.push(questions[i]);

                i++;
              }

              // If we need more questions to meet numToAsk
              // Iterate through uq and push questions user did poorly on to qArr
              while (qArr.length < numToAsk) {
                
                // Quadratic random number distribution (skews towards UserQuestions with low accuracy)
                const rand  = Math.random(),
                      index = Math.floor(rand * rand) * uq.length;

                // If qArr does not have a question with chosen index's id, push question from questions where id === uq[index].id
                if (qArr.indexOfProp('id', uq[index].id) === -1) qArr.push(questions[questions.indexOfProp('id', uq[index].id)]);
              }

              res.json(
                {
                  questions: shuffle(qArr),
                  name: quiz[0].dataValues.name,
                  type: quiz[0].dataValues.type
                }
              );
            })
          })
        }
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
