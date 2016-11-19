$(function () {
  function renderQuestions (quiz) {
    let htmlString = '';

    for (const question of quiz) {
      const template = `
<div class="row no-margin"><br/>
  <div class="col s12">
    <div class="card grey darken-1 no-margin">
      <div class="card-content white-text">
        <p>${question.choiceA ? 'Question' : 'True or false'}: ${question.q}</p>
        ${question.choiceA ? `<ul class="no-margin">
          <li>A: ${question.choiceA}</li>
          <li>B: ${question.choiceB}</li>
          <li>C: ${question.choiceC}</li>
          <li>D: ${question.choiceD}</li>
        </ul>` : ''}
        <p>Answer: ${question.a}</p>
      </div>
    </div>
  </div>
</div>`;
      htmlString += template;
    }

    return htmlString;
  }

  $("#search").on('keyup', function (e) {
    const searchTerm = $("#search").val().trim();

    if (searchTerm.length > 0) {
      $.get(`/api/search/${searchTerm}`).then(data => {
        let htmlString = '';

        for (var i = 0; i < data.length; i++) {
          const template = `
<div class="row">
  <div class="col s12">
    <div class="card blue-grey darken-1">
      <div class="card-content white-text">
        <span class="card-title">${data[i].name}</span>
        <div class="right pad-right">
          <br/>Taken: ${data[i].totalAttempts} Times
        </div>
        <p class="flavor-text grey-text text-lighten-1">Say: "Alexa, ask cheevo to quiz me on ${data[i].name}"</p>
        <div class="chip">${data[i].desc}</div>
        <div class="right pad-right">
          <a class="waves-effect waves-light btn btn-showq" data-id=${i}>SHOW QUESTIONS</a>
        </div>
        <br/>
        <div id="questions_${i}" data-vis="false" style="display: none;">
          ${renderQuestions(data[i].Questions)}
        </div>
      </div>
    </div>
  </div>
</div>
`;
          htmlString += template;
        }

        $('#displayQuiz').html(htmlString);
      });
    
    } else $('#displayQuiz').empty();
  })
})
