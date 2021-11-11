export default class Speaker {
  private ctx: AudioContext;
  private osc: OscillatorNode;
  private playing: boolean;

  constructor() {
    this.ctx = new AudioContext();
    const options = { type: 'square' as OscillatorType, frequency: 174.6 };
    this.osc = new OscillatorNode(this.ctx, options);
    this.osc.connect(this.ctx.destination);
    this.playing = false;
  }

  public start() {
    if (!this.playing) this.osc.start();
    this.playing = true;
  }

  public stop() {
    if (this.playing) this.osc.stop();
    this.playing = false;
  }
}
