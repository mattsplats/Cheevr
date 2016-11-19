'use strict';

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
  <div class="input-field col m4 s6 center">
    <input name="a_${i}" type="radio" id="a_${i}_true" checked="true" />
    <label for="a_${i}_true">True</label>
    &nbsp;
    <input name="a_${i}" type="radio" id="a_${i}_false" />
    <label for="a_${i}_false">False</label>
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
<div>
  <div class="row">
    <div class="input-field col m8 s12">
      <input id="q_${i}" type="text" class="validate">
      <label for="q_${i}">Question ${i}</label>
    </div>
    <div class="input-field col m4 s6">
      <input name="a_${i}" type="radio" id="a_${i}_A" checked="true" />
      <label for="a_${i}_A">A</label>
      &nbsp;
      <input name="a_${i}" type="radio" id="a_${i}_B" />
      <label for="a_${i}_B">B</label>
      &nbsp;
      <input name="a_${i}" type="radio" id="a_${i}_C" />
      <label for="a_${i}_C">C</label>
      &nbsp;
      <input name="a_${i}" type="radio" id="a_${i}_D" />
      <label for="a_${i}_D">D</label>
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
</div>
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

      $('#name').val(quiz.name).addClass('valid').next().addClass('active');
      $('#desc').val(quiz.desc).addClass('valid').next().addClass('active');

      for (let i = 1; i <= quiz.questions.length; i++) {
        $(`#q_${i}`).val(quiz.questions[i - 1].q).addClass('valid').next().addClass('active');
        if (quiz.type === 'trueFalse') {
          if (quiz.questions[i - 1].a === 'false') $(`#a_${i}_false`).click();
        
        } else {
          if (quiz.questions[i - 1].a === 'a') $(`#a_${i}_A`).click();
          else if (quiz.questions[i - 1].a === 'b') $(`#a_${i}_B`).click();
          else if (quiz.questions[i - 1].a === 'c') $(`#a_${i}_C`).click();
          else $(`#a_${i}_D`).click();

          $(`#choiceA_${i}`).val(quiz.questions[i - 1].choiceA).addClass('valid').next().addClass('active');
          $(`#choiceB_${i}`).val(quiz.questions[i - 1].choiceB).addClass('valid').next().addClass('active');
          $(`#choiceC_${i}`).val(quiz.questions[i - 1].choiceC).addClass('valid').next().addClass('active');
          $(`#choiceD_${i}`).val(quiz.questions[i - 1].choiceD).addClass('valid').next().addClass('active');
        }
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
      let a = $(`input[type=radio][name=a_${i}]`).prop('checked');

      if ($('#questionType').data('type') === 'multipleChoice') {
        if ($(`#a_${i}_A`).prop('checked')) a = 'a';
        else if ($(`#a_${i}_B`).prop('checked')) a = 'b';
        else if ($(`#a_${i}_C`).prop('checked')) a = 'c';
        else a = 'd';
      }

      questions.push({
        q: $(`#q_${i}`).val().trim(),
        a: a,
        choiceA: $(`#choiceA_${i}`).val() ? $(`#choiceA_${i}`).val().trim() : null,
        choiceB: $(`#choiceB_${i}`).val() ? $(`#choiceB_${i}`).val().trim() : null,
        choiceC: $(`#choiceC_${i}`).val() ? $(`#choiceC_${i}`).val().trim() : null,
        choiceD: $(`#choiceD_${i}`).val() ? $(`#choiceD_${i}`).val().trim() : null,
      });
    }

    console.log(questions);

    if ($('#page').data('title') === 'edit') {
      $.ajax({
        method: 'PUT',
        url: `${window.location.origin}/api`,
        data: {
          id: $('#page').data('id'),
          name: $(`#name`).val().trim(),
          desc: $(`#desc`).val().trim(),
          type: $(`#questionType`).val(),
          numberToAsk: 0,
          questions: questions
        }
      }).done(res => 
        Materialize.toast('Quiz Updated!', 2000)
      ).fail(err =>
        console.log(err)
      )

    } else {
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
    }
  });
})