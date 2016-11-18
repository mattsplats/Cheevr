$(function () {
  function renderQuestions (quiz) {
    let htmlString = '';

    for (const question of quiz) {
      const template = `
<div class="row no-margin-bot">
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

        for (const quiz of data) {
          const template = `
<div class="row">
  <div class="col s12">
    <div class="card blue-grey darken-1">
      <div class="card-content white-text">
        <span class="card-title">${quiz.name}</span>
        <div class="right pad-right">
          <br/>Taken: ${quiz.totalAttempts} Times
        </div>
        <p class="flavor-text grey-text text-lighten-1">Say: "Alexa, ask cheevo to quiz me on ${quiz.name}"</p>
        <div class="chip">${quiz.desc}</div>
        <br/><br/>
        ${renderQuestions(quiz.Questions)}
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
