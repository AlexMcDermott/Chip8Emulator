export default class Speaker {
  private ctx: AudioContext;
  private osc: OscillatorNode;
  private options: OscillatorOptions;

  constructor() {
    this.ctx = new AudioContext();
    this.osc = null;
    this.options = { type: 'square' as OscillatorType, frequency: 147 };
    window.addEventListener('click', () => this.ctx.resume());
  }

  public start() {
    if (this.osc != null) return;
    this.osc = new OscillatorNode(this.ctx, this.options);
    this.osc.connect(this.ctx.destination);
    console.log('starting');
    this.osc.start(this.ctx.currentTime);
  }

  public stop() {
    if (this.osc == null) return;
    this.osc.stop();
    console.log('stopping');
    this.osc = null;
  }
}
