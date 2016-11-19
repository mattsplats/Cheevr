const SLIDE_TIME = 400;

$(document).on('click', '.btn-showq', function (e) {
  console.log('ok')
  const target = $(`#questions_${$(this).data('id')}`);

  if (!target.data('vis')) {
    target.show({ duration: 1, complete: target.slideDown({ duration: SLIDE_TIME, easing: 'linear' }) }).data('vis', true);

  } else {
    target.slideUp({ duration: SLIDE_TIME }).data('vis', false);
  }
})
