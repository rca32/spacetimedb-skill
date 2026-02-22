import { ComponentBase as b } from "@orillusion/core";
class v extends b {
  /**
   * Stats DOM container
   * with default class="stats"  
   * could custom container style with css
   */
  container;
  beginTime = performance.now();
  prevTime = this.beginTime;
  frames = 0;
  fpsPanel;
  memPanel;
  // private drawcallPanel:Panel
  /**
   * @internal
   */
  init() {
    const e = this.container = document.createElement("div");
    e.className = "stats", e.setAttribute("style", "display:flex;flex-direction:column;gap:1px;position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000"), this.fpsPanel = new g(e, "FPS", "#0ff", "#002"), "memory" in performance && (this.memPanel = new g(e, "MB", "#f08", "#201")), this.beginTime = (performance || Date).now(), document.body.appendChild(this.container);
  }
  /**
   * @internal
   */
  onDisable() {
    this.container.style.display = "none";
  }
  /**
   * @internal
   */
  onEnable() {
    this.container.style.display = "flex";
  }
  /**
   * @internal
   */
  stop() {
    this.fpsPanel.destroy(), this.memPanel?.destroy(), document.body.removeChild(this.container);
  }
  /**
   * @internal
   */
  onUpdate() {
    this.frames++;
    const e = this.beginTime = performance.now();
    e >= this.prevTime + 1e3 && (this.fpsPanel.update(this.frames * 1e3 / (e - this.prevTime), 100), this.memPanel?.update(performance.memory.totalJSHeapSize / 1048576, 256), this.prevTime = e, this.frames = 0);
  }
}
class g {
  canvas;
  worker;
  width = 80;
  height = 48;
  constructor(e, n, l, m) {
    const a = this.canvas = document.createElement("canvas");
    a.width = this.width, a.height = this.height, e.appendChild(a);
    const p = a.transferControlToOffscreen(), h = new Blob([`(${T})()`], { type: "application/javascript" });
    this.worker = new Worker(URL.createObjectURL(h)), this.worker.postMessage({ type: "init", offscreen: p, name: n, fg: l, bg: m }, [p]);
  }
  update(e, n) {
    this.worker.postMessage({ type: "update", value: e, maxValue: n });
  }
  destroy() {
    this.worker.terminate();
  }
}
function T() {
  let i, e, n, l, m, a, p, h = 1 / 0, d = 0;
  const s = 1, y = 3, u = 2, r = 3, o = 15, c = 74, f = 30;
  onmessage = (t) => {
    t.data.type == "update" ? (h = Math.min(h, t.data.value), d = Math.max(d, t.data.value), e.fillStyle = l, e.globalAlpha = 1, e.fillRect(0, 0, a, o), e.fillStyle = m, e.fillText(Math.round(t.data.value) + " " + n + " (" + Math.round(h) + "-" + Math.round(d) + ")", y, u), e.drawImage(i, r + s, o, c - s, f, r, o, c - s, f), e.fillRect(r + c - s, o, s, f), e.fillStyle = l, e.globalAlpha = 0.9, e.fillRect(r + c - s, o, s, Math.round((1 - t.data.value / t.data.maxValue) * f))) : t.data.type == "init" && (i = t.data.offscreen, n = t.data.name, l = t.data.bg, m = t.data.fg, a = i.width, p = i.height, e = i.getContext("2d"), e.font = "bold 9px Helvetica,Arial,sans-serif", e.textBaseline = "top", e.fillStyle = l, e.fillRect(0, 0, a, p), e.fillStyle = m, e.fillText(n, y, u), e.fillRect(r, o, c, f), e.fillStyle = l, e.globalAlpha = 0.9, e.fillRect(r, o, c, f));
  };
}
export {
  v as Stats
};
