'use strict';

module.exports = function (models) {
  models.sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
  .then(() => models.sequelize.sync({ force: true }))
  .then(() => 
    models.User.create({
      AmazonId: 'amzn1.account.AH3O2OSXXW7MALYVXATKJ4A3EKBA',
      displayName: 'Carlos Lopez',
    })

    // Create quizzes
    .then(user =>
      user.createQuiz({
        name: 'capitals',
        desc: 'How well do you know the U.S. state capitals?',
        type: 'trueFalse',
        numberToAsk: 5,
        OwnerId: user.id,
        OwnerDisplayName: user.displayName
      }).then(quiz =>
        quiz.createQuestion({
          q: 'Austin is the capital of Texas',
          a: 'true'
        }).then(() => quiz.createQuestion({
          q: 'Chicago is the capital of Illinois',
          a: 'false'
        })).then(() => quiz.createQuestion({
          "q": "New York City is the capital of New York",
          "a": "false"
        })).then(() => quiz.createQuestion({
          "q": "New Mexico City is the capital of New Mexico",
          "a": "false"
        })).then(() => quiz.createQuestion({
          "q": "Los Angeles is the capital of California",
          "a": "false"
        })).then(() => quiz.createQuestion({
          "q": "Portland is the capital of Oregon",
          "a": "false"
        })).then(() => quiz.createQuestion({
          "q": "Anchorage is the capital of Alaska",
          "a": "false"
        })).then(() => quiz.createQuestion({
          "q": "Denver is the capital of Colorado",
          "a": "true"
        })).then(() => quiz.createQuestion({       
          "q": "Hartford is the capital of Connecticut",
          "a": "true"
        })).then(() => quiz.createQuestion({
          "q": "Dover is the capital of Delaware",
          "a": "true"
        })).then(() => quiz.createQuestion({
          "q": "Tallahassee is the capital of Florida",
          "a": "true"
        })).then(() => quiz.createQuestion({
          "q": "Honolulu is the capital of Hawaii",
          "a": "true"
        })).then(() => quiz.createQuestion({
          "q": "Indianapolis is the capital of Indiana",
          "a": "true"
        })).then(() => quiz.createQuestion({
          "q": "Kansas City is the capital of Kansas",
          "a": "false"
        })).then(() => quiz.createQuestion({
          "q": "Frankfort is the capital of Kentucky",
          "a": "true"
        })).then(() => quiz.createQuestion({
          "q": "Little Rock is the capital of Arkansas",
          "a": "true"
        })).then(() => quiz.createQuestion({
          "q": "Las Vegas is the capital of Nevada",
          "a": "false"
        }))
      ).then(() =>
      user.createQuiz({
        name: 'slang',
        desc: 'Test your slang vocabulary!',
        type: 'multipleChoice',
        numberToAsk: 5,
        OwnerId: user.id,
        OwnerDisplayName: user.displayName
      }).then(quiz => 
        quiz.createQuestion({
          "q": "For the word: feels, what is the best synonym?",
          "a": "b",
          "choiceA": "rough",
          "choiceB": "intense emotions",
          "choiceC": "sense",
          "choiceD": "fleek"
        }).then(() => quiz.createQuestion({
          "q": "For the word: woke, what is the best synonym?",
          "a": "a",
          "choiceA": "pay attention",
          "choiceB": "wake",
          "choiceC": "sleep",
          "choiceD": "eat"
        })).then(() => quiz.createQuestion({
          "q": "For the word: squad, what is the best synonym?",
          "a": "d",
          "choiceA": "mouse",
          "choiceB": "ban",
          "choiceC": "balls",
          "choiceD": "homies"
        })).then(() => quiz.createQuestion({
          "q": "For the word: fleek, what is the best synonym?",
          "a": "b",
          "choiceA": "horrible",
          "choiceB": "awesome",
          "choiceC": "squad",
          "choiceD": "trump"
        })).then(() => quiz.createQuestion({
          "q": "For the word: BAE, what is the best synonym?",
          "a": "a",
          "choiceA": "babe",
          "choiceB": "enemy",
          "choiceC": "hater",
          "choiceD": "corn"
        })).then(() => quiz.createQuestion({
          "q": "For the word: THOT, what is the best synonym?",
          "a": "c",
          "choiceA": "Bae",
          "choiceB": "nice girl",
          "choiceC": "That Hoe Over There",
          "choiceD": "homie"
        })).then(() => quiz.createQuestion({
          "q": "For the word: shade, what is the best synonym?",
          "a": "a",
          "choiceA": "negative comment",
          "choiceB": "fleek",
          "choiceC": "shadow",
          "choiceD": "thot"
        })).then(() => quiz.createQuestion({
          "q": "For the word: turnt, what is the best synonym?",
          "a": "d",
          "choiceA": "chill",
          "choiceB": "relax",
          "choiceC": "somber",
          "choiceD": "party"
        })).then(() => quiz.createQuestion({
          "q": "For the word: thirsty, what is the best synonym?",
          "a": "b",
          "choiceA": "parched",
          "choiceB": "horny",
          "choiceC": "dry",
          "choiceD": "desert"
        }))
      ))
    )
  )

  // Re-enable foreign key checks 
  .then(() => models.sequelize.query('SET FOREIGN_KEY_CHECKS = 1'))
}