$(function () {

  // Form row generator methods
  const htmlGen = {
    trueFalse: function (startIndex, endIndex) {
      let htmlString = '';

      for (let i = startIndex; i <= endIndex; i++) {
        const template = `
<!-- True/False Statement ${i} -->
<div class="row">
  <div class="input-field col m8 s12">
    <input id="q_${i}" type="text" class="validate">
    <label for="q_${i}">True/False Statement ${i}</label>
  </div>
  <div class="input-field col m4 s6">
    <select id="a_${i}">
      <option disabled selected value="">Correct answer?</option>
      <option value="true">true</option>
      <option value="false">false</option>
    </select>
  </div>
</div>
`;
        htmlString += template;
      }

      return htmlString;
    },

    multipleChoice: function (startIndex, endIndex) {
      let htmlString = '';

      for (let i = startIndex; i <= endIndex; i++) {
        const template = `
<!-- Question ${i} -->
<div class="row">
  <div class="input-field col m8 s12">
    <input id="q_${i}" type="text" class="validate">
    <label for="q_${i}">Question ${i}</label>
  </div>
  <div class="input-field col m4 s6">
    <select id="a_${i}">
      <option disabled selected value="">Correct answer?</option>
      <option value="a">A</option>
      <option value="b">B</option>
      <option value="c">C</option>
      <option value="d">D</option>
    </select>
  </div>
</div>
<div class="row">
  <div class="input-field col m3 s6">
    <input id="choiceA_${i}" type="text" class="validate">
    <label for="choiceA_${i}">Choice A</label>
  </div>
  <div class="input-field col m3 s6">
    <input id="choiceB_${i}" type="text" class="validate">
    <label for="choiceB_${i}">Choice B</label>
  </div>
  <div class="input-field col m3 s6">
    <input id="choiceC_${i}" type="text" class="validate">
    <label for="choiceC_${i}">Choice C</label>
  </div>
  <div class="input-field col m3 s6">
    <input id="choiceD_${i}" type="text" class="validate">
    <label for="choiceD_${i}">Choice D</label>
  </div>
</div>
${i < endIndex ? `<div class="divider"></div><br/>` : ''}
`;
        htmlString += template;
      }

      return htmlString;
    }
  }

  // Render edit page
  if ($('#page').data('title') === 'edit') {
    $.get(`api/quiz/${$('#page').data('id')}`).then(quiz => {
      $('#input').html(htmlGen[quiz.type](1, quiz.questions.length));
      $('select').material_select();

      for (let i = 1; i <= quiz.questions.length; i++) {
        $(`#q_${[i]}`).val(quiz.questions[i - 1].q).addClass('valid').next().addClass('active');
        console.log($(`#a_${[i]}`).prev('ul').attr('id'));
      }
    })
  };


  // Events
  // On select question type
  $('#questionType').change(function (e) {
    if ($(this).val() !== $(this).data('type')) {
      $('#input').slideUp({ duration: 1 }).html(htmlGen[$(this).val()](1, 3)).slideDown({ duration: 250, easing: 'linear' });
      $('select').material_select();
      $(this).data('type', $(this).val());
    }
  });

  // Add question
  $('#addQuestion').click(function (e) {
    const numQ = $('#input').children().length + 1;

    $('#input').append(
      $('<div>').attr('id', `block_${numQ}`).html(htmlGen[$('#questionType').val()](numQ, numQ))
      .hide({ duration: 1 }).slideDown({ duration: 175, easing: 'linear' })
    );

    $('select').material_select();
    $('#rmQuestion').show({ duration: 125 });
  });

  // Delete question
  $('#rmQuestion').click(function (e) {
    const numQ = $('#input').children().length;

    if (numQ > 3) {
      $(`#block_${numQ}`).slideUp({ duration: 175 });
      if (numQ < 5) $('#rmQuestion').hide({ duration: 200 });
      setTimeout(() => $(`#block_${numQ}`).remove(), 175)
    }
  });

  // Submit quiz
  $('#submitQuiz').click(function (e) {
    const numQ = $('#input').children().length;
    let questions = [];

    for (let i = 1; i <= numQ; i++) {
      questions.push({
        q: $(`#q_${i}`).val().trim(),
        a: $(`#a_${i}`).val().trim(),
        choiceA: $(`#choiceA_${i}`).val() ? $(`#choiceA_${i}`).val().trim() : null,
        choiceB: $(`#choiceB_${i}`).val() ? $(`#choiceB_${i}`).val().trim() : null,
        choiceC: $(`#choiceC_${i}`).val() ? $(`#choiceC_${i}`).val().trim() : null,
        choiceD: $(`#choiceD_${i}`).val() ? $(`#choiceD_${i}`).val().trim() : null,
      });
    }

    console.log('OK')

    $.post({
      url: `${window.location.origin}/api`,
      data: {
        name: $(`#name`).val().trim(),
        desc: $(`#desc`).val().trim(),
        type: $(`#questionType`).val(),
        numberToAsk: 0,
        questions: questions
      }
    }).done(res => 
      Materialize.toast('Quiz Added!', 2000)
    ).fail(err =>
      console.log(err)
    )
  });
})