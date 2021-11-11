export default class Keyboard {
  private keymap: Record<string, number>;
  private pressed: Array<boolean>;
  private callback: (code: number) => void;

  constructor() {
    this.keymap = {
      '1': 0x1, // 1 1
      '2': 0x2, // 2 2
      '3': 0x3, // 3 3
      '4': 0xc, // 4 C
      'q': 0x4, // q 4
      'w': 0x5, // w 5
      'e': 0x6, // e 6
      'r': 0xd, // r D
      'a': 0x7, // a 7
      's': 0x8, // s 8
      'd': 0x9, // d 9
      'f': 0xe, // f E
      'z': 0xa, // z A
      'x': 0x0, // x 0
      'c': 0xb, // c B
      'v': 0xf, // v F
    };

    this.pressed = new Array(16).fill(false);
    this.callback = null;
    window.addEventListener('keyup', this.keyUp.bind(this));
  }

  public isPressed(code: number) {
    return this.pressed[code];
  }

  public wait(callback: (code: number) => void) {
    this.callback = callback;
  }

  private keyUp(e: KeyboardEvent) {
    const code = this.keymap[e.key];
    this.pressed[code] = !this.pressed[code];
    if (this.callback == null) return;
    this.callback(code);
    this.callback = null;
  }
}
