$(function () {
  const SLIDE_TIME = 400;

  $('.btn-showq').click(function (e) {
    const target = $(`#questions_${$(this).data('id')}`);

    if (!target.data('vis')) {
      target.show({ duration: 1, complete: target.slideDown({ duration: SLIDE_TIME }) }).data('vis', true);


    } else {
      target.slideUp({ duration: SLIDE_TIME }).data('vis', false);
    }
  })
})