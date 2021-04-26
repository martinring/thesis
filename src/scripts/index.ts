import * as anchor from '../../node_modules/markdown-it-anchor/types/index'
import '../style/index.css'

function toggleParents(elem: HTMLElement, on?: boolean) {  
  if (elem) {    
    if (elem.tagName == 'A' || elem.tagName == 'UL') {
      elem.classList.toggle('active',on)
    }
    toggleParents(elem.parentElement,on)
  }
}

const offsets: number[] = []
const elements: { [offset: number]: HTMLAnchorElement } = { }
let active: number | null = null

function init() {
  if (active) toggleParents(elements[offsets[active]],false)
  active = null
  offsets.splice(0,offsets.length)
  document.getElementById('TOC').querySelectorAll('a').forEach(anchor => {    
    if (anchor.hash) {      
      const elem = document.getElementById(anchor.hash.slice(1))
      offsets.push(elem.offsetTop)
      elements[elem.offsetTop] = anchor      
    }
  })
  setActive()
}

window.addEventListener('DOMContentLoaded',() => {  
  init()
  let y0 = 0  
},{ once: true })

window.addEventListener('resize',init)

window.setInterval(init,1000)

function setActive() {
  let y1 = window.scrollY + (window.innerHeight / 4)
  let i = offsets.findIndex(y => y > y1)  
  i = i < 0 ? offsets.length - 1 : Math.max(0,i-1)
  if (active !== i) {
    if (active !== null) toggleParents(elements[offsets[active]],false)
    active = i
    if (active !== null) toggleParents(elements[offsets[active]],true)
  }
}

window.addEventListener('scroll',setActive)