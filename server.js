'use strict';

// Modules
const express    = require('express'),
      exphbs     = require('express-handlebars'),
      bodyParser = require('body-parser'),

      // Local dependencies
      routes     = require('./controllers/controller.js'),
      models     = require('./models'),

      // Const vars
      app        = express(),
      hbs        = exphbs.create({ defaultLayout: 'main', extname: '.hbs' }),
      PORT       = process.env.PORT || 3000;

// Handlebars init
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
if (!process.env.PORT) app.enable('view cache');  // Disable view cache for local testing

// Body parser init
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());

// Sequelize init
// Drop all tables
models.sequelize.query('SET FOREIGN_KEY_CHECKS = 0').then(() => 
  models.sequelize.sync({force:true}))

// Create dummy user
  .then(() => models.User.create({
    username: 'dummyUser',
    Quizzes: [
      {
        name: 'capitals',
        type: 'trueFalse',
        OwnerId: 1
      },
      {
        name: 'vocab',
        type: 'multipleChoice',
        OwnerId: 1
      }
    ]
  },
  {
    include: [models.Quiz]
  })
)

// Create true/false quiz
.then(() => 
  models.Quiz.findOne(
    {
      where: {name: 'capitals'}
    }
  ).then(quiz => {
    models.Question.create({
      q: 'Austin is the capital of Texas',
      a: 'true'
    }).then(question => 
      quiz.addQuestion(question)
    )

    models.Question.create({
      q: 'Chicago is the capital of Illinois',
      a: 'false'
    }).then(question =>
      quiz.addQuestion(question)
    )
  })
)

// Create multiple choice quiz
.then(() => 
  models.Quiz.findOne(
    {
      where: {name: 'vocab'}
    }
  ).then(quiz => {
    models.Question.create({
      q: 'What is the best synonym for the word, accurate?',
      a: 'd',
      choiceA: 'recent',
      choiceB: 'better',
      choiceC: 'pleased',
      choiceD: 'correct'
    }).then(question => 
      quiz.addQuestion(question)
    );

    models.Question.create({
      q: 'What is the best synonym for the word, ban?',
      a: 'b',
      choiceA: 'lose',
      choiceB: 'prohibit',
      choiceC: 'sigh',
      choiceD: 'reflect'
    }).then(question =>
      quiz.addQuestion(question)
    );

    models.Question.create({
      q: 'What is the best synonym for the word, definitely?',
      a: 'c',
      choiceA: 'quickly',
      choiceB: 'easily',
      choiceC: 'certainly',
      choiceD: 'only'
    }).then(question =>
      quiz.addQuestion(question)
    );
  })
)

// Re-enable foreign key checks 
.then(() => models.sequelize.query('SET FOREIGN_KEY_CHECKS = 1'));



// Route for static content
app.use(express.static(process.cwd() + '/public'));

// Controller routes
app.use('/', routes);

// Init server
app.listen(PORT, function () {
  console.log(`App listening on port ${PORT}`);
});
