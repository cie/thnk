const CR = '\r';
const ERASE_LINE = '\x1b[K';
const PRINT_MARGIN = 80;

export async function displayProgress(fullStream, lineHead) {
  let lastLine = '';
  for await (const event of fullStream) {
    if (event.type === 'text-delta') {
      const { textDelta } = event;
      lastLine += textDelta;
      if (lastLine.endsWith('\n') || lastLine.length > PRINT_MARGIN - lineHead.length) {
        process.stderr.write(`${CR}${ERASE_LINE}${lineHead}${lastLine.slice(0, -1)}`.slice(0, PRINT_MARGIN));
        lastLine = '';
      }
    } else if (event.type === 'error') {
      throw event.error;
    }
  }
}
