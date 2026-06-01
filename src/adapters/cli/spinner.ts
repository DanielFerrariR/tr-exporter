const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function startSpinner(message: string): () => void {
  let frame = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r${FRAMES[frame]} ${message}`);
    frame = (frame + 1) % FRAMES.length;
  }, 80);
  return () => {
    clearInterval(interval);
    process.stdout.write('\r\x1b[K');
  };
}
