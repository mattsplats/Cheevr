'use strict';

// On load
$(function () {
  const es = new EventSource('/stream');
 
  es.onmessage = function (event) {
    if (event.data !== `"keepAlive"`) {
      const quiz = JSON.parse(event.data);
      $('#ul').append($('<li>').html(`Quiz: ${quiz.name}<br/>Result: ${quiz.results.reduce((a,b) => b ? a + 1 : a, 0)} / ${quiz.results.length} correct`));
    }
  };
});