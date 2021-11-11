export default class Keyboard {
  private keymap: Record<string, number>;
  private pressed: Array<boolean>;
  private callback: (code: number) => void;

  constructor() {
    this.keymap = {
      '1': 0x1,
      '2': 0x2,
      '3': 0x3,
      '4': 0xc,
      'q': 0x4,
      'w': 0x5,
      'e': 0x6,
      'r': 0xd,
      'a': 0x7,
      's': 0x8,
      'd': 0x9,
      'f': 0xe,
      'z': 0xa,
      'x': 0x0,
      'c': 0xb,
      'v': 0xf,
    };

    window.addEventListener('keyup', this.keyUp.bind(this));
    this.clear();
  }

  public clear() {
    this.pressed = new Array(16).fill(false);
    this.callback = null;
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
