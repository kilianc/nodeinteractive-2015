$(function () {
  var $body = $('body')
  var $progressBar = $('.progress')
  var $presentables = $('section, .fragment')
  var $currentPresentable = $()

  var currentIndex = null
  var presentablesCount = $presentables.length

  $presentables.each(function (i) {
    var $presentable = $(this)
    var isFragment = $presentable.hasClass('fragment')
    var type = isFragment ? '/fragments/' : '/slides/'
    var hash = type + ($presentable.attr('id') || (i + 1))

    if (isFragment) {
      var $section = $presentable.closest('section')
      hash = $section.data('hash') + hash
    } else {
      hash = '#' + hash
    }

    $presentable.attr('data-hash', hash)
    $presentable.data('index', i)
    $presentable.addClass('hidden')
    $presentable.addClass($presentable.attr('data-layout'))
  })

  $('[data-autoplay]').each(function () {
    var $parent = $(this)
    var stagger = $parent.attr('data-autoplay')
    $parent.children().each(function (i) {
      $(this).css('animation-delay', ((i + 1) * stagger) + 's')
    })
  })

  ;(function () {
    var forwardKeys = [39, 32]
    var backwardKeys = [37]
    var startKeys = [72]
    var cuepoints = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57]

    $(window).on('keyup', function (e) {
      var steps = e.shiftKey ? 10 : 1

      if (~forwardKeys.indexOf(e.keyCode)) forward(steps)
      if (~backwardKeys.indexOf(e.keyCode)) backward(steps)
      if (~startKeys.indexOf(e.keyCode)) goto(0)
      if (~cuepoints.indexOf(e.keyCode)) jump(e.keyCode - 48)

      e.preventDefault()
    })
  })()

  function goto(index) {
    console.info('goto: %d', index)
    currentIndex = index
    window.location.hash = $($presentables[currentIndex]).attr('data-hash')
  }

  function jump(cuepoint) {
    console.info('jump: %d', cuepoint)
    currentIndex = Math.round(presentablesCount / 10 * cuepoint)
    window.location.hash = $($presentables[currentIndex]).attr('data-hash')
  }

  function forward(steps) {
    console.info('forward: %d', steps)
    currentIndex = (currentIndex + steps) % presentablesCount
    window.location.hash = $($presentables[currentIndex]).attr('data-hash')
  }

  function backward(steps) {
    console.info('backward: %d', steps)
    currentIndex = (currentIndex - steps) % presentablesCount
    if (currentIndex < 0) currentIndex += presentablesCount
    window.location.hash = $($presentables[currentIndex]).attr('data-hash')
  }

  function onHashChange() {
    var $oldPresentable = $currentPresentable
    $currentPresentable = $('[data-hash="' + window.location.hash + '"]')

    if (!$currentPresentable.length) {
      $currentPresentable = $oldPresentable
      window.location.hash = $($presentables[0]).attr('data-hash')
      return
    }

    currentIndex = $currentPresentable.data('index')
    $progressBar.css('width',  ((currentIndex + 1) / presentablesCount * 100) + 'vw')

    var $currentSection = $currentPresentable.closest('section')
    var $oldSection = $oldPresentable.closest('section')
    var $fragments = $currentSection.find('.fragment')

    // default behavior is to hide old presentable
    $oldPresentable.addClass('hidden')
    $fragments.addClass('hidden')

    // if presentable is a fragment show everything until itself
    if ($currentPresentable.hasClass('fragment')) {
      $fragments.each(function () {
        var $fragment = $(this)
        if ($fragment.data('index') <= currentIndex) {
          $fragment.removeClass('hidden')
        }
      })
    }

    // if we changed section
    if (!$oldSection.is($currentSection)) {
      // hide old section
      $oldSection.addClass('hidden')

      // switch layouts
      $body.removeClass($oldSection.attr('data-layout'))
      $body.addClass($currentSection.attr('data-layout'))
    }

    // show current
    $currentSection.removeClass('hidden')
    $currentPresentable.removeClass('hidden')
  }

  // mobile
  (function () {
    var viewportWidth = $(window).width()
    var halfViewportWidth = viewportWidth * 0.5

    $(window).on('touchend', function (e) {
      if (e.originalEvent.layerX >= halfViewportWidth) forward(1)
      if (e.originalEvent.layerX < halfViewportWidth) backward(1)
    }).on('ontouchmove', function (e){
      e.preventDefault()
    })
  })()

  $(window).on('hashchange', onHashChange)
  onHashChange()
})
