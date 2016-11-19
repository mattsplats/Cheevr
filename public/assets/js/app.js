'use strict';

// On load
$(function () {
  const es = new EventSource('/stream');
 
  es.onmessage = function (event) {
    if (event.data !== `"keepAlive"`) {
      Materialize.toast(`${event.data} just created a quiz!`, 2000);
    }
  };
});