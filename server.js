'use strict';

// Includes / static vars
const express    = require('express'),
      exphbs     = require('express-handlebars'),
      bodyParser = require('body-parser'),

      routes     = require('./controllers/controller.js'),
      models     = require('./models'),

      app        = express(),
      hbs        = exphbs.create({ defaultLayout: 'main', extname: '.hbs' }),
      PORT       = process.env.PORT || 3000;

// Handlebars init
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
if (PORT !== 3000) app.enable('view cache');  // Disable view cache for local testing

// Body parser init
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());

// Sequelize init
models.sequelize.sync();

// Route for static content
app.use(express.static(process.cwd() + '/public'));

// Controller routes
app.use('/', routes);

// Init server
app.listen(PORT, function () {
  console.log(`App listening on port ${PORT}`);
});
