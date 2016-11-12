'use strict';

// On load
$(function () {
  const es = new EventSource('/stream');
 
  es.onmessage = function (event) {
    $('#ul').append($('<li>').text(event.data));
  };
});