const SLIDE_TIME = 400;

$(document).on('click', '.btn-showq', function (e) {
  const target = $(`#questions_${$(this).data('id')}`);

  if (!target.data('vis')) {
    target.show({ duration: 1, complete: target.slideDown({ duration: SLIDE_TIME, easing: 'linear' }) }).data('vis', true);

  } else {
    target.slideUp({ duration: SLIDE_TIME }).data('vis', false);
  }
})

$(document).on('click', '.btn-del', function (e) {
  const id     = $(this).data('id'),
        target = $(`#questions_${id}`);

  $.ajax({
    method: 'DELETE',
    url: `${window.location.origin}/api`,
    data: {
      id: id
    }
  }).done(res => {
    Materialize.toast('Quiz Deleted!', 2000);

    $(`#quiz_${id}`).slideUp({ duration: 175 });
    setTimeout(() => $(`#quiz_${id}`).remove(), 175)
  }).fail(err =>
    console.log(err)
  )
})


$(function () {
  $('.modal').modal();
});
          
