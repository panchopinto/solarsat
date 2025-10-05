
export function el(q){return document.querySelector(q)}
export function on(elm, ev, fn){elm.addEventListener(ev, fn)}
export function downloadBlob(content, filename, type='image/png'){
  const a=document.createElement('a');a.style.display='none'
  const blob=new Blob([content], {type}); const url=URL.createObjectURL(blob)
  a.href=url;a.download=filename;document.body.appendChild(a);a.click()
  setTimeout(()=>{URL.revokeObjectURL(url);a.remove()}, 500)
}
export function captureCanvas(canvas, name='captura.png'){
  canvas.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click()}, 'image/png')
}
export function setTheme(dark=true){
  document.documentElement.style.setProperty('--bg', dark ? '#0b1020' : '#f6f9ff')
  document.body.style.background = dark
    ? 'radial-gradient(1000px 600px at 70% -20%, #1d2447 0%, #0b1020 60%)'
    : 'radial-gradient(1000px 600px at 70% -20%, #ffffff 0%, #cfe3ff 60%)'
}
