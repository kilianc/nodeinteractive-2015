$(function () {
  $('figure').each(function () {
    var $figure = $(this)
    var src = $figure.attr('data-src')
    $figure.css('background-image', 'url(' + src + ')')
  })
})
