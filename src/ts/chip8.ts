import Display from './display';
import Keyboard from './keyboard';
import Speaker from './speaker';
import Stats from 'stats.js';

export default class Chip8 {
  private memory: Uint8Array;
  private v: Uint8Array;
  private i: number;
  private pc: number;
  private stack: Array<number>;
  private dt: number;
  private st: number;
  private paused: boolean;
  private display: Display;
  private keyboard: Keyboard;
  private speaker: Speaker;
  private _cyclesPerStep: number;
  private stats: Stats;

  constructor(display: Display, keyboard: Keyboard, speaker: Speaker) {
    this.display = display;
    this.keyboard = keyboard;
    this.speaker = speaker;
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }

  private init() {
    this.memory = new Uint8Array(4096);
    this.v = new Uint8Array(16);
    this.i = 0;
    this.pc = 0x200;
    this.stack = [];
    this.dt = 0;
    this.st = 0;
    this.paused = false;
    this.display.clear();
    this.keyboard.clear();
    this.speaker.stop();
    this.cyclesPerStep = 1;
  }

  public get cyclesPerStep(): number {
    return this._cyclesPerStep;
  }

  public set cyclesPerStep(n: number) {
    this._cyclesPerStep = n < 0 || !Number.isFinite(n) ? 1 : Math.floor(n);
  }

  public async start(file: File) {
    this.init();
    const rom = await file.arrayBuffer();
    const program = new Uint8Array(rom);
    this.loadSprites();
    this.loadProgram(program);
    requestAnimationFrame(this.step.bind(this));
  }

  private step() {
    this.stats.begin();
    this.cycle();
    this.stats.end();
    requestAnimationFrame(this.step.bind(this));
  }

  private cycle() {
    for (let i = 0; i < this._cyclesPerStep; i++) {
      if (this.paused) return;
      const opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
      this.pc += 2;
      this.process(opcode);
      this.updateTimers();
    }
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
    const sprites = [
      0xf0, 0x90, 0x90, 0x90, 0xf0, 0x20, 0x60, 0x20, 0x20, 0x70, 0xf0, 0x10,
      0xf0, 0x80, 0xf0, 0xf0, 0x10, 0xf0, 0x10, 0xf0, 0x90, 0x90, 0xf0, 0x10,
      0x10, 0xf0, 0x80, 0xf0, 0x10, 0xf0, 0xf0, 0x80, 0xf0, 0x90, 0xf0, 0xf0,
      0x10, 0x20, 0x40, 0x40, 0xf0, 0x90, 0xf0, 0x90, 0xf0, 0xf0, 0x90, 0xf0,
      0x10, 0xf0, 0xf0, 0x90, 0xf0, 0x90, 0x90, 0xe0, 0x90, 0xe0, 0x90, 0xe0,
      0xf0, 0x80, 0x80, 0x80, 0xf0, 0xe0, 0x90, 0x90, 0x90, 0xe0, 0xf0, 0x80,
      0xf0, 0x80, 0xf0, 0xf0, 0x80, 0xf0, 0x80, 0x80,
    ];

    for (let i = 0; i < sprites.length; i++) {
      this.memory[i] = sprites[i];
    }
  }

  private process(opcode: number) {
    const nnn = opcode & 0x0fff;
    const n = opcode & 0x000f;
    const x = (opcode & 0x0f00) >> 8;
    const y = (opcode & 0x00f0) >> 4;
    const kk = opcode & 0x00ff;

    switch (opcode & 0xf000) {
      case 0x0000:
        switch (opcode & 0xff) {
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
        switch (opcode & 0xf) {
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
            this.v[0xf] = (this.v[x] & 0x1) > 0x0 ? 1 : 0;
            this.v[x] >>= 1;
            break;
          case 0x7:
            this.v[0xf] = this.v[y] > this.v[x] ? 1 : 0;
            this.v[x] = this.v[y] - this.v[x];
            break;
          case 0xe:
            this.v[0xf] = (this.v[x] & 0x80) > 0x0 ? 1 : 0;
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
            const value = (line & 0x80) > 0 ? 1 : 0;
            this.v[0xf] = this.display.set(px, py, value);
            line <<= 1;
          }
        }
        break;
      case 0xe000:
        switch (opcode & 0xff) {
          case 0x9e:
            if (this.keyboard.isPressed(this.v[x])) this.pc += 2;
            break;
          case 0xa1:
            if (!this.keyboard.isPressed(this.v[x])) this.pc += 2;
            break;
        }
        break;
      case 0xf000:
        switch (opcode & 0xff) {
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
            this.memory[this.i + 2] = this.v[x] % 10;
            break;
          case 0x55:
            for (let i = 0; i <= x; i++) {
              this.memory[this.i + i] = this.v[i];
            }
            break;
          case 0x65:
            for (let i = 0; i <= x; i++) {
              this.v[i] = this.memory[this.i + i];
            }
            break;
        }
        break;
      default:
        throw new Error('Unknown opcode');
    }
  }
}
