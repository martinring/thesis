/**
 * @param { 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' } color
 * @param { string } x
 * @returns string
 */
function color(color,x) {
  let res = ''
  switch (color) {
    case 'red':
      res += '\x1b[31m'
      break; 
    case 'green':
      res += '\x1b[32m'
      break;
    case 'yellow': 
      res += '\x1b[33m' 
      break;
    case 'blue':
      res += '\x1b[34m'
      break;
    case 'magenta':
      res += '\x1b[35'
      break;
    case 'cyan':
      res += '\x1b[36m'
      break;
  }
  res += x + '\x1b[0m'
  return res
}

export function debug(...args) {
  console.log(color('magenta','[debug] ' + args[0]),...args.slice(1));
}

export function info(...args) {
  console.log(color('blue','[info]  ') + args[0],...args.slice(1));
}

export function warn(...args) {
  console.warn(color('yellow','[warn]  ') + args[0],...args.slice(1));  
}

export function error(...args) {
  console.error(color('red','[error] ') + args[0],...args.slice(1))
}

export function timed(name,t) {
  console.log('\x1b[32m[start]\x1b[0m ' + name)
  const taskT0 = Date.now()
  if (typeof t == 'function') {
    try {
      const res = t()
      console.log(color('green','[done]  ') + `${name} (${Date.now() - taskT0}ms)`)
      return res
    } catch (e) {      
      console.log(color('red','[fail]  ') + name + ": \n" + e)
      throw e
    }
  } else {
    return t.then(r => {
      console.log(color('green','[done]  ') + `${name} (${Date.now() - taskT0}ms)`)
      return r
    },(e) => {
      console.log(color('red','[fail]  ') + name + ": \n" + e)
      throw e
    })
  }
}