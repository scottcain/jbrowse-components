import Canvas2DContextShim from '.'

test('serialize a single command and read back out', () => {
  const ctx = new Canvas2DContextShim(100, 100)
  ctx.arc(20, 21, 22, 23, 24)
})
