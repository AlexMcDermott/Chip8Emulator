export default class Display {
  private cols: number;
  private rows: number;
  private width: number;
  private height: number;
  private display: Array<number>;
  private ctx: CanvasRenderingContext2D;
  private scl: number;

  constructor(canvas: HTMLCanvasElement) {
    this.cols = 64;
    this.rows = 32;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const min = Math.min(width / this.cols, height / this.rows);
    this.scl = Math.floor(0.95 * min);
    this.display = new Array(this.cols * this.rows).fill(0);
    this.width = this.cols * this.scl;
    this.height = this.rows * this.scl;
    canvas.width = this.width;
    canvas.height = this.height;
    this.ctx = canvas.getContext('2d');
    this.render();
  }

  public set(x: number, y: number, value: number) {
    if (x > this.cols) x -= this.cols;
    if (x < 0) x += this.cols;
    if (y > this.rows) y -= this.rows;
    if (y < 0) y += this.rows;

    const index = y * this.cols + x;
    const prev = this.display[index];
    const curr = this.display[index] ^ value;
    this.display[index] = curr;
    return prev == 1 && curr == 0 ? 1 : 0;
  }

  public clear() {
    this.display.fill(0);
  }

  public render() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = '#FFF';

    for (let i = 0; i < this.cols * this.rows; i++) {
      const x = (i % this.cols) * this.scl;
      const y = Math.floor(i / this.cols) * this.scl;
      if (this.display[i] == 1) this.ctx.fillRect(x, y, this.scl, this.scl);
    }
  }
}
