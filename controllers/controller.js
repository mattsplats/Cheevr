'use strict';

// Modules
const express = require('express'),
      expsse  = require('express-sse'),
      rp      = require('request-promise'),

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

// User ID verification for GET(user)/POST/PUT/DELETE routes
function authUser (req, res) {
  // Set where condition based on environment
  if (process.env.AMAZON_CLIENT_ID) {
    if (req.session.passport) {
      return { where: { AmazonId: req.session.passport.user }};

    // If user is not logged in, deny request
    } else {
      res.json({ error: 'Authentication failed / not logged in' });
    }

  } else {
    return { where: { displayName: 'Dummy User' }};
  }
}

// Input verification for POST/PUT/DELETE routes
function verifyQuizName (req, res, success) {
  if (/[^a-z0-9.,:!?' ]/gi.test(req.body.name)) {
    res.json({ status: 1});  // Status 1: string contains invalid characters

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
router.get('/selectquiz', (req, res) => res.render('layouts/selectquiz'));
router.get('/createquiz', (req, res) => res.render('layouts/createquiz'));
router.get('/gettingstarted', (req, res) => res.render('layouts/gettingstarted'));

// GET quiz data (accepts quiz id or quiz name)
router.get('/api/quiz/:quizName', (req, res) => {
  const input          = +req.params.quizName ? +req.params.quizName : req.params.quizName,  // Coerce to number if input string would not become NaN
        whereCondition = typeof input === 'number' ? { id: input } : { name: input };        // Create object based on input type

  models.Quiz.findOne(whereCondition).then(quiz =>
    quiz.getQuestions().then(questions => {
      quiz.dataValues.questions = questions;
      res.json(quiz);
    })
  );
});

// GET quiz search
router.get('/api/search/:quizName', (req, res) => 
  models.Quiz.findAll({ where: { name: { $like: `%${req.params.quizName}%` }}}).then(quizzes =>
    res.json(quizzes)
  )
);

// GET user data
router.get('/api/user', (req, res) => {
  const whereCondition = authUser(req, res);

  if (whereCondition) {
    models.User.findOne(whereCondition).then(user => {
      if (user) {
        user.getQuizzes(
          {
            order: 'UserQuiz.updatedAt DESC'  // Get in order of last quiz taken
          }
        ).then(quizzes => {
          user.dataValues.quizzes = quizzes;
          res.json(user);
        })

      } else {
        res.json({ error: 'No user by that ID' });
      }
    })
  }
});

// Add new quiz
router.post('/api', (req, res) => {
  const whereCondition = authUser(req, res);

  if (whereCondition) {

    // Check input, if it passes run 2nd param
    verifyQuizName(req, res,  () => {

      // Add new quiz to current user
      models.User.findOne(whereCondition).then(user => {
        if (user) {
          models.Quiz.create({
            name: req.body.name,
            type: req.body.type,
            OwnerId: user.id,
            OwnerDisplayName: user.displayName,
            numberToAsk: req.body.numberToAsk
          }).then(quiz => {
            for (var i = 0; i < req.body.questions.length; i++) {
              models.Question.create({
                q: req.body.questions[i].q,
                a: req.body.questions[i].a,
                choiceA: req.body.questions[i].choiceA,
                choiceB: req.body.questions[i].choiceB,
                choiceC: req.body.questions[i].choiceC,
                choiceD: req.body.questions[i].choiceD
              }).then(question => quiz.addQuestion(question))
            }
          }).then(() =>
            res.json({ status: 0 })  // Status 0: OK
          );

        } else {
          res.json({ error: 'No user by that ID' });
        }
      })
    })
  }
});

// Modify quiz
router.put('/api', (req, res) => {
  const whereCondition = authUser(req, res);

  if (whereCondition) {

    // Check input, if it passes run callback
    verifyQuizName(req, res, () => {

      // Update quiz for current user
      models.User.findOne(whereCondition).then(user => {
        if (user) {
          models.Quiz.findOne({
            where: {
              id: req.body.id,
              OwnerId: user.id
            }
          }).then(quiz => {

            // Update Quiz table
            quiz.update({
              name: req.body.name,
              type: req.body.type,
              numberToAsk: req.body.numberToAsk,
              OwnerDisplayName: user.displayName
            }).then(() =>
              models.Question.destroy({
                where: { QuizId: quiz.id }
              })
            ).then(() => {
              for (var i = 0; i < req.body.questions.length; i++) {
                models.Question.create({
                  q: req.body.questions[i].q,
                  a: req.body.questions[i].a,
                  choiceA: req.body.questions[i].choiceA,
                  choiceB: req.body.questions[i].choiceB,
                  choiceC: req.body.questions[i].choiceC,
                  choiceD: req.body.questions[i].choiceD
                }).then(question => quiz.addQuestion(question))
              }
            })
          }).then(() =>
            res.json({ status: 0})  // Status 0: OK
          )

        } else {
          res.json({ error: 'No user by that ID' });
        }
      })
    })
  }
});

// Delete quiz
router.delete('/api', (req, res) => {
  const whereCondition = authUser(req, res);

  if (whereCondition) {
    models.User.findOne(whereCondition).then(user => {
      if (user) {
        models.Quiz.findOne({
          where: {
            name: req.body.name,
            OwnerId: user.id
          }
        }).then(quiz =>
          models.Question.destroy({ where: { QuizId: quiz.id }})
        ).then(() =>
          models.Quiz.destroy({ where: { name: req.body.name }})
        ).then(() =>
          res.json({ status: 0 })  // Status 0: OK
        );

      } else {
        res.json({ error: 'No user by that ID' });
      }
    });
  }
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

    // If a quiz was found
    if (quiz.length > 0) {
      models.Question.findAll(
        {
          attributes: ['id', 'q', 'a', 'choiceA', 'choiceB', 'choiceC', 'choiceD'],
          where: { QuizID: quiz[0].dataValues.id }
        }
      ).then(questions => {
        const numToAsk = quiz[0].dataValues.numberToAsk;
        questions = shuffle(questions);

        // If creator elected to have users take the entire quiz, send a shuffled array of all questions to Alexa
        if (numToAsk === 0 || numToAsk >= questions.length) {
          res.json({
            questions: questions,
            name: quiz[0].dataValues.name,
            type: quiz[0].dataValues.type
          });

        // If we are selecting a subset of questions for users
        } else {

          // Get ids of all questions in quiz
          let ids = [];
          for (let i = 0; i < questions.length; i++) {
            ids.push(questions[i].id);
          }

          // Get questions user has already taken
          models.User.findOne({ where: { displayName: 'Dummy User' }}).then(user => {
            models.UserQuestion.findAll({
              where: {
                QuestionId: { $in: ids },
                UserId: user.id
              },
              order: ['accuracy']
            }).then(uq => {
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

              res.json({
                questions: shuffle(qArr),
                name: quiz[0].dataValues.name,
                type: quiz[0].dataValues.type
              });
            })
          })
        }
      });

    // If no quiz was found
    } else {
      res.json({ name: false });
    }
  });
});

// Update database with results
router.post('/alexa', (req, res) => {
  if (req.body.accessToken) {

    const options = {
      uri: 'https://api.amazon.com/user/profile?access_token=' + req.body.accessToken,
      json: true
    };

    rp(options).then(profile => {
      console.log(profile);

      models.User.findOrCreate({
        where: {
          AmazonId: profile.user_id,
          displayName: profile.name
        }
      }).spread((user, wasCreated) => {

        // Update Quiz table
        models.Quiz.findOne({ where: { name: req.body.name }}).then(quiz => {

          quiz.timesAttempted += req.body.results.length;
          quiz.timesSucceeded += req.body.results.reduce((a,b) => b ? a + 1 : a, 0);
          quiz.accuracy = 100 * quiz.timesSucceeded / quiz.timesAttempted;

          models.Quiz.update(
            {
              timesAttempted: quiz.timesAttempted,
              timesSucceeded: quiz.timesSucceeded,
              accuracy: quiz.accuracy
            },
            { where: { id: quiz.id }
          });

          // Update UserQuiz table
          quiz.addUser(user).then(() => {
            models.UserQuiz.findOne({ where: { QuizId: quiz.id }}).then(uq => {
              uq.timesAttempted += req.body.results.length;
              uq.timesSucceeded += req.body.results.reduce((a,b) => b ? a + 1 : a, 0);
              uq.accuracy = 100 * uq.timesSucceeded / uq.timesAttempted;

              models.UserQuiz.update(
                {
                  timesAttempted: uq.timesAttempted,
                  timesSucceeded: uq.timesSucceeded,
                  accuracy: uq.accuracy
                },
                { where: {
                  UserId: user.id,
                  QuizId: quiz.id
                }
              });
            })
          })
        });

        // Update UserQuestion table
        user.addQuestions(req.body.ids).then(() => {
          for (let i = 0; i < req.body.ids.length; i++) {
            models.UserQuestion.findOne({ where: { QuestionId: req.body.ids[i] }}).then(uq => {
              uq.timesAttempted++;
              if (req.body.results[i] === true) uq.timesSucceeded++;
              uq.accuracy = 100 * uq.timesSucceeded / uq.timesAttempted;

              models.UserQuestion.update(
                {
                  timesAttempted: uq.timesAttempted,
                  timesSucceeded: uq.timesSucceeded,
                  accuracy: uq.accuracy
                },
                { where: { QuestionId: req.body.ids[i] }
              });
            })
          }
        })
      });

      // Send live updates to webpage
      sse.send(req.body);

      // Respond to XHR request
      res.json({ status: 0 });
    });

  } else {
    res.json({ error: 'Authentication failed / not logged in' });
  }
});



module.exports = router;
