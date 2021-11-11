import Display from './display';
import Keyboard from './keyboard';
import Speaker from './speaker';

export default class Chip8 {
  private memory: Uint8Array;
  private v: Uint8Array;
  private i: number;
  private pc: number;
  private stack: Array<number>;
  private dt: number;
  private st: number;
  private display: Display;
  private keyboard: Keyboard;
  private speaker: Speaker;
  private paused: boolean;

  constructor(display: Display, keyboard: Keyboard, speaker: Speaker) {
    this.memory = new Uint8Array(4096);
    this.v = new Uint8Array(16);
    this.i = 0;
    this.pc = 0x200;
    this.stack = [];
    this.dt = 0;
    this.st = 0;
    this.display = display;
    this.keyboard = keyboard;
    this.speaker = speaker;
    this.paused = false;
  }

  public async start(file: File) {
    const rom = await file.arrayBuffer();
    const program = new Uint8Array(rom);
    this.loadSprites();
    this.loadProgram(program);
    this.step();
  }

  public step() {
    this.cycle();
    requestAnimationFrame(this.step.bind(this));
  }

  private cycle() {
    if (this.paused) return;
    const instruction = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
    this.pc += 2;
    this.process(instruction);
    this.updateTimers();
    this.sound();
    this.display.render();
  }

  private updateTimers() {
    if (this.dt > 0) this.dt--;
    if (this.st > 0) this.st--;
  }

  private sound() {
    this.st > 0 ? this.speaker.start() : this.speaker.stop();
  }

  private loadProgram(program: Uint8Array) {
    for (let i = 0; i < program.length; i++) {
      this.memory[0x200 + i] = program[i];
    }
  }

  private loadSprites() {
    // prettier-ignore
    const sprites = [
      0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
      0x20, 0x60, 0x20, 0x20, 0x70, // 1
      0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
      0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
      0x90, 0x90, 0xF0, 0x10, 0x10, // 4
      0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
      0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
      0xF0, 0x10, 0x20, 0x40, 0x40, // 7
      0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
      0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
      0xF0, 0x90, 0xF0, 0x90, 0x90, // A
      0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
      0xF0, 0x80, 0x80, 0x80, 0xF0, // C
      0xE0, 0x90, 0x90, 0x90, 0xE0, // D
      0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
      0xF0, 0x80, 0xF0, 0x80, 0x80  // F
    ];

    for (let i = 0; i < sprites.length; i++) {
      this.memory[i] = sprites[i];
    }
  }

  private process(instruction: number) {
    const nnn = instruction & 0x0fff;
    const n = instruction & 0x000f;
    const x = (instruction & 0x0f00) >> 8;
    const y = (instruction & 0x00f0) >> 4;
    const kk = instruction & 0x00ff;

    switch (instruction & 0xf000) {
      case 0x0000:
        switch (instruction & 0xff) {
          case 0xe0:
            this.display.clear();
            break;
          case 0xee:
            this.pc = this.stack.pop();
            break;
        }
        break;
      case 0x1000:
        this.pc = nnn;
        break;
      case 0x2000:
        this.stack.push(this.pc);
        this.pc = nnn;
        break;
      case 0x3000:
        if (this.v[x] == kk) this.pc += 2;
        break;
      case 0x4000:
        if (this.v[x] != kk) this.pc += 2;
        break;
      case 0x5000:
        if (this.v[x] == this.v[y]) this.pc += 2;
        break;
      case 0x6000:
        this.v[x] = kk;
        break;
      case 0x7000:
        this.v[x] += kk;
        break;
      case 0x8000:
        switch (instruction & 0xf) {
          case 0x0:
            this.v[x] = this.v[y];
            break;
          case 0x1:
            this.v[x] |= this.v[y];
            break;
          case 0x2:
            this.v[x] &= this.v[y];
            break;
          case 0x3:
            this.v[x] ^= this.v[y];
            break;
          case 0x4:
            const sum = this.v[x] + this.v[y];
            this.v[0xf] = sum > 0xff ? 1 : 0;
            this.v[x] = sum & 0xff;
            break;
          case 0x5:
            this.v[0xf] = this.v[x] > this.v[y] ? 1 : 0;
            this.v[x] -= this.v[y];
            break;
          case 0x6:
            this.v[0xf] = (this.v[x] & 0x1) != 0x0 ? 1 : 0;
            this.v[x] >>= 1;
            break;
          case 0x7:
            this.v[0xf] = this.v[y] > this.v[x] ? 1 : 0;
            this.v[x] = this.v[y] - this.v[x];
            break;
          case 0xe:
            this.v[0xf] = (this.v[x] & 0x80) != 0x0 ? 1 : 0;
            this.v[x] <<= 1;
            break;
        }
        break;
      case 0x9000:
        if (this.v[x] != this.v[y]) this.pc += 2;
        break;
      case 0xa000:
        this.i = nnn;
        break;
      case 0xb000:
        this.pc = nnn + this.v[0x0];
        break;
      case 0xc000:
        this.v[x] = kk & Math.floor(Math.random() * 0xff);
        break;
      case 0xd000:
        for (let row = 0; row < n; row++) {
          let line = this.memory[this.i + row];
          for (let col = 0; col < 8; col++) {
            const px = this.v[x] + col;
            const py = this.v[y] + row;
            if ((line & 0x80) != 0) this.v[0xf] = this.display.set(px, py);
            line <<= 1;
          }
        }
        break;
      case 0xe000:
        switch (instruction & 0xff) {
          case 0x9e:
            if (this.keyboard.isPressed(this.v[x])) this.pc += 2;
            break;
          case 0xa1:
            if (!this.keyboard.isPressed(this.v[x])) this.pc += 2;
            break;
        }
        break;
      case 0xf000:
        switch (instruction & 0xff) {
          case 0x07:
            this.v[x] = this.dt;
            break;
          case 0x0a:
            this.paused = true;
            this.keyboard.wait(code => {
              this.v[x] = code;
              this.paused = false;
            });
            break;
          case 0x15:
            this.dt = this.v[x];
            break;
          case 0x18:
            this.st = this.v[x];
            break;
          case 0x1e:
            this.i += this.v[x];
            break;
          case 0x29:
            this.i = this.v[x] * 5;
            break;
          case 0x33:
            this.memory[this.i] = Math.floor(this.v[x] / 100);
            this.memory[this.i + 1] = Math.floor((this.v[x] % 100) / 10);
            this.memory[this.i + 2] = Math.floor(this.v[x] % 10);
            break;
          case 0x55:
            for (let i = 0; i < this.v[x]; i++) {
              this.memory[this.i + i] = this.v[i];
            }
            break;
          case 0x65:
            for (let i = 0; i < this.v[x]; i++) {
              this.v[i] = this.memory[this.i + i];
            }
            break;
        }
        break;
      default:
        throw new Error('Unknown instruction');
    }
  }
}
