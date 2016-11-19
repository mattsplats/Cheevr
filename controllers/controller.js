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

Array.prototype.indexOfProp = function (value, prop1, prop2) {
  for (var i = 0; i < this.length; i++) {
    if (prop2) if (this[i] && this[i][prop1][prop2] === value) return i;
    else if (this[i] && this[i][prop1] === value) return i;
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
    return { where: { id: 1 }};
  }
}

// True if user is logged in (or local env), false otherwise
function isLoggedIn (req, res) {
  if (process.env.AMAZON_CLIENT_ID) return !!req.session.passport;
  return true;
}

// Render page with user's first name
function renderWithUsername (uri, req, res) {
  if (isLoggedIn(req, res)) {
    models.User.findOne(authUser(req, res))
    .then(user => res.render(uri, { isLoggedIn: true, username: user.displayName.split(" ")[0] }))

  } else res.render('index', { isLoggedIn: false });
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
// Non-auth web routes
router.get('/', (req, res) => renderWithUsername('index', req, res));
router.get('/gettingstarted', (req, res) => renderWithUsername('layouts/gettingstarted', req, res));
router.get('/search', (req, res) => renderWithUsername('layouts/search', req, res));

// Auth required web routes
router.get('/user_results', (req, res) =>  {
  const whereCondition = authUser(req, res);

  if (whereCondition) {
    models.User.findOne(whereCondition).then(user => {
      if (user) {
        user.getQuizzes({ order: 'UserQuiz.updatedAt DESC' }).then(quizzes =>
          res.render('layouts/user_results', {
            isLoggedIn: isLoggedIn(req, res),
            username: user.displayName.split(" ")[0],
            quizzes: quizzes
          })
        )

      } else {
        res.json({ error: 'No user by that ID' });
      }
    })
  }
});
router.get('/user_quizzes', (req, res) => {
  const whereCondition = authUser(req, res);

  if (whereCondition) {
    models.User.findOne(whereCondition).then(user => {
      if (user) {
        models.Quiz.findAll({
          where: { OwnerId: user.id },
          include: models.Question
        }).then(quizzes => {
          quizzes.map(quiz => quiz.dataValues.Questions.map(question => question.a = question.a.toUpperCase()));
          res.render('layouts/user_quizzes', {
            isLoggedIn: isLoggedIn(req, res),
            username: user.displayName.split(" ")[0],
            user: user,
            quizzes: quizzes
          });
        })

      } else {
        res.json({ error: 'No user by that ID' });
      }
    })
  }
});
router.get('/user_create', (req, res) => renderWithUsername('layouts/user_create', req, res));
router.get('/user_edit.:id', (req, res) => {
  const whereCondition = authUser(req, res);

  if (whereCondition) {
    models.User.findOne(whereCondition).then(user => {
      if (user) {
        models.Quiz.findOne({
          where: {
            id: req.params.id
          },
          include: models.Question
        }).then(quiz => {
          if (quiz) {
            console.log(quiz);
            res.render('layouts/user_edit', {
              isLoggedIn: isLoggedIn(req, res),
              username: user.displayName.split(" ")[0],
              quiz: quiz,
              isMC: !(quiz.type === 'trueFalse')
            });

          } else {
            res.json({ error: 'Quiz not owned by current user' });
          }
        })

      } else {
        res.json({ error: 'No user by that ID' });
      }
    })
  }
});

// GET quiz data
router.get('/api/quiz/:id', (req, res) => {
  models.Quiz.findOne({ where: { id: req.params.id }}).then(quiz =>
    quiz.getQuestions().then(questions => {
      quiz.dataValues.questions = questions;
      res.json(quiz);
    })
  );
});

// GET all quizzes
router.get('/api/quizzes', (req, res) => 
  models.Quiz.findAll().then(quizzes => 
    res.json(quizzes)
  )
);

// GET quiz search (returns exact name first, then near matches, then quizzes with search term in desc)
router.get('/api/search/:quizName', (req, res) => 
  models.Quiz.findOne({
    where: { name: req.params.quizName },
    include: [models.Question]
  }).then(quizByName =>
    models.Quiz.findAll({
      where: { name: { $like: `${req.params.quizName}%` }},
      include: [models.Question]
    }).then(quizzesByName => 
      models.Quiz.findAll({
        where: { desc: { $like: `%${req.params.quizName}%` }},
        include: [models.Question]
      }).then(quizzesByDesc => {
        let quizzes = quizByName ? [quizByName] : [];  // Final list

        for (let i = 0; i < quizzesByName.length; i++) {
          if (quizzes.indexOfProp(quizzesByName[i].dataValues.id, 'dataValues', 'id') === -1) quizzes.push(quizzesByName[i]);
        }
        for (let i = 0; i < quizzesByDesc.length; i++) {
          if (quizzes.indexOfProp(quizzesByDesc[i].dataValues.id, 'dataValues', 'id') === -1) quizzes.push(quizzesByDesc[i]);
        }
        res.json(quizzes);
      })
    )
  )
);

// GET user data by UserQuiz order
router.get('/api/userStats', (req, res) => {
  const whereCondition = authUser(req, res);

  if (whereCondition) {
    models.User.findOne(whereCondition).then(user => {
      if (user) {
        user.getQuizzes({ order: 'UserQuiz.updatedAt DESC' }).then(quizzes => {   // Get in order of last quiz taken 
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
            desc: req.body.desc,
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
router.get('/alexa/:string', (req, res) => {
  const string      = req.params.string.split('.'),
        quizName    = string[0],
        accessToken = !string[1] || string[1] == 'false' || typeof +string[1] === 'number' ? false : string[1];

  console.log();
  console.log('==========================');
  console.log('Alexa GET request');
  console.log('quizName:', quizName);
  console.log('accessToken:', accessToken);
  console.log('==========================');
  console.log();

  models.sequelize.query(`SELECT id, name, type, numberToAsk FROM Quizzes WHERE name SOUNDS LIKE ?`,
    {
      replacements: [quizName],
      model: models.Quiz
    }
  ).then(quiz => {

    // If a quiz was found
    if (quiz && quiz.length > 0) {
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
        } else if (accessToken || true) {
          const options = {
            uri: `https://api.amazon.com/user/profile?access_token=${accessToken}`,
            json: true
          };

          // Get ids of all questions in quiz
          let ids = [];
          for (let i = 0; i < questions.length; i++) {
            ids.push(questions[i].id);
          }

          // Query Amazon API for user profile
          rp(options).then(profile => {

            console.log(profile);

            // Get the user database model
            models.User.findOne({ where: { AmazonId: profile.user_id }}).then(user => {
              
              // If there is a user in the database
              if (user) {
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

                    // If user has never tried question (is not in UserQuestion) AND question has not been selected already (is not in qArr)
                    if (uq.indexOfProp(ids[i], 'dataValues', 'QuestionId') === -1 && qArr.indexOfProp(ids[i], 'dataValues', 'id') === -1) qArr.push(questions[i]);

                    i++;
                  }

                  // If we need more questions to meet numToAsk
                  // Iterate through uq and push questions user did poorly on to qArr
                  while (qArr.length < numToAsk) {

                    // Quadratic random number distribution (skews towards UserQuestions with low accuracy)
                    const index = Math.floor(Math.pow(Math.random(), 2) * uq.length);

                    // If qArr does not have a question with chosen index's id, push question from questions where id === uq[index].id
                    if (qArr.indexOfProp(uq[index].dataValues.QuestionId, 'dataValues', 'id') === -1) qArr.push(questions[questions.indexOfProp(uq[index].dataValues.QuestionId, 'dataValues', 'id')]);
                  }

                  res.json({
                    questions: shuffle(qArr),
                    name: quiz[0].dataValues.name,
                    type: quiz[0].dataValues.type
                  });
                });
              
              // If there is no user in the database yet
              } else {
                res.json({
                  questions: questions.slice(0, numToAsk - 1),
                  name: quiz[0].dataValues.name,
                  type: quiz[0].dataValues.type
                });
              }
            })
          }).catch(err => {  // If Amazon API gives bad response
            console.log();
            console.log('==========================');
            console.log('ERROR: Response code', err.message);
            console.log('==========================');
            console.log();

            res.json({
              questions: questions.slice(0, numToAsk - 1),
              name: quiz[0].dataValues.name,
              type: quiz[0].dataValues.type
            })
          })

        // If no access token was sent
        } else {
          console.log();
          console.log('==========================');
          console.log('No access token');
          console.log('==========================');
          console.log();

          res.json({
            questions: questions.slice(0, numToAsk - 1),
            name: quiz[0].dataValues.name,
            type: quiz[0].dataValues.type
          });
        }
      });

    // If no quiz was found
    } else {
      console.log();
      console.log('==========================');
      console.log('Not found:', quizName);
      console.log('==========================');
      console.log();

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
      models.User.findOrCreate({ where: { AmazonId: profile.user_id }}).spread((user, wasCreated) => {

        // Update Quiz table
        models.Quiz.findOne({ where: { name: req.body.name }}).then(quiz => {

          quiz.timesAttempted += req.body.results.length;
          quiz.timesSucceeded += req.body.results.reduce((a,b) => b ? a + 1 : a, 0);
          quiz.accuracy = 100 * quiz.timesSucceeded / quiz.timesAttempted;

          models.Quiz.update(
            {
              timesAttempted: quiz.timesAttempted,
              timesSucceeded: quiz.timesSucceeded,
              accuracy: quiz.accuracy,
              totalAttempts: quiz.totalAttempts + 1
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
