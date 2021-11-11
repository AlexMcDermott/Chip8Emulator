export default class Speaker {
  private osc: OscillatorNode;
  private playing: boolean;

  constructor() {
    const ctx = new AudioContext();
    const options = { type: 'square' as OscillatorType, frequency: 174.6 };
    this.osc = new OscillatorNode(ctx, options);
    this.osc.connect(ctx.destination);
    this.playing = false;
  }

  public start() {
    this.osc.start();
    this.playing = true;
  }

  public stop() {
    if (this.playing) this.osc.stop();
    this.playing = false;
  }
}
