import './index.css'


/*document.addEventListener('DOMContentLoaded',() => {    
  const h1s = Array.from(document.getElementsByTagName('h1'))
  let current = 0
  window.addEventListener('scroll',(e) => {
    console.log(h1s[1].offsetParent, window.pageYOffset)
    while (current < h1s.length - 1 && h1s[current].clientTop < window.pageYOffset) {
      h1s[current].classList.remove('active')
      current += 1
    }
    h1s[current].classList.add('active')
  })

},{ once: true })*/