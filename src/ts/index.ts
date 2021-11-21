import Chip8 from './chip8';
import Display from './display';
import Keyboard from './keyboard';
import Speaker from './speaker';

const canvas = document.querySelector('#display') as HTMLCanvasElement;
const input = document.querySelector('#rom') as HTMLInputElement;

const display = new Display(canvas);
const keyboard = new Keyboard();
const speaker = new Speaker();
const chip8 = new Chip8(display, keyboard, speaker);

canvas.addEventListener('click', () => input.click());
input.addEventListener('change', () => chip8.start(input.files[0]));
