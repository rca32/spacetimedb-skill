import { Vector2 as z, GeometryBase as jt, Vector3 as xe, VertexAttributeName as ue, ParserBase as ea, PlaneGeometry as ra, lerp as kr, Transform as ta, BoundingBox as $t, Material as na, Shader as aa, ShaderLib as Fr, RenderShaderPass as nt, PassType as at, BlendMode as it, Color as Se, Vector4 as st, GPUAddressMode as ot, MeshRenderer as ia } from "@orillusion/core";
var Be = /* @__PURE__ */ ((e) => (e[e.LineCurve = 0] = "LineCurve", e[e.SplineCurve = 1] = "SplineCurve", e[e.EllipseCurve = 2] = "EllipseCurve", e[e.QuadraticBezierCurve = 3] = "QuadraticBezierCurve", e))(Be || {});
class Xr {
  curveType;
  get points() {
    return console.warn("points not implementation!"), [];
  }
  getPoint(r, t = new z()) {
    return console.warn("getPoint not implementation!"), t;
  }
  getPoints(r = 5) {
    let t = [];
    for (let n = 0; n <= r; n++)
      t.push(this.getPoint(n / r));
    return t;
  }
}
class sa extends Xr {
  v0;
  v1;
  constructor(r, t) {
    super(), this.v0 = r, this.v1 = t, this.curveType = Be.LineCurve;
  }
  get points() {
    return [this.v0, this.v1];
  }
  getPoint(r, t = new z()) {
    return r >= 1 ? t.copyFrom(this.v1) : (this.v1.sub(this.v0, t), t.multiplyScaler(r).add(this.v0, t)), t;
  }
  getPointAt(r, t = new z()) {
    return this.getPoint(r, t);
  }
  getTangent(r, t = new z()) {
    return this.v1.sub(this.v0, t), t.normalize(), t;
  }
  getTangentAt(r, t = new z()) {
    return this.getTangent(r, t);
  }
  copyFrom(r) {
    this.v0.copyFrom(r.v0), this.v1.copyFrom(r.v1);
  }
}
class oa extends Xr {
  v0;
  v1;
  v2;
  v3;
  constructor(r, t, n, a) {
    super(), this.v0 = r, this.v1 = t, this.v2 = n, this.v3 = a;
  }
  get points() {
    return [this.v0, this.v1, this.v2, this.v3];
  }
  getPoint(r, t = new z()) {
    return t.set(
      this.cubicBezier(r, this.v0.x, this.v1.x, this.v2.x, this.v3.x),
      this.cubicBezier(r, this.v0.y, this.v1.y, this.v2.y, this.v3.y)
    ), t;
  }
  copyFrom(r) {
    this.v0.copyFrom(r.v0), this.v1.copyFrom(r.v1), this.v2.copyFrom(r.v2), this.v3.copyFrom(r.v3);
  }
  cubicBezierP0(r, t) {
    const n = 1 - r;
    return n * n * n * t;
  }
  cubicBezierP1(r, t) {
    const n = 1 - r;
    return 3 * n * n * r * t;
  }
  cubicBezierP2(r, t) {
    return 3 * (1 - r) * r * r * t;
  }
  cubicBezierP3(r, t) {
    return r * r * r * t;
  }
  cubicBezier(r, t, n, a, i) {
    return this.cubicBezierP0(r, t) + this.cubicBezierP1(r, n) + this.cubicBezierP2(r, a) + this.cubicBezierP3(r, i);
  }
}
class ua extends Xr {
  v0;
  v1;
  v2;
  constructor(r, t, n) {
    super(), this.v0 = r, this.v1 = t, this.v2 = n, this.curveType = Be.QuadraticBezierCurve;
  }
  get points() {
    return [this.v0, this.v1, this.v2];
  }
  getPoint(r, t = new z()) {
    return t.set(
      this.quadraticBezier(r, this.v0.x, this.v1.x, this.v2.x),
      this.quadraticBezier(r, this.v0.y, this.v1.y, this.v2.y)
    ), t;
  }
  copyFrom(r) {
    this.v0.copyFrom(r.v0), this.v1.copyFrom(r.v1), this.v2.copyFrom(r.v2);
  }
  quadraticBezierP0(r, t) {
    const n = 1 - r;
    return n * n * t;
  }
  quadraticBezierP1(r, t) {
    return 2 * (1 - r) * r * t;
  }
  quadraticBezierP2(r, t) {
    return r * r * t;
  }
  quadraticBezier(r, t, n, a) {
    return this.quadraticBezierP0(r, t) + this.quadraticBezierP1(r, n) + this.quadraticBezierP2(r, a);
  }
}
class hr {
  static HELP_0 = new hr();
  static HELP_1 = new hr();
  static HELP_2 = new hr();
  constructor(r = 0, t = 0, n = 0, a) {
    this.set(r, t, n, a);
  }
  set(r, t, n = 0, a) {
    this.x = r, this.y = t, this.h = n, this.invalid = a;
  }
  copyFrom(r) {
    return this.x = r.x, this.y = r.y, this.h = r.h, this.invalid = r.invalid, this;
  }
  x;
  y;
  h;
  invalid;
}
class la {
  static triangulate(r, t, n = 2) {
    const a = t && t.length, i = a ? t[0] * n : r.length;
    let s = rn(r, 0, i, n, !0);
    const u = [];
    if (!s || s.next === s.prev)
      return u;
    let o, l, f, p, h, c, d;
    if (a && (s = ca(r, t, s, n)), r.length > 80 * n) {
      o = f = r[0], l = p = r[1];
      for (let m = n; m < i; m += n)
        h = r[m], c = r[m + 1], h < o && (o = h), c < l && (l = c), h > f && (f = h), c > p && (p = c);
      d = Math.max(f - o, p - l), d = d !== 0 ? 32767 / d : 0;
    }
    return Ze(s, u, n, o, l, d, 0), u;
  }
}
function fa(e, r) {
  let t = e, n = !1;
  const a = (e.x + r.x) / 2, i = (e.y + r.y) / 2;
  do
    t.y > i != t.next.y > i && t.next.y !== t.y && a < (t.next.x - t.x) * (i - t.y) / (t.next.y - t.y) + t.x && (n = !n), t = t.next;
  while (t !== e);
  return n;
}
function ha(e, r) {
  return e.next.i !== r.i && e.prev.i !== r.i && !da(e, r) && // dones't intersect other edges
  (qe(e, r) && qe(r, e) && fa(e, r) && // locally visible
  (K(e.prev, e, r.prev) || K(e, r.prev, r)) || // does not create opposite-facing sectors
  br(e, r) && K(e.prev, e, e.next) > 0 && K(r.prev, r, r.next) > 0);
}
function K(e, r, t) {
  return (r.y - e.y) * (t.x - r.x) - (r.x - e.x) * (t.y - r.y);
}
function br(e, r) {
  return e.x === r.x && e.y === r.y;
}
function ar(e, r, t) {
  return r.x <= Math.max(e.x, t.x) && r.x >= Math.min(e.x, t.x) && r.y <= Math.max(e.y, t.y) && r.y >= Math.min(e.y, t.y);
}
function ir(e) {
  return e > 0 ? 1 : e < 0 ? -1 : 0;
}
function en(e, r, t, n) {
  const a = ir(K(e, r, t)), i = ir(K(e, r, n)), s = ir(K(t, n, e)), u = ir(K(t, n, r));
  return !!(a !== i && s !== u || a === 0 && ar(e, t, r) || i === 0 && ar(e, n, r) || s === 0 && ar(t, e, n) || u === 0 && ar(t, r, n));
}
function pa(e) {
  let r = e, t = e;
  do
    (r.x < t.x || r.x === t.x && r.y < t.y) && (t = r), r = r.next;
  while (r !== e);
  return t;
}
function rn(e, r, t, n, a) {
  let i, s;
  if (a === wa(e, r, t, n) > 0)
    for (i = r; i < t; i += n) s = ut(i, e[i], e[i + 1], s);
  else
    for (i = t - n; i >= r; i -= n) s = ut(i, e[i], e[i + 1], s);
  return s && br(s, s.next) && (Ye(s), s = s.next), s;
}
function ca(e, r, t, n) {
  const a = [];
  let i, s, u, o, l;
  for (i = 0, s = r.length; i < s; i++)
    u = r[i] * n, o = i < s - 1 ? r[i + 1] * n : e.length, l = rn(e, u, o, n, !1), l === l.next && (l.steiner = !0), a.push(pa(l));
  for (a.sort(ma), i = 0; i < a.length; i++)
    t = va(a[i], t);
  return t;
}
function va(e, r) {
  const t = xa(e, r);
  if (!t)
    return r;
  const n = tn(t, e);
  return Me(n, n.next), Me(t, t.next);
}
function Me(e, r) {
  if (!e) return e;
  r || (r = e);
  let t = e, n;
  do
    if (n = !1, !t.steiner && (br(t, t.next) || K(t.prev, t, t.next) === 0)) {
      if (Ye(t), t = r = t.prev, t === t.next) break;
      n = !0;
    } else
      t = t.next;
  while (n || t !== r);
  return r;
}
function Ie(e, r, t, n, a, i, s, u) {
  return (a - s) * (r - u) >= (e - s) * (i - u) && (e - s) * (n - u) >= (t - s) * (r - u) && (t - s) * (i - u) >= (a - s) * (n - u);
}
function da(e, r) {
  let t = e;
  do {
    if (t.i !== e.i && t.next.i !== e.i && t.i !== r.i && t.next.i !== r.i && en(t, t.next, e, r)) return !0;
    t = t.next;
  } while (t !== e);
  return !1;
}
function qe(e, r) {
  return K(e.prev, e, e.next) < 0 ? K(e, r, e.next) >= 0 && K(e, e.prev, r) >= 0 : K(e, r, e.prev) < 0 || K(e, e.next, r) < 0;
}
function ga(e, r) {
  return K(e.prev, e, r.prev) < 0 && K(r.next, e, e.next) < 0;
}
function xa(e, r) {
  let t = r, n = -1 / 0, a;
  const i = e.x, s = e.y;
  do {
    if (s <= t.y && s >= t.next.y && t.next.y !== t.y) {
      const h = t.x + (s - t.y) * (t.next.x - t.x) / (t.next.y - t.y);
      if (h <= i && h > n && (n = h, a = t.x < t.next.x ? t : t.next, h === i))
        return a;
    }
    t = t.next;
  } while (t !== r);
  if (!a) return null;
  const u = a, o = a.x, l = a.y;
  let f = 1 / 0, p;
  t = a;
  do
    i >= t.x && t.x >= o && i !== t.x && Ie(s < l ? i : n, s, o, l, s < l ? n : i, s, t.x, t.y) && (p = Math.abs(s - t.y) / (i - t.x), qe(t, e) && (p < f || p === f && (t.x > a.x || t.x === a.x && ga(a, t))) && (a = t, f = p)), t = t.next;
  while (t !== u);
  return a;
}
function ma(e, r) {
  return e.x - r.x;
}
function ya(e) {
  let r, t, n, a, i, s, u, o, l = 1;
  do {
    for (t = e, e = null, i = null, s = 0; t; ) {
      for (s++, n = t, u = 0, r = 0; r < l && (u++, n = n.nextZ, !!n); r++)
        ;
      for (o = l; u > 0 || o > 0 && n; )
        u !== 0 && (o === 0 || !n || t.z <= n.z) ? (a = t, t = t.nextZ, u--) : (a = n, n = n.nextZ, o--), i ? i.nextZ = a : e = a, a.prevZ = i, i = a;
      t = n;
    }
    i.nextZ = null, l *= 2;
  } while (s > 1);
  return e;
}
function Ar(e, r, t, n, a) {
  return e = (e - t) * a | 0, r = (r - n) * a | 0, e = (e | e << 8) & 16711935, e = (e | e << 4) & 252645135, e = (e | e << 2) & 858993459, e = (e | e << 1) & 1431655765, r = (r | r << 8) & 16711935, r = (r | r << 4) & 252645135, r = (r | r << 2) & 858993459, r = (r | r << 1) & 1431655765, e | r << 1;
}
function ba(e, r, t, n) {
  let a = e;
  do
    a.z === 0 && (a.z = Ar(a.x, a.y, r, t, n)), a.prevZ = a.prev, a.nextZ = a.next, a = a.next;
  while (a !== e);
  a.prevZ.nextZ = null, a.prevZ = null, ya(a);
}
function Sa(e, r, t, n) {
  const a = e.prev, i = e, s = e.next;
  if (K(a, i, s) >= 0) return !1;
  const u = a.x, o = i.x, l = s.x, f = a.y, p = i.y, h = s.y, c = u < o ? u < l ? u : l : o < l ? o : l, d = f < p ? f < h ? f : h : p < h ? p : h, m = u > o ? u > l ? u : l : o > l ? o : l, y = f > p ? f > h ? f : h : p > h ? p : h, x = Ar(c, d, r, t, n), F = Ar(m, y, r, t, n);
  let g = e.prevZ, T = e.nextZ;
  for (; g && g.z >= x && T && T.z <= F; ) {
    if (g.x >= c && g.x <= m && g.y >= d && g.y <= y && g !== a && g !== s && Ie(u, f, o, p, l, h, g.x, g.y) && K(g.prev, g, g.next) >= 0 || (g = g.prevZ, T.x >= c && T.x <= m && T.y >= d && T.y <= y && T !== a && T !== s && Ie(u, f, o, p, l, h, T.x, T.y) && K(T.prev, T, T.next) >= 0)) return !1;
    T = T.nextZ;
  }
  for (; g && g.z >= x; ) {
    if (g.x >= c && g.x <= m && g.y >= d && g.y <= y && g !== a && g !== s && Ie(u, f, o, p, l, h, g.x, g.y) && K(g.prev, g, g.next) >= 0) return !1;
    g = g.prevZ;
  }
  for (; T && T.z <= F; ) {
    if (T.x >= c && T.x <= m && T.y >= d && T.y <= y && T !== a && T !== s && Ie(u, f, o, p, l, h, T.x, T.y) && K(T.prev, T, T.next) >= 0) return !1;
    T = T.nextZ;
  }
  return !0;
}
function Ta(e, r, t) {
  let n = e;
  do {
    const a = n.prev, i = n.next.next;
    !br(a, i) && en(a, n, n.next, i) && qe(a, i) && qe(i, a) && (r.push(a.i / t | 0), r.push(n.i / t | 0), r.push(i.i / t | 0), Ye(n), Ye(n.next), n = e = i), n = n.next;
  } while (n !== e);
  return Me(n);
}
function ka(e, r, t, n, a, i) {
  let s = e;
  do {
    let u = s.next.next;
    for (; u !== s.prev; ) {
      if (s.i !== u.i && ha(s, u)) {
        let o = tn(s, u);
        s = Me(s, s.next), o = Me(o, o.next), Ze(s, r, t, n, a, i, 0), Ze(o, r, t, n, a, i, 0);
        return;
      }
      u = u.next;
    }
    s = s.next;
  } while (s !== e);
}
function Fa(e) {
  const r = e.prev, t = e, n = e.next;
  if (K(r, t, n) >= 0) return !1;
  const a = r.x, i = t.x, s = n.x, u = r.y, o = t.y, l = n.y, f = a < i ? a < s ? a : s : i < s ? i : s, p = u < o ? u < l ? u : l : o < l ? o : l, h = a > i ? a > s ? a : s : i > s ? i : s, c = u > o ? u > l ? u : l : o > l ? o : l;
  let d = n.next;
  for (; d !== r; ) {
    if (d.x >= f && d.x <= h && d.y >= p && d.y <= c && Ie(a, u, i, o, s, l, d.x, d.y) && K(d.prev, d, d.next) >= 0) return !1;
    d = d.next;
  }
  return !0;
}
function Ze(e, r, t, n, a, i, s) {
  if (!e) return;
  !s && i && ba(e, n, a, i);
  let u = e, o, l;
  for (; e.prev !== e.next; ) {
    if (o = e.prev, l = e.next, i ? Sa(e, n, a, i) : Fa(e)) {
      r.push(o.i / t | 0), r.push(e.i / t | 0), r.push(l.i / t | 0), Ye(e), e = l.next, u = l.next;
      continue;
    }
    if (e = l, e === u) {
      s ? s === 1 ? (e = Ta(Me(e), r, t), Ze(e, r, t, n, a, i, 2)) : s === 2 && ka(e, r, t, n, a, i) : Ze(Me(e), r, t, n, a, i, 1);
      break;
    }
  }
}
function tn(e, r) {
  const t = new Pr(e.i, e.x, e.y), n = new Pr(r.i, r.x, r.y), a = e.next, i = r.prev;
  return e.next = r, r.prev = e, t.next = a, a.prev = t, n.next = t, t.prev = n, i.next = n, n.prev = i, n;
}
function ut(e, r, t, n) {
  const a = new Pr(e, r, t);
  return n ? (a.next = n.next, a.prev = n, n.next.prev = a, n.next = a) : (a.prev = a, a.next = a), a;
}
function Ye(e) {
  e.next.prev = e.prev, e.prev.next = e.next, e.prevZ && (e.prevZ.nextZ = e.nextZ), e.nextZ && (e.nextZ.prevZ = e.prevZ);
}
function Pr(e, r, t) {
  this.i = e, this.x = r, this.y = t, this.prev = null, this.next = null, this.z = 0, this.prevZ = null, this.nextZ = null, this.steiner = !1;
}
function wa(e, r, t, n) {
  let a = 0;
  for (let i = r, s = t - n; i < t; i += n)
    a += (e[s] - e[i]) * (e[i + 1] + e[s + 1]), s = i;
  return a;
}
class Ge {
  static isClockWise(r) {
    return Ge.area(r) < 0;
  }
  static area(r) {
    let t = 0;
    const n = r.length;
    for (let a = n - 1, i = 0; i < n; a = i++)
      t += r[a].x * r[i].y - r[i].x * r[a].y;
    return t * 0.5;
  }
  static triangulateShape(r, t) {
    const n = [], a = [], i = [];
    lt(r), ft(a, r);
    let s = r.length;
    t.forEach(lt);
    for (let o = 0; o < t.length; o++)
      i.push(s), s += t[o].length, ft(a, t[o]);
    const u = la.triangulate(a, i);
    for (let o = 0; o < u.length; o += 3)
      n.push(u.slice(o, o + 3));
    return n;
  }
}
function lt(e) {
  const r = e.length;
  r > 2 && e[r - 1].equals(e[0]) && e.pop();
}
function ft(e, r) {
  for (let t = 0; t < r.length; t++)
    e.push(r[t].x), e.push(r[t].y);
}
class Ua extends jt {
  shapes;
  options;
  verticesArray = [];
  uvArray = [];
  constructor(r, t) {
    super(), this.options = t, this.shapes = r, this.shapes && this.shapes.length > 0 && this.buildGeometry(t);
  }
  getExtractPointsAndBoundingSize(r, t) {
    const n = t.depth !== void 0 ? t.depth : 1, a = t.curveSegments !== void 0 ? t.curveSegments : 12;
    let i = new xe(1 / 0, 1 / 0, n > 0 ? 0 : n), s = new xe(-1 / 0, -1 / 0, n < 0 ? 0 : n), u = [];
    for (let o of this.shapes) {
      const l = o.extractPoints(a);
      u.push(l);
      let f = l.shape;
      for (let p = 0; p < f.length; p++) {
        const h = f[p];
        h.x < i.x && (i.x = h.x), h.y < i.y && (i.y = h.y), h.x > s.x && (s.x = h.x), h.y > s.y && (s.y = h.y);
      }
    }
    return {
      ShapePoints: u,
      BoundingSize: { min: i, max: s }
    };
  }
  buildGeometry(r) {
    this.verticesArray = [], this.uvArray = [];
    let t = r.anchorPoint !== void 0 ? r.anchorPoint : new xe(0, 0, 0.5);
    const n = this.getExtractPointsAndBoundingSize(this.shapes, r), a = n.BoundingSize.min.subtract(n.BoundingSize.max);
    a.multiply(t, a);
    for (let s of this.shapes)
      this.addShape(s, r, a);
    const i = new Uint32Array(this.verticesArray.length / 3);
    for (let s = 0; s < i.length; s += 3)
      i[s] = s, i[s + 1] = s + 2, i[s + 2] = s + 1;
    this.setIndices(i), this.setAttribute(ue.position, new Float32Array(this.verticesArray)), this.setAttribute(ue.normal, new Float32Array(this.verticesArray.length)), this.setAttribute(ue.uv, new Float32Array(this.uvArray)), this.computeNormals();
  }
  addGroup(r, t, n = 0) {
    this.addSubGeometry({
      indexStart: r,
      indexCount: t,
      vertexStart: 0,
      vertexCount: 0,
      firstStart: 0,
      index: 0,
      topology: 0
    });
  }
  addShape(r, t, n) {
    const a = this.verticesArray, i = this.uvArray, s = this, u = t.curveSegments !== void 0 ? t.curveSegments : 12, o = t.steps !== void 0 ? t.steps : 1, l = t.depth !== void 0 ? t.depth : 1;
    let f = t.bevelEnabled !== void 0 ? t.bevelEnabled : !0, p = t.bevelThickness !== void 0 ? t.bevelThickness : 0.2, h = t.bevelSize !== void 0 ? t.bevelSize : p - 0.1, c = t.bevelOffset !== void 0 ? t.bevelOffset : 0, d = t.bevelSegments !== void 0 ? t.bevelSegments : 3;
    f || (d = 0, p = 0, h = 0, c = 0);
    const m = [], y = r.extractPoints(u);
    let x = y.shape;
    const F = y.holes;
    for (let b = 0; b < x.length; b++) {
      const S = x[b];
      S.x += n.x, S.y += n.y;
    }
    for (let b = 0; b < F.length; b++) {
      const S = F[b];
      for (let R = 0; R < S.length; R++) {
        const B = S[R];
        B.x += n.x, B.y += n.y;
      }
    }
    !Ge.isClockWise(x) && (x = x.reverse());
    for (let b = 0; b < F.length; b++) {
      const S = F[b];
      Ge.isClockWise(S) && (F[b] = S.reverse());
    }
    const T = Ge.triangulateShape(x, F), O = x;
    for (let b = 0; b < F.length; b++) {
      const S = F[b];
      x = x.concat(S);
    }
    const P = x.length, L = T.length, U = [];
    for (let b = 0, S = O.length - 1, R = b + 1; b < O.length; b++, S++, R++)
      S === O.length && (S = 0), R === O.length && (R = 0), U[b] = this.getBevelVec(O[b], O[S], O[R]);
    const G = [];
    let N, V = U.concat();
    for (let b = 0, S = F.length; b < S; b++) {
      const R = F[b];
      N = [];
      for (let B = 0, A = R.length - 1, H = B + 1; B < R.length; B++, A++, H++)
        A === R.length && (A = 0), H === R.length && (H = 0), N[B] = this.getBevelVec(R[B], R[A], R[H]);
      G.push(N), V = V.concat(N);
    }
    for (let b = 0; b < d; b++) {
      const S = b / d, R = p * Math.cos(S * Math.PI / 2), B = h * Math.sin(S * Math.PI / 2) + c;
      for (let A = 0; A < O.length; A++) {
        const H = this.scalePoint2(O[A], U[A], B);
        W(H.x, H.y, -R + n.z);
      }
      for (let A = 0, H = F.length; A < H; A++) {
        const Q = F[A];
        N = G[A];
        for (let ae = 0; ae < Q.length; ae++) {
          const Ee = this.scalePoint2(Q[ae], N[ae], B);
          W(Ee.x, Ee.y, -R + n.z);
        }
      }
    }
    const $ = h + c;
    for (let b = 0; b < P; b++) {
      const S = f ? this.scalePoint2(x[b], V[b], $) : x[b];
      W(S.x, S.y, 0 + n.z);
    }
    for (let b = 1; b <= o; b++)
      for (let S = 0; S < P; S++) {
        const R = f ? this.scalePoint2(x[S], V[S], $) : x[S];
        W(R.x, R.y, l / o * b + n.z);
      }
    for (let b = d - 1; b >= 0; b--) {
      const S = b / d, R = p * Math.cos(S * Math.PI / 2), B = h * Math.sin(S * Math.PI / 2) + c;
      for (let A = 0, H = O.length; A < H; A++) {
        const Q = this.scalePoint2(O[A], U[A], B);
        W(Q.x, Q.y, l + R + n.z);
      }
      for (let A = 0, H = F.length; A < H; A++) {
        const Q = F[A];
        N = G[A];
        for (let ae = 0, Ee = Q.length; ae < Ee; ae++) {
          const Ve = this.scalePoint2(Q[ae], N[ae], B);
          W(Ve.x, Ve.y, l + R + n.z);
        }
      }
    }
    function te() {
      const b = a.length / 3;
      if (f) {
        let S = 0, R = P * S;
        for (let B = 0; B < L; B++) {
          const A = T[B];
          X(A[2] + R, A[1] + R, A[0] + R);
        }
        S = o + d * 2, R = P * S;
        for (let B = 0; B < L; B++) {
          const A = T[B];
          X(A[0] + R, A[1] + R, A[2] + R);
        }
      } else {
        for (let S = 0; S < L; S++) {
          const R = T[S];
          X(R[2], R[1], R[0]);
        }
        for (let S = 0; S < L; S++) {
          const R = T[S];
          X(R[0] + P * o, R[1] + P * o, R[2] + P * o);
        }
      }
      s.addGroup(b, a.length / 3 - b, 0);
    }
    function Z() {
      const b = a.length / 3;
      let S = 0;
      _(O, S), S += O.length;
      for (let R = 0, B = F.length; R < B; R++) {
        const A = F[R];
        _(A, S), S += A.length;
      }
      s.addGroup(b, a.length / 3 - b, 1);
    }
    function _(b, S, R = !1) {
      let B = b.length;
      for (; --B >= 0; ) {
        const A = B;
        let H = B - 1;
        H < 0 && (H = b.length - 1);
        for (let Q = 0, ae = o + d * 2; Q < ae; Q++) {
          const Ee = P * Q, Ve = P * (Q + 1), Kn = S + A + Ee, Jn = S + H + Ee, jn = S + H + Ve, $n = S + A + Ve;
          ee(Kn, Jn, jn, $n, R);
        }
      }
    }
    function W(b, S, R) {
      m.push(b), m.push(S), m.push(R);
    }
    function X(b, S, R, B = !1) {
      B ? (I(b), I(S), I(R)) : (I(b), I(R), I(S));
      const A = a.length / 3, H = ht.generateTopUV(a, A - 3, A - 2, A - 1);
      Y(H[0]), Y(H[1]), Y(H[2]);
    }
    function ee(b, S, R, B, A = !1) {
      A ? (I(b), I(S), I(B), I(S), I(R), I(B)) : (I(b), I(B), I(S), I(S), I(B), I(R));
      const H = a.length / 3, Q = ht.generateSideWallUV(a, H - 6, H - 3, H - 2, H - 1);
      Y(Q[0]), Y(Q[1]), Y(Q[3]), Y(Q[1]), Y(Q[2]), Y(Q[3]);
    }
    function I(b) {
      a.push(m[b * 3 + 0]), a.push(m[b * 3 + 1]), a.push(m[b * 3 + 2]);
    }
    function Y(b) {
      i.push(b.x), i.push(b.y);
    }
    te(), Z();
  }
  scalePoint2(r, t, n) {
    return r.clone().addScaledVector(t, n);
  }
  getBevelVec(r, t, n) {
    let a, i, s;
    const u = r.x - t.x, o = r.y - t.y, l = n.x - r.x, f = n.y - r.y, p = u * u + o * o, h = u * f - o * l;
    if (Math.abs(h) > Number.EPSILON) {
      const c = Math.sqrt(p), d = Math.sqrt(l * l + f * f), m = t.x - o / c, y = t.y + u / c, x = n.x - f / d, F = n.y + l / d, g = ((x - m) * f - (F - y) * l) / (u * f - o * l);
      a = m + u * g - r.x, i = y + o * g - r.y;
      const T = a * a + i * i;
      if (T <= 2)
        return new z(a, i);
      s = Math.sqrt(T / 2);
    } else {
      let c = !1;
      u > Number.EPSILON ? l > Number.EPSILON && (c = !0) : u < -Number.EPSILON ? l < -Number.EPSILON && (c = !0) : Math.sign(o) === Math.sign(f) && (c = !0), c ? (a = -o, i = u, s = Math.sqrt(p)) : (a = u, i = o, s = Math.sqrt(p / 2));
    }
    return new z(a / s, i / s);
  }
}
class ht {
  static generateTopUV(r, t, n, a) {
    const i = r[t * 3], s = r[t * 3 + 1], u = r[n * 3], o = r[n * 3 + 1], l = r[a * 3], f = r[a * 3 + 1];
    return [
      new z(i, s),
      new z(u, o),
      new z(l, f)
    ];
  }
  static generateSideWallUV(r, t, n, a, i) {
    const s = r[t * 3], u = r[t * 3 + 1], o = r[t * 3 + 2], l = r[n * 3], f = r[n * 3 + 1], p = r[n * 3 + 2], h = r[a * 3], c = r[a * 3 + 1], d = r[a * 3 + 2], m = r[i * 3], y = r[i * 3 + 1], x = r[i * 3 + 2];
    return Math.abs(u - f) < Math.abs(s - l) ? [
      new z(s, 1 - o),
      new z(l, 1 - p),
      new z(h, 1 - d),
      new z(m, 1 - x)
    ] : [
      new z(u, 1 - o),
      new z(f, 1 - p),
      new z(c, 1 - d),
      new z(y, 1 - x)
    ];
  }
}
class Ca {
  autoClose = !1;
  curves = [];
  currentPoint = new z();
  constructor(r) {
    r && this.setFromPoints(r);
  }
  getPoints(r) {
    let t;
    const n = [];
    for (let a = 0, i = this.curves; a < i.length; a++) {
      const s = i[a], u = s.curveType == Be.EllipseCurve ? r * 2 : s.curveType == Be.LineCurve ? 1 : s.curveType == Be.SplineCurve ? r * s.points.length : r, o = s.getPoints(u);
      for (let l = 0; l < o.length; l++) {
        const f = o[l];
        t && t.equals(f) || (n.push(f), t = f);
      }
    }
    return this.autoClose && n.length > 1 && !n[n.length - 1].equals(n[0]) && n.push(n[0]), n;
  }
  setFromPoints(r) {
    this.moveTo(r[0].x, r[0].y);
    for (let t = 1; t < r.length; t++)
      this.lineTo(r[t].x, r[t].y);
    return this;
  }
  moveTo(r, t) {
    return this.currentPoint.set(r, t), this;
  }
  lineTo(r, t) {
    return this.curves.push(new sa(this.currentPoint.clone(), new z(r, t))), this.currentPoint.set(r, t), this;
  }
  quadraticCurveTo(r, t, n, a) {
    return this.curves.push(new ua(this.currentPoint.clone(), new z(r, t), new z(n, a))), this.currentPoint.set(n, a), this;
  }
  bezierCurveTo(r, t, n, a, i, s) {
    return this.curves.push(new oa(this.currentPoint.clone(), new z(r, t), new z(n, a), new z(i, s))), this.currentPoint.set(i, s), this;
  }
  isIntersect(r) {
    let t = this.getPoints(1), n = r.getPoints(1);
    return this.pointInPolygon(n[0], t);
  }
  pointInPolygon(r, t) {
    let n = !1;
    const a = r.x, i = r.y, s = t;
    let u = s.length - 1;
    for (let o = 0; o < s.length; o++) {
      const l = s[o].x, f = s[o].y, p = s[u].x, h = s[u].y;
      f > i != h > i && a < (p - l) * (i - f) / (h - f) + l && (n = !n), u = o;
    }
    return n;
  }
}
class pt extends Ca {
  holes = [];
  constructor(r) {
    super(r);
  }
  extractPoints(r) {
    return {
      shape: this.getPoints(r),
      holes: this.getPointsHoles(r)
    };
  }
  getPointsHoles(r) {
    const t = [];
    for (let n = 0, a = this.holes.length; n < a; n++)
      t[n] = this.holes[n].getPoints(r);
    return t;
  }
}
/*! https://mths.be/codepointat v0.2.0 by @mathias */
String.prototype.codePointAt || function() {
  var e = function() {
    try {
      var t = {}, n = Object.defineProperty, a = n(t, t, t) && n;
    } catch {
    }
    return a;
  }(), r = function(t) {
    if (this == null)
      throw TypeError();
    var n = String(this), a = n.length, i = t ? Number(t) : 0;
    if (i != i && (i = 0), !(i < 0 || i >= a)) {
      var s = n.charCodeAt(i), u;
      return (
        // check if it’s the start of a surrogate pair
        s >= 55296 && s <= 56319 && // high surrogate
        a > i + 1 && (u = n.charCodeAt(i + 1), u >= 56320 && u <= 57343) ? (s - 55296) * 1024 + u - 56320 + 65536 : s
      );
    }
  };
  e ? e(String.prototype, "codePointAt", {
    value: r,
    configurable: !0,
    writable: !0
  }) : String.prototype.codePointAt = r;
}();
var qr = 0, nn = -3;
function Qe() {
  this.table = new Uint16Array(16), this.trans = new Uint16Array(288);
}
function Oa(e, r) {
  this.source = e, this.sourceIndex = 0, this.tag = 0, this.bitcount = 0, this.dest = r, this.destLen = 0, this.ltree = new Qe(), this.dtree = new Qe();
}
var an = new Qe(), sn = new Qe(), Zr = new Uint8Array(30), Yr = new Uint16Array(30), on = new Uint8Array(30), un = new Uint16Array(30), Ea = new Uint8Array([
  16,
  17,
  18,
  0,
  8,
  7,
  9,
  6,
  10,
  5,
  11,
  4,
  12,
  3,
  13,
  2,
  14,
  1,
  15
]), ct = new Qe(), ve = new Uint8Array(320);
function ln(e, r, t, n) {
  var a, i;
  for (a = 0; a < t; ++a)
    e[a] = 0;
  for (a = 0; a < 30 - t; ++a)
    e[a + t] = a / t | 0;
  for (i = n, a = 0; a < 30; ++a)
    r[a] = i, i += 1 << e[a];
}
function Ra(e, r) {
  var t;
  for (t = 0; t < 7; ++t)
    e.table[t] = 0;
  for (e.table[7] = 24, e.table[8] = 152, e.table[9] = 112, t = 0; t < 24; ++t)
    e.trans[t] = 256 + t;
  for (t = 0; t < 144; ++t)
    e.trans[24 + t] = t;
  for (t = 0; t < 8; ++t)
    e.trans[168 + t] = 280 + t;
  for (t = 0; t < 112; ++t)
    e.trans[176 + t] = 144 + t;
  for (t = 0; t < 5; ++t)
    r.table[t] = 0;
  for (r.table[5] = 32, t = 0; t < 32; ++t)
    r.trans[t] = t;
}
var vt = new Uint16Array(16);
function wr(e, r, t, n) {
  var a, i;
  for (a = 0; a < 16; ++a)
    e.table[a] = 0;
  for (a = 0; a < n; ++a)
    e.table[r[t + a]]++;
  for (e.table[0] = 0, i = 0, a = 0; a < 16; ++a)
    vt[a] = i, i += e.table[a];
  for (a = 0; a < n; ++a)
    r[t + a] && (e.trans[vt[r[t + a]]++] = a);
}
function La(e) {
  e.bitcount-- || (e.tag = e.source[e.sourceIndex++], e.bitcount = 7);
  var r = e.tag & 1;
  return e.tag >>>= 1, r;
}
function de(e, r, t) {
  if (!r)
    return t;
  for (; e.bitcount < 24; )
    e.tag |= e.source[e.sourceIndex++] << e.bitcount, e.bitcount += 8;
  var n = e.tag & 65535 >>> 16 - r;
  return e.tag >>>= r, e.bitcount -= r, n + t;
}
function Ir(e, r) {
  for (; e.bitcount < 24; )
    e.tag |= e.source[e.sourceIndex++] << e.bitcount, e.bitcount += 8;
  var t = 0, n = 0, a = 0, i = e.tag;
  do
    n = 2 * n + (i & 1), i >>>= 1, ++a, t += r.table[a], n -= r.table[a];
  while (n >= 0);
  return e.tag = i, e.bitcount -= a, r.trans[t + n];
}
function Da(e, r, t) {
  var n, a, i, s, u, o;
  for (n = de(e, 5, 257), a = de(e, 5, 1), i = de(e, 4, 4), s = 0; s < 19; ++s)
    ve[s] = 0;
  for (s = 0; s < i; ++s) {
    var l = de(e, 3, 0);
    ve[Ea[s]] = l;
  }
  for (wr(ct, ve, 0, 19), u = 0; u < n + a; ) {
    var f = Ir(e, ct);
    switch (f) {
      case 16:
        var p = ve[u - 1];
        for (o = de(e, 2, 3); o; --o)
          ve[u++] = p;
        break;
      case 17:
        for (o = de(e, 3, 3); o; --o)
          ve[u++] = 0;
        break;
      case 18:
        for (o = de(e, 7, 11); o; --o)
          ve[u++] = 0;
        break;
      default:
        ve[u++] = f;
        break;
    }
  }
  wr(r, ve, 0, n), wr(t, ve, n, a);
}
function dt(e, r, t) {
  for (; ; ) {
    var n = Ir(e, r);
    if (n === 256)
      return qr;
    if (n < 256)
      e.dest[e.destLen++] = n;
    else {
      var a, i, s, u;
      for (n -= 257, a = de(e, Zr[n], Yr[n]), i = Ir(e, t), s = e.destLen - de(e, on[i], un[i]), u = s; u < s + a; ++u)
        e.dest[e.destLen++] = e.dest[u];
    }
  }
}
function Ma(e) {
  for (var r, t, n; e.bitcount > 8; )
    e.sourceIndex--, e.bitcount -= 8;
  if (r = e.source[e.sourceIndex + 1], r = 256 * r + e.source[e.sourceIndex], t = e.source[e.sourceIndex + 3], t = 256 * t + e.source[e.sourceIndex + 2], r !== (~t & 65535))
    return nn;
  for (e.sourceIndex += 4, n = r; n; --n)
    e.dest[e.destLen++] = e.source[e.sourceIndex++];
  return e.bitcount = 0, qr;
}
function Aa(e, r) {
  var t = new Oa(e, r), n, a, i;
  do {
    switch (n = La(t), a = de(t, 2, 0), a) {
      case 0:
        i = Ma(t);
        break;
      case 1:
        i = dt(t, an, sn);
        break;
      case 2:
        Da(t, t.ltree, t.dtree), i = dt(t, t.ltree, t.dtree);
        break;
      default:
        i = nn;
    }
    if (i !== qr)
      throw new Error("Data error");
  } while (!n);
  return t.destLen < t.dest.length ? typeof t.dest.slice == "function" ? t.dest.slice(0, t.destLen) : t.dest.subarray(0, t.destLen) : t.dest;
}
Ra(an, sn);
ln(Zr, Yr, 4, 3);
ln(on, un, 2, 1);
Zr[28] = 0;
Yr[28] = 258;
var Pa = Aa;
function Pe(e, r, t, n, a) {
  return Math.pow(1 - a, 3) * e + 3 * Math.pow(1 - a, 2) * a * r + 3 * (1 - a) * Math.pow(a, 2) * t + Math.pow(a, 3) * n;
}
function Oe() {
  this.x1 = Number.NaN, this.y1 = Number.NaN, this.x2 = Number.NaN, this.y2 = Number.NaN;
}
Oe.prototype.isEmpty = function() {
  return isNaN(this.x1) || isNaN(this.y1) || isNaN(this.x2) || isNaN(this.y2);
};
Oe.prototype.addPoint = function(e, r) {
  typeof e == "number" && ((isNaN(this.x1) || isNaN(this.x2)) && (this.x1 = e, this.x2 = e), e < this.x1 && (this.x1 = e), e > this.x2 && (this.x2 = e)), typeof r == "number" && ((isNaN(this.y1) || isNaN(this.y2)) && (this.y1 = r, this.y2 = r), r < this.y1 && (this.y1 = r), r > this.y2 && (this.y2 = r));
};
Oe.prototype.addX = function(e) {
  this.addPoint(e, null);
};
Oe.prototype.addY = function(e) {
  this.addPoint(null, e);
};
Oe.prototype.addBezier = function(e, r, t, n, a, i, s, u) {
  var o = [e, r], l = [t, n], f = [a, i], p = [s, u];
  this.addPoint(e, r), this.addPoint(s, u);
  for (var h = 0; h <= 1; h++) {
    var c = 6 * o[h] - 12 * l[h] + 6 * f[h], d = -3 * o[h] + 9 * l[h] - 9 * f[h] + 3 * p[h], m = 3 * l[h] - 3 * o[h];
    if (d === 0) {
      if (c === 0)
        continue;
      var y = -m / c;
      0 < y && y < 1 && (h === 0 && this.addX(Pe(o[h], l[h], f[h], p[h], y)), h === 1 && this.addY(Pe(o[h], l[h], f[h], p[h], y)));
      continue;
    }
    var x = Math.pow(c, 2) - 4 * m * d;
    if (!(x < 0)) {
      var F = (-c + Math.sqrt(x)) / (2 * d);
      0 < F && F < 1 && (h === 0 && this.addX(Pe(o[h], l[h], f[h], p[h], F)), h === 1 && this.addY(Pe(o[h], l[h], f[h], p[h], F)));
      var g = (-c - Math.sqrt(x)) / (2 * d);
      0 < g && g < 1 && (h === 0 && this.addX(Pe(o[h], l[h], f[h], p[h], g)), h === 1 && this.addY(Pe(o[h], l[h], f[h], p[h], g)));
    }
  }
};
Oe.prototype.addQuad = function(e, r, t, n, a, i) {
  var s = e + 0.6666666666666666 * (t - e), u = r + 2 / 3 * (n - r), o = s + 1 / 3 * (a - e), l = u + 1 / 3 * (i - r);
  this.addBezier(e, r, s, u, o, l, a, i);
};
function re() {
  this.commands = [], this.fill = "black", this.stroke = null, this.strokeWidth = 1;
}
re.prototype.moveTo = function(e, r) {
  this.commands.push({
    type: "M",
    x: e,
    y: r
  });
};
re.prototype.lineTo = function(e, r) {
  this.commands.push({
    type: "L",
    x: e,
    y: r
  });
};
re.prototype.curveTo = re.prototype.bezierCurveTo = function(e, r, t, n, a, i) {
  this.commands.push({
    type: "C",
    x1: e,
    y1: r,
    x2: t,
    y2: n,
    x: a,
    y: i
  });
};
re.prototype.quadTo = re.prototype.quadraticCurveTo = function(e, r, t, n) {
  this.commands.push({
    type: "Q",
    x1: e,
    y1: r,
    x: t,
    y: n
  });
};
re.prototype.close = re.prototype.closePath = function() {
  this.commands.push({
    type: "Z"
  });
};
re.prototype.extend = function(e) {
  if (e.commands)
    e = e.commands;
  else if (e instanceof Oe) {
    var r = e;
    this.moveTo(r.x1, r.y1), this.lineTo(r.x2, r.y1), this.lineTo(r.x2, r.y2), this.lineTo(r.x1, r.y2), this.close();
    return;
  }
  Array.prototype.push.apply(this.commands, e);
};
re.prototype.getBoundingBox = function() {
  for (var e = new Oe(), r = 0, t = 0, n = 0, a = 0, i = 0; i < this.commands.length; i++) {
    var s = this.commands[i];
    switch (s.type) {
      case "M":
        e.addPoint(s.x, s.y), r = n = s.x, t = a = s.y;
        break;
      case "L":
        e.addPoint(s.x, s.y), n = s.x, a = s.y;
        break;
      case "Q":
        e.addQuad(n, a, s.x1, s.y1, s.x, s.y), n = s.x, a = s.y;
        break;
      case "C":
        e.addBezier(n, a, s.x1, s.y1, s.x2, s.y2, s.x, s.y), n = s.x, a = s.y;
        break;
      case "Z":
        n = r, a = t;
        break;
      default:
        throw new Error("Unexpected path command " + s.type);
    }
  }
  return e.isEmpty() && e.addPoint(0, 0), e;
};
re.prototype.draw = function(e) {
  e.beginPath();
  for (var r = 0; r < this.commands.length; r += 1) {
    var t = this.commands[r];
    t.type === "M" ? e.moveTo(t.x, t.y) : t.type === "L" ? e.lineTo(t.x, t.y) : t.type === "C" ? e.bezierCurveTo(t.x1, t.y1, t.x2, t.y2, t.x, t.y) : t.type === "Q" ? e.quadraticCurveTo(t.x1, t.y1, t.x, t.y) : t.type === "Z" && e.closePath();
  }
  this.fill && (e.fillStyle = this.fill, e.fill()), this.stroke && (e.strokeStyle = this.stroke, e.lineWidth = this.strokeWidth, e.stroke());
};
re.prototype.toPathData = function(e) {
  e = e !== void 0 ? e : 2;
  function r(s) {
    return Math.round(s) === s ? "" + Math.round(s) : s.toFixed(e);
  }
  function t() {
    for (var s = arguments, u = "", o = 0; o < arguments.length; o += 1) {
      var l = s[o];
      l >= 0 && o > 0 && (u += " "), u += r(l);
    }
    return u;
  }
  for (var n = "", a = 0; a < this.commands.length; a += 1) {
    var i = this.commands[a];
    i.type === "M" ? n += "M" + t(i.x, i.y) : i.type === "L" ? n += "L" + t(i.x, i.y) : i.type === "C" ? n += "C" + t(i.x1, i.y1, i.x2, i.y2, i.x, i.y) : i.type === "Q" ? n += "Q" + t(i.x1, i.y1, i.x, i.y) : i.type === "Z" && (n += "Z");
  }
  return n;
};
re.prototype.toSVG = function(e) {
  var r = '<path d="';
  return r += this.toPathData(e), r += '"', this.fill && this.fill !== "black" && (this.fill === null ? r += ' fill="none"' : r += ' fill="' + this.fill + '"'), this.stroke && (r += ' stroke="' + this.stroke + '" stroke-width="' + this.strokeWidth + '"'), r += "/>", r;
};
re.prototype.toDOMElement = function(e) {
  var r = this.toPathData(e), t = document.createElementNS("http://www.w3.org/2000/svg", "path");
  return t.setAttribute("d", r), t;
};
function fn(e) {
  throw new Error(e);
}
function gt(e, r) {
  e || fn(r);
}
var D = { fail: fn, argument: gt, assert: gt }, xt = 32768, mt = 2147483648, _e = {}, k = {}, M = {};
function pe(e) {
  return function() {
    return e;
  };
}
k.BYTE = function(e) {
  return D.argument(e >= 0 && e <= 255, "Byte value should be between 0 and 255."), [e];
};
M.BYTE = pe(1);
k.CHAR = function(e) {
  return [e.charCodeAt(0)];
};
M.CHAR = pe(1);
k.CHARARRAY = function(e) {
  typeof e > "u" && (e = "", console.warn("Undefined CHARARRAY encountered and treated as an empty string. This is probably caused by a missing glyph name."));
  for (var r = [], t = 0; t < e.length; t += 1)
    r[t] = e.charCodeAt(t);
  return r;
};
M.CHARARRAY = function(e) {
  return typeof e > "u" ? 0 : e.length;
};
k.USHORT = function(e) {
  return [e >> 8 & 255, e & 255];
};
M.USHORT = pe(2);
k.SHORT = function(e) {
  return e >= xt && (e = -(2 * xt - e)), [e >> 8 & 255, e & 255];
};
M.SHORT = pe(2);
k.UINT24 = function(e) {
  return [e >> 16 & 255, e >> 8 & 255, e & 255];
};
M.UINT24 = pe(3);
k.ULONG = function(e) {
  return [e >> 24 & 255, e >> 16 & 255, e >> 8 & 255, e & 255];
};
M.ULONG = pe(4);
k.LONG = function(e) {
  return e >= mt && (e = -(2 * mt - e)), [e >> 24 & 255, e >> 16 & 255, e >> 8 & 255, e & 255];
};
M.LONG = pe(4);
k.FIXED = k.ULONG;
M.FIXED = M.ULONG;
k.FWORD = k.SHORT;
M.FWORD = M.SHORT;
k.UFWORD = k.USHORT;
M.UFWORD = M.USHORT;
k.LONGDATETIME = function(e) {
  return [0, 0, 0, 0, e >> 24 & 255, e >> 16 & 255, e >> 8 & 255, e & 255];
};
M.LONGDATETIME = pe(8);
k.TAG = function(e) {
  return D.argument(e.length === 4, "Tag should be exactly 4 ASCII characters."), [
    e.charCodeAt(0),
    e.charCodeAt(1),
    e.charCodeAt(2),
    e.charCodeAt(3)
  ];
};
M.TAG = pe(4);
k.Card8 = k.BYTE;
M.Card8 = M.BYTE;
k.Card16 = k.USHORT;
M.Card16 = M.USHORT;
k.OffSize = k.BYTE;
M.OffSize = M.BYTE;
k.SID = k.USHORT;
M.SID = M.USHORT;
k.NUMBER = function(e) {
  return e >= -107 && e <= 107 ? [e + 139] : e >= 108 && e <= 1131 ? (e = e - 108, [(e >> 8) + 247, e & 255]) : e >= -1131 && e <= -108 ? (e = -e - 108, [(e >> 8) + 251, e & 255]) : e >= -32768 && e <= 32767 ? k.NUMBER16(e) : k.NUMBER32(e);
};
M.NUMBER = function(e) {
  return k.NUMBER(e).length;
};
k.NUMBER16 = function(e) {
  return [28, e >> 8 & 255, e & 255];
};
M.NUMBER16 = pe(3);
k.NUMBER32 = function(e) {
  return [29, e >> 24 & 255, e >> 16 & 255, e >> 8 & 255, e & 255];
};
M.NUMBER32 = pe(5);
k.REAL = function(e) {
  var r = e.toString(), t = /\.(\d*?)(?:9{5,20}|0{5,20})\d{0,2}(?:e(.+)|$)/.exec(r);
  if (t) {
    var n = parseFloat("1e" + ((t[2] ? +t[2] : 0) + t[1].length));
    r = (Math.round(e * n) / n).toString();
  }
  for (var a = "", i = 0, s = r.length; i < s; i += 1) {
    var u = r[i];
    u === "e" ? a += r[++i] === "-" ? "c" : "b" : u === "." ? a += "a" : u === "-" ? a += "e" : a += u;
  }
  a += a.length & 1 ? "f" : "ff";
  for (var o = [30], l = 0, f = a.length; l < f; l += 2)
    o.push(parseInt(a.substr(l, 2), 16));
  return o;
};
M.REAL = function(e) {
  return k.REAL(e).length;
};
k.NAME = k.CHARARRAY;
M.NAME = M.CHARARRAY;
k.STRING = k.CHARARRAY;
M.STRING = M.CHARARRAY;
_e.UTF8 = function(e, r, t) {
  for (var n = [], a = t, i = 0; i < a; i++, r += 1)
    n[i] = e.getUint8(r);
  return String.fromCharCode.apply(null, n);
};
_e.UTF16 = function(e, r, t) {
  for (var n = [], a = t / 2, i = 0; i < a; i++, r += 2)
    n[i] = e.getUint16(r);
  return String.fromCharCode.apply(null, n);
};
k.UTF16 = function(e) {
  for (var r = [], t = 0; t < e.length; t += 1) {
    var n = e.charCodeAt(t);
    r[r.length] = n >> 8 & 255, r[r.length] = n & 255;
  }
  return r;
};
M.UTF16 = function(e) {
  return e.length * 2;
};
var Br = {
  "x-mac-croatian": (
    // Python: 'mac_croatian'
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®Š™´¨≠ŽØ∞±≤≥∆µ∂∑∏š∫ªºΩžø¿¡¬√ƒ≈Ć«Č… ÀÃÕŒœĐ—“”‘’÷◊©⁄€‹›Æ»–·‚„‰ÂćÁčÈÍÎÏÌÓÔđÒÚÛÙıˆ˜¯πË˚¸Êæˇ"
  ),
  "x-mac-cyrillic": (
    // Python: 'mac_cyrillic'
    "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°Ґ£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµґЈЄєЇїЉљЊњјЅ¬√ƒ≈∆«»… ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю"
  ),
  "x-mac-gaelic": (
    // http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/GAELIC.TXT
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØḂ±≤≥ḃĊċḊḋḞḟĠġṀæøṁṖṗɼƒſṠ«»… ÀÃÕŒœ–—“”‘’ṡẛÿŸṪ€‹›Ŷŷṫ·Ỳỳ⁊ÂÊÁËÈÍÎÏÌÓÔ♣ÒÚÛÙıÝýŴŵẄẅẀẁẂẃ"
  ),
  "x-mac-greek": (
    // Python: 'mac_greek'
    "Ä¹²É³ÖÜ΅àâä΄¨çéèêë£™îï•½‰ôö¦€ùûü†ΓΔΘΛΞΠß®©ΣΪ§≠°·Α±≤≥¥ΒΕΖΗΙΚΜΦΫΨΩάΝ¬ΟΡ≈Τ«»… ΥΧΆΈœ–―“”‘’÷ΉΊΌΎέήίόΏύαβψδεφγηιξκλμνοπώρστθωςχυζϊϋΐΰ­"
  ),
  "x-mac-icelandic": (
    // Python: 'mac_iceland'
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûüÝ°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€ÐðÞþý·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
  ),
  "x-mac-inuit": (
    // http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/INUIT.TXT
    "ᐃᐄᐅᐆᐊᐋᐱᐲᐳᐴᐸᐹᑉᑎᑏᑐᑑᑕᑖᑦᑭᑮᑯᑰᑲᑳᒃᒋᒌᒍᒎᒐᒑ°ᒡᒥᒦ•¶ᒧ®©™ᒨᒪᒫᒻᓂᓃᓄᓅᓇᓈᓐᓯᓰᓱᓲᓴᓵᔅᓕᓖᓗᓘᓚᓛᓪᔨᔩᔪᔫᔭ… ᔮᔾᕕᕖᕗ–—“”‘’ᕘᕙᕚᕝᕆᕇᕈᕉᕋᕌᕐᕿᖀᖁᖂᖃᖄᖅᖏᖐᖑᖒᖓᖔᖕᙱᙲᙳᙴᙵᙶᖖᖠᖡᖢᖣᖤᖥᖦᕼŁł"
  ),
  "x-mac-ce": (
    // Python: 'mac_latin2'
    "ÄĀāÉĄÖÜáąČäčĆćéŹźĎíďĒēĖóėôöõúĚěü†°Ę£§•¶ß®©™ę¨≠ģĮįĪ≤≥īĶ∂∑łĻļĽľĹĺŅņŃ¬√ńŇ∆«»… ňŐÕőŌ–—“”‘’÷◊ōŔŕŘ‹›řŖŗŠ‚„šŚśÁŤťÍŽžŪÓÔūŮÚůŰűŲųÝýķŻŁżĢˇ"
  ),
  macintosh: (
    // Python: 'mac_roman'
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
  ),
  "x-mac-romanian": (
    // Python: 'mac_romanian'
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ĂȘ∞±≤≥¥µ∂∑∏π∫ªºΩăș¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›Țț‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
  ),
  "x-mac-turkish": (
    // Python: 'mac_turkish'
    "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸĞğİıŞş‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙˆ˜¯˘˙˚¸˝˛ˇ"
  )
};
_e.MACSTRING = function(e, r, t, n) {
  var a = Br[n];
  if (a !== void 0) {
    for (var i = "", s = 0; s < t; s++) {
      var u = e.getUint8(r + s);
      u <= 127 ? i += String.fromCharCode(u) : i += a[u & 127];
    }
    return i;
  }
};
var sr = typeof WeakMap == "function" && /* @__PURE__ */ new WeakMap(), or, Ia = function(e) {
  if (!or) {
    or = {};
    for (var r in Br)
      or[r] = new String(r);
  }
  var t = or[e];
  if (t !== void 0) {
    if (sr) {
      var n = sr.get(t);
      if (n !== void 0)
        return n;
    }
    var a = Br[e];
    if (a !== void 0) {
      for (var i = {}, s = 0; s < a.length; s++)
        i[a.charCodeAt(s)] = s + 128;
      return sr && sr.set(t, i), i;
    }
  }
};
k.MACSTRING = function(e, r) {
  var t = Ia(r);
  if (t !== void 0) {
    for (var n = [], a = 0; a < e.length; a++) {
      var i = e.charCodeAt(a);
      if (i >= 128 && (i = t[i], i === void 0))
        return;
      n[a] = i;
    }
    return n;
  }
};
M.MACSTRING = function(e, r) {
  var t = k.MACSTRING(e, r);
  return t !== void 0 ? t.length : 0;
};
function Gr(e) {
  return e >= -128 && e <= 127;
}
function Ba(e, r, t) {
  for (var n = 0, a = e.length; r < a && n < 64 && e[r] === 0; )
    ++r, ++n;
  return t.push(128 | n - 1), r;
}
function Ga(e, r, t) {
  for (var n = 0, a = e.length, i = r; i < a && n < 64; ) {
    var s = e[i];
    if (!Gr(s) || s === 0 && i + 1 < a && e[i + 1] === 0)
      break;
    ++i, ++n;
  }
  t.push(n - 1);
  for (var u = r; u < i; ++u)
    t.push(e[u] + 256 & 255);
  return i;
}
function Na(e, r, t) {
  for (var n = 0, a = e.length, i = r; i < a && n < 64; ) {
    var s = e[i];
    if (s === 0 || Gr(s) && i + 1 < a && Gr(e[i + 1]))
      break;
    ++i, ++n;
  }
  t.push(64 | n - 1);
  for (var u = r; u < i; ++u) {
    var o = e[u];
    t.push(o + 65536 >> 8 & 255, o + 256 & 255);
  }
  return i;
}
k.VARDELTAS = function(e) {
  for (var r = 0, t = []; r < e.length; ) {
    var n = e[r];
    n === 0 ? r = Ba(e, r, t) : n >= -128 && n <= 127 ? r = Ga(e, r, t) : r = Na(e, r, t);
  }
  return t;
};
k.INDEX = function(e) {
  for (var r = 1, t = [r], n = [], a = 0; a < e.length; a += 1) {
    var i = k.OBJECT(e[a]);
    Array.prototype.push.apply(n, i), r += i.length, t.push(r);
  }
  if (n.length === 0)
    return [0, 0];
  for (var s = [], u = 1 + Math.floor(Math.log(r) / Math.log(2)) / 8 | 0, o = [void 0, k.BYTE, k.USHORT, k.UINT24, k.ULONG][u], l = 0; l < t.length; l += 1) {
    var f = o(t[l]);
    Array.prototype.push.apply(s, f);
  }
  return Array.prototype.concat(
    k.Card16(e.length),
    k.OffSize(u),
    s,
    n
  );
};
M.INDEX = function(e) {
  return k.INDEX(e).length;
};
k.DICT = function(e) {
  for (var r = [], t = Object.keys(e), n = t.length, a = 0; a < n; a += 1) {
    var i = parseInt(t[a], 0), s = e[i];
    r = r.concat(k.OPERAND(s.value, s.type)), r = r.concat(k.OPERATOR(i));
  }
  return r;
};
M.DICT = function(e) {
  return k.DICT(e).length;
};
k.OPERATOR = function(e) {
  return e < 1200 ? [e] : [12, e - 1200];
};
k.OPERAND = function(e, r) {
  var t = [];
  if (Array.isArray(r))
    for (var n = 0; n < r.length; n += 1)
      D.argument(e.length === r.length, "Not enough arguments given for type" + r), t = t.concat(k.OPERAND(e[n], r[n]));
  else if (r === "SID")
    t = t.concat(k.NUMBER(e));
  else if (r === "offset")
    t = t.concat(k.NUMBER32(e));
  else if (r === "number")
    t = t.concat(k.NUMBER(e));
  else if (r === "real")
    t = t.concat(k.REAL(e));
  else
    throw new Error("Unknown operand type " + r);
  return t;
};
k.OP = k.BYTE;
M.OP = M.BYTE;
var ur = typeof WeakMap == "function" && /* @__PURE__ */ new WeakMap();
k.CHARSTRING = function(e) {
  if (ur) {
    var r = ur.get(e);
    if (r !== void 0)
      return r;
  }
  for (var t = [], n = e.length, a = 0; a < n; a += 1) {
    var i = e[a];
    t = t.concat(k[i.type](i.value));
  }
  return ur && ur.set(e, t), t;
};
M.CHARSTRING = function(e) {
  return k.CHARSTRING(e).length;
};
k.OBJECT = function(e) {
  var r = k[e.type];
  return D.argument(r !== void 0, "No encoding function for type " + e.type), r(e.value);
};
M.OBJECT = function(e) {
  var r = M[e.type];
  return D.argument(r !== void 0, "No sizeOf function for type " + e.type), r(e.value);
};
k.TABLE = function(e) {
  for (var r = [], t = e.fields.length, n = [], a = [], i = 0; i < t; i += 1) {
    var s = e.fields[i], u = k[s.type];
    D.argument(u !== void 0, "No encoding function for field type " + s.type + " (" + s.name + ")");
    var o = e[s.name];
    o === void 0 && (o = s.value);
    var l = u(o);
    s.type === "TABLE" ? (a.push(r.length), r = r.concat([0, 0]), n.push(l)) : r = r.concat(l);
  }
  for (var f = 0; f < n.length; f += 1) {
    var p = a[f], h = r.length;
    D.argument(h < 65536, "Table " + e.tableName + " too big."), r[p] = h >> 8, r[p + 1] = h & 255, r = r.concat(n[f]);
  }
  return r;
};
M.TABLE = function(e) {
  for (var r = 0, t = e.fields.length, n = 0; n < t; n += 1) {
    var a = e.fields[n], i = M[a.type];
    D.argument(i !== void 0, "No sizeOf function for field type " + a.type + " (" + a.name + ")");
    var s = e[a.name];
    s === void 0 && (s = a.value), r += i(s), a.type === "TABLE" && (r += 2);
  }
  return r;
};
k.RECORD = k.TABLE;
M.RECORD = M.TABLE;
k.LITERAL = function(e) {
  return e;
};
M.LITERAL = function(e) {
  return e.length;
};
function ne(e, r, t) {
  if (r.length && (r[0].name !== "coverageFormat" || r[0].value === 1))
    for (var n = 0; n < r.length; n += 1) {
      var a = r[n];
      this[a.name] = a.value;
    }
  if (this.tableName = e, this.fields = r, t)
    for (var i = Object.keys(t), s = 0; s < i.length; s += 1) {
      var u = i[s], o = t[u];
      this[u] !== void 0 && (this[u] = o);
    }
}
ne.prototype.encode = function() {
  return k.TABLE(this);
};
ne.prototype.sizeOf = function() {
  return M.TABLE(this);
};
function Ke(e, r, t) {
  t === void 0 && (t = r.length);
  var n = new Array(r.length + 1);
  n[0] = { name: e + "Count", type: "USHORT", value: t };
  for (var a = 0; a < r.length; a++)
    n[a + 1] = { name: e + a, type: "USHORT", value: r[a] };
  return n;
}
function Nr(e, r, t) {
  var n = r.length, a = new Array(n + 1);
  a[0] = { name: e + "Count", type: "USHORT", value: n };
  for (var i = 0; i < n; i++)
    a[i + 1] = { name: e + i, type: "TABLE", value: t(r[i], i) };
  return a;
}
function Je(e, r, t) {
  var n = r.length, a = [];
  a[0] = { name: e + "Count", type: "USHORT", value: n };
  for (var i = 0; i < n; i++)
    a = a.concat(t(r[i], i));
  return a;
}
function vr(e) {
  e.format === 1 ? ne.call(
    this,
    "coverageTable",
    [{ name: "coverageFormat", type: "USHORT", value: 1 }].concat(Ke("glyph", e.glyphs))
  ) : e.format === 2 ? ne.call(
    this,
    "coverageTable",
    [{ name: "coverageFormat", type: "USHORT", value: 2 }].concat(Je("rangeRecord", e.ranges, function(r) {
      return [
        { name: "startGlyphID", type: "USHORT", value: r.start },
        { name: "endGlyphID", type: "USHORT", value: r.end },
        { name: "startCoverageIndex", type: "USHORT", value: r.index }
      ];
    }))
  ) : D.assert(!1, "Coverage format must be 1 or 2.");
}
vr.prototype = Object.create(ne.prototype);
vr.prototype.constructor = vr;
function dr(e) {
  ne.call(
    this,
    "scriptListTable",
    Je("scriptRecord", e, function(r, t) {
      var n = r.script, a = n.defaultLangSys;
      return D.assert(!!a, "Unable to write GSUB: script " + r.tag + " has no default language system."), [
        { name: "scriptTag" + t, type: "TAG", value: r.tag },
        { name: "script" + t, type: "TABLE", value: new ne("scriptTable", [
          { name: "defaultLangSys", type: "TABLE", value: new ne("defaultLangSys", [
            { name: "lookupOrder", type: "USHORT", value: 0 },
            { name: "reqFeatureIndex", type: "USHORT", value: a.reqFeatureIndex }
          ].concat(Ke("featureIndex", a.featureIndexes))) }
        ].concat(Je("langSys", n.langSysRecords, function(i, s) {
          var u = i.langSys;
          return [
            { name: "langSysTag" + s, type: "TAG", value: i.tag },
            { name: "langSys" + s, type: "TABLE", value: new ne("langSys", [
              { name: "lookupOrder", type: "USHORT", value: 0 },
              { name: "reqFeatureIndex", type: "USHORT", value: u.reqFeatureIndex }
            ].concat(Ke("featureIndex", u.featureIndexes))) }
          ];
        }))) }
      ];
    })
  );
}
dr.prototype = Object.create(ne.prototype);
dr.prototype.constructor = dr;
function gr(e) {
  ne.call(
    this,
    "featureListTable",
    Je("featureRecord", e, function(r, t) {
      var n = r.feature;
      return [
        { name: "featureTag" + t, type: "TAG", value: r.tag },
        { name: "feature" + t, type: "TABLE", value: new ne("featureTable", [
          { name: "featureParams", type: "USHORT", value: n.featureParams }
        ].concat(Ke("lookupListIndex", n.lookupListIndexes))) }
      ];
    })
  );
}
gr.prototype = Object.create(ne.prototype);
gr.prototype.constructor = gr;
function xr(e, r) {
  ne.call(this, "lookupListTable", Nr("lookup", e, function(t) {
    var n = r[t.lookupType];
    return D.assert(!!n, "Unable to write GSUB lookup type " + t.lookupType + " tables."), new ne("lookupTable", [
      { name: "lookupType", type: "USHORT", value: t.lookupType },
      { name: "lookupFlag", type: "USHORT", value: t.lookupFlag }
    ].concat(Nr("subtable", t.subtables, n)));
  }));
}
xr.prototype = Object.create(ne.prototype);
xr.prototype.constructor = xr;
var w = {
  Table: ne,
  Record: ne,
  Coverage: vr,
  ScriptList: dr,
  FeatureList: gr,
  LookupList: xr,
  ushortList: Ke,
  tableList: Nr,
  recordList: Je
};
function yt(e, r) {
  return e.getUint8(r);
}
function mr(e, r) {
  return e.getUint16(r, !1);
}
function _a(e, r) {
  return e.getInt16(r, !1);
}
function Qr(e, r) {
  return e.getUint32(r, !1);
}
function hn(e, r) {
  var t = e.getInt16(r, !1), n = e.getUint16(r + 2, !1);
  return t + n / 65535;
}
function Ha(e, r) {
  for (var t = "", n = r; n < r + 4; n += 1)
    t += String.fromCharCode(e.getInt8(n));
  return t;
}
function za(e, r, t) {
  for (var n = 0, a = 0; a < t; a += 1)
    n <<= 8, n += e.getUint8(r + a);
  return n;
}
function Va(e, r, t) {
  for (var n = [], a = r; a < t; a += 1)
    n.push(e.getUint8(a));
  return n;
}
function Wa(e) {
  for (var r = "", t = 0; t < e.length; t += 1)
    r += String.fromCharCode(e[t]);
  return r;
}
var Xa = {
  byte: 1,
  uShort: 2,
  short: 2,
  uLong: 4,
  fixed: 4,
  longDateTime: 8,
  tag: 4
};
function v(e, r) {
  this.data = e, this.offset = r, this.relativeOffset = 0;
}
v.prototype.parseByte = function() {
  var e = this.data.getUint8(this.offset + this.relativeOffset);
  return this.relativeOffset += 1, e;
};
v.prototype.parseChar = function() {
  var e = this.data.getInt8(this.offset + this.relativeOffset);
  return this.relativeOffset += 1, e;
};
v.prototype.parseCard8 = v.prototype.parseByte;
v.prototype.parseUShort = function() {
  var e = this.data.getUint16(this.offset + this.relativeOffset);
  return this.relativeOffset += 2, e;
};
v.prototype.parseCard16 = v.prototype.parseUShort;
v.prototype.parseSID = v.prototype.parseUShort;
v.prototype.parseOffset16 = v.prototype.parseUShort;
v.prototype.parseShort = function() {
  var e = this.data.getInt16(this.offset + this.relativeOffset);
  return this.relativeOffset += 2, e;
};
v.prototype.parseF2Dot14 = function() {
  var e = this.data.getInt16(this.offset + this.relativeOffset) / 16384;
  return this.relativeOffset += 2, e;
};
v.prototype.parseULong = function() {
  var e = Qr(this.data, this.offset + this.relativeOffset);
  return this.relativeOffset += 4, e;
};
v.prototype.parseOffset32 = v.prototype.parseULong;
v.prototype.parseFixed = function() {
  var e = hn(this.data, this.offset + this.relativeOffset);
  return this.relativeOffset += 4, e;
};
v.prototype.parseString = function(e) {
  var r = this.data, t = this.offset + this.relativeOffset, n = "";
  this.relativeOffset += e;
  for (var a = 0; a < e; a++)
    n += String.fromCharCode(r.getUint8(t + a));
  return n;
};
v.prototype.parseTag = function() {
  return this.parseString(4);
};
v.prototype.parseLongDateTime = function() {
  var e = Qr(this.data, this.offset + this.relativeOffset + 4);
  return e -= 2082844800, this.relativeOffset += 8, e;
};
v.prototype.parseVersion = function(e) {
  var r = mr(this.data, this.offset + this.relativeOffset), t = mr(this.data, this.offset + this.relativeOffset + 2);
  return this.relativeOffset += 4, e === void 0 && (e = 4096), r + t / e / 10;
};
v.prototype.skip = function(e, r) {
  r === void 0 && (r = 1), this.relativeOffset += Xa[e] * r;
};
v.prototype.parseULongList = function(e) {
  e === void 0 && (e = this.parseULong());
  for (var r = new Array(e), t = this.data, n = this.offset + this.relativeOffset, a = 0; a < e; a++)
    r[a] = t.getUint32(n), n += 4;
  return this.relativeOffset += e * 4, r;
};
v.prototype.parseOffset16List = v.prototype.parseUShortList = function(e) {
  e === void 0 && (e = this.parseUShort());
  for (var r = new Array(e), t = this.data, n = this.offset + this.relativeOffset, a = 0; a < e; a++)
    r[a] = t.getUint16(n), n += 2;
  return this.relativeOffset += e * 2, r;
};
v.prototype.parseShortList = function(e) {
  for (var r = new Array(e), t = this.data, n = this.offset + this.relativeOffset, a = 0; a < e; a++)
    r[a] = t.getInt16(n), n += 2;
  return this.relativeOffset += e * 2, r;
};
v.prototype.parseByteList = function(e) {
  for (var r = new Array(e), t = this.data, n = this.offset + this.relativeOffset, a = 0; a < e; a++)
    r[a] = t.getUint8(n++);
  return this.relativeOffset += e, r;
};
v.prototype.parseList = function(e, r) {
  r || (r = e, e = this.parseUShort());
  for (var t = new Array(e), n = 0; n < e; n++)
    t[n] = r.call(this);
  return t;
};
v.prototype.parseList32 = function(e, r) {
  r || (r = e, e = this.parseULong());
  for (var t = new Array(e), n = 0; n < e; n++)
    t[n] = r.call(this);
  return t;
};
v.prototype.parseRecordList = function(e, r) {
  r || (r = e, e = this.parseUShort());
  for (var t = new Array(e), n = Object.keys(r), a = 0; a < e; a++) {
    for (var i = {}, s = 0; s < n.length; s++) {
      var u = n[s], o = r[u];
      i[u] = o.call(this);
    }
    t[a] = i;
  }
  return t;
};
v.prototype.parseRecordList32 = function(e, r) {
  r || (r = e, e = this.parseULong());
  for (var t = new Array(e), n = Object.keys(r), a = 0; a < e; a++) {
    for (var i = {}, s = 0; s < n.length; s++) {
      var u = n[s], o = r[u];
      i[u] = o.call(this);
    }
    t[a] = i;
  }
  return t;
};
v.prototype.parseStruct = function(e) {
  if (typeof e == "function")
    return e.call(this);
  for (var r = Object.keys(e), t = {}, n = 0; n < r.length; n++) {
    var a = r[n], i = e[a];
    t[a] = i.call(this);
  }
  return t;
};
v.prototype.parseValueRecord = function(e) {
  if (e === void 0 && (e = this.parseUShort()), e !== 0) {
    var r = {};
    return e & 1 && (r.xPlacement = this.parseShort()), e & 2 && (r.yPlacement = this.parseShort()), e & 4 && (r.xAdvance = this.parseShort()), e & 8 && (r.yAdvance = this.parseShort()), e & 16 && (r.xPlaDevice = void 0, this.parseShort()), e & 32 && (r.yPlaDevice = void 0, this.parseShort()), e & 64 && (r.xAdvDevice = void 0, this.parseShort()), e & 128 && (r.yAdvDevice = void 0, this.parseShort()), r;
  }
};
v.prototype.parseValueRecordList = function() {
  for (var e = this.parseUShort(), r = this.parseUShort(), t = new Array(r), n = 0; n < r; n++)
    t[n] = this.parseValueRecord(e);
  return t;
};
v.prototype.parsePointer = function(e) {
  var r = this.parseOffset16();
  if (r > 0)
    return new v(this.data, this.offset + r).parseStruct(e);
};
v.prototype.parsePointer32 = function(e) {
  var r = this.parseOffset32();
  if (r > 0)
    return new v(this.data, this.offset + r).parseStruct(e);
};
v.prototype.parseListOfLists = function(e) {
  for (var r = this.parseOffset16List(), t = r.length, n = this.relativeOffset, a = new Array(t), i = 0; i < t; i++) {
    var s = r[i];
    if (s === 0) {
      a[i] = void 0;
      continue;
    }
    if (this.relativeOffset = s, e) {
      for (var u = this.parseOffset16List(), o = new Array(u.length), l = 0; l < u.length; l++)
        this.relativeOffset = s + u[l], o[l] = e.call(this);
      a[i] = o;
    } else
      a[i] = this.parseUShortList();
  }
  return this.relativeOffset = n, a;
};
v.prototype.parseCoverage = function() {
  var e = this.offset + this.relativeOffset, r = this.parseUShort(), t = this.parseUShort();
  if (r === 1)
    return {
      format: 1,
      glyphs: this.parseUShortList(t)
    };
  if (r === 2) {
    for (var n = new Array(t), a = 0; a < t; a++)
      n[a] = {
        start: this.parseUShort(),
        end: this.parseUShort(),
        index: this.parseUShort()
      };
    return {
      format: 2,
      ranges: n
    };
  }
  throw new Error("0x" + e.toString(16) + ": Coverage format must be 1 or 2.");
};
v.prototype.parseClassDef = function() {
  var e = this.offset + this.relativeOffset, r = this.parseUShort();
  if (r === 1)
    return {
      format: 1,
      startGlyph: this.parseUShort(),
      classes: this.parseUShortList()
    };
  if (r === 2)
    return {
      format: 2,
      ranges: this.parseRecordList({
        start: v.uShort,
        end: v.uShort,
        classId: v.uShort
      })
    };
  throw new Error("0x" + e.toString(16) + ": ClassDef format must be 1 or 2.");
};
v.list = function(e, r) {
  return function() {
    return this.parseList(e, r);
  };
};
v.list32 = function(e, r) {
  return function() {
    return this.parseList32(e, r);
  };
};
v.recordList = function(e, r) {
  return function() {
    return this.parseRecordList(e, r);
  };
};
v.recordList32 = function(e, r) {
  return function() {
    return this.parseRecordList32(e, r);
  };
};
v.pointer = function(e) {
  return function() {
    return this.parsePointer(e);
  };
};
v.pointer32 = function(e) {
  return function() {
    return this.parsePointer32(e);
  };
};
v.tag = v.prototype.parseTag;
v.byte = v.prototype.parseByte;
v.uShort = v.offset16 = v.prototype.parseUShort;
v.uShortList = v.prototype.parseUShortList;
v.uLong = v.offset32 = v.prototype.parseULong;
v.uLongList = v.prototype.parseULongList;
v.struct = v.prototype.parseStruct;
v.coverage = v.prototype.parseCoverage;
v.classDef = v.prototype.parseClassDef;
var bt = {
  reserved: v.uShort,
  reqFeatureIndex: v.uShort,
  featureIndexes: v.uShortList
};
v.prototype.parseScriptList = function() {
  return this.parsePointer(v.recordList({
    tag: v.tag,
    script: v.pointer({
      defaultLangSys: v.pointer(bt),
      langSysRecords: v.recordList({
        tag: v.tag,
        langSys: v.pointer(bt)
      })
    })
  })) || [];
};
v.prototype.parseFeatureList = function() {
  return this.parsePointer(v.recordList({
    tag: v.tag,
    feature: v.pointer({
      featureParams: v.offset16,
      lookupListIndexes: v.uShortList
    })
  })) || [];
};
v.prototype.parseLookupList = function(e) {
  return this.parsePointer(v.list(v.pointer(function() {
    var r = this.parseUShort();
    D.argument(1 <= r && r <= 9, "GPOS/GSUB lookup type " + r + " unknown.");
    var t = this.parseUShort(), n = t & 16;
    return {
      lookupType: r,
      lookupFlag: t,
      subtables: this.parseList(v.pointer(e[r])),
      markFilteringSet: n ? this.parseUShort() : void 0
    };
  }))) || [];
};
v.prototype.parseFeatureVariationsList = function() {
  return this.parsePointer32(function() {
    var e = this.parseUShort(), r = this.parseUShort();
    D.argument(e === 1 && r < 1, "GPOS/GSUB feature variations table unknown.");
    var t = this.parseRecordList32({
      conditionSetOffset: v.offset32,
      featureTableSubstitutionOffset: v.offset32
    });
    return t;
  }) || [];
};
var E = {
  getByte: yt,
  getCard8: yt,
  getUShort: mr,
  getCard16: mr,
  getShort: _a,
  getULong: Qr,
  getFixed: hn,
  getTag: Ha,
  getOffset: za,
  getBytes: Va,
  bytesToString: Wa,
  Parser: v
};
function qa(e, r) {
  r.parseUShort(), e.length = r.parseULong(), e.language = r.parseULong();
  var t;
  e.groupCount = t = r.parseULong(), e.glyphIndexMap = {};
  for (var n = 0; n < t; n += 1)
    for (var a = r.parseULong(), i = r.parseULong(), s = r.parseULong(), u = a; u <= i; u += 1)
      e.glyphIndexMap[u] = s, s++;
}
function Za(e, r, t, n, a) {
  e.length = r.parseUShort(), e.language = r.parseUShort();
  var i;
  e.segCount = i = r.parseUShort() >> 1, r.skip("uShort", 3), e.glyphIndexMap = {};
  for (var s = new E.Parser(t, n + a + 14), u = new E.Parser(t, n + a + 16 + i * 2), o = new E.Parser(t, n + a + 16 + i * 4), l = new E.Parser(t, n + a + 16 + i * 6), f = n + a + 16 + i * 8, p = 0; p < i - 1; p += 1)
    for (var h = void 0, c = s.parseUShort(), d = u.parseUShort(), m = o.parseShort(), y = l.parseUShort(), x = d; x <= c; x += 1)
      y !== 0 ? (f = l.offset + l.relativeOffset - 2, f += y, f += (x - d) * 2, h = E.getUShort(t, f), h !== 0 && (h = h + m & 65535)) : h = x + m & 65535, e.glyphIndexMap[x] = h;
}
function Ya(e, r) {
  var t = {};
  t.version = E.getUShort(e, r), D.argument(t.version === 0, "cmap table version should be 0."), t.numTables = E.getUShort(e, r + 2);
  for (var n = -1, a = t.numTables - 1; a >= 0; a -= 1) {
    var i = E.getUShort(e, r + 4 + a * 8), s = E.getUShort(e, r + 4 + a * 8 + 2);
    if (i === 3 && (s === 0 || s === 1 || s === 10) || i === 0 && (s === 0 || s === 1 || s === 2 || s === 3 || s === 4)) {
      n = E.getULong(e, r + 4 + a * 8 + 4);
      break;
    }
  }
  if (n === -1)
    throw new Error("No valid cmap sub-tables found.");
  var u = new E.Parser(e, r + n);
  if (t.format = u.parseUShort(), t.format === 12)
    qa(t, u);
  else if (t.format === 4)
    Za(t, u, e, r, n);
  else
    throw new Error("Only format 4 and 12 cmap tables are supported (found format " + t.format + ").");
  return t;
}
function Qa(e, r, t) {
  e.segments.push({
    end: r,
    start: r,
    delta: -(r - t),
    offset: 0,
    glyphIndex: t
  });
}
function Ka(e) {
  e.segments.push({
    end: 65535,
    start: 65535,
    delta: 1,
    offset: 0
  });
}
function Ja(e) {
  var r = !0, t;
  for (t = e.length - 1; t > 0; t -= 1) {
    var n = e.get(t);
    if (n.unicode > 65535) {
      console.log("Adding CMAP format 12 (needed!)"), r = !1;
      break;
    }
  }
  var a = [
    { name: "version", type: "USHORT", value: 0 },
    { name: "numTables", type: "USHORT", value: r ? 1 : 2 },
    // CMAP 4 header
    { name: "platformID", type: "USHORT", value: 3 },
    { name: "encodingID", type: "USHORT", value: 1 },
    { name: "offset", type: "ULONG", value: r ? 12 : 20 }
  ];
  r || (a = a.concat([
    // CMAP 12 header
    { name: "cmap12PlatformID", type: "USHORT", value: 3 },
    // We encode only for PlatformID = 3 (Windows) because it is supported everywhere
    { name: "cmap12EncodingID", type: "USHORT", value: 10 },
    { name: "cmap12Offset", type: "ULONG", value: 0 }
  ])), a = a.concat([
    // CMAP 4 Subtable
    { name: "format", type: "USHORT", value: 4 },
    { name: "cmap4Length", type: "USHORT", value: 0 },
    { name: "language", type: "USHORT", value: 0 },
    { name: "segCountX2", type: "USHORT", value: 0 },
    { name: "searchRange", type: "USHORT", value: 0 },
    { name: "entrySelector", type: "USHORT", value: 0 },
    { name: "rangeShift", type: "USHORT", value: 0 }
  ]);
  var i = new w.Table("cmap", a);
  for (i.segments = [], t = 0; t < e.length; t += 1) {
    for (var s = e.get(t), u = 0; u < s.unicodes.length; u += 1)
      Qa(i, s.unicodes[u], t);
    i.segments = i.segments.sort(function(F, g) {
      return F.start - g.start;
    });
  }
  Ka(i);
  var o = i.segments.length, l = 0, f = [], p = [], h = [], c = [], d = [], m = [];
  for (t = 0; t < o; t += 1) {
    var y = i.segments[t];
    y.end <= 65535 && y.start <= 65535 ? (f = f.concat({ name: "end_" + t, type: "USHORT", value: y.end }), p = p.concat({ name: "start_" + t, type: "USHORT", value: y.start }), h = h.concat({ name: "idDelta_" + t, type: "SHORT", value: y.delta }), c = c.concat({ name: "idRangeOffset_" + t, type: "USHORT", value: y.offset }), y.glyphId !== void 0 && (d = d.concat({ name: "glyph_" + t, type: "USHORT", value: y.glyphId }))) : l += 1, !r && y.glyphIndex !== void 0 && (m = m.concat({ name: "cmap12Start_" + t, type: "ULONG", value: y.start }), m = m.concat({ name: "cmap12End_" + t, type: "ULONG", value: y.end }), m = m.concat({ name: "cmap12Glyph_" + t, type: "ULONG", value: y.glyphIndex }));
  }
  if (i.segCountX2 = (o - l) * 2, i.searchRange = Math.pow(2, Math.floor(Math.log(o - l) / Math.log(2))) * 2, i.entrySelector = Math.log(i.searchRange / 2) / Math.log(2), i.rangeShift = i.segCountX2 - i.searchRange, i.fields = i.fields.concat(f), i.fields.push({ name: "reservedPad", type: "USHORT", value: 0 }), i.fields = i.fields.concat(p), i.fields = i.fields.concat(h), i.fields = i.fields.concat(c), i.fields = i.fields.concat(d), i.cmap4Length = 14 + // Subtable header
  f.length * 2 + 2 + // reservedPad
  p.length * 2 + h.length * 2 + c.length * 2 + d.length * 2, !r) {
    var x = 16 + // Subtable header
    m.length * 4;
    i.cmap12Offset = 12 + 2 * 2 + 4 + i.cmap4Length, i.fields = i.fields.concat([
      { name: "cmap12Format", type: "USHORT", value: 12 },
      { name: "cmap12Reserved", type: "USHORT", value: 0 },
      { name: "cmap12Length", type: "ULONG", value: x },
      { name: "cmap12Language", type: "ULONG", value: 0 },
      { name: "cmap12nGroups", type: "ULONG", value: m.length / 3 }
    ]), i.fields = i.fields.concat(m);
  }
  return i;
}
var pn = { parse: Ya, make: Ja }, pr = [
  ".notdef",
  "space",
  "exclam",
  "quotedbl",
  "numbersign",
  "dollar",
  "percent",
  "ampersand",
  "quoteright",
  "parenleft",
  "parenright",
  "asterisk",
  "plus",
  "comma",
  "hyphen",
  "period",
  "slash",
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "colon",
  "semicolon",
  "less",
  "equal",
  "greater",
  "question",
  "at",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "bracketleft",
  "backslash",
  "bracketright",
  "asciicircum",
  "underscore",
  "quoteleft",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "braceleft",
  "bar",
  "braceright",
  "asciitilde",
  "exclamdown",
  "cent",
  "sterling",
  "fraction",
  "yen",
  "florin",
  "section",
  "currency",
  "quotesingle",
  "quotedblleft",
  "guillemotleft",
  "guilsinglleft",
  "guilsinglright",
  "fi",
  "fl",
  "endash",
  "dagger",
  "daggerdbl",
  "periodcentered",
  "paragraph",
  "bullet",
  "quotesinglbase",
  "quotedblbase",
  "quotedblright",
  "guillemotright",
  "ellipsis",
  "perthousand",
  "questiondown",
  "grave",
  "acute",
  "circumflex",
  "tilde",
  "macron",
  "breve",
  "dotaccent",
  "dieresis",
  "ring",
  "cedilla",
  "hungarumlaut",
  "ogonek",
  "caron",
  "emdash",
  "AE",
  "ordfeminine",
  "Lslash",
  "Oslash",
  "OE",
  "ordmasculine",
  "ae",
  "dotlessi",
  "lslash",
  "oslash",
  "oe",
  "germandbls",
  "onesuperior",
  "logicalnot",
  "mu",
  "trademark",
  "Eth",
  "onehalf",
  "plusminus",
  "Thorn",
  "onequarter",
  "divide",
  "brokenbar",
  "degree",
  "thorn",
  "threequarters",
  "twosuperior",
  "registered",
  "minus",
  "eth",
  "multiply",
  "threesuperior",
  "copyright",
  "Aacute",
  "Acircumflex",
  "Adieresis",
  "Agrave",
  "Aring",
  "Atilde",
  "Ccedilla",
  "Eacute",
  "Ecircumflex",
  "Edieresis",
  "Egrave",
  "Iacute",
  "Icircumflex",
  "Idieresis",
  "Igrave",
  "Ntilde",
  "Oacute",
  "Ocircumflex",
  "Odieresis",
  "Ograve",
  "Otilde",
  "Scaron",
  "Uacute",
  "Ucircumflex",
  "Udieresis",
  "Ugrave",
  "Yacute",
  "Ydieresis",
  "Zcaron",
  "aacute",
  "acircumflex",
  "adieresis",
  "agrave",
  "aring",
  "atilde",
  "ccedilla",
  "eacute",
  "ecircumflex",
  "edieresis",
  "egrave",
  "iacute",
  "icircumflex",
  "idieresis",
  "igrave",
  "ntilde",
  "oacute",
  "ocircumflex",
  "odieresis",
  "ograve",
  "otilde",
  "scaron",
  "uacute",
  "ucircumflex",
  "udieresis",
  "ugrave",
  "yacute",
  "ydieresis",
  "zcaron",
  "exclamsmall",
  "Hungarumlautsmall",
  "dollaroldstyle",
  "dollarsuperior",
  "ampersandsmall",
  "Acutesmall",
  "parenleftsuperior",
  "parenrightsuperior",
  "266 ff",
  "onedotenleader",
  "zerooldstyle",
  "oneoldstyle",
  "twooldstyle",
  "threeoldstyle",
  "fouroldstyle",
  "fiveoldstyle",
  "sixoldstyle",
  "sevenoldstyle",
  "eightoldstyle",
  "nineoldstyle",
  "commasuperior",
  "threequartersemdash",
  "periodsuperior",
  "questionsmall",
  "asuperior",
  "bsuperior",
  "centsuperior",
  "dsuperior",
  "esuperior",
  "isuperior",
  "lsuperior",
  "msuperior",
  "nsuperior",
  "osuperior",
  "rsuperior",
  "ssuperior",
  "tsuperior",
  "ff",
  "ffi",
  "ffl",
  "parenleftinferior",
  "parenrightinferior",
  "Circumflexsmall",
  "hyphensuperior",
  "Gravesmall",
  "Asmall",
  "Bsmall",
  "Csmall",
  "Dsmall",
  "Esmall",
  "Fsmall",
  "Gsmall",
  "Hsmall",
  "Ismall",
  "Jsmall",
  "Ksmall",
  "Lsmall",
  "Msmall",
  "Nsmall",
  "Osmall",
  "Psmall",
  "Qsmall",
  "Rsmall",
  "Ssmall",
  "Tsmall",
  "Usmall",
  "Vsmall",
  "Wsmall",
  "Xsmall",
  "Ysmall",
  "Zsmall",
  "colonmonetary",
  "onefitted",
  "rupiah",
  "Tildesmall",
  "exclamdownsmall",
  "centoldstyle",
  "Lslashsmall",
  "Scaronsmall",
  "Zcaronsmall",
  "Dieresissmall",
  "Brevesmall",
  "Caronsmall",
  "Dotaccentsmall",
  "Macronsmall",
  "figuredash",
  "hypheninferior",
  "Ogoneksmall",
  "Ringsmall",
  "Cedillasmall",
  "questiondownsmall",
  "oneeighth",
  "threeeighths",
  "fiveeighths",
  "seveneighths",
  "onethird",
  "twothirds",
  "zerosuperior",
  "foursuperior",
  "fivesuperior",
  "sixsuperior",
  "sevensuperior",
  "eightsuperior",
  "ninesuperior",
  "zeroinferior",
  "oneinferior",
  "twoinferior",
  "threeinferior",
  "fourinferior",
  "fiveinferior",
  "sixinferior",
  "seveninferior",
  "eightinferior",
  "nineinferior",
  "centinferior",
  "dollarinferior",
  "periodinferior",
  "commainferior",
  "Agravesmall",
  "Aacutesmall",
  "Acircumflexsmall",
  "Atildesmall",
  "Adieresissmall",
  "Aringsmall",
  "AEsmall",
  "Ccedillasmall",
  "Egravesmall",
  "Eacutesmall",
  "Ecircumflexsmall",
  "Edieresissmall",
  "Igravesmall",
  "Iacutesmall",
  "Icircumflexsmall",
  "Idieresissmall",
  "Ethsmall",
  "Ntildesmall",
  "Ogravesmall",
  "Oacutesmall",
  "Ocircumflexsmall",
  "Otildesmall",
  "Odieresissmall",
  "OEsmall",
  "Oslashsmall",
  "Ugravesmall",
  "Uacutesmall",
  "Ucircumflexsmall",
  "Udieresissmall",
  "Yacutesmall",
  "Thornsmall",
  "Ydieresissmall",
  "001.000",
  "001.001",
  "001.002",
  "001.003",
  "Black",
  "Bold",
  "Book",
  "Light",
  "Medium",
  "Regular",
  "Roman",
  "Semibold"
], ja = [
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "space",
  "exclam",
  "quotedbl",
  "numbersign",
  "dollar",
  "percent",
  "ampersand",
  "quoteright",
  "parenleft",
  "parenright",
  "asterisk",
  "plus",
  "comma",
  "hyphen",
  "period",
  "slash",
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "colon",
  "semicolon",
  "less",
  "equal",
  "greater",
  "question",
  "at",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "bracketleft",
  "backslash",
  "bracketright",
  "asciicircum",
  "underscore",
  "quoteleft",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "braceleft",
  "bar",
  "braceright",
  "asciitilde",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "exclamdown",
  "cent",
  "sterling",
  "fraction",
  "yen",
  "florin",
  "section",
  "currency",
  "quotesingle",
  "quotedblleft",
  "guillemotleft",
  "guilsinglleft",
  "guilsinglright",
  "fi",
  "fl",
  "",
  "endash",
  "dagger",
  "daggerdbl",
  "periodcentered",
  "",
  "paragraph",
  "bullet",
  "quotesinglbase",
  "quotedblbase",
  "quotedblright",
  "guillemotright",
  "ellipsis",
  "perthousand",
  "",
  "questiondown",
  "",
  "grave",
  "acute",
  "circumflex",
  "tilde",
  "macron",
  "breve",
  "dotaccent",
  "dieresis",
  "",
  "ring",
  "cedilla",
  "",
  "hungarumlaut",
  "ogonek",
  "caron",
  "emdash",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "AE",
  "",
  "ordfeminine",
  "",
  "",
  "",
  "",
  "Lslash",
  "Oslash",
  "OE",
  "ordmasculine",
  "",
  "",
  "",
  "",
  "",
  "ae",
  "",
  "",
  "",
  "dotlessi",
  "",
  "",
  "lslash",
  "oslash",
  "oe",
  "germandbls"
], $a = [
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "space",
  "exclamsmall",
  "Hungarumlautsmall",
  "",
  "dollaroldstyle",
  "dollarsuperior",
  "ampersandsmall",
  "Acutesmall",
  "parenleftsuperior",
  "parenrightsuperior",
  "twodotenleader",
  "onedotenleader",
  "comma",
  "hyphen",
  "period",
  "fraction",
  "zerooldstyle",
  "oneoldstyle",
  "twooldstyle",
  "threeoldstyle",
  "fouroldstyle",
  "fiveoldstyle",
  "sixoldstyle",
  "sevenoldstyle",
  "eightoldstyle",
  "nineoldstyle",
  "colon",
  "semicolon",
  "commasuperior",
  "threequartersemdash",
  "periodsuperior",
  "questionsmall",
  "",
  "asuperior",
  "bsuperior",
  "centsuperior",
  "dsuperior",
  "esuperior",
  "",
  "",
  "isuperior",
  "",
  "",
  "lsuperior",
  "msuperior",
  "nsuperior",
  "osuperior",
  "",
  "",
  "rsuperior",
  "ssuperior",
  "tsuperior",
  "",
  "ff",
  "fi",
  "fl",
  "ffi",
  "ffl",
  "parenleftinferior",
  "",
  "parenrightinferior",
  "Circumflexsmall",
  "hyphensuperior",
  "Gravesmall",
  "Asmall",
  "Bsmall",
  "Csmall",
  "Dsmall",
  "Esmall",
  "Fsmall",
  "Gsmall",
  "Hsmall",
  "Ismall",
  "Jsmall",
  "Ksmall",
  "Lsmall",
  "Msmall",
  "Nsmall",
  "Osmall",
  "Psmall",
  "Qsmall",
  "Rsmall",
  "Ssmall",
  "Tsmall",
  "Usmall",
  "Vsmall",
  "Wsmall",
  "Xsmall",
  "Ysmall",
  "Zsmall",
  "colonmonetary",
  "onefitted",
  "rupiah",
  "Tildesmall",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "exclamdownsmall",
  "centoldstyle",
  "Lslashsmall",
  "",
  "",
  "Scaronsmall",
  "Zcaronsmall",
  "Dieresissmall",
  "Brevesmall",
  "Caronsmall",
  "",
  "Dotaccentsmall",
  "",
  "",
  "Macronsmall",
  "",
  "",
  "figuredash",
  "hypheninferior",
  "",
  "",
  "Ogoneksmall",
  "Ringsmall",
  "Cedillasmall",
  "",
  "",
  "",
  "onequarter",
  "onehalf",
  "threequarters",
  "questiondownsmall",
  "oneeighth",
  "threeeighths",
  "fiveeighths",
  "seveneighths",
  "onethird",
  "twothirds",
  "",
  "",
  "zerosuperior",
  "onesuperior",
  "twosuperior",
  "threesuperior",
  "foursuperior",
  "fivesuperior",
  "sixsuperior",
  "sevensuperior",
  "eightsuperior",
  "ninesuperior",
  "zeroinferior",
  "oneinferior",
  "twoinferior",
  "threeinferior",
  "fourinferior",
  "fiveinferior",
  "sixinferior",
  "seveninferior",
  "eightinferior",
  "nineinferior",
  "centinferior",
  "dollarinferior",
  "periodinferior",
  "commainferior",
  "Agravesmall",
  "Aacutesmall",
  "Acircumflexsmall",
  "Atildesmall",
  "Adieresissmall",
  "Aringsmall",
  "AEsmall",
  "Ccedillasmall",
  "Egravesmall",
  "Eacutesmall",
  "Ecircumflexsmall",
  "Edieresissmall",
  "Igravesmall",
  "Iacutesmall",
  "Icircumflexsmall",
  "Idieresissmall",
  "Ethsmall",
  "Ntildesmall",
  "Ogravesmall",
  "Oacutesmall",
  "Ocircumflexsmall",
  "Otildesmall",
  "Odieresissmall",
  "OEsmall",
  "Oslashsmall",
  "Ugravesmall",
  "Uacutesmall",
  "Ucircumflexsmall",
  "Udieresissmall",
  "Yacutesmall",
  "Thornsmall",
  "Ydieresissmall"
], Le = [
  ".notdef",
  ".null",
  "nonmarkingreturn",
  "space",
  "exclam",
  "quotedbl",
  "numbersign",
  "dollar",
  "percent",
  "ampersand",
  "quotesingle",
  "parenleft",
  "parenright",
  "asterisk",
  "plus",
  "comma",
  "hyphen",
  "period",
  "slash",
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "colon",
  "semicolon",
  "less",
  "equal",
  "greater",
  "question",
  "at",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "bracketleft",
  "backslash",
  "bracketright",
  "asciicircum",
  "underscore",
  "grave",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "braceleft",
  "bar",
  "braceright",
  "asciitilde",
  "Adieresis",
  "Aring",
  "Ccedilla",
  "Eacute",
  "Ntilde",
  "Odieresis",
  "Udieresis",
  "aacute",
  "agrave",
  "acircumflex",
  "adieresis",
  "atilde",
  "aring",
  "ccedilla",
  "eacute",
  "egrave",
  "ecircumflex",
  "edieresis",
  "iacute",
  "igrave",
  "icircumflex",
  "idieresis",
  "ntilde",
  "oacute",
  "ograve",
  "ocircumflex",
  "odieresis",
  "otilde",
  "uacute",
  "ugrave",
  "ucircumflex",
  "udieresis",
  "dagger",
  "degree",
  "cent",
  "sterling",
  "section",
  "bullet",
  "paragraph",
  "germandbls",
  "registered",
  "copyright",
  "trademark",
  "acute",
  "dieresis",
  "notequal",
  "AE",
  "Oslash",
  "infinity",
  "plusminus",
  "lessequal",
  "greaterequal",
  "yen",
  "mu",
  "partialdiff",
  "summation",
  "product",
  "pi",
  "integral",
  "ordfeminine",
  "ordmasculine",
  "Omega",
  "ae",
  "oslash",
  "questiondown",
  "exclamdown",
  "logicalnot",
  "radical",
  "florin",
  "approxequal",
  "Delta",
  "guillemotleft",
  "guillemotright",
  "ellipsis",
  "nonbreakingspace",
  "Agrave",
  "Atilde",
  "Otilde",
  "OE",
  "oe",
  "endash",
  "emdash",
  "quotedblleft",
  "quotedblright",
  "quoteleft",
  "quoteright",
  "divide",
  "lozenge",
  "ydieresis",
  "Ydieresis",
  "fraction",
  "currency",
  "guilsinglleft",
  "guilsinglright",
  "fi",
  "fl",
  "daggerdbl",
  "periodcentered",
  "quotesinglbase",
  "quotedblbase",
  "perthousand",
  "Acircumflex",
  "Ecircumflex",
  "Aacute",
  "Edieresis",
  "Egrave",
  "Iacute",
  "Icircumflex",
  "Idieresis",
  "Igrave",
  "Oacute",
  "Ocircumflex",
  "apple",
  "Ograve",
  "Uacute",
  "Ucircumflex",
  "Ugrave",
  "dotlessi",
  "circumflex",
  "tilde",
  "macron",
  "breve",
  "dotaccent",
  "ring",
  "cedilla",
  "hungarumlaut",
  "ogonek",
  "caron",
  "Lslash",
  "lslash",
  "Scaron",
  "scaron",
  "Zcaron",
  "zcaron",
  "brokenbar",
  "Eth",
  "eth",
  "Yacute",
  "yacute",
  "Thorn",
  "thorn",
  "minus",
  "multiply",
  "onesuperior",
  "twosuperior",
  "threesuperior",
  "onehalf",
  "onequarter",
  "threequarters",
  "franc",
  "Gbreve",
  "gbreve",
  "Idotaccent",
  "Scedilla",
  "scedilla",
  "Cacute",
  "cacute",
  "Ccaron",
  "ccaron",
  "dcroat"
];
function cn(e) {
  this.font = e;
}
cn.prototype.charToGlyphIndex = function(e) {
  var r = e.codePointAt(0), t = this.font.glyphs;
  if (t) {
    for (var n = 0; n < t.length; n += 1)
      for (var a = t.get(n), i = 0; i < a.unicodes.length; i += 1)
        if (a.unicodes[i] === r)
          return n;
  }
  return null;
};
function vn(e) {
  this.cmap = e;
}
vn.prototype.charToGlyphIndex = function(e) {
  return this.cmap.glyphIndexMap[e.codePointAt(0)] || 0;
};
function yr(e, r) {
  this.encoding = e, this.charset = r;
}
yr.prototype.charToGlyphIndex = function(e) {
  var r = e.codePointAt(0), t = this.encoding[r];
  return this.charset.indexOf(t);
};
function Kr(e) {
  switch (e.version) {
    case 1:
      this.names = Le.slice();
      break;
    case 2:
      this.names = new Array(e.numberOfGlyphs);
      for (var r = 0; r < e.numberOfGlyphs; r++)
        e.glyphNameIndex[r] < Le.length ? this.names[r] = Le[e.glyphNameIndex[r]] : this.names[r] = e.names[e.glyphNameIndex[r] - Le.length];
      break;
    case 2.5:
      this.names = new Array(e.numberOfGlyphs);
      for (var t = 0; t < e.numberOfGlyphs; t++)
        this.names[t] = Le[t + e.glyphNameIndex[t]];
      break;
    case 3:
      this.names = [];
      break;
    default:
      this.names = [];
      break;
  }
}
Kr.prototype.nameToGlyphIndex = function(e) {
  return this.names.indexOf(e);
};
Kr.prototype.glyphIndexToName = function(e) {
  return this.names[e];
};
function ei(e) {
  for (var r, t = e.tables.cmap.glyphIndexMap, n = Object.keys(t), a = 0; a < n.length; a += 1) {
    var i = n[a], s = t[i];
    r = e.glyphs.get(s), r.addUnicode(parseInt(i));
  }
  for (var u = 0; u < e.glyphs.length; u += 1)
    r = e.glyphs.get(u), e.cffEncoding ? e.isCIDFont ? r.name = "gid" + u : r.name = e.cffEncoding.charset[u] : e.glyphNames.names && (r.name = e.glyphNames.glyphIndexToName(u));
}
function ri(e) {
  e._IndexToUnicodeMap = {};
  for (var r = e.tables.cmap.glyphIndexMap, t = Object.keys(r), n = 0; n < t.length; n += 1) {
    var a = t[n], i = r[a];
    e._IndexToUnicodeMap[i] === void 0 ? e._IndexToUnicodeMap[i] = {
      unicodes: [parseInt(a)]
    } : e._IndexToUnicodeMap[i].unicodes.push(parseInt(a));
  }
}
function ti(e, r) {
  r.lowMemory ? ri(e) : ei(e);
}
function ni(e, r, t, n, a) {
  e.beginPath(), e.moveTo(r, t), e.lineTo(n, a), e.stroke();
}
var Re = { line: ni };
function ai(e, r) {
  var t = r || new re();
  return {
    configurable: !0,
    get: function() {
      return typeof t == "function" && (t = t()), t;
    },
    set: function(n) {
      t = n;
    }
  };
}
function oe(e) {
  this.bindConstructorValues(e);
}
oe.prototype.bindConstructorValues = function(e) {
  this.index = e.index || 0, this.name = e.name || null, this.unicode = e.unicode || void 0, this.unicodes = e.unicodes || e.unicode !== void 0 ? [e.unicode] : [], "xMin" in e && (this.xMin = e.xMin), "yMin" in e && (this.yMin = e.yMin), "xMax" in e && (this.xMax = e.xMax), "yMax" in e && (this.yMax = e.yMax), "advanceWidth" in e && (this.advanceWidth = e.advanceWidth), Object.defineProperty(this, "path", ai(this, e.path));
};
oe.prototype.addUnicode = function(e) {
  this.unicodes.length === 0 && (this.unicode = e), this.unicodes.push(e);
};
oe.prototype.getBoundingBox = function() {
  return this.path.getBoundingBox();
};
oe.prototype.getPath = function(e, r, t, n, a) {
  e = e !== void 0 ? e : 0, r = r !== void 0 ? r : 0, t = t !== void 0 ? t : 72;
  var i, s;
  n || (n = {});
  var u = n.xScale, o = n.yScale;
  if (n.hinting && a && a.hinting && (s = this.path && a.hinting.exec(this, t)), s)
    i = a.hinting.getCommands(s), e = Math.round(e), r = Math.round(r), u = o = 1;
  else {
    i = this.path.commands;
    var l = 1 / (this.path.unitsPerEm || 1e3) * t;
    u === void 0 && (u = l), o === void 0 && (o = l);
  }
  for (var f = new re(), p = 0; p < i.length; p += 1) {
    var h = i[p];
    h.type === "M" ? f.moveTo(e + h.x * u, r + -h.y * o) : h.type === "L" ? f.lineTo(e + h.x * u, r + -h.y * o) : h.type === "Q" ? f.quadraticCurveTo(
      e + h.x1 * u,
      r + -h.y1 * o,
      e + h.x * u,
      r + -h.y * o
    ) : h.type === "C" ? f.curveTo(
      e + h.x1 * u,
      r + -h.y1 * o,
      e + h.x2 * u,
      r + -h.y2 * o,
      e + h.x * u,
      r + -h.y * o
    ) : h.type === "Z" && f.closePath();
  }
  return f;
};
oe.prototype.getContours = function() {
  if (this.points === void 0)
    return [];
  for (var e = [], r = [], t = 0; t < this.points.length; t += 1) {
    var n = this.points[t];
    r.push(n), n.lastPointOfContour && (e.push(r), r = []);
  }
  return D.argument(r.length === 0, "There are still points left in the current contour."), e;
};
oe.prototype.getMetrics = function() {
  for (var e = this.path.commands, r = [], t = [], n = 0; n < e.length; n += 1) {
    var a = e[n];
    a.type !== "Z" && (r.push(a.x), t.push(a.y)), (a.type === "Q" || a.type === "C") && (r.push(a.x1), t.push(a.y1)), a.type === "C" && (r.push(a.x2), t.push(a.y2));
  }
  var i = {
    xMin: Math.min.apply(null, r),
    yMin: Math.min.apply(null, t),
    xMax: Math.max.apply(null, r),
    yMax: Math.max.apply(null, t),
    leftSideBearing: this.leftSideBearing
  };
  return isFinite(i.xMin) || (i.xMin = 0), isFinite(i.xMax) || (i.xMax = this.advanceWidth), isFinite(i.yMin) || (i.yMin = 0), isFinite(i.yMax) || (i.yMax = 0), i.rightSideBearing = this.advanceWidth - i.leftSideBearing - (i.xMax - i.xMin), i;
};
oe.prototype.draw = function(e, r, t, n, a) {
  this.getPath(r, t, n, a).draw(e);
};
oe.prototype.drawPoints = function(e, r, t, n) {
  function a(p, h, c, d) {
    e.beginPath();
    for (var m = 0; m < p.length; m += 1)
      e.moveTo(h + p[m].x * d, c + p[m].y * d), e.arc(h + p[m].x * d, c + p[m].y * d, 2, 0, Math.PI * 2, !1);
    e.closePath(), e.fill();
  }
  r = r !== void 0 ? r : 0, t = t !== void 0 ? t : 0, n = n !== void 0 ? n : 24;
  for (var i = 1 / this.path.unitsPerEm * n, s = [], u = [], o = this.path, l = 0; l < o.commands.length; l += 1) {
    var f = o.commands[l];
    f.x !== void 0 && s.push({ x: f.x, y: -f.y }), f.x1 !== void 0 && u.push({ x: f.x1, y: -f.y1 }), f.x2 !== void 0 && u.push({ x: f.x2, y: -f.y2 });
  }
  e.fillStyle = "blue", a(s, r, t, i), e.fillStyle = "red", a(u, r, t, i);
};
oe.prototype.drawMetrics = function(e, r, t, n) {
  var a;
  r = r !== void 0 ? r : 0, t = t !== void 0 ? t : 0, n = n !== void 0 ? n : 24, a = 1 / this.path.unitsPerEm * n, e.lineWidth = 1, e.strokeStyle = "black", Re.line(e, r, -1e4, r, 1e4), Re.line(e, -1e4, t, 1e4, t);
  var i = this.xMin || 0, s = this.yMin || 0, u = this.xMax || 0, o = this.yMax || 0, l = this.advanceWidth || 0;
  e.strokeStyle = "blue", Re.line(e, r + i * a, -1e4, r + i * a, 1e4), Re.line(e, r + u * a, -1e4, r + u * a, 1e4), Re.line(e, -1e4, t + -s * a, 1e4, t + -s * a), Re.line(e, -1e4, t + -o * a, 1e4, t + -o * a), e.strokeStyle = "green", Re.line(e, r + l * a, -1e4, r + l * a, 1e4);
};
function lr(e, r, t) {
  Object.defineProperty(e, r, {
    get: function() {
      return e.path, e[t];
    },
    set: function(n) {
      e[t] = n;
    },
    enumerable: !0,
    configurable: !0
  });
}
function Jr(e, r) {
  if (this.font = e, this.glyphs = {}, Array.isArray(r))
    for (var t = 0; t < r.length; t++) {
      var n = r[t];
      n.path.unitsPerEm = e.unitsPerEm, this.glyphs[t] = n;
    }
  this.length = r && r.length || 0;
}
Jr.prototype.get = function(e) {
  if (this.glyphs[e] === void 0) {
    this.font._push(e), typeof this.glyphs[e] == "function" && (this.glyphs[e] = this.glyphs[e]());
    var r = this.glyphs[e], t = this.font._IndexToUnicodeMap[e];
    if (t)
      for (var n = 0; n < t.unicodes.length; n++)
        r.addUnicode(t.unicodes[n]);
    this.font.cffEncoding ? this.font.isCIDFont ? r.name = "gid" + e : r.name = this.font.cffEncoding.charset[e] : this.font.glyphNames.names && (r.name = this.font.glyphNames.glyphIndexToName(e)), this.glyphs[e].advanceWidth = this.font._hmtxTableData[e].advanceWidth, this.glyphs[e].leftSideBearing = this.font._hmtxTableData[e].leftSideBearing;
  } else
    typeof this.glyphs[e] == "function" && (this.glyphs[e] = this.glyphs[e]());
  return this.glyphs[e];
};
Jr.prototype.push = function(e, r) {
  this.glyphs[e] = r, this.length++;
};
function ii(e, r) {
  return new oe({ index: r, font: e });
}
function si(e, r, t, n, a, i) {
  return function() {
    var s = new oe({ index: r, font: e });
    return s.path = function() {
      t(s, n, a);
      var u = i(e.glyphs, s);
      return u.unitsPerEm = e.unitsPerEm, u;
    }, lr(s, "xMin", "_xMin"), lr(s, "xMax", "_xMax"), lr(s, "yMin", "_yMin"), lr(s, "yMax", "_yMax"), s;
  };
}
function oi(e, r, t, n) {
  return function() {
    var a = new oe({ index: r, font: e });
    return a.path = function() {
      var i = t(e, a, n);
      return i.unitsPerEm = e.unitsPerEm, i;
    }, a;
  };
}
var me = { GlyphSet: Jr, glyphLoader: ii, ttfGlyphLoader: si, cffGlyphLoader: oi };
function dn(e, r) {
  if (e === r)
    return !0;
  if (Array.isArray(e) && Array.isArray(r)) {
    if (e.length !== r.length)
      return !1;
    for (var t = 0; t < e.length; t += 1)
      if (!dn(e[t], r[t]))
        return !1;
    return !0;
  } else
    return !1;
}
function _r(e) {
  var r;
  return e.length < 1240 ? r = 107 : e.length < 33900 ? r = 1131 : r = 32768, r;
}
function Fe(e, r, t) {
  var n = [], a = [], i = E.getCard16(e, r), s, u;
  if (i !== 0) {
    var o = E.getByte(e, r + 2);
    s = r + (i + 1) * o + 2;
    for (var l = r + 3, f = 0; f < i + 1; f += 1)
      n.push(E.getOffset(e, l, o)), l += o;
    u = s + n[i];
  } else
    u = r + 2;
  for (var p = 0; p < n.length - 1; p += 1) {
    var h = E.getBytes(e, s + n[p], s + n[p + 1]);
    t && (h = t(h)), a.push(h);
  }
  return { objects: a, startOffset: r, endOffset: u };
}
function ui(e, r) {
  var t = [], n = E.getCard16(e, r), a, i;
  if (n !== 0) {
    var s = E.getByte(e, r + 2);
    a = r + (n + 1) * s + 2;
    for (var u = r + 3, o = 0; o < n + 1; o += 1)
      t.push(E.getOffset(e, u, s)), u += s;
    i = a + t[n];
  } else
    i = r + 2;
  return { offsets: t, startOffset: r, endOffset: i };
}
function li(e, r, t, n, a) {
  var i = E.getCard16(t, n), s = 0;
  if (i !== 0) {
    var u = E.getByte(t, n + 2);
    s = n + (i + 1) * u + 2;
  }
  var o = E.getBytes(t, s + r[e], s + r[e + 1]);
  return o;
}
function fi(e) {
  for (var r = "", t = 15, n = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "E", "E-", null, "-"]; ; ) {
    var a = e.parseByte(), i = a >> 4, s = a & 15;
    if (i === t || (r += n[i], s === t))
      break;
    r += n[s];
  }
  return parseFloat(r);
}
function hi(e, r) {
  var t, n, a, i;
  if (r === 28)
    return t = e.parseByte(), n = e.parseByte(), t << 8 | n;
  if (r === 29)
    return t = e.parseByte(), n = e.parseByte(), a = e.parseByte(), i = e.parseByte(), t << 24 | n << 16 | a << 8 | i;
  if (r === 30)
    return fi(e);
  if (r >= 32 && r <= 246)
    return r - 139;
  if (r >= 247 && r <= 250)
    return t = e.parseByte(), (r - 247) * 256 + t + 108;
  if (r >= 251 && r <= 254)
    return t = e.parseByte(), -(r - 251) * 256 - t - 108;
  throw new Error("Invalid b0 " + r);
}
function pi(e) {
  for (var r = {}, t = 0; t < e.length; t += 1) {
    var n = e[t][0], a = e[t][1], i = void 0;
    if (a.length === 1 ? i = a[0] : i = a, r.hasOwnProperty(n) && !isNaN(r[n]))
      throw new Error("Object " + r + " already has key " + n);
    r[n] = i;
  }
  return r;
}
function gn(e, r, t) {
  r = r !== void 0 ? r : 0;
  var n = new E.Parser(e, r), a = [], i = [];
  for (t = t !== void 0 ? t : e.length; n.relativeOffset < t; ) {
    var s = n.parseByte();
    s <= 21 ? (s === 12 && (s = 1200 + n.parseByte()), a.push([s, i]), i = []) : i.push(hi(n, s));
  }
  return pi(a);
}
function Xe(e, r) {
  return r <= 390 ? r = pr[r] : r = e[r - 391], r;
}
function xn(e, r, t) {
  for (var n = {}, a, i = 0; i < r.length; i += 1) {
    var s = r[i];
    if (Array.isArray(s.type)) {
      var u = [];
      u.length = s.type.length;
      for (var o = 0; o < s.type.length; o++)
        a = e[s.op] !== void 0 ? e[s.op][o] : void 0, a === void 0 && (a = s.value !== void 0 && s.value[o] !== void 0 ? s.value[o] : null), s.type[o] === "SID" && (a = Xe(t, a)), u[o] = a;
      n[s.name] = u;
    } else
      a = e[s.op], a === void 0 && (a = s.value !== void 0 ? s.value : null), s.type === "SID" && (a = Xe(t, a)), n[s.name] = a;
  }
  return n;
}
function ci(e, r) {
  var t = {};
  return t.formatMajor = E.getCard8(e, r), t.formatMinor = E.getCard8(e, r + 1), t.size = E.getCard8(e, r + 2), t.offsetSize = E.getCard8(e, r + 3), t.startOffset = r, t.endOffset = r + 4, t;
}
var mn = [
  { name: "version", op: 0, type: "SID" },
  { name: "notice", op: 1, type: "SID" },
  { name: "copyright", op: 1200, type: "SID" },
  { name: "fullName", op: 2, type: "SID" },
  { name: "familyName", op: 3, type: "SID" },
  { name: "weight", op: 4, type: "SID" },
  { name: "isFixedPitch", op: 1201, type: "number", value: 0 },
  { name: "italicAngle", op: 1202, type: "number", value: 0 },
  { name: "underlinePosition", op: 1203, type: "number", value: -100 },
  { name: "underlineThickness", op: 1204, type: "number", value: 50 },
  { name: "paintType", op: 1205, type: "number", value: 0 },
  { name: "charstringType", op: 1206, type: "number", value: 2 },
  {
    name: "fontMatrix",
    op: 1207,
    type: ["real", "real", "real", "real", "real", "real"],
    value: [1e-3, 0, 0, 1e-3, 0, 0]
  },
  { name: "uniqueId", op: 13, type: "number" },
  { name: "fontBBox", op: 5, type: ["number", "number", "number", "number"], value: [0, 0, 0, 0] },
  { name: "strokeWidth", op: 1208, type: "number", value: 0 },
  { name: "xuid", op: 14, type: [], value: null },
  { name: "charset", op: 15, type: "offset", value: 0 },
  { name: "encoding", op: 16, type: "offset", value: 0 },
  { name: "charStrings", op: 17, type: "offset", value: 0 },
  { name: "private", op: 18, type: ["number", "offset"], value: [0, 0] },
  { name: "ros", op: 1230, type: ["SID", "SID", "number"] },
  { name: "cidFontVersion", op: 1231, type: "number", value: 0 },
  { name: "cidFontRevision", op: 1232, type: "number", value: 0 },
  { name: "cidFontType", op: 1233, type: "number", value: 0 },
  { name: "cidCount", op: 1234, type: "number", value: 8720 },
  { name: "uidBase", op: 1235, type: "number" },
  { name: "fdArray", op: 1236, type: "offset" },
  { name: "fdSelect", op: 1237, type: "offset" },
  { name: "fontName", op: 1238, type: "SID" }
], yn = [
  { name: "subrs", op: 19, type: "offset", value: 0 },
  { name: "defaultWidthX", op: 20, type: "number", value: 0 },
  { name: "nominalWidthX", op: 21, type: "number", value: 0 }
];
function vi(e, r) {
  var t = gn(e, 0, e.byteLength);
  return xn(t, mn, r);
}
function bn(e, r, t, n) {
  var a = gn(e, r, t);
  return xn(a, yn, n);
}
function St(e, r, t, n) {
  for (var a = [], i = 0; i < t.length; i += 1) {
    var s = new DataView(new Uint8Array(t[i]).buffer), u = vi(s, n);
    u._subrs = [], u._subrsBias = 0, u._defaultWidthX = 0, u._nominalWidthX = 0;
    var o = u.private[0], l = u.private[1];
    if (o !== 0 && l !== 0) {
      var f = bn(e, l + r, o, n);
      if (u._defaultWidthX = f.defaultWidthX, u._nominalWidthX = f.nominalWidthX, f.subrs !== 0) {
        var p = l + f.subrs, h = Fe(e, p + r);
        u._subrs = h.objects, u._subrsBias = _r(u._subrs);
      }
      u._privateDict = f;
    }
    a.push(u);
  }
  return a;
}
function di(e, r, t, n) {
  var a, i, s = new E.Parser(e, r);
  t -= 1;
  var u = [".notdef"], o = s.parseCard8();
  if (o === 0)
    for (var l = 0; l < t; l += 1)
      a = s.parseSID(), u.push(Xe(n, a));
  else if (o === 1)
    for (; u.length <= t; ) {
      a = s.parseSID(), i = s.parseCard8();
      for (var f = 0; f <= i; f += 1)
        u.push(Xe(n, a)), a += 1;
    }
  else if (o === 2)
    for (; u.length <= t; ) {
      a = s.parseSID(), i = s.parseCard16();
      for (var p = 0; p <= i; p += 1)
        u.push(Xe(n, a)), a += 1;
    }
  else
    throw new Error("Unknown charset format " + o);
  return u;
}
function gi(e, r, t) {
  var n, a = {}, i = new E.Parser(e, r), s = i.parseCard8();
  if (s === 0)
    for (var u = i.parseCard8(), o = 0; o < u; o += 1)
      n = i.parseCard8(), a[n] = o;
  else if (s === 1) {
    var l = i.parseCard8();
    n = 1;
    for (var f = 0; f < l; f += 1)
      for (var p = i.parseCard8(), h = i.parseCard8(), c = p; c <= p + h; c += 1)
        a[c] = n, n += 1;
  } else
    throw new Error("Unknown encoding format " + s);
  return new yr(a, t);
}
function Tt(e, r, t) {
  var n, a, i, s, u = new re(), o = [], l = 0, f = !1, p = !1, h = 0, c = 0, d, m, y, x;
  if (e.isCIDFont) {
    var F = e.tables.cff.topDict._fdSelect[r.index], g = e.tables.cff.topDict._fdArray[F];
    d = g._subrs, m = g._subrsBias, y = g._defaultWidthX, x = g._nominalWidthX;
  } else
    d = e.tables.cff.topDict._subrs, m = e.tables.cff.topDict._subrsBias, y = e.tables.cff.topDict._defaultWidthX, x = e.tables.cff.topDict._nominalWidthX;
  var T = y;
  function O(U, G) {
    p && u.closePath(), u.moveTo(U, G), p = !0;
  }
  function P() {
    var U;
    U = o.length % 2 !== 0, U && !f && (T = o.shift() + x), l += o.length >> 1, o.length = 0, f = !0;
  }
  function L(U) {
    for (var G, N, V, $, te, Z, _, W, X, ee, I, Y, b = 0; b < U.length; ) {
      var S = U[b];
      switch (b += 1, S) {
        case 1:
          P();
          break;
        case 3:
          P();
          break;
        case 4:
          o.length > 1 && !f && (T = o.shift() + x, f = !0), c += o.pop(), O(h, c);
          break;
        case 5:
          for (; o.length > 0; )
            h += o.shift(), c += o.shift(), u.lineTo(h, c);
          break;
        case 6:
          for (; o.length > 0 && (h += o.shift(), u.lineTo(h, c), o.length !== 0); )
            c += o.shift(), u.lineTo(h, c);
          break;
        case 7:
          for (; o.length > 0 && (c += o.shift(), u.lineTo(h, c), o.length !== 0); )
            h += o.shift(), u.lineTo(h, c);
          break;
        case 8:
          for (; o.length > 0; )
            n = h + o.shift(), a = c + o.shift(), i = n + o.shift(), s = a + o.shift(), h = i + o.shift(), c = s + o.shift(), u.curveTo(n, a, i, s, h, c);
          break;
        case 10:
          te = o.pop() + m, Z = d[te], Z && L(Z);
          break;
        case 11:
          return;
        case 12:
          switch (S = U[b], b += 1, S) {
            case 35:
              n = h + o.shift(), a = c + o.shift(), i = n + o.shift(), s = a + o.shift(), _ = i + o.shift(), W = s + o.shift(), X = _ + o.shift(), ee = W + o.shift(), I = X + o.shift(), Y = ee + o.shift(), h = I + o.shift(), c = Y + o.shift(), o.shift(), u.curveTo(n, a, i, s, _, W), u.curveTo(X, ee, I, Y, h, c);
              break;
            case 34:
              n = h + o.shift(), a = c, i = n + o.shift(), s = a + o.shift(), _ = i + o.shift(), W = s, X = _ + o.shift(), ee = s, I = X + o.shift(), Y = c, h = I + o.shift(), u.curveTo(n, a, i, s, _, W), u.curveTo(X, ee, I, Y, h, c);
              break;
            case 36:
              n = h + o.shift(), a = c + o.shift(), i = n + o.shift(), s = a + o.shift(), _ = i + o.shift(), W = s, X = _ + o.shift(), ee = s, I = X + o.shift(), Y = ee + o.shift(), h = I + o.shift(), u.curveTo(n, a, i, s, _, W), u.curveTo(X, ee, I, Y, h, c);
              break;
            case 37:
              n = h + o.shift(), a = c + o.shift(), i = n + o.shift(), s = a + o.shift(), _ = i + o.shift(), W = s + o.shift(), X = _ + o.shift(), ee = W + o.shift(), I = X + o.shift(), Y = ee + o.shift(), Math.abs(I - h) > Math.abs(Y - c) ? h = I + o.shift() : c = Y + o.shift(), u.curveTo(n, a, i, s, _, W), u.curveTo(X, ee, I, Y, h, c);
              break;
            default:
              console.log("Glyph " + r.index + ": unknown operator 1200" + S), o.length = 0;
          }
          break;
        case 14:
          o.length > 0 && !f && (T = o.shift() + x, f = !0), p && (u.closePath(), p = !1);
          break;
        case 18:
          P();
          break;
        case 19:
        case 20:
          P(), b += l + 7 >> 3;
          break;
        case 21:
          o.length > 2 && !f && (T = o.shift() + x, f = !0), c += o.pop(), h += o.pop(), O(h, c);
          break;
        case 22:
          o.length > 1 && !f && (T = o.shift() + x, f = !0), h += o.pop(), O(h, c);
          break;
        case 23:
          P();
          break;
        case 24:
          for (; o.length > 2; )
            n = h + o.shift(), a = c + o.shift(), i = n + o.shift(), s = a + o.shift(), h = i + o.shift(), c = s + o.shift(), u.curveTo(n, a, i, s, h, c);
          h += o.shift(), c += o.shift(), u.lineTo(h, c);
          break;
        case 25:
          for (; o.length > 6; )
            h += o.shift(), c += o.shift(), u.lineTo(h, c);
          n = h + o.shift(), a = c + o.shift(), i = n + o.shift(), s = a + o.shift(), h = i + o.shift(), c = s + o.shift(), u.curveTo(n, a, i, s, h, c);
          break;
        case 26:
          for (o.length % 2 && (h += o.shift()); o.length > 0; )
            n = h, a = c + o.shift(), i = n + o.shift(), s = a + o.shift(), h = i, c = s + o.shift(), u.curveTo(n, a, i, s, h, c);
          break;
        case 27:
          for (o.length % 2 && (c += o.shift()); o.length > 0; )
            n = h + o.shift(), a = c, i = n + o.shift(), s = a + o.shift(), h = i + o.shift(), c = s, u.curveTo(n, a, i, s, h, c);
          break;
        case 28:
          G = U[b], N = U[b + 1], o.push((G << 24 | N << 16) >> 16), b += 2;
          break;
        case 29:
          te = o.pop() + e.gsubrsBias, Z = e.gsubrs[te], Z && L(Z);
          break;
        case 30:
          for (; o.length > 0 && (n = h, a = c + o.shift(), i = n + o.shift(), s = a + o.shift(), h = i + o.shift(), c = s + (o.length === 1 ? o.shift() : 0), u.curveTo(n, a, i, s, h, c), o.length !== 0); )
            n = h + o.shift(), a = c, i = n + o.shift(), s = a + o.shift(), c = s + o.shift(), h = i + (o.length === 1 ? o.shift() : 0), u.curveTo(n, a, i, s, h, c);
          break;
        case 31:
          for (; o.length > 0 && (n = h + o.shift(), a = c, i = n + o.shift(), s = a + o.shift(), c = s + o.shift(), h = i + (o.length === 1 ? o.shift() : 0), u.curveTo(n, a, i, s, h, c), o.length !== 0); )
            n = h, a = c + o.shift(), i = n + o.shift(), s = a + o.shift(), h = i + o.shift(), c = s + (o.length === 1 ? o.shift() : 0), u.curveTo(n, a, i, s, h, c);
          break;
        default:
          S < 32 ? console.log("Glyph " + r.index + ": unknown operator " + S) : S < 247 ? o.push(S - 139) : S < 251 ? (G = U[b], b += 1, o.push((S - 247) * 256 + G + 108)) : S < 255 ? (G = U[b], b += 1, o.push(-(S - 251) * 256 - G - 108)) : (G = U[b], N = U[b + 1], V = U[b + 2], $ = U[b + 3], b += 4, o.push((G << 24 | N << 16 | V << 8 | $) / 65536));
      }
    }
  }
  return L(t), r.advanceWidth = T, u;
}
function xi(e, r, t, n) {
  var a = [], i, s = new E.Parser(e, r), u = s.parseCard8();
  if (u === 0)
    for (var o = 0; o < t; o++) {
      if (i = s.parseCard8(), i >= n)
        throw new Error("CFF table CID Font FDSelect has bad FD index value " + i + " (FD count " + n + ")");
      a.push(i);
    }
  else if (u === 3) {
    var l = s.parseCard16(), f = s.parseCard16();
    if (f !== 0)
      throw new Error("CFF Table CID Font FDSelect format 3 range has bad initial GID " + f);
    for (var p, h = 0; h < l; h++) {
      if (i = s.parseCard8(), p = s.parseCard16(), i >= n)
        throw new Error("CFF table CID Font FDSelect has bad FD index value " + i + " (FD count " + n + ")");
      if (p > t)
        throw new Error("CFF Table CID Font FDSelect format 3 range has bad GID " + p);
      for (; f < p; f++)
        a.push(i);
      f = p;
    }
    if (p !== t)
      throw new Error("CFF Table CID Font FDSelect format 3 range has bad final GID " + p);
  } else
    throw new Error("CFF Table CID Font FDSelect table has unsupported format " + u);
  return a;
}
function mi(e, r, t, n) {
  t.tables.cff = {};
  var a = ci(e, r), i = Fe(e, a.endOffset, E.bytesToString), s = Fe(e, i.endOffset), u = Fe(e, s.endOffset, E.bytesToString), o = Fe(e, u.endOffset);
  t.gsubrs = o.objects, t.gsubrsBias = _r(t.gsubrs);
  var l = St(e, r, s.objects, u.objects);
  if (l.length !== 1)
    throw new Error("CFF table has too many fonts in 'FontSet' - count of fonts NameIndex.length = " + l.length);
  var f = l[0];
  if (t.tables.cff.topDict = f, f._privateDict && (t.defaultWidthX = f._privateDict.defaultWidthX, t.nominalWidthX = f._privateDict.nominalWidthX), f.ros[0] !== void 0 && f.ros[1] !== void 0 && (t.isCIDFont = !0), t.isCIDFont) {
    var p = f.fdArray, h = f.fdSelect;
    if (p === 0 || h === 0)
      throw new Error("Font is marked as a CID font, but FDArray and/or FDSelect information is missing");
    p += r;
    var c = Fe(e, p), d = St(e, r, c.objects, u.objects);
    f._fdArray = d, h += r, f._fdSelect = xi(e, h, t.numGlyphs, d.length);
  }
  var m = r + f.private[1], y = bn(e, m, f.private[0], u.objects);
  if (t.defaultWidthX = y.defaultWidthX, t.nominalWidthX = y.nominalWidthX, y.subrs !== 0) {
    var x = m + y.subrs, F = Fe(e, x);
    t.subrs = F.objects, t.subrsBias = _r(t.subrs);
  } else
    t.subrs = [], t.subrsBias = 0;
  var g;
  n.lowMemory ? (g = ui(e, r + f.charStrings), t.nGlyphs = g.offsets.length) : (g = Fe(e, r + f.charStrings), t.nGlyphs = g.objects.length);
  var T = di(e, r + f.charset, t.nGlyphs, u.objects);
  if (f.encoding === 0 ? t.cffEncoding = new yr(ja, T) : f.encoding === 1 ? t.cffEncoding = new yr($a, T) : t.cffEncoding = gi(e, r + f.encoding, T), t.encoding = t.encoding || t.cffEncoding, t.glyphs = new me.GlyphSet(t), n.lowMemory)
    t._push = function(L) {
      var U = li(L, g.offsets, e, r + f.charStrings);
      t.glyphs.push(L, me.cffGlyphLoader(t, L, Tt, U));
    };
  else
    for (var O = 0; O < t.nGlyphs; O += 1) {
      var P = g.objects[O];
      t.glyphs.push(O, me.cffGlyphLoader(t, O, Tt, P));
    }
}
function Sn(e, r) {
  var t, n = pr.indexOf(e);
  return n >= 0 && (t = n), n = r.indexOf(e), n >= 0 ? t = n + pr.length : (t = pr.length + r.length, r.push(e)), t;
}
function yi() {
  return new w.Record("Header", [
    { name: "major", type: "Card8", value: 1 },
    { name: "minor", type: "Card8", value: 0 },
    { name: "hdrSize", type: "Card8", value: 4 },
    { name: "major", type: "Card8", value: 1 }
  ]);
}
function bi(e) {
  var r = new w.Record("Name INDEX", [
    { name: "names", type: "INDEX", value: [] }
  ]);
  r.names = [];
  for (var t = 0; t < e.length; t += 1)
    r.names.push({ name: "name_" + t, type: "NAME", value: e[t] });
  return r;
}
function Tn(e, r, t) {
  for (var n = {}, a = 0; a < e.length; a += 1) {
    var i = e[a], s = r[i.name];
    s !== void 0 && !dn(s, i.value) && (i.type === "SID" && (s = Sn(s, t)), n[i.op] = { name: i.name, type: i.type, value: s });
  }
  return n;
}
function kt(e, r) {
  var t = new w.Record("Top DICT", [
    { name: "dict", type: "DICT", value: {} }
  ]);
  return t.dict = Tn(mn, e, r), t;
}
function Ft(e) {
  var r = new w.Record("Top DICT INDEX", [
    { name: "topDicts", type: "INDEX", value: [] }
  ]);
  return r.topDicts = [{ name: "topDict_0", type: "TABLE", value: e }], r;
}
function Si(e) {
  var r = new w.Record("String INDEX", [
    { name: "strings", type: "INDEX", value: [] }
  ]);
  r.strings = [];
  for (var t = 0; t < e.length; t += 1)
    r.strings.push({ name: "string_" + t, type: "STRING", value: e[t] });
  return r;
}
function Ti() {
  return new w.Record("Global Subr INDEX", [
    { name: "subrs", type: "INDEX", value: [] }
  ]);
}
function ki(e, r) {
  for (var t = new w.Record("Charsets", [
    { name: "format", type: "Card8", value: 0 }
  ]), n = 0; n < e.length; n += 1) {
    var a = e[n], i = Sn(a, r);
    t.fields.push({ name: "glyph_" + n, type: "SID", value: i });
  }
  return t;
}
function Fi(e) {
  var r = [], t = e.path;
  r.push({ name: "width", type: "NUMBER", value: e.advanceWidth });
  for (var n = 0, a = 0, i = 0; i < t.commands.length; i += 1) {
    var s = void 0, u = void 0, o = t.commands[i];
    if (o.type === "Q") {
      var l = 0.3333333333333333, f = 2 / 3;
      o = {
        type: "C",
        x: o.x,
        y: o.y,
        x1: Math.round(l * n + f * o.x1),
        y1: Math.round(l * a + f * o.y1),
        x2: Math.round(l * o.x + f * o.x1),
        y2: Math.round(l * o.y + f * o.y1)
      };
    }
    if (o.type === "M")
      s = Math.round(o.x - n), u = Math.round(o.y - a), r.push({ name: "dx", type: "NUMBER", value: s }), r.push({ name: "dy", type: "NUMBER", value: u }), r.push({ name: "rmoveto", type: "OP", value: 21 }), n = Math.round(o.x), a = Math.round(o.y);
    else if (o.type === "L")
      s = Math.round(o.x - n), u = Math.round(o.y - a), r.push({ name: "dx", type: "NUMBER", value: s }), r.push({ name: "dy", type: "NUMBER", value: u }), r.push({ name: "rlineto", type: "OP", value: 5 }), n = Math.round(o.x), a = Math.round(o.y);
    else if (o.type === "C") {
      var p = Math.round(o.x1 - n), h = Math.round(o.y1 - a), c = Math.round(o.x2 - o.x1), d = Math.round(o.y2 - o.y1);
      s = Math.round(o.x - o.x2), u = Math.round(o.y - o.y2), r.push({ name: "dx1", type: "NUMBER", value: p }), r.push({ name: "dy1", type: "NUMBER", value: h }), r.push({ name: "dx2", type: "NUMBER", value: c }), r.push({ name: "dy2", type: "NUMBER", value: d }), r.push({ name: "dx", type: "NUMBER", value: s }), r.push({ name: "dy", type: "NUMBER", value: u }), r.push({ name: "rrcurveto", type: "OP", value: 8 }), n = Math.round(o.x), a = Math.round(o.y);
    }
  }
  return r.push({ name: "endchar", type: "OP", value: 14 }), r;
}
function wi(e) {
  for (var r = new w.Record("CharStrings INDEX", [
    { name: "charStrings", type: "INDEX", value: [] }
  ]), t = 0; t < e.length; t += 1) {
    var n = e.get(t), a = Fi(n);
    r.charStrings.push({ name: n.name, type: "CHARSTRING", value: a });
  }
  return r;
}
function Ui(e, r) {
  var t = new w.Record("Private DICT", [
    { name: "dict", type: "DICT", value: {} }
  ]);
  return t.dict = Tn(yn, e, r), t;
}
function Ci(e, r) {
  for (var t = new w.Table("CFF ", [
    { name: "header", type: "RECORD" },
    { name: "nameIndex", type: "RECORD" },
    { name: "topDictIndex", type: "RECORD" },
    { name: "stringIndex", type: "RECORD" },
    { name: "globalSubrIndex", type: "RECORD" },
    { name: "charsets", type: "RECORD" },
    { name: "charStringsIndex", type: "RECORD" },
    { name: "privateDict", type: "RECORD" }
  ]), n = 1 / r.unitsPerEm, a = {
    version: r.version,
    fullName: r.fullName,
    familyName: r.familyName,
    weight: r.weightName,
    fontBBox: r.fontBBox || [0, 0, 0, 0],
    fontMatrix: [n, 0, 0, n, 0, 0],
    charset: 999,
    encoding: 0,
    charStrings: 999,
    private: [0, 999]
  }, i = {}, s = [], u, o = 1; o < e.length; o += 1)
    u = e.get(o), s.push(u.name);
  var l = [];
  t.header = yi(), t.nameIndex = bi([r.postScriptName]);
  var f = kt(a, l);
  t.topDictIndex = Ft(f), t.globalSubrIndex = Ti(), t.charsets = ki(s, l), t.charStringsIndex = wi(e), t.privateDict = Ui(i, l), t.stringIndex = Si(l);
  var p = t.header.sizeOf() + t.nameIndex.sizeOf() + t.topDictIndex.sizeOf() + t.stringIndex.sizeOf() + t.globalSubrIndex.sizeOf();
  return a.charset = p, a.encoding = 0, a.charStrings = a.charset + t.charsets.sizeOf(), a.private[1] = a.charStrings + t.charStringsIndex.sizeOf(), f = kt(a, l), t.topDictIndex = Ft(f), t;
}
var kn = { parse: mi, make: Ci };
function Oi(e, r) {
  var t = {}, n = new E.Parser(e, r);
  return t.version = n.parseVersion(), t.fontRevision = Math.round(n.parseFixed() * 1e3) / 1e3, t.checkSumAdjustment = n.parseULong(), t.magicNumber = n.parseULong(), D.argument(t.magicNumber === 1594834165, "Font header has wrong magic number."), t.flags = n.parseUShort(), t.unitsPerEm = n.parseUShort(), t.created = n.parseLongDateTime(), t.modified = n.parseLongDateTime(), t.xMin = n.parseShort(), t.yMin = n.parseShort(), t.xMax = n.parseShort(), t.yMax = n.parseShort(), t.macStyle = n.parseUShort(), t.lowestRecPPEM = n.parseUShort(), t.fontDirectionHint = n.parseShort(), t.indexToLocFormat = n.parseShort(), t.glyphDataFormat = n.parseShort(), t;
}
function Ei(e) {
  var r = Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3) + 2082844800, t = r;
  return e.createdTimestamp && (t = e.createdTimestamp + 2082844800), new w.Table("head", [
    { name: "version", type: "FIXED", value: 65536 },
    { name: "fontRevision", type: "FIXED", value: 65536 },
    { name: "checkSumAdjustment", type: "ULONG", value: 0 },
    { name: "magicNumber", type: "ULONG", value: 1594834165 },
    { name: "flags", type: "USHORT", value: 0 },
    { name: "unitsPerEm", type: "USHORT", value: 1e3 },
    { name: "created", type: "LONGDATETIME", value: t },
    { name: "modified", type: "LONGDATETIME", value: r },
    { name: "xMin", type: "SHORT", value: 0 },
    { name: "yMin", type: "SHORT", value: 0 },
    { name: "xMax", type: "SHORT", value: 0 },
    { name: "yMax", type: "SHORT", value: 0 },
    { name: "macStyle", type: "USHORT", value: 0 },
    { name: "lowestRecPPEM", type: "USHORT", value: 0 },
    { name: "fontDirectionHint", type: "SHORT", value: 2 },
    { name: "indexToLocFormat", type: "SHORT", value: 0 },
    { name: "glyphDataFormat", type: "SHORT", value: 0 }
  ], e);
}
var Fn = { parse: Oi, make: Ei };
function Ri(e, r) {
  var t = {}, n = new E.Parser(e, r);
  return t.version = n.parseVersion(), t.ascender = n.parseShort(), t.descender = n.parseShort(), t.lineGap = n.parseShort(), t.advanceWidthMax = n.parseUShort(), t.minLeftSideBearing = n.parseShort(), t.minRightSideBearing = n.parseShort(), t.xMaxExtent = n.parseShort(), t.caretSlopeRise = n.parseShort(), t.caretSlopeRun = n.parseShort(), t.caretOffset = n.parseShort(), n.relativeOffset += 8, t.metricDataFormat = n.parseShort(), t.numberOfHMetrics = n.parseUShort(), t;
}
function Li(e) {
  return new w.Table("hhea", [
    { name: "version", type: "FIXED", value: 65536 },
    { name: "ascender", type: "FWORD", value: 0 },
    { name: "descender", type: "FWORD", value: 0 },
    { name: "lineGap", type: "FWORD", value: 0 },
    { name: "advanceWidthMax", type: "UFWORD", value: 0 },
    { name: "minLeftSideBearing", type: "FWORD", value: 0 },
    { name: "minRightSideBearing", type: "FWORD", value: 0 },
    { name: "xMaxExtent", type: "FWORD", value: 0 },
    { name: "caretSlopeRise", type: "SHORT", value: 1 },
    { name: "caretSlopeRun", type: "SHORT", value: 0 },
    { name: "caretOffset", type: "SHORT", value: 0 },
    { name: "reserved1", type: "SHORT", value: 0 },
    { name: "reserved2", type: "SHORT", value: 0 },
    { name: "reserved3", type: "SHORT", value: 0 },
    { name: "reserved4", type: "SHORT", value: 0 },
    { name: "metricDataFormat", type: "SHORT", value: 0 },
    { name: "numberOfHMetrics", type: "USHORT", value: 0 }
  ], e);
}
var wn = { parse: Ri, make: Li };
function Di(e, r, t, n, a) {
  for (var i, s, u = new E.Parser(e, r), o = 0; o < n; o += 1) {
    o < t && (i = u.parseUShort(), s = u.parseShort());
    var l = a.get(o);
    l.advanceWidth = i, l.leftSideBearing = s;
  }
}
function Mi(e, r, t, n, a) {
  e._hmtxTableData = {};
  for (var i, s, u = new E.Parser(r, t), o = 0; o < a; o += 1)
    o < n && (i = u.parseUShort(), s = u.parseShort()), e._hmtxTableData[o] = {
      advanceWidth: i,
      leftSideBearing: s
    };
}
function Ai(e, r, t, n, a, i, s) {
  s.lowMemory ? Mi(e, r, t, n, a) : Di(r, t, n, a, i);
}
function Pi(e) {
  for (var r = new w.Table("hmtx", []), t = 0; t < e.length; t += 1) {
    var n = e.get(t), a = n.advanceWidth || 0, i = n.leftSideBearing || 0;
    r.fields.push({ name: "advanceWidth_" + t, type: "USHORT", value: a }), r.fields.push({ name: "leftSideBearing_" + t, type: "SHORT", value: i });
  }
  return r;
}
var Un = { parse: Ai, make: Pi };
function Ii(e) {
  for (var r = new w.Table("ltag", [
    { name: "version", type: "ULONG", value: 1 },
    { name: "flags", type: "ULONG", value: 0 },
    { name: "numTags", type: "ULONG", value: e.length }
  ]), t = "", n = 12 + e.length * 4, a = 0; a < e.length; ++a) {
    var i = t.indexOf(e[a]);
    i < 0 && (i = t.length, t += e[a]), r.fields.push({ name: "offset " + a, type: "USHORT", value: n + i }), r.fields.push({ name: "length " + a, type: "USHORT", value: e[a].length });
  }
  return r.fields.push({ name: "stringPool", type: "CHARARRAY", value: t }), r;
}
function Bi(e, r) {
  var t = new E.Parser(e, r), n = t.parseULong();
  D.argument(n === 1, "Unsupported ltag table version."), t.skip("uLong", 1);
  for (var a = t.parseULong(), i = [], s = 0; s < a; s++) {
    for (var u = "", o = r + t.parseUShort(), l = t.parseUShort(), f = o; f < o + l; ++f)
      u += String.fromCharCode(e.getInt8(f));
    i.push(u);
  }
  return i;
}
var Cn = { make: Ii, parse: Bi };
function Gi(e, r) {
  var t = {}, n = new E.Parser(e, r);
  return t.version = n.parseVersion(), t.numGlyphs = n.parseUShort(), t.version === 1 && (t.maxPoints = n.parseUShort(), t.maxContours = n.parseUShort(), t.maxCompositePoints = n.parseUShort(), t.maxCompositeContours = n.parseUShort(), t.maxZones = n.parseUShort(), t.maxTwilightPoints = n.parseUShort(), t.maxStorage = n.parseUShort(), t.maxFunctionDefs = n.parseUShort(), t.maxInstructionDefs = n.parseUShort(), t.maxStackElements = n.parseUShort(), t.maxSizeOfInstructions = n.parseUShort(), t.maxComponentElements = n.parseUShort(), t.maxComponentDepth = n.parseUShort()), t;
}
function Ni(e) {
  return new w.Table("maxp", [
    { name: "version", type: "FIXED", value: 20480 },
    { name: "numGlyphs", type: "USHORT", value: e }
  ]);
}
var On = { parse: Gi, make: Ni }, En = [
  "copyright",
  // 0
  "fontFamily",
  // 1
  "fontSubfamily",
  // 2
  "uniqueID",
  // 3
  "fullName",
  // 4
  "version",
  // 5
  "postScriptName",
  // 6
  "trademark",
  // 7
  "manufacturer",
  // 8
  "designer",
  // 9
  "description",
  // 10
  "manufacturerURL",
  // 11
  "designerURL",
  // 12
  "license",
  // 13
  "licenseURL",
  // 14
  "reserved",
  // 15
  "preferredFamily",
  // 16
  "preferredSubfamily",
  // 17
  "compatibleFullName",
  // 18
  "sampleText",
  // 19
  "postScriptFindFontName",
  // 20
  "wwsFamily",
  // 21
  "wwsSubfamily"
  // 22
], Rn = {
  0: "en",
  1: "fr",
  2: "de",
  3: "it",
  4: "nl",
  5: "sv",
  6: "es",
  7: "da",
  8: "pt",
  9: "no",
  10: "he",
  11: "ja",
  12: "ar",
  13: "fi",
  14: "el",
  15: "is",
  16: "mt",
  17: "tr",
  18: "hr",
  19: "zh-Hant",
  20: "ur",
  21: "hi",
  22: "th",
  23: "ko",
  24: "lt",
  25: "pl",
  26: "hu",
  27: "es",
  28: "lv",
  29: "se",
  30: "fo",
  31: "fa",
  32: "ru",
  33: "zh",
  34: "nl-BE",
  35: "ga",
  36: "sq",
  37: "ro",
  38: "cz",
  39: "sk",
  40: "si",
  41: "yi",
  42: "sr",
  43: "mk",
  44: "bg",
  45: "uk",
  46: "be",
  47: "uz",
  48: "kk",
  49: "az-Cyrl",
  50: "az-Arab",
  51: "hy",
  52: "ka",
  53: "mo",
  54: "ky",
  55: "tg",
  56: "tk",
  57: "mn-CN",
  58: "mn",
  59: "ps",
  60: "ks",
  61: "ku",
  62: "sd",
  63: "bo",
  64: "ne",
  65: "sa",
  66: "mr",
  67: "bn",
  68: "as",
  69: "gu",
  70: "pa",
  71: "or",
  72: "ml",
  73: "kn",
  74: "ta",
  75: "te",
  76: "si",
  77: "my",
  78: "km",
  79: "lo",
  80: "vi",
  81: "id",
  82: "tl",
  83: "ms",
  84: "ms-Arab",
  85: "am",
  86: "ti",
  87: "om",
  88: "so",
  89: "sw",
  90: "rw",
  91: "rn",
  92: "ny",
  93: "mg",
  94: "eo",
  128: "cy",
  129: "eu",
  130: "ca",
  131: "la",
  132: "qu",
  133: "gn",
  134: "ay",
  135: "tt",
  136: "ug",
  137: "dz",
  138: "jv",
  139: "su",
  140: "gl",
  141: "af",
  142: "br",
  143: "iu",
  144: "gd",
  145: "gv",
  146: "ga",
  147: "to",
  148: "el-polyton",
  149: "kl",
  150: "az",
  151: "nn"
}, _i = {
  0: 0,
  // langEnglish → smRoman
  1: 0,
  // langFrench → smRoman
  2: 0,
  // langGerman → smRoman
  3: 0,
  // langItalian → smRoman
  4: 0,
  // langDutch → smRoman
  5: 0,
  // langSwedish → smRoman
  6: 0,
  // langSpanish → smRoman
  7: 0,
  // langDanish → smRoman
  8: 0,
  // langPortuguese → smRoman
  9: 0,
  // langNorwegian → smRoman
  10: 5,
  // langHebrew → smHebrew
  11: 1,
  // langJapanese → smJapanese
  12: 4,
  // langArabic → smArabic
  13: 0,
  // langFinnish → smRoman
  14: 6,
  // langGreek → smGreek
  15: 0,
  // langIcelandic → smRoman (modified)
  16: 0,
  // langMaltese → smRoman
  17: 0,
  // langTurkish → smRoman (modified)
  18: 0,
  // langCroatian → smRoman (modified)
  19: 2,
  // langTradChinese → smTradChinese
  20: 4,
  // langUrdu → smArabic
  21: 9,
  // langHindi → smDevanagari
  22: 21,
  // langThai → smThai
  23: 3,
  // langKorean → smKorean
  24: 29,
  // langLithuanian → smCentralEuroRoman
  25: 29,
  // langPolish → smCentralEuroRoman
  26: 29,
  // langHungarian → smCentralEuroRoman
  27: 29,
  // langEstonian → smCentralEuroRoman
  28: 29,
  // langLatvian → smCentralEuroRoman
  29: 0,
  // langSami → smRoman
  30: 0,
  // langFaroese → smRoman (modified)
  31: 4,
  // langFarsi → smArabic (modified)
  32: 7,
  // langRussian → smCyrillic
  33: 25,
  // langSimpChinese → smSimpChinese
  34: 0,
  // langFlemish → smRoman
  35: 0,
  // langIrishGaelic → smRoman (modified)
  36: 0,
  // langAlbanian → smRoman
  37: 0,
  // langRomanian → smRoman (modified)
  38: 29,
  // langCzech → smCentralEuroRoman
  39: 29,
  // langSlovak → smCentralEuroRoman
  40: 0,
  // langSlovenian → smRoman (modified)
  41: 5,
  // langYiddish → smHebrew
  42: 7,
  // langSerbian → smCyrillic
  43: 7,
  // langMacedonian → smCyrillic
  44: 7,
  // langBulgarian → smCyrillic
  45: 7,
  // langUkrainian → smCyrillic (modified)
  46: 7,
  // langByelorussian → smCyrillic
  47: 7,
  // langUzbek → smCyrillic
  48: 7,
  // langKazakh → smCyrillic
  49: 7,
  // langAzerbaijani → smCyrillic
  50: 4,
  // langAzerbaijanAr → smArabic
  51: 24,
  // langArmenian → smArmenian
  52: 23,
  // langGeorgian → smGeorgian
  53: 7,
  // langMoldavian → smCyrillic
  54: 7,
  // langKirghiz → smCyrillic
  55: 7,
  // langTajiki → smCyrillic
  56: 7,
  // langTurkmen → smCyrillic
  57: 27,
  // langMongolian → smMongolian
  58: 7,
  // langMongolianCyr → smCyrillic
  59: 4,
  // langPashto → smArabic
  60: 4,
  // langKurdish → smArabic
  61: 4,
  // langKashmiri → smArabic
  62: 4,
  // langSindhi → smArabic
  63: 26,
  // langTibetan → smTibetan
  64: 9,
  // langNepali → smDevanagari
  65: 9,
  // langSanskrit → smDevanagari
  66: 9,
  // langMarathi → smDevanagari
  67: 13,
  // langBengali → smBengali
  68: 13,
  // langAssamese → smBengali
  69: 11,
  // langGujarati → smGujarati
  70: 10,
  // langPunjabi → smGurmukhi
  71: 12,
  // langOriya → smOriya
  72: 17,
  // langMalayalam → smMalayalam
  73: 16,
  // langKannada → smKannada
  74: 14,
  // langTamil → smTamil
  75: 15,
  // langTelugu → smTelugu
  76: 18,
  // langSinhalese → smSinhalese
  77: 19,
  // langBurmese → smBurmese
  78: 20,
  // langKhmer → smKhmer
  79: 22,
  // langLao → smLao
  80: 30,
  // langVietnamese → smVietnamese
  81: 0,
  // langIndonesian → smRoman
  82: 0,
  // langTagalog → smRoman
  83: 0,
  // langMalayRoman → smRoman
  84: 4,
  // langMalayArabic → smArabic
  85: 28,
  // langAmharic → smEthiopic
  86: 28,
  // langTigrinya → smEthiopic
  87: 28,
  // langOromo → smEthiopic
  88: 0,
  // langSomali → smRoman
  89: 0,
  // langSwahili → smRoman
  90: 0,
  // langKinyarwanda → smRoman
  91: 0,
  // langRundi → smRoman
  92: 0,
  // langNyanja → smRoman
  93: 0,
  // langMalagasy → smRoman
  94: 0,
  // langEsperanto → smRoman
  128: 0,
  // langWelsh → smRoman (modified)
  129: 0,
  // langBasque → smRoman
  130: 0,
  // langCatalan → smRoman
  131: 0,
  // langLatin → smRoman
  132: 0,
  // langQuechua → smRoman
  133: 0,
  // langGuarani → smRoman
  134: 0,
  // langAymara → smRoman
  135: 7,
  // langTatar → smCyrillic
  136: 4,
  // langUighur → smArabic
  137: 26,
  // langDzongkha → smTibetan
  138: 0,
  // langJavaneseRom → smRoman
  139: 0,
  // langSundaneseRom → smRoman
  140: 0,
  // langGalician → smRoman
  141: 0,
  // langAfrikaans → smRoman
  142: 0,
  // langBreton → smRoman (modified)
  143: 28,
  // langInuktitut → smEthiopic (modified)
  144: 0,
  // langScottishGaelic → smRoman (modified)
  145: 0,
  // langManxGaelic → smRoman (modified)
  146: 0,
  // langIrishGaelicScript → smRoman (modified)
  147: 0,
  // langTongan → smRoman
  148: 6,
  // langGreekAncient → smRoman
  149: 0,
  // langGreenlandic → smRoman
  150: 0,
  // langAzerbaijanRoman → smRoman
  151: 0
  // langNynorsk → smRoman
}, Ln = {
  1078: "af",
  1052: "sq",
  1156: "gsw",
  1118: "am",
  5121: "ar-DZ",
  15361: "ar-BH",
  3073: "ar",
  2049: "ar-IQ",
  11265: "ar-JO",
  13313: "ar-KW",
  12289: "ar-LB",
  4097: "ar-LY",
  6145: "ary",
  8193: "ar-OM",
  16385: "ar-QA",
  1025: "ar-SA",
  10241: "ar-SY",
  7169: "aeb",
  14337: "ar-AE",
  9217: "ar-YE",
  1067: "hy",
  1101: "as",
  2092: "az-Cyrl",
  1068: "az",
  1133: "ba",
  1069: "eu",
  1059: "be",
  2117: "bn",
  1093: "bn-IN",
  8218: "bs-Cyrl",
  5146: "bs",
  1150: "br",
  1026: "bg",
  1027: "ca",
  3076: "zh-HK",
  5124: "zh-MO",
  2052: "zh",
  4100: "zh-SG",
  1028: "zh-TW",
  1155: "co",
  1050: "hr",
  4122: "hr-BA",
  1029: "cs",
  1030: "da",
  1164: "prs",
  1125: "dv",
  2067: "nl-BE",
  1043: "nl",
  3081: "en-AU",
  10249: "en-BZ",
  4105: "en-CA",
  9225: "en-029",
  16393: "en-IN",
  6153: "en-IE",
  8201: "en-JM",
  17417: "en-MY",
  5129: "en-NZ",
  13321: "en-PH",
  18441: "en-SG",
  7177: "en-ZA",
  11273: "en-TT",
  2057: "en-GB",
  1033: "en",
  12297: "en-ZW",
  1061: "et",
  1080: "fo",
  1124: "fil",
  1035: "fi",
  2060: "fr-BE",
  3084: "fr-CA",
  1036: "fr",
  5132: "fr-LU",
  6156: "fr-MC",
  4108: "fr-CH",
  1122: "fy",
  1110: "gl",
  1079: "ka",
  3079: "de-AT",
  1031: "de",
  5127: "de-LI",
  4103: "de-LU",
  2055: "de-CH",
  1032: "el",
  1135: "kl",
  1095: "gu",
  1128: "ha",
  1037: "he",
  1081: "hi",
  1038: "hu",
  1039: "is",
  1136: "ig",
  1057: "id",
  1117: "iu",
  2141: "iu-Latn",
  2108: "ga",
  1076: "xh",
  1077: "zu",
  1040: "it",
  2064: "it-CH",
  1041: "ja",
  1099: "kn",
  1087: "kk",
  1107: "km",
  1158: "quc",
  1159: "rw",
  1089: "sw",
  1111: "kok",
  1042: "ko",
  1088: "ky",
  1108: "lo",
  1062: "lv",
  1063: "lt",
  2094: "dsb",
  1134: "lb",
  1071: "mk",
  2110: "ms-BN",
  1086: "ms",
  1100: "ml",
  1082: "mt",
  1153: "mi",
  1146: "arn",
  1102: "mr",
  1148: "moh",
  1104: "mn",
  2128: "mn-CN",
  1121: "ne",
  1044: "nb",
  2068: "nn",
  1154: "oc",
  1096: "or",
  1123: "ps",
  1045: "pl",
  1046: "pt",
  2070: "pt-PT",
  1094: "pa",
  1131: "qu-BO",
  2155: "qu-EC",
  3179: "qu",
  1048: "ro",
  1047: "rm",
  1049: "ru",
  9275: "smn",
  4155: "smj-NO",
  5179: "smj",
  3131: "se-FI",
  1083: "se",
  2107: "se-SE",
  8251: "sms",
  6203: "sma-NO",
  7227: "sms",
  1103: "sa",
  7194: "sr-Cyrl-BA",
  3098: "sr",
  6170: "sr-Latn-BA",
  2074: "sr-Latn",
  1132: "nso",
  1074: "tn",
  1115: "si",
  1051: "sk",
  1060: "sl",
  11274: "es-AR",
  16394: "es-BO",
  13322: "es-CL",
  9226: "es-CO",
  5130: "es-CR",
  7178: "es-DO",
  12298: "es-EC",
  17418: "es-SV",
  4106: "es-GT",
  18442: "es-HN",
  2058: "es-MX",
  19466: "es-NI",
  6154: "es-PA",
  15370: "es-PY",
  10250: "es-PE",
  20490: "es-PR",
  // Microsoft has defined two different language codes for
  // “Spanish with modern sorting” and “Spanish with traditional
  // sorting”. This makes sense for collation APIs, and it would be
  // possible to express this in BCP 47 language tags via Unicode
  // extensions (eg., es-u-co-trad is Spanish with traditional
  // sorting). However, for storing names in fonts, the distinction
  // does not make sense, so we give “es” in both cases.
  3082: "es",
  1034: "es",
  21514: "es-US",
  14346: "es-UY",
  8202: "es-VE",
  2077: "sv-FI",
  1053: "sv",
  1114: "syr",
  1064: "tg",
  2143: "tzm",
  1097: "ta",
  1092: "tt",
  1098: "te",
  1054: "th",
  1105: "bo",
  1055: "tr",
  1090: "tk",
  1152: "ug",
  1058: "uk",
  1070: "hsb",
  1056: "ur",
  2115: "uz-Cyrl",
  1091: "uz",
  1066: "vi",
  1106: "cy",
  1160: "wo",
  1157: "sah",
  1144: "ii",
  1130: "yo"
};
function Hi(e, r, t) {
  switch (e) {
    case 0:
      if (r === 65535)
        return "und";
      if (t)
        return t[r];
      break;
    case 1:
      return Rn[r];
    case 3:
      return Ln[r];
  }
}
var Hr = "utf-16", zi = {
  0: "macintosh",
  // smRoman
  1: "x-mac-japanese",
  // smJapanese
  2: "x-mac-chinesetrad",
  // smTradChinese
  3: "x-mac-korean",
  // smKorean
  6: "x-mac-greek",
  // smGreek
  7: "x-mac-cyrillic",
  // smCyrillic
  9: "x-mac-devanagai",
  // smDevanagari
  10: "x-mac-gurmukhi",
  // smGurmukhi
  11: "x-mac-gujarati",
  // smGujarati
  12: "x-mac-oriya",
  // smOriya
  13: "x-mac-bengali",
  // smBengali
  14: "x-mac-tamil",
  // smTamil
  15: "x-mac-telugu",
  // smTelugu
  16: "x-mac-kannada",
  // smKannada
  17: "x-mac-malayalam",
  // smMalayalam
  18: "x-mac-sinhalese",
  // smSinhalese
  19: "x-mac-burmese",
  // smBurmese
  20: "x-mac-khmer",
  // smKhmer
  21: "x-mac-thai",
  // smThai
  22: "x-mac-lao",
  // smLao
  23: "x-mac-georgian",
  // smGeorgian
  24: "x-mac-armenian",
  // smArmenian
  25: "x-mac-chinesesimp",
  // smSimpChinese
  26: "x-mac-tibetan",
  // smTibetan
  27: "x-mac-mongolian",
  // smMongolian
  28: "x-mac-ethiopic",
  // smEthiopic
  29: "x-mac-ce",
  // smCentralEuroRoman
  30: "x-mac-vietnamese",
  // smVietnamese
  31: "x-mac-extarabic"
  // smExtArabic
}, Vi = {
  15: "x-mac-icelandic",
  // langIcelandic
  17: "x-mac-turkish",
  // langTurkish
  18: "x-mac-croatian",
  // langCroatian
  24: "x-mac-ce",
  // langLithuanian
  25: "x-mac-ce",
  // langPolish
  26: "x-mac-ce",
  // langHungarian
  27: "x-mac-ce",
  // langEstonian
  28: "x-mac-ce",
  // langLatvian
  30: "x-mac-icelandic",
  // langFaroese
  37: "x-mac-romanian",
  // langRomanian
  38: "x-mac-ce",
  // langCzech
  39: "x-mac-ce",
  // langSlovak
  40: "x-mac-ce",
  // langSlovenian
  143: "x-mac-inuit",
  // langInuktitut
  146: "x-mac-gaelic"
  // langIrishGaelicScript
};
function Dn(e, r, t) {
  switch (e) {
    case 0:
      return Hr;
    case 1:
      return Vi[t] || zi[r];
    case 3:
      if (r === 1 || r === 10)
        return Hr;
      break;
  }
}
function Wi(e, r, t) {
  for (var n = {}, a = new E.Parser(e, r), i = a.parseUShort(), s = a.parseUShort(), u = a.offset + a.parseUShort(), o = 0; o < s; o++) {
    var l = a.parseUShort(), f = a.parseUShort(), p = a.parseUShort(), h = a.parseUShort(), c = En[h] || h, d = a.parseUShort(), m = a.parseUShort(), y = Hi(l, p, t), x = Dn(l, f, p);
    if (x !== void 0 && y !== void 0) {
      var F = void 0;
      if (x === Hr ? F = _e.UTF16(e, u + m, d) : F = _e.MACSTRING(e, u + m, d, x), F) {
        var g = n[c];
        g === void 0 && (g = n[c] = {}), g[y] = F;
      }
    }
  }
  return i === 1 && a.parseUShort(), n;
}
function Ur(e) {
  var r = {};
  for (var t in e)
    r[e[t]] = parseInt(t);
  return r;
}
function wt(e, r, t, n, a, i) {
  return new w.Record("NameRecord", [
    { name: "platformID", type: "USHORT", value: e },
    { name: "encodingID", type: "USHORT", value: r },
    { name: "languageID", type: "USHORT", value: t },
    { name: "nameID", type: "USHORT", value: n },
    { name: "length", type: "USHORT", value: a },
    { name: "offset", type: "USHORT", value: i }
  ]);
}
function Xi(e, r) {
  var t = e.length, n = r.length - t + 1;
  e:
    for (var a = 0; a < n; a++)
      for (; a < n; a++) {
        for (var i = 0; i < t; i++)
          if (r[a + i] !== e[i])
            continue e;
        return a;
      }
  return -1;
}
function Ut(e, r) {
  var t = Xi(e, r);
  if (t < 0) {
    t = r.length;
    for (var n = 0, a = e.length; n < a; ++n)
      r.push(e[n]);
  }
  return t;
}
function qi(e, r) {
  var t, n = [], a = {}, i = Ur(En);
  for (var s in e) {
    var u = i[s];
    if (u === void 0 && (u = s), t = parseInt(u), isNaN(t))
      throw new Error('Name table entry "' + s + '" does not exist, see nameTableNames for complete list.');
    a[t] = e[s], n.push(t);
  }
  for (var o = Ur(Rn), l = Ur(Ln), f = [], p = [], h = 0; h < n.length; h++) {
    t = n[h];
    var c = a[t];
    for (var d in c) {
      var m = c[d], y = 1, x = o[d], F = _i[x], g = Dn(y, F, x), T = k.MACSTRING(m, g);
      T === void 0 && (y = 0, x = r.indexOf(d), x < 0 && (x = r.length, r.push(d)), F = 4, T = k.UTF16(m));
      var O = Ut(T, p);
      f.push(wt(
        y,
        F,
        x,
        t,
        T.length,
        O
      ));
      var P = l[d];
      if (P !== void 0) {
        var L = k.UTF16(m), U = Ut(L, p);
        f.push(wt(
          3,
          1,
          P,
          t,
          L.length,
          U
        ));
      }
    }
  }
  f.sort(function(V, $) {
    return V.platformID - $.platformID || V.encodingID - $.encodingID || V.languageID - $.languageID || V.nameID - $.nameID;
  });
  for (var G = new w.Table("name", [
    { name: "format", type: "USHORT", value: 0 },
    { name: "count", type: "USHORT", value: f.length },
    { name: "stringOffset", type: "USHORT", value: 6 + f.length * 12 }
  ]), N = 0; N < f.length; N++)
    G.fields.push({ name: "record_" + N, type: "RECORD", value: f[N] });
  return G.fields.push({ name: "strings", type: "LITERAL", value: p }), G;
}
var Mn = { parse: Wi, make: qi }, zr = [
  { begin: 0, end: 127 },
  // Basic Latin
  { begin: 128, end: 255 },
  // Latin-1 Supplement
  { begin: 256, end: 383 },
  // Latin Extended-A
  { begin: 384, end: 591 },
  // Latin Extended-B
  { begin: 592, end: 687 },
  // IPA Extensions
  { begin: 688, end: 767 },
  // Spacing Modifier Letters
  { begin: 768, end: 879 },
  // Combining Diacritical Marks
  { begin: 880, end: 1023 },
  // Greek and Coptic
  { begin: 11392, end: 11519 },
  // Coptic
  { begin: 1024, end: 1279 },
  // Cyrillic
  { begin: 1328, end: 1423 },
  // Armenian
  { begin: 1424, end: 1535 },
  // Hebrew
  { begin: 42240, end: 42559 },
  // Vai
  { begin: 1536, end: 1791 },
  // Arabic
  { begin: 1984, end: 2047 },
  // NKo
  { begin: 2304, end: 2431 },
  // Devanagari
  { begin: 2432, end: 2559 },
  // Bengali
  { begin: 2560, end: 2687 },
  // Gurmukhi
  { begin: 2688, end: 2815 },
  // Gujarati
  { begin: 2816, end: 2943 },
  // Oriya
  { begin: 2944, end: 3071 },
  // Tamil
  { begin: 3072, end: 3199 },
  // Telugu
  { begin: 3200, end: 3327 },
  // Kannada
  { begin: 3328, end: 3455 },
  // Malayalam
  { begin: 3584, end: 3711 },
  // Thai
  { begin: 3712, end: 3839 },
  // Lao
  { begin: 4256, end: 4351 },
  // Georgian
  { begin: 6912, end: 7039 },
  // Balinese
  { begin: 4352, end: 4607 },
  // Hangul Jamo
  { begin: 7680, end: 7935 },
  // Latin Extended Additional
  { begin: 7936, end: 8191 },
  // Greek Extended
  { begin: 8192, end: 8303 },
  // General Punctuation
  { begin: 8304, end: 8351 },
  // Superscripts And Subscripts
  { begin: 8352, end: 8399 },
  // Currency Symbol
  { begin: 8400, end: 8447 },
  // Combining Diacritical Marks For Symbols
  { begin: 8448, end: 8527 },
  // Letterlike Symbols
  { begin: 8528, end: 8591 },
  // Number Forms
  { begin: 8592, end: 8703 },
  // Arrows
  { begin: 8704, end: 8959 },
  // Mathematical Operators
  { begin: 8960, end: 9215 },
  // Miscellaneous Technical
  { begin: 9216, end: 9279 },
  // Control Pictures
  { begin: 9280, end: 9311 },
  // Optical Character Recognition
  { begin: 9312, end: 9471 },
  // Enclosed Alphanumerics
  { begin: 9472, end: 9599 },
  // Box Drawing
  { begin: 9600, end: 9631 },
  // Block Elements
  { begin: 9632, end: 9727 },
  // Geometric Shapes
  { begin: 9728, end: 9983 },
  // Miscellaneous Symbols
  { begin: 9984, end: 10175 },
  // Dingbats
  { begin: 12288, end: 12351 },
  // CJK Symbols And Punctuation
  { begin: 12352, end: 12447 },
  // Hiragana
  { begin: 12448, end: 12543 },
  // Katakana
  { begin: 12544, end: 12591 },
  // Bopomofo
  { begin: 12592, end: 12687 },
  // Hangul Compatibility Jamo
  { begin: 43072, end: 43135 },
  // Phags-pa
  { begin: 12800, end: 13055 },
  // Enclosed CJK Letters And Months
  { begin: 13056, end: 13311 },
  // CJK Compatibility
  { begin: 44032, end: 55215 },
  // Hangul Syllables
  { begin: 55296, end: 57343 },
  // Non-Plane 0 *
  { begin: 67840, end: 67871 },
  // Phoenicia
  { begin: 19968, end: 40959 },
  // CJK Unified Ideographs
  { begin: 57344, end: 63743 },
  // Private Use Area (plane 0)
  { begin: 12736, end: 12783 },
  // CJK Strokes
  { begin: 64256, end: 64335 },
  // Alphabetic Presentation Forms
  { begin: 64336, end: 65023 },
  // Arabic Presentation Forms-A
  { begin: 65056, end: 65071 },
  // Combining Half Marks
  { begin: 65040, end: 65055 },
  // Vertical Forms
  { begin: 65104, end: 65135 },
  // Small Form Variants
  { begin: 65136, end: 65279 },
  // Arabic Presentation Forms-B
  { begin: 65280, end: 65519 },
  // Halfwidth And Fullwidth Forms
  { begin: 65520, end: 65535 },
  // Specials
  { begin: 3840, end: 4095 },
  // Tibetan
  { begin: 1792, end: 1871 },
  // Syriac
  { begin: 1920, end: 1983 },
  // Thaana
  { begin: 3456, end: 3583 },
  // Sinhala
  { begin: 4096, end: 4255 },
  // Myanmar
  { begin: 4608, end: 4991 },
  // Ethiopic
  { begin: 5024, end: 5119 },
  // Cherokee
  { begin: 5120, end: 5759 },
  // Unified Canadian Aboriginal Syllabics
  { begin: 5760, end: 5791 },
  // Ogham
  { begin: 5792, end: 5887 },
  // Runic
  { begin: 6016, end: 6143 },
  // Khmer
  { begin: 6144, end: 6319 },
  // Mongolian
  { begin: 10240, end: 10495 },
  // Braille Patterns
  { begin: 40960, end: 42127 },
  // Yi Syllables
  { begin: 5888, end: 5919 },
  // Tagalog
  { begin: 66304, end: 66351 },
  // Old Italic
  { begin: 66352, end: 66383 },
  // Gothic
  { begin: 66560, end: 66639 },
  // Deseret
  { begin: 118784, end: 119039 },
  // Byzantine Musical Symbols
  { begin: 119808, end: 120831 },
  // Mathematical Alphanumeric Symbols
  { begin: 1044480, end: 1048573 },
  // Private Use (plane 15)
  { begin: 65024, end: 65039 },
  // Variation Selectors
  { begin: 917504, end: 917631 },
  // Tags
  { begin: 6400, end: 6479 },
  // Limbu
  { begin: 6480, end: 6527 },
  // Tai Le
  { begin: 6528, end: 6623 },
  // New Tai Lue
  { begin: 6656, end: 6687 },
  // Buginese
  { begin: 11264, end: 11359 },
  // Glagolitic
  { begin: 11568, end: 11647 },
  // Tifinagh
  { begin: 19904, end: 19967 },
  // Yijing Hexagram Symbols
  { begin: 43008, end: 43055 },
  // Syloti Nagri
  { begin: 65536, end: 65663 },
  // Linear B Syllabary
  { begin: 65856, end: 65935 },
  // Ancient Greek Numbers
  { begin: 66432, end: 66463 },
  // Ugaritic
  { begin: 66464, end: 66527 },
  // Old Persian
  { begin: 66640, end: 66687 },
  // Shavian
  { begin: 66688, end: 66735 },
  // Osmanya
  { begin: 67584, end: 67647 },
  // Cypriot Syllabary
  { begin: 68096, end: 68191 },
  // Kharoshthi
  { begin: 119552, end: 119647 },
  // Tai Xuan Jing Symbols
  { begin: 73728, end: 74751 },
  // Cuneiform
  { begin: 119648, end: 119679 },
  // Counting Rod Numerals
  { begin: 7040, end: 7103 },
  // Sundanese
  { begin: 7168, end: 7247 },
  // Lepcha
  { begin: 7248, end: 7295 },
  // Ol Chiki
  { begin: 43136, end: 43231 },
  // Saurashtra
  { begin: 43264, end: 43311 },
  // Kayah Li
  { begin: 43312, end: 43359 },
  // Rejang
  { begin: 43520, end: 43615 },
  // Cham
  { begin: 65936, end: 65999 },
  // Ancient Symbols
  { begin: 66e3, end: 66047 },
  // Phaistos Disc
  { begin: 66208, end: 66271 },
  // Carian
  { begin: 127024, end: 127135 }
  // Domino Tiles
];
function Zi(e) {
  for (var r = 0; r < zr.length; r += 1) {
    var t = zr[r];
    if (e >= t.begin && e < t.end)
      return r;
  }
  return -1;
}
function Yi(e, r) {
  var t = {}, n = new E.Parser(e, r);
  t.version = n.parseUShort(), t.xAvgCharWidth = n.parseShort(), t.usWeightClass = n.parseUShort(), t.usWidthClass = n.parseUShort(), t.fsType = n.parseUShort(), t.ySubscriptXSize = n.parseShort(), t.ySubscriptYSize = n.parseShort(), t.ySubscriptXOffset = n.parseShort(), t.ySubscriptYOffset = n.parseShort(), t.ySuperscriptXSize = n.parseShort(), t.ySuperscriptYSize = n.parseShort(), t.ySuperscriptXOffset = n.parseShort(), t.ySuperscriptYOffset = n.parseShort(), t.yStrikeoutSize = n.parseShort(), t.yStrikeoutPosition = n.parseShort(), t.sFamilyClass = n.parseShort(), t.panose = [];
  for (var a = 0; a < 10; a++)
    t.panose[a] = n.parseByte();
  return t.ulUnicodeRange1 = n.parseULong(), t.ulUnicodeRange2 = n.parseULong(), t.ulUnicodeRange3 = n.parseULong(), t.ulUnicodeRange4 = n.parseULong(), t.achVendID = String.fromCharCode(n.parseByte(), n.parseByte(), n.parseByte(), n.parseByte()), t.fsSelection = n.parseUShort(), t.usFirstCharIndex = n.parseUShort(), t.usLastCharIndex = n.parseUShort(), t.sTypoAscender = n.parseShort(), t.sTypoDescender = n.parseShort(), t.sTypoLineGap = n.parseShort(), t.usWinAscent = n.parseUShort(), t.usWinDescent = n.parseUShort(), t.version >= 1 && (t.ulCodePageRange1 = n.parseULong(), t.ulCodePageRange2 = n.parseULong()), t.version >= 2 && (t.sxHeight = n.parseShort(), t.sCapHeight = n.parseShort(), t.usDefaultChar = n.parseUShort(), t.usBreakChar = n.parseUShort(), t.usMaxContent = n.parseUShort()), t;
}
function Qi(e) {
  return new w.Table("OS/2", [
    { name: "version", type: "USHORT", value: 3 },
    { name: "xAvgCharWidth", type: "SHORT", value: 0 },
    { name: "usWeightClass", type: "USHORT", value: 0 },
    { name: "usWidthClass", type: "USHORT", value: 0 },
    { name: "fsType", type: "USHORT", value: 0 },
    { name: "ySubscriptXSize", type: "SHORT", value: 650 },
    { name: "ySubscriptYSize", type: "SHORT", value: 699 },
    { name: "ySubscriptXOffset", type: "SHORT", value: 0 },
    { name: "ySubscriptYOffset", type: "SHORT", value: 140 },
    { name: "ySuperscriptXSize", type: "SHORT", value: 650 },
    { name: "ySuperscriptYSize", type: "SHORT", value: 699 },
    { name: "ySuperscriptXOffset", type: "SHORT", value: 0 },
    { name: "ySuperscriptYOffset", type: "SHORT", value: 479 },
    { name: "yStrikeoutSize", type: "SHORT", value: 49 },
    { name: "yStrikeoutPosition", type: "SHORT", value: 258 },
    { name: "sFamilyClass", type: "SHORT", value: 0 },
    { name: "bFamilyType", type: "BYTE", value: 0 },
    { name: "bSerifStyle", type: "BYTE", value: 0 },
    { name: "bWeight", type: "BYTE", value: 0 },
    { name: "bProportion", type: "BYTE", value: 0 },
    { name: "bContrast", type: "BYTE", value: 0 },
    { name: "bStrokeVariation", type: "BYTE", value: 0 },
    { name: "bArmStyle", type: "BYTE", value: 0 },
    { name: "bLetterform", type: "BYTE", value: 0 },
    { name: "bMidline", type: "BYTE", value: 0 },
    { name: "bXHeight", type: "BYTE", value: 0 },
    { name: "ulUnicodeRange1", type: "ULONG", value: 0 },
    { name: "ulUnicodeRange2", type: "ULONG", value: 0 },
    { name: "ulUnicodeRange3", type: "ULONG", value: 0 },
    { name: "ulUnicodeRange4", type: "ULONG", value: 0 },
    { name: "achVendID", type: "CHARARRAY", value: "XXXX" },
    { name: "fsSelection", type: "USHORT", value: 0 },
    { name: "usFirstCharIndex", type: "USHORT", value: 0 },
    { name: "usLastCharIndex", type: "USHORT", value: 0 },
    { name: "sTypoAscender", type: "SHORT", value: 0 },
    { name: "sTypoDescender", type: "SHORT", value: 0 },
    { name: "sTypoLineGap", type: "SHORT", value: 0 },
    { name: "usWinAscent", type: "USHORT", value: 0 },
    { name: "usWinDescent", type: "USHORT", value: 0 },
    { name: "ulCodePageRange1", type: "ULONG", value: 0 },
    { name: "ulCodePageRange2", type: "ULONG", value: 0 },
    { name: "sxHeight", type: "SHORT", value: 0 },
    { name: "sCapHeight", type: "SHORT", value: 0 },
    { name: "usDefaultChar", type: "USHORT", value: 0 },
    { name: "usBreakChar", type: "USHORT", value: 0 },
    { name: "usMaxContext", type: "USHORT", value: 0 }
  ], e);
}
var Vr = { parse: Yi, make: Qi, unicodeRanges: zr, getUnicodeRange: Zi };
function Ki(e, r) {
  var t = {}, n = new E.Parser(e, r);
  switch (t.version = n.parseVersion(), t.italicAngle = n.parseFixed(), t.underlinePosition = n.parseShort(), t.underlineThickness = n.parseShort(), t.isFixedPitch = n.parseULong(), t.minMemType42 = n.parseULong(), t.maxMemType42 = n.parseULong(), t.minMemType1 = n.parseULong(), t.maxMemType1 = n.parseULong(), t.version) {
    case 1:
      t.names = Le.slice();
      break;
    case 2:
      t.numberOfGlyphs = n.parseUShort(), t.glyphNameIndex = new Array(t.numberOfGlyphs);
      for (var a = 0; a < t.numberOfGlyphs; a++)
        t.glyphNameIndex[a] = n.parseUShort();
      t.names = [];
      for (var i = 0; i < t.numberOfGlyphs; i++)
        if (t.glyphNameIndex[i] >= Le.length) {
          var s = n.parseChar();
          t.names.push(n.parseString(s));
        }
      break;
    case 2.5:
      t.numberOfGlyphs = n.parseUShort(), t.offset = new Array(t.numberOfGlyphs);
      for (var u = 0; u < t.numberOfGlyphs; u++)
        t.offset[u] = n.parseChar();
      break;
  }
  return t;
}
function Ji() {
  return new w.Table("post", [
    { name: "version", type: "FIXED", value: 196608 },
    { name: "italicAngle", type: "FIXED", value: 0 },
    { name: "underlinePosition", type: "FWORD", value: 0 },
    { name: "underlineThickness", type: "FWORD", value: 0 },
    { name: "isFixedPitch", type: "ULONG", value: 0 },
    { name: "minMemType42", type: "ULONG", value: 0 },
    { name: "maxMemType42", type: "ULONG", value: 0 },
    { name: "minMemType1", type: "ULONG", value: 0 },
    { name: "maxMemType1", type: "ULONG", value: 0 }
  ]);
}
var An = { parse: Ki, make: Ji }, le = new Array(9);
le[1] = function() {
  var r = this.offset + this.relativeOffset, t = this.parseUShort();
  if (t === 1)
    return {
      substFormat: 1,
      coverage: this.parsePointer(v.coverage),
      deltaGlyphId: this.parseUShort()
    };
  if (t === 2)
    return {
      substFormat: 2,
      coverage: this.parsePointer(v.coverage),
      substitute: this.parseOffset16List()
    };
  D.assert(!1, "0x" + r.toString(16) + ": lookup type 1 format must be 1 or 2.");
};
le[2] = function() {
  var r = this.parseUShort();
  return D.argument(r === 1, "GSUB Multiple Substitution Subtable identifier-format must be 1"), {
    substFormat: r,
    coverage: this.parsePointer(v.coverage),
    sequences: this.parseListOfLists()
  };
};
le[3] = function() {
  var r = this.parseUShort();
  return D.argument(r === 1, "GSUB Alternate Substitution Subtable identifier-format must be 1"), {
    substFormat: r,
    coverage: this.parsePointer(v.coverage),
    alternateSets: this.parseListOfLists()
  };
};
le[4] = function() {
  var r = this.parseUShort();
  return D.argument(r === 1, "GSUB ligature table identifier-format must be 1"), {
    substFormat: r,
    coverage: this.parsePointer(v.coverage),
    ligatureSets: this.parseListOfLists(function() {
      return {
        ligGlyph: this.parseUShort(),
        components: this.parseUShortList(this.parseUShort() - 1)
      };
    })
  };
};
var Ne = {
  sequenceIndex: v.uShort,
  lookupListIndex: v.uShort
};
le[5] = function() {
  var r = this.offset + this.relativeOffset, t = this.parseUShort();
  if (t === 1)
    return {
      substFormat: t,
      coverage: this.parsePointer(v.coverage),
      ruleSets: this.parseListOfLists(function() {
        var i = this.parseUShort(), s = this.parseUShort();
        return {
          input: this.parseUShortList(i - 1),
          lookupRecords: this.parseRecordList(s, Ne)
        };
      })
    };
  if (t === 2)
    return {
      substFormat: t,
      coverage: this.parsePointer(v.coverage),
      classDef: this.parsePointer(v.classDef),
      classSets: this.parseListOfLists(function() {
        var i = this.parseUShort(), s = this.parseUShort();
        return {
          classes: this.parseUShortList(i - 1),
          lookupRecords: this.parseRecordList(s, Ne)
        };
      })
    };
  if (t === 3) {
    var n = this.parseUShort(), a = this.parseUShort();
    return {
      substFormat: t,
      coverages: this.parseList(n, v.pointer(v.coverage)),
      lookupRecords: this.parseRecordList(a, Ne)
    };
  }
  D.assert(!1, "0x" + r.toString(16) + ": lookup type 5 format must be 1, 2 or 3.");
};
le[6] = function() {
  var r = this.offset + this.relativeOffset, t = this.parseUShort();
  if (t === 1)
    return {
      substFormat: 1,
      coverage: this.parsePointer(v.coverage),
      chainRuleSets: this.parseListOfLists(function() {
        return {
          backtrack: this.parseUShortList(),
          input: this.parseUShortList(this.parseShort() - 1),
          lookahead: this.parseUShortList(),
          lookupRecords: this.parseRecordList(Ne)
        };
      })
    };
  if (t === 2)
    return {
      substFormat: 2,
      coverage: this.parsePointer(v.coverage),
      backtrackClassDef: this.parsePointer(v.classDef),
      inputClassDef: this.parsePointer(v.classDef),
      lookaheadClassDef: this.parsePointer(v.classDef),
      chainClassSet: this.parseListOfLists(function() {
        return {
          backtrack: this.parseUShortList(),
          input: this.parseUShortList(this.parseShort() - 1),
          lookahead: this.parseUShortList(),
          lookupRecords: this.parseRecordList(Ne)
        };
      })
    };
  if (t === 3)
    return {
      substFormat: 3,
      backtrackCoverage: this.parseList(v.pointer(v.coverage)),
      inputCoverage: this.parseList(v.pointer(v.coverage)),
      lookaheadCoverage: this.parseList(v.pointer(v.coverage)),
      lookupRecords: this.parseRecordList(Ne)
    };
  D.assert(!1, "0x" + r.toString(16) + ": lookup type 6 format must be 1, 2 or 3.");
};
le[7] = function() {
  var r = this.parseUShort();
  D.argument(r === 1, "GSUB Extension Substitution subtable identifier-format must be 1");
  var t = this.parseUShort(), n = new v(this.data, this.offset + this.parseULong());
  return {
    substFormat: 1,
    lookupType: t,
    extension: le[t].call(n)
  };
};
le[8] = function() {
  var r = this.parseUShort();
  return D.argument(r === 1, "GSUB Reverse Chaining Contextual Single Substitution Subtable identifier-format must be 1"), {
    substFormat: r,
    coverage: this.parsePointer(v.coverage),
    backtrackCoverage: this.parseList(v.pointer(v.coverage)),
    lookaheadCoverage: this.parseList(v.pointer(v.coverage)),
    substitutes: this.parseUShortList()
  };
};
function ji(e, r) {
  r = r || 0;
  var t = new v(e, r), n = t.parseVersion(1);
  return D.argument(n === 1 || n === 1.1, "Unsupported GSUB table version."), n === 1 ? {
    version: n,
    scripts: t.parseScriptList(),
    features: t.parseFeatureList(),
    lookups: t.parseLookupList(le)
  } : {
    version: n,
    scripts: t.parseScriptList(),
    features: t.parseFeatureList(),
    lookups: t.parseLookupList(le),
    variations: t.parseFeatureVariationsList()
  };
}
var He = new Array(9);
He[1] = function(r) {
  return r.substFormat === 1 ? new w.Table("substitutionTable", [
    { name: "substFormat", type: "USHORT", value: 1 },
    { name: "coverage", type: "TABLE", value: new w.Coverage(r.coverage) },
    { name: "deltaGlyphID", type: "USHORT", value: r.deltaGlyphId }
  ]) : new w.Table("substitutionTable", [
    { name: "substFormat", type: "USHORT", value: 2 },
    { name: "coverage", type: "TABLE", value: new w.Coverage(r.coverage) }
  ].concat(w.ushortList("substitute", r.substitute)));
};
He[2] = function(r) {
  return D.assert(r.substFormat === 1, "Lookup type 2 substFormat must be 1."), new w.Table("substitutionTable", [
    { name: "substFormat", type: "USHORT", value: 1 },
    { name: "coverage", type: "TABLE", value: new w.Coverage(r.coverage) }
  ].concat(w.tableList("seqSet", r.sequences, function(t) {
    return new w.Table("sequenceSetTable", w.ushortList("sequence", t));
  })));
};
He[3] = function(r) {
  return D.assert(r.substFormat === 1, "Lookup type 3 substFormat must be 1."), new w.Table("substitutionTable", [
    { name: "substFormat", type: "USHORT", value: 1 },
    { name: "coverage", type: "TABLE", value: new w.Coverage(r.coverage) }
  ].concat(w.tableList("altSet", r.alternateSets, function(t) {
    return new w.Table("alternateSetTable", w.ushortList("alternate", t));
  })));
};
He[4] = function(r) {
  return D.assert(r.substFormat === 1, "Lookup type 4 substFormat must be 1."), new w.Table("substitutionTable", [
    { name: "substFormat", type: "USHORT", value: 1 },
    { name: "coverage", type: "TABLE", value: new w.Coverage(r.coverage) }
  ].concat(w.tableList("ligSet", r.ligatureSets, function(t) {
    return new w.Table("ligatureSetTable", w.tableList("ligature", t, function(n) {
      return new w.Table(
        "ligatureTable",
        [{ name: "ligGlyph", type: "USHORT", value: n.ligGlyph }].concat(w.ushortList("component", n.components, n.components.length + 1))
      );
    }));
  })));
};
He[6] = function(r) {
  if (r.substFormat === 1) {
    var t = new w.Table("chainContextTable", [
      { name: "substFormat", type: "USHORT", value: r.substFormat },
      { name: "coverage", type: "TABLE", value: new w.Coverage(r.coverage) }
    ].concat(w.tableList("chainRuleSet", r.chainRuleSets, function(i) {
      return new w.Table("chainRuleSetTable", w.tableList("chainRule", i, function(s) {
        var u = w.ushortList("backtrackGlyph", s.backtrack, s.backtrack.length).concat(w.ushortList("inputGlyph", s.input, s.input.length + 1)).concat(w.ushortList("lookaheadGlyph", s.lookahead, s.lookahead.length)).concat(w.ushortList("substitution", [], s.lookupRecords.length));
        return s.lookupRecords.forEach(function(o, l) {
          u = u.concat({ name: "sequenceIndex" + l, type: "USHORT", value: o.sequenceIndex }).concat({ name: "lookupListIndex" + l, type: "USHORT", value: o.lookupListIndex });
        }), new w.Table("chainRuleTable", u);
      }));
    })));
    return t;
  } else if (r.substFormat === 2)
    D.assert(!1, "lookup type 6 format 2 is not yet supported.");
  else if (r.substFormat === 3) {
    var n = [
      { name: "substFormat", type: "USHORT", value: r.substFormat }
    ];
    n.push({ name: "backtrackGlyphCount", type: "USHORT", value: r.backtrackCoverage.length }), r.backtrackCoverage.forEach(function(i, s) {
      n.push({ name: "backtrackCoverage" + s, type: "TABLE", value: new w.Coverage(i) });
    }), n.push({ name: "inputGlyphCount", type: "USHORT", value: r.inputCoverage.length }), r.inputCoverage.forEach(function(i, s) {
      n.push({ name: "inputCoverage" + s, type: "TABLE", value: new w.Coverage(i) });
    }), n.push({ name: "lookaheadGlyphCount", type: "USHORT", value: r.lookaheadCoverage.length }), r.lookaheadCoverage.forEach(function(i, s) {
      n.push({ name: "lookaheadCoverage" + s, type: "TABLE", value: new w.Coverage(i) });
    }), n.push({ name: "substitutionCount", type: "USHORT", value: r.lookupRecords.length }), r.lookupRecords.forEach(function(i, s) {
      n = n.concat({ name: "sequenceIndex" + s, type: "USHORT", value: i.sequenceIndex }).concat({ name: "lookupListIndex" + s, type: "USHORT", value: i.lookupListIndex });
    });
    var a = new w.Table("chainContextTable", n);
    return a;
  }
  D.assert(!1, "lookup type 6 format must be 1, 2 or 3.");
};
function $i(e) {
  return new w.Table("GSUB", [
    { name: "version", type: "ULONG", value: 65536 },
    { name: "scripts", type: "TABLE", value: new w.ScriptList(e.scripts) },
    { name: "features", type: "TABLE", value: new w.FeatureList(e.features) },
    { name: "lookups", type: "TABLE", value: new w.LookupList(e.lookups, He) }
  ]);
}
var Pn = { parse: ji, make: $i };
function es(e, r) {
  var t = new E.Parser(e, r), n = t.parseULong();
  D.argument(n === 1, "Unsupported META table version."), t.parseULong(), t.parseULong();
  for (var a = t.parseULong(), i = {}, s = 0; s < a; s++) {
    var u = t.parseTag(), o = t.parseULong(), l = t.parseULong(), f = _e.UTF8(e, r + o, l);
    i[u] = f;
  }
  return i;
}
function rs(e) {
  var r = Object.keys(e).length, t = "", n = 16 + r * 12, a = new w.Table("meta", [
    { name: "version", type: "ULONG", value: 1 },
    { name: "flags", type: "ULONG", value: 0 },
    { name: "offset", type: "ULONG", value: n },
    { name: "numTags", type: "ULONG", value: r }
  ]);
  for (var i in e) {
    var s = t.length;
    t += e[i], a.fields.push({ name: "tag " + i, type: "TAG", value: i }), a.fields.push({ name: "offset " + i, type: "ULONG", value: n + s }), a.fields.push({ name: "length " + i, type: "ULONG", value: e[i].length });
  }
  return a.fields.push({ name: "stringPool", type: "CHARARRAY", value: t }), a;
}
var In = { parse: es, make: rs };
function Ct(e) {
  return Math.log(e) / Math.log(2) | 0;
}
function jr(e) {
  for (; e.length % 4 !== 0; )
    e.push(0);
  for (var r = 0, t = 0; t < e.length; t += 4)
    r += (e[t] << 24) + (e[t + 1] << 16) + (e[t + 2] << 8) + e[t + 3];
  return r %= Math.pow(2, 32), r;
}
function Ot(e, r, t, n) {
  return new w.Record("Table Record", [
    { name: "tag", type: "TAG", value: e !== void 0 ? e : "" },
    { name: "checkSum", type: "ULONG", value: r !== void 0 ? r : 0 },
    { name: "offset", type: "ULONG", value: t !== void 0 ? t : 0 },
    { name: "length", type: "ULONG", value: n !== void 0 ? n : 0 }
  ]);
}
function Bn(e) {
  var r = new w.Table("sfnt", [
    { name: "version", type: "TAG", value: "OTTO" },
    { name: "numTables", type: "USHORT", value: 0 },
    { name: "searchRange", type: "USHORT", value: 0 },
    { name: "entrySelector", type: "USHORT", value: 0 },
    { name: "rangeShift", type: "USHORT", value: 0 }
  ]);
  r.tables = e, r.numTables = e.length;
  var t = Math.pow(2, Ct(r.numTables));
  r.searchRange = 16 * t, r.entrySelector = Ct(t), r.rangeShift = r.numTables * 16 - r.searchRange;
  for (var n = [], a = [], i = r.sizeOf() + Ot().sizeOf() * r.numTables; i % 4 !== 0; )
    i += 1, a.push({ name: "padding", type: "BYTE", value: 0 });
  for (var s = 0; s < e.length; s += 1) {
    var u = e[s];
    D.argument(u.tableName.length === 4, "Table name" + u.tableName + " is invalid.");
    var o = u.sizeOf(), l = Ot(u.tableName, jr(u.encode()), i, o);
    for (n.push({ name: l.tag + " Table Record", type: "RECORD", value: l }), a.push({ name: u.tableName + " table", type: "RECORD", value: u }), i += o, D.argument(!isNaN(i), "Something went wrong calculating the offset."); i % 4 !== 0; )
      i += 1, a.push({ name: "padding", type: "BYTE", value: 0 });
  }
  return n.sort(function(f, p) {
    return f.value.tag > p.value.tag ? 1 : -1;
  }), r.fields = r.fields.concat(n), r.fields = r.fields.concat(a), r;
}
function Et(e, r, t) {
  for (var n = 0; n < r.length; n += 1) {
    var a = e.charToGlyphIndex(r[n]);
    if (a > 0) {
      var i = e.glyphs.get(a);
      return i.getMetrics();
    }
  }
  return t;
}
function ts(e) {
  for (var r = 0, t = 0; t < e.length; t += 1)
    r += e[t];
  return r / e.length;
}
function ns(e) {
  for (var r = [], t = [], n = [], a = [], i = [], s = [], u = [], o, l = 0, f = 0, p = 0, h = 0, c = 0, d = 0; d < e.glyphs.length; d += 1) {
    var m = e.glyphs.get(d), y = m.unicode | 0;
    if (isNaN(m.advanceWidth))
      throw new Error("Glyph " + m.name + " (" + d + "): advanceWidth is not a number.");
    (o > y || o === void 0) && y > 0 && (o = y), l < y && (l = y);
    var x = Vr.getUnicodeRange(y);
    if (x < 32)
      f |= 1 << x;
    else if (x < 64)
      p |= 1 << x - 32;
    else if (x < 96)
      h |= 1 << x - 64;
    else if (x < 123)
      c |= 1 << x - 96;
    else
      throw new Error("Unicode ranges bits > 123 are reserved for internal usage");
    if (m.name !== ".notdef") {
      var F = m.getMetrics();
      r.push(F.xMin), t.push(F.yMin), n.push(F.xMax), a.push(F.yMax), s.push(F.leftSideBearing), u.push(F.rightSideBearing), i.push(m.advanceWidth);
    }
  }
  var g = {
    xMin: Math.min.apply(null, r),
    yMin: Math.min.apply(null, t),
    xMax: Math.max.apply(null, n),
    yMax: Math.max.apply(null, a),
    advanceWidthMax: Math.max.apply(null, i),
    advanceWidthAvg: ts(i),
    minLeftSideBearing: Math.min.apply(null, s),
    maxLeftSideBearing: Math.max.apply(null, s),
    minRightSideBearing: Math.min.apply(null, u)
  };
  g.ascender = e.ascender, g.descender = e.descender;
  var T = Fn.make({
    flags: 3,
    // 00000011 (baseline for font at y=0; left sidebearing point at x=0)
    unitsPerEm: e.unitsPerEm,
    xMin: g.xMin,
    yMin: g.yMin,
    xMax: g.xMax,
    yMax: g.yMax,
    lowestRecPPEM: 3,
    createdTimestamp: e.createdTimestamp
  }), O = wn.make({
    ascender: g.ascender,
    descender: g.descender,
    advanceWidthMax: g.advanceWidthMax,
    minLeftSideBearing: g.minLeftSideBearing,
    minRightSideBearing: g.minRightSideBearing,
    xMaxExtent: g.maxLeftSideBearing + (g.xMax - g.xMin),
    numberOfHMetrics: e.glyphs.length
  }), P = On.make(e.glyphs.length), L = Vr.make(Object.assign({
    xAvgCharWidth: Math.round(g.advanceWidthAvg),
    usFirstCharIndex: o,
    usLastCharIndex: l,
    ulUnicodeRange1: f,
    ulUnicodeRange2: p,
    ulUnicodeRange3: h,
    ulUnicodeRange4: c,
    // See http://typophile.com/node/13081 for more info on vertical metrics.
    // We get metrics for typical characters (such as "x" for xHeight).
    // We provide some fallback characters if characters are unavailable: their
    // ordering was chosen experimentally.
    sTypoAscender: g.ascender,
    sTypoDescender: g.descender,
    sTypoLineGap: 0,
    usWinAscent: g.yMax,
    usWinDescent: Math.abs(g.yMin),
    ulCodePageRange1: 1,
    // FIXME: hard-code Latin 1 support for now
    sxHeight: Et(e, "xyvw", { yMax: Math.round(g.ascender / 2) }).yMax,
    sCapHeight: Et(e, "HIKLEFJMNTZBDPRAGOQSUVWXY", g).yMax,
    usDefaultChar: e.hasChar(" ") ? 32 : 0,
    // Use space as the default character, if available.
    usBreakChar: e.hasChar(" ") ? 32 : 0
    // Use space as the break character, if available.
  }, e.tables.os2)), U = Un.make(e.glyphs), G = pn.make(e.glyphs), N = e.getEnglishName("fontFamily"), V = e.getEnglishName("fontSubfamily"), $ = N + " " + V, te = e.getEnglishName("postScriptName");
  te || (te = N.replace(/\s/g, "") + "-" + V);
  var Z = {};
  for (var _ in e.names)
    Z[_] = e.names[_];
  Z.uniqueID || (Z.uniqueID = { en: e.getEnglishName("manufacturer") + ":" + $ }), Z.postScriptName || (Z.postScriptName = { en: te }), Z.preferredFamily || (Z.preferredFamily = e.names.fontFamily), Z.preferredSubfamily || (Z.preferredSubfamily = e.names.fontSubfamily);
  var W = [], X = Mn.make(Z, W), ee = W.length > 0 ? Cn.make(W) : void 0, I = An.make(), Y = kn.make(e.glyphs, {
    version: e.getEnglishName("version"),
    fullName: $,
    familyName: N,
    weightName: V,
    postScriptName: te,
    unitsPerEm: e.unitsPerEm,
    fontBBox: [0, g.yMin, g.ascender, g.advanceWidthMax]
  }), b = e.metas && Object.keys(e.metas).length > 0 ? In.make(e.metas) : void 0, S = [T, O, P, L, X, G, I, Y, U];
  ee && S.push(ee), e.tables.gsub && S.push(Pn.make(e.tables.gsub)), b && S.push(b);
  for (var R = Bn(S), B = R.encode(), A = jr(B), H = R.fields, Q = !1, ae = 0; ae < H.length; ae += 1)
    if (H[ae].name === "head table") {
      H[ae].value.checkSumAdjustment = 2981146554 - A, Q = !0;
      break;
    }
  if (!Q)
    throw new Error("Could not find head table with checkSum to adjust.");
  return R;
}
var as = { make: Bn, fontToTable: ns, computeCheckSum: jr };
function Cr(e, r) {
  for (var t = 0, n = e.length - 1; t <= n; ) {
    var a = t + n >>> 1, i = e[a].tag;
    if (i === r)
      return a;
    i < r ? t = a + 1 : n = a - 1;
  }
  return -t - 1;
}
function Rt(e, r) {
  for (var t = 0, n = e.length - 1; t <= n; ) {
    var a = t + n >>> 1, i = e[a];
    if (i === r)
      return a;
    i < r ? t = a + 1 : n = a - 1;
  }
  return -t - 1;
}
function Lt(e, r) {
  for (var t, n = 0, a = e.length - 1; n <= a; ) {
    var i = n + a >>> 1;
    t = e[i];
    var s = t.start;
    if (s === r)
      return t;
    s < r ? n = i + 1 : a = i - 1;
  }
  if (n > 0)
    return t = e[n - 1], r > t.end ? 0 : t;
}
function $e(e, r) {
  this.font = e, this.tableName = r;
}
$e.prototype = {
  /**
   * Binary search an object by "tag" property
   * @instance
   * @function searchTag
   * @memberof opentype.Layout
   * @param  {Array} arr
   * @param  {string} tag
   * @return {number}
   */
  searchTag: Cr,
  /**
   * Binary search in a list of numbers
   * @instance
   * @function binSearch
   * @memberof opentype.Layout
   * @param  {Array} arr
   * @param  {number} value
   * @return {number}
   */
  binSearch: Rt,
  /**
   * Get or create the Layout table (GSUB, GPOS etc).
   * @param  {boolean} create - Whether to create a new one.
   * @return {Object} The GSUB or GPOS table.
   */
  getTable: function(e) {
    var r = this.font.tables[this.tableName];
    return !r && e && (r = this.font.tables[this.tableName] = this.createDefaultTable()), r;
  },
  /**
   * Returns all scripts in the substitution table.
   * @instance
   * @return {Array}
   */
  getScriptNames: function() {
    var e = this.getTable();
    return e ? e.scripts.map(function(r) {
      return r.tag;
    }) : [];
  },
  /**
   * Returns the best bet for a script name.
   * Returns 'DFLT' if it exists.
   * If not, returns 'latn' if it exists.
   * If neither exist, returns undefined.
   */
  getDefaultScriptName: function() {
    var e = this.getTable();
    if (e) {
      for (var r = !1, t = 0; t < e.scripts.length; t++) {
        var n = e.scripts[t].tag;
        if (n === "DFLT")
          return n;
        n === "latn" && (r = !0);
      }
      if (r)
        return "latn";
    }
  },
  /**
   * Returns all LangSysRecords in the given script.
   * @instance
   * @param {string} [script='DFLT']
   * @param {boolean} create - forces the creation of this script table if it doesn't exist.
   * @return {Object} An object with tag and script properties.
   */
  getScriptTable: function(e, r) {
    var t = this.getTable(r);
    if (t) {
      e = e || "DFLT";
      var n = t.scripts, a = Cr(t.scripts, e);
      if (a >= 0)
        return n[a].script;
      if (r) {
        var i = {
          tag: e,
          script: {
            defaultLangSys: { reserved: 0, reqFeatureIndex: 65535, featureIndexes: [] },
            langSysRecords: []
          }
        };
        return n.splice(-1 - a, 0, i), i.script;
      }
    }
  },
  /**
   * Returns a language system table
   * @instance
   * @param {string} [script='DFLT']
   * @param {string} [language='dlft']
   * @param {boolean} create - forces the creation of this langSysTable if it doesn't exist.
   * @return {Object}
   */
  getLangSysTable: function(e, r, t) {
    var n = this.getScriptTable(e, t);
    if (n) {
      if (!r || r === "dflt" || r === "DFLT")
        return n.defaultLangSys;
      var a = Cr(n.langSysRecords, r);
      if (a >= 0)
        return n.langSysRecords[a].langSys;
      if (t) {
        var i = {
          tag: r,
          langSys: { reserved: 0, reqFeatureIndex: 65535, featureIndexes: [] }
        };
        return n.langSysRecords.splice(-1 - a, 0, i), i.langSys;
      }
    }
  },
  /**
   * Get a specific feature table.
   * @instance
   * @param {string} [script='DFLT']
   * @param {string} [language='dlft']
   * @param {string} feature - One of the codes listed at https://www.microsoft.com/typography/OTSPEC/featurelist.htm
   * @param {boolean} create - forces the creation of the feature table if it doesn't exist.
   * @return {Object}
   */
  getFeatureTable: function(e, r, t, n) {
    var a = this.getLangSysTable(e, r, n);
    if (a) {
      for (var i, s = a.featureIndexes, u = this.font.tables[this.tableName].features, o = 0; o < s.length; o++)
        if (i = u[s[o]], i.tag === t)
          return i.feature;
      if (n) {
        var l = u.length;
        return D.assert(l === 0 || t >= u[l - 1].tag, "Features must be added in alphabetical order."), i = {
          tag: t,
          feature: { params: 0, lookupListIndexes: [] }
        }, u.push(i), s.push(l), i.feature;
      }
    }
  },
  /**
   * Get the lookup tables of a given type for a script/language/feature.
   * @instance
   * @param {string} [script='DFLT']
   * @param {string} [language='dlft']
   * @param {string} feature - 4-letter feature code
   * @param {number} lookupType - 1 to 9
   * @param {boolean} create - forces the creation of the lookup table if it doesn't exist, with no subtables.
   * @return {Object[]}
   */
  getLookupTables: function(e, r, t, n, a) {
    var i = this.getFeatureTable(e, r, t, a), s = [];
    if (i) {
      for (var u, o = i.lookupListIndexes, l = this.font.tables[this.tableName].lookups, f = 0; f < o.length; f++)
        u = l[o[f]], u.lookupType === n && s.push(u);
      if (s.length === 0 && a) {
        u = {
          lookupType: n,
          lookupFlag: 0,
          subtables: [],
          markFilteringSet: void 0
        };
        var p = l.length;
        return l.push(u), o.push(p), [u];
      }
    }
    return s;
  },
  /**
   * Find a glyph in a class definition table
   * https://docs.microsoft.com/en-us/typography/opentype/spec/chapter2#class-definition-table
   * @param {object} classDefTable - an OpenType Layout class definition table
   * @param {number} glyphIndex - the index of the glyph to find
   * @returns {number} -1 if not found
   */
  getGlyphClass: function(e, r) {
    switch (e.format) {
      case 1:
        return e.startGlyph <= r && r < e.startGlyph + e.classes.length ? e.classes[r - e.startGlyph] : 0;
      case 2:
        var t = Lt(e.ranges, r);
        return t ? t.classId : 0;
    }
  },
  /**
   * Find a glyph in a coverage table
   * https://docs.microsoft.com/en-us/typography/opentype/spec/chapter2#coverage-table
   * @param {object} coverageTable - an OpenType Layout coverage table
   * @param {number} glyphIndex - the index of the glyph to find
   * @returns {number} -1 if not found
   */
  getCoverageIndex: function(e, r) {
    switch (e.format) {
      case 1:
        var t = Rt(e.glyphs, r);
        return t >= 0 ? t : -1;
      case 2:
        var n = Lt(e.ranges, r);
        return n ? n.index + r - n.start : -1;
    }
  },
  /**
   * Returns the list of glyph indexes of a coverage table.
   * Format 1: the list is stored raw
   * Format 2: compact list as range records.
   * @instance
   * @param  {Object} coverageTable
   * @return {Array}
   */
  expandCoverage: function(e) {
    if (e.format === 1)
      return e.glyphs;
    for (var r = [], t = e.ranges, n = 0; n < t.length; n++)
      for (var a = t[n], i = a.start, s = a.end, u = i; u <= s; u++)
        r.push(u);
    return r;
  }
};
function er(e) {
  $e.call(this, e, "gpos");
}
er.prototype = $e.prototype;
er.prototype.init = function() {
  var e = this.getDefaultScriptName();
  this.defaultKerningTables = this.getKerningTables(e);
};
er.prototype.getKerningValue = function(e, r, t) {
  for (var n = 0; n < e.length; n++)
    for (var a = e[n].subtables, i = 0; i < a.length; i++) {
      var s = a[i], u = this.getCoverageIndex(s.coverage, r);
      if (!(u < 0))
        switch (s.posFormat) {
          case 1:
            for (var o = s.pairSets[u], l = 0; l < o.length; l++) {
              var f = o[l];
              if (f.secondGlyph === t)
                return f.value1 && f.value1.xAdvance || 0;
            }
            break;
          case 2:
            var p = this.getGlyphClass(s.classDef1, r), h = this.getGlyphClass(s.classDef2, t), c = s.classRecords[p][h];
            return c.value1 && c.value1.xAdvance || 0;
        }
    }
  return 0;
};
er.prototype.getKerningTables = function(e, r) {
  if (this.font.tables.gpos)
    return this.getLookupTables(e, r, "kern", 2);
};
function ie(e) {
  $e.call(this, e, "gsub");
}
function is(e, r) {
  var t = e.length;
  if (t !== r.length)
    return !1;
  for (var n = 0; n < t; n++)
    if (e[n] !== r[n])
      return !1;
  return !0;
}
function $r(e, r, t) {
  for (var n = e.subtables, a = 0; a < n.length; a++) {
    var i = n[a];
    if (i.substFormat === r)
      return i;
  }
  if (t)
    return n.push(t), t;
}
ie.prototype = $e.prototype;
ie.prototype.createDefaultTable = function() {
  return {
    version: 1,
    scripts: [{
      tag: "DFLT",
      script: {
        defaultLangSys: { reserved: 0, reqFeatureIndex: 65535, featureIndexes: [] },
        langSysRecords: []
      }
    }],
    features: [],
    lookups: []
  };
};
ie.prototype.getSingle = function(e, r, t) {
  for (var n = [], a = this.getLookupTables(r, t, e, 1), i = 0; i < a.length; i++)
    for (var s = a[i].subtables, u = 0; u < s.length; u++) {
      var o = s[u], l = this.expandCoverage(o.coverage), f = void 0;
      if (o.substFormat === 1) {
        var p = o.deltaGlyphId;
        for (f = 0; f < l.length; f++) {
          var h = l[f];
          n.push({ sub: h, by: h + p });
        }
      } else {
        var c = o.substitute;
        for (f = 0; f < l.length; f++)
          n.push({ sub: l[f], by: c[f] });
      }
    }
  return n;
};
ie.prototype.getMultiple = function(e, r, t) {
  for (var n = [], a = this.getLookupTables(r, t, e, 2), i = 0; i < a.length; i++)
    for (var s = a[i].subtables, u = 0; u < s.length; u++) {
      var o = s[u], l = this.expandCoverage(o.coverage), f = void 0;
      for (f = 0; f < l.length; f++) {
        var p = l[f], h = o.sequences[f];
        n.push({ sub: p, by: h });
      }
    }
  return n;
};
ie.prototype.getAlternates = function(e, r, t) {
  for (var n = [], a = this.getLookupTables(r, t, e, 3), i = 0; i < a.length; i++)
    for (var s = a[i].subtables, u = 0; u < s.length; u++)
      for (var o = s[u], l = this.expandCoverage(o.coverage), f = o.alternateSets, p = 0; p < l.length; p++)
        n.push({ sub: l[p], by: f[p] });
  return n;
};
ie.prototype.getLigatures = function(e, r, t) {
  for (var n = [], a = this.getLookupTables(r, t, e, 4), i = 0; i < a.length; i++)
    for (var s = a[i].subtables, u = 0; u < s.length; u++)
      for (var o = s[u], l = this.expandCoverage(o.coverage), f = o.ligatureSets, p = 0; p < l.length; p++)
        for (var h = l[p], c = f[p], d = 0; d < c.length; d++) {
          var m = c[d];
          n.push({
            sub: [h].concat(m.components),
            by: m.ligGlyph
          });
        }
  return n;
};
ie.prototype.addSingle = function(e, r, t, n) {
  var a = this.getLookupTables(t, n, e, 1, !0)[0], i = $r(a, 2, {
    // lookup type 1 subtable, format 2, coverage format 1
    substFormat: 2,
    coverage: { format: 1, glyphs: [] },
    substitute: []
  });
  D.assert(i.coverage.format === 1, "Single: unable to modify coverage table format " + i.coverage.format);
  var s = r.sub, u = this.binSearch(i.coverage.glyphs, s);
  u < 0 && (u = -1 - u, i.coverage.glyphs.splice(u, 0, s), i.substitute.splice(u, 0, 0)), i.substitute[u] = r.by;
};
ie.prototype.addMultiple = function(e, r, t, n) {
  D.assert(r.by instanceof Array && r.by.length > 1, 'Multiple: "by" must be an array of two or more ids');
  var a = this.getLookupTables(t, n, e, 2, !0)[0], i = $r(a, 1, {
    // lookup type 2 subtable, format 1, coverage format 1
    substFormat: 1,
    coverage: { format: 1, glyphs: [] },
    sequences: []
  });
  D.assert(i.coverage.format === 1, "Multiple: unable to modify coverage table format " + i.coverage.format);
  var s = r.sub, u = this.binSearch(i.coverage.glyphs, s);
  u < 0 && (u = -1 - u, i.coverage.glyphs.splice(u, 0, s), i.sequences.splice(u, 0, 0)), i.sequences[u] = r.by;
};
ie.prototype.addAlternate = function(e, r, t, n) {
  var a = this.getLookupTables(t, n, e, 3, !0)[0], i = $r(a, 1, {
    // lookup type 3 subtable, format 1, coverage format 1
    substFormat: 1,
    coverage: { format: 1, glyphs: [] },
    alternateSets: []
  });
  D.assert(i.coverage.format === 1, "Alternate: unable to modify coverage table format " + i.coverage.format);
  var s = r.sub, u = this.binSearch(i.coverage.glyphs, s);
  u < 0 && (u = -1 - u, i.coverage.glyphs.splice(u, 0, s), i.alternateSets.splice(u, 0, 0)), i.alternateSets[u] = r.by;
};
ie.prototype.addLigature = function(e, r, t, n) {
  var a = this.getLookupTables(t, n, e, 4, !0)[0], i = a.subtables[0];
  i || (i = {
    // lookup type 4 subtable, format 1, coverage format 1
    substFormat: 1,
    coverage: { format: 1, glyphs: [] },
    ligatureSets: []
  }, a.subtables[0] = i), D.assert(i.coverage.format === 1, "Ligature: unable to modify coverage table format " + i.coverage.format);
  var s = r.sub[0], u = r.sub.slice(1), o = {
    ligGlyph: r.by,
    components: u
  }, l = this.binSearch(i.coverage.glyphs, s);
  if (l >= 0) {
    for (var f = i.ligatureSets[l], p = 0; p < f.length; p++)
      if (is(f[p].components, u))
        return;
    f.push(o);
  } else
    l = -1 - l, i.coverage.glyphs.splice(l, 0, s), i.ligatureSets.splice(l, 0, [o]);
};
ie.prototype.getFeature = function(e, r, t) {
  if (/ss\d\d/.test(e))
    return this.getSingle(e, r, t);
  switch (e) {
    case "aalt":
    case "salt":
      return this.getSingle(e, r, t).concat(this.getAlternates(e, r, t));
    case "dlig":
    case "liga":
    case "rlig":
      return this.getLigatures(e, r, t);
    case "ccmp":
      return this.getMultiple(e, r, t).concat(this.getLigatures(e, r, t));
    case "stch":
      return this.getMultiple(e, r, t);
  }
};
ie.prototype.add = function(e, r, t, n) {
  if (/ss\d\d/.test(e))
    return this.addSingle(e, r, t, n);
  switch (e) {
    case "aalt":
    case "salt":
      return typeof r.by == "number" ? this.addSingle(e, r, t, n) : this.addAlternate(e, r, t, n);
    case "dlig":
    case "liga":
    case "rlig":
      return this.addLigature(e, r, t, n);
    case "ccmp":
      return r.by instanceof Array ? this.addMultiple(e, r, t, n) : this.addLigature(e, r, t, n);
  }
};
function ss() {
  return typeof window < "u";
}
function os(e) {
  for (var r = new Buffer(e.byteLength), t = new Uint8Array(e), n = 0; n < r.length; ++n)
    r[n] = t[n];
  return r;
}
function We(e, r) {
  if (!e)
    throw r;
}
function Dt(e, r, t, n, a) {
  var i;
  return (r & n) > 0 ? (i = e.parseByte(), r & a || (i = -i), i = t + i) : (r & a) > 0 ? i = t : i = t + e.parseShort(), i;
}
function Gn(e, r, t) {
  var n = new E.Parser(r, t);
  e.numberOfContours = n.parseShort(), e._xMin = n.parseShort(), e._yMin = n.parseShort(), e._xMax = n.parseShort(), e._yMax = n.parseShort();
  var a, i;
  if (e.numberOfContours > 0) {
    for (var s = e.endPointIndices = [], u = 0; u < e.numberOfContours; u += 1)
      s.push(n.parseUShort());
    e.instructionLength = n.parseUShort(), e.instructions = [];
    for (var o = 0; o < e.instructionLength; o += 1)
      e.instructions.push(n.parseByte());
    var l = s[s.length - 1] + 1;
    a = [];
    for (var f = 0; f < l; f += 1)
      if (i = n.parseByte(), a.push(i), (i & 8) > 0)
        for (var p = n.parseByte(), h = 0; h < p; h += 1)
          a.push(i), f += 1;
    if (D.argument(a.length === l, "Bad flags."), s.length > 0) {
      var c = [], d;
      if (l > 0) {
        for (var m = 0; m < l; m += 1)
          i = a[m], d = {}, d.onCurve = !!(i & 1), d.lastPointOfContour = s.indexOf(m) >= 0, c.push(d);
        for (var y = 0, x = 0; x < l; x += 1)
          i = a[x], d = c[x], d.x = Dt(n, i, y, 2, 16), y = d.x;
        for (var F = 0, g = 0; g < l; g += 1)
          i = a[g], d = c[g], d.y = Dt(n, i, F, 4, 32), F = d.y;
      }
      e.points = c;
    } else
      e.points = [];
  } else if (e.numberOfContours === 0)
    e.points = [];
  else {
    e.isComposite = !0, e.points = [], e.components = [];
    for (var T = !0; T; ) {
      a = n.parseUShort();
      var O = {
        glyphIndex: n.parseUShort(),
        xScale: 1,
        scale01: 0,
        scale10: 0,
        yScale: 1,
        dx: 0,
        dy: 0
      };
      (a & 1) > 0 ? (a & 2) > 0 ? (O.dx = n.parseShort(), O.dy = n.parseShort()) : O.matchedPoints = [n.parseUShort(), n.parseUShort()] : (a & 2) > 0 ? (O.dx = n.parseChar(), O.dy = n.parseChar()) : O.matchedPoints = [n.parseByte(), n.parseByte()], (a & 8) > 0 ? O.xScale = O.yScale = n.parseF2Dot14() : (a & 64) > 0 ? (O.xScale = n.parseF2Dot14(), O.yScale = n.parseF2Dot14()) : (a & 128) > 0 && (O.xScale = n.parseF2Dot14(), O.scale01 = n.parseF2Dot14(), O.scale10 = n.parseF2Dot14(), O.yScale = n.parseF2Dot14()), e.components.push(O), T = !!(a & 32);
    }
    if (a & 256) {
      e.instructionLength = n.parseUShort(), e.instructions = [];
      for (var P = 0; P < e.instructionLength; P += 1)
        e.instructions.push(n.parseByte());
    }
  }
}
function Or(e, r) {
  for (var t = [], n = 0; n < e.length; n += 1) {
    var a = e[n], i = {
      x: r.xScale * a.x + r.scale01 * a.y + r.dx,
      y: r.scale10 * a.x + r.yScale * a.y + r.dy,
      onCurve: a.onCurve,
      lastPointOfContour: a.lastPointOfContour
    };
    t.push(i);
  }
  return t;
}
function us(e) {
  for (var r = [], t = [], n = 0; n < e.length; n += 1) {
    var a = e[n];
    t.push(a), a.lastPointOfContour && (r.push(t), t = []);
  }
  return D.argument(t.length === 0, "There are still points left in the current contour."), r;
}
function Nn(e) {
  var r = new re();
  if (!e)
    return r;
  for (var t = us(e), n = 0; n < t.length; ++n) {
    var a = t[n], i = null, s = a[a.length - 1], u = a[0];
    if (s.onCurve)
      r.moveTo(s.x, s.y);
    else if (u.onCurve)
      r.moveTo(u.x, u.y);
    else {
      var o = { x: (s.x + u.x) * 0.5, y: (s.y + u.y) * 0.5 };
      r.moveTo(o.x, o.y);
    }
    for (var l = 0; l < a.length; ++l)
      if (i = s, s = u, u = a[(l + 1) % a.length], s.onCurve)
        r.lineTo(s.x, s.y);
      else {
        var f = u;
        i.onCurve || ((s.x + i.x) * 0.5, (s.y + i.y) * 0.5), u.onCurve || (f = { x: (s.x + u.x) * 0.5, y: (s.y + u.y) * 0.5 }), r.quadraticCurveTo(s.x, s.y, f.x, f.y);
      }
    r.closePath();
  }
  return r;
}
function _n(e, r) {
  if (r.isComposite)
    for (var t = 0; t < r.components.length; t += 1) {
      var n = r.components[t], a = e.get(n.glyphIndex);
      if (a.getPath(), a.points) {
        var i = void 0;
        if (n.matchedPoints === void 0)
          i = Or(a.points, n);
        else {
          if (n.matchedPoints[0] > r.points.length - 1 || n.matchedPoints[1] > a.points.length - 1)
            throw Error("Matched points out of range in " + r.name);
          var s = r.points[n.matchedPoints[0]], u = a.points[n.matchedPoints[1]], o = {
            xScale: n.xScale,
            scale01: n.scale01,
            scale10: n.scale10,
            yScale: n.yScale,
            dx: 0,
            dy: 0
          };
          u = Or([u], o)[0], o.dx = s.x - u.x, o.dy = s.y - u.y, i = Or(a.points, o);
        }
        r.points = r.points.concat(i);
      }
    }
  return Nn(r.points);
}
function ls(e, r, t, n) {
  for (var a = new me.GlyphSet(n), i = 0; i < t.length - 1; i += 1) {
    var s = t[i], u = t[i + 1];
    s !== u ? a.push(i, me.ttfGlyphLoader(n, i, Gn, e, r + s, _n)) : a.push(i, me.glyphLoader(n, i));
  }
  return a;
}
function fs(e, r, t, n) {
  var a = new me.GlyphSet(n);
  return n._push = function(i) {
    var s = t[i], u = t[i + 1];
    s !== u ? a.push(i, me.ttfGlyphLoader(n, i, Gn, e, r + s, _n)) : a.push(i, me.glyphLoader(n, i));
  }, a;
}
function hs(e, r, t, n, a) {
  return a.lowMemory ? fs(e, r, t, n) : ls(e, r, t, n);
}
var Hn = { getPath: Nn, parse: hs }, zn, Ae, Vn, Wr;
function Wn(e) {
  this.font = e, this.getCommands = function(r) {
    return Hn.getPath(r).commands;
  }, this._fpgmState = this._prepState = void 0, this._errorState = 0;
}
function ps(e) {
  return e;
}
function Xn(e) {
  return Math.sign(e) * Math.round(Math.abs(e));
}
function cs(e) {
  return Math.sign(e) * Math.round(Math.abs(e * 2)) / 2;
}
function vs(e) {
  return Math.sign(e) * (Math.round(Math.abs(e) + 0.5) - 0.5);
}
function ds(e) {
  return Math.sign(e) * Math.ceil(Math.abs(e));
}
function gs(e) {
  return Math.sign(e) * Math.floor(Math.abs(e));
}
var qn = function(e) {
  var r = this.srPeriod, t = this.srPhase, n = this.srThreshold, a = 1;
  return e < 0 && (e = -e, a = -1), e += n - t, e = Math.trunc(e / r) * r, e += t, e < 0 ? t * a : e * a;
}, ge = {
  x: 1,
  y: 0,
  axis: "x",
  // Gets the projected distance between two points.
  // o1/o2 ... if true, respective original position is used.
  distance: function(e, r, t, n) {
    return (t ? e.xo : e.x) - (n ? r.xo : r.x);
  },
  // Moves point p so the moved position has the same relative
  // position to the moved positions of rp1 and rp2 than the
  // original positions had.
  //
  // See APPENDIX on INTERPOLATE at the bottom of this file.
  interpolate: function(e, r, t, n) {
    var a, i, s, u, o, l, f;
    if (!n || n === this) {
      if (a = e.xo - r.xo, i = e.xo - t.xo, o = r.x - r.xo, l = t.x - t.xo, s = Math.abs(a), u = Math.abs(i), f = s + u, f === 0) {
        e.x = e.xo + (o + l) / 2;
        return;
      }
      e.x = e.xo + (o * u + l * s) / f;
      return;
    }
    if (a = n.distance(e, r, !0, !0), i = n.distance(e, t, !0, !0), o = n.distance(r, r, !1, !0), l = n.distance(t, t, !1, !0), s = Math.abs(a), u = Math.abs(i), f = s + u, f === 0) {
      ge.setRelative(e, e, (o + l) / 2, n, !0);
      return;
    }
    ge.setRelative(e, e, (o * u + l * s) / f, n, !0);
  },
  // Slope of line normal to this
  normalSlope: Number.NEGATIVE_INFINITY,
  // Sets the point 'p' relative to point 'rp'
  // by the distance 'd'.
  //
  // See APPENDIX on SETRELATIVE at the bottom of this file.
  //
  // p   ... point to set
  // rp  ... reference point
  // d   ... distance on projection vector
  // pv  ... projection vector (undefined = this)
  // org ... if true, uses the original position of rp as reference.
  setRelative: function(e, r, t, n, a) {
    if (!n || n === this) {
      e.x = (a ? r.xo : r.x) + t;
      return;
    }
    var i = a ? r.xo : r.x, s = a ? r.yo : r.y, u = i + t * n.x, o = s + t * n.y;
    e.x = u + (e.y - o) / n.normalSlope;
  },
  // Slope of vector line.
  slope: 0,
  // Touches the point p.
  touch: function(e) {
    e.xTouched = !0;
  },
  // Tests if a point p is touched.
  touched: function(e) {
    return e.xTouched;
  },
  // Untouches the point p.
  untouch: function(e) {
    e.xTouched = !1;
  }
}, ye = {
  x: 0,
  y: 1,
  axis: "y",
  // Gets the projected distance between two points.
  // o1/o2 ... if true, respective original position is used.
  distance: function(e, r, t, n) {
    return (t ? e.yo : e.y) - (n ? r.yo : r.y);
  },
  // Moves point p so the moved position has the same relative
  // position to the moved positions of rp1 and rp2 than the
  // original positions had.
  //
  // See APPENDIX on INTERPOLATE at the bottom of this file.
  interpolate: function(e, r, t, n) {
    var a, i, s, u, o, l, f;
    if (!n || n === this) {
      if (a = e.yo - r.yo, i = e.yo - t.yo, o = r.y - r.yo, l = t.y - t.yo, s = Math.abs(a), u = Math.abs(i), f = s + u, f === 0) {
        e.y = e.yo + (o + l) / 2;
        return;
      }
      e.y = e.yo + (o * u + l * s) / f;
      return;
    }
    if (a = n.distance(e, r, !0, !0), i = n.distance(e, t, !0, !0), o = n.distance(r, r, !1, !0), l = n.distance(t, t, !1, !0), s = Math.abs(a), u = Math.abs(i), f = s + u, f === 0) {
      ye.setRelative(e, e, (o + l) / 2, n, !0);
      return;
    }
    ye.setRelative(e, e, (o * u + l * s) / f, n, !0);
  },
  // Slope of line normal to this.
  normalSlope: 0,
  // Sets the point 'p' relative to point 'rp'
  // by the distance 'd'
  //
  // See APPENDIX on SETRELATIVE at the bottom of this file.
  //
  // p   ... point to set
  // rp  ... reference point
  // d   ... distance on projection vector
  // pv  ... projection vector (undefined = this)
  // org ... if true, uses the original position of rp as reference.
  setRelative: function(e, r, t, n, a) {
    if (!n || n === this) {
      e.y = (a ? r.yo : r.y) + t;
      return;
    }
    var i = a ? r.xo : r.x, s = a ? r.yo : r.y, u = i + t * n.x, o = s + t * n.y;
    e.y = o + n.normalSlope * (e.x - u);
  },
  // Slope of vector line.
  slope: Number.POSITIVE_INFINITY,
  // Touches the point p.
  touch: function(e) {
    e.yTouched = !0;
  },
  // Tests if a point p is touched.
  touched: function(e) {
    return e.yTouched;
  },
  // Untouches the point p.
  untouch: function(e) {
    e.yTouched = !1;
  }
};
Object.freeze(ge);
Object.freeze(ye);
function rr(e, r) {
  this.x = e, this.y = r, this.axis = void 0, this.slope = r / e, this.normalSlope = -e / r, Object.freeze(this);
}
rr.prototype.distance = function(e, r, t, n) {
  return this.x * ge.distance(e, r, t, n) + this.y * ye.distance(e, r, t, n);
};
rr.prototype.interpolate = function(e, r, t, n) {
  var a, i, s, u, o, l, f;
  if (s = n.distance(e, r, !0, !0), u = n.distance(e, t, !0, !0), a = n.distance(r, r, !1, !0), i = n.distance(t, t, !1, !0), o = Math.abs(s), l = Math.abs(u), f = o + l, f === 0) {
    this.setRelative(e, e, (a + i) / 2, n, !0);
    return;
  }
  this.setRelative(e, e, (a * l + i * o) / f, n, !0);
};
rr.prototype.setRelative = function(e, r, t, n, a) {
  n = n || this;
  var i = a ? r.xo : r.x, s = a ? r.yo : r.y, u = i + t * n.x, o = s + t * n.y, l = n.normalSlope, f = this.slope, p = e.x, h = e.y;
  e.x = (f * p - l * u + o - h) / (f - l), e.y = f * (e.x - p) + h;
};
rr.prototype.touch = function(e) {
  e.xTouched = !0, e.yTouched = !0;
};
function tr(e, r) {
  var t = Math.sqrt(e * e + r * r);
  return e /= t, r /= t, e === 1 && r === 0 ? ge : e === 0 && r === 1 ? ye : new rr(e, r);
}
function be(e, r, t, n) {
  this.x = this.xo = Math.round(e * 64) / 64, this.y = this.yo = Math.round(r * 64) / 64, this.lastPointOfContour = t, this.onCurve = n, this.prevPointOnContour = void 0, this.nextPointOnContour = void 0, this.xTouched = !1, this.yTouched = !1, Object.preventExtensions(this);
}
be.prototype.nextTouched = function(e) {
  for (var r = this.nextPointOnContour; !e.touched(r) && r !== this; )
    r = r.nextPointOnContour;
  return r;
};
be.prototype.prevTouched = function(e) {
  for (var r = this.prevPointOnContour; !e.touched(r) && r !== this; )
    r = r.prevPointOnContour;
  return r;
};
var je = Object.freeze(new be(0, 0)), xs = {
  cvCutIn: 17 / 16,
  // control value cut in
  deltaBase: 9,
  deltaShift: 0.125,
  loop: 1,
  // loops some instructions
  minDis: 1,
  // minimum distance
  autoFlip: !0
};
function we(e, r) {
  switch (this.env = e, this.stack = [], this.prog = r, e) {
    case "glyf":
      this.zp0 = this.zp1 = this.zp2 = 1, this.rp0 = this.rp1 = this.rp2 = 0;
    case "prep":
      this.fv = this.pv = this.dpv = ge, this.round = Xn;
  }
}
Wn.prototype.exec = function(e, r) {
  if (typeof r != "number")
    throw new Error("Point size is not a number!");
  if (!(this._errorState > 2)) {
    var t = this.font, n = this._prepState;
    if (!n || n.ppem !== r) {
      var a = this._fpgmState;
      if (!a) {
        we.prototype = xs, a = this._fpgmState = new we("fpgm", t.tables.fpgm), a.funcs = [], a.font = t, exports.DEBUG && (console.log("---EXEC FPGM---"), a.step = -1);
        try {
          Ae(a);
        } catch (l) {
          console.log("Hinting error in FPGM:" + l), this._errorState = 3;
          return;
        }
      }
      we.prototype = a, n = this._prepState = new we("prep", t.tables.prep), n.ppem = r;
      var i = t.tables.cvt;
      if (i)
        for (var s = n.cvt = new Array(i.length), u = r / t.unitsPerEm, o = 0; o < i.length; o++)
          s[o] = i[o] * u;
      else
        n.cvt = [];
      exports.DEBUG && (console.log("---EXEC PREP---"), n.step = -1);
      try {
        Ae(n);
      } catch (l) {
        this._errorState < 2 && console.log("Hinting error in PREP:" + l), this._errorState = 2;
      }
    }
    if (!(this._errorState > 1))
      try {
        return Vn(e, n);
      } catch (l) {
        this._errorState < 1 && (console.log("Hinting error:" + l), console.log("Note: further hinting errors are silenced")), this._errorState = 1;
        return;
      }
  }
};
Vn = function(e, r) {
  var t = r.ppem / r.font.unitsPerEm, n = t, a = e.components, i, s, u;
  if (we.prototype = r, !a)
    u = new we("glyf", e.instructions), exports.DEBUG && (console.log("---EXEC GLYPH---"), u.step = -1), Wr(e, u, t, n), s = u.gZone;
  else {
    var o = r.font;
    s = [], i = [];
    for (var l = 0; l < a.length; l++) {
      var f = a[l], p = o.glyphs.get(f.glyphIndex);
      u = new we("glyf", p.instructions), exports.DEBUG && (console.log("---EXEC COMP " + l + "---"), u.step = -1), Wr(p, u, t, n);
      for (var h = Math.round(f.dx * t), c = Math.round(f.dy * n), d = u.gZone, m = u.contours, y = 0; y < d.length; y++) {
        var x = d[y];
        x.xTouched = x.yTouched = !1, x.xo = x.x = x.x + h, x.yo = x.y = x.y + c;
      }
      var F = s.length;
      s.push.apply(s, d);
      for (var g = 0; g < m.length; g++)
        i.push(m[g] + F);
    }
    e.instructions && !u.inhibitGridFit && (u = new we("glyf", e.instructions), u.gZone = u.z0 = u.z1 = u.z2 = s, u.contours = i, s.push(
      new be(0, 0),
      new be(Math.round(e.advanceWidth * t), 0)
    ), exports.DEBUG && (console.log("---EXEC COMPOSITE---"), u.step = -1), Ae(u), s.length -= 2);
  }
  return s;
};
Wr = function(e, r, t, n) {
  for (var a = e.points || [], i = a.length, s = r.gZone = r.z0 = r.z1 = r.z2 = [], u = r.contours = [], o, l = 0; l < i; l++)
    o = a[l], s[l] = new be(
      o.x * t,
      o.y * n,
      o.lastPointOfContour,
      o.onCurve
    );
  for (var f, p, h = 0; h < i; h++)
    o = s[h], f || (f = o, u.push(h)), o.lastPointOfContour ? (o.nextPointOnContour = f, f.prevPointOnContour = o, f = void 0) : (p = s[h + 1], o.nextPointOnContour = p, p.prevPointOnContour = o);
  if (!r.inhibitGridFit) {
    if (exports.DEBUG) {
      console.log("PROCESSING GLYPH", r.stack);
      for (var c = 0; c < i; c++)
        console.log(c, s[c].x, s[c].y);
    }
    if (s.push(
      new be(0, 0),
      new be(Math.round(e.advanceWidth * t), 0)
    ), Ae(r), s.length -= 2, exports.DEBUG) {
      console.log("FINISHED GLYPH", r.stack);
      for (var d = 0; d < i; d++)
        console.log(d, s[d].x, s[d].y);
    }
  }
};
Ae = function(e) {
  var r = e.prog;
  if (r) {
    var t = r.length, n;
    for (e.ip = 0; e.ip < t; e.ip++) {
      if (exports.DEBUG && e.step++, n = zn[r[e.ip]], !n)
        throw new Error(
          "unknown instruction: 0x" + Number(r[e.ip]).toString(16)
        );
      n(e);
    }
  }
};
function Sr(e) {
  for (var r = e.tZone = new Array(e.gZone.length), t = 0; t < r.length; t++)
    r[t] = new be(0, 0);
}
function Zn(e, r) {
  var t = e.prog, n = e.ip, a = 1, i;
  do
    if (i = t[++n], i === 88)
      a++;
    else if (i === 89)
      a--;
    else if (i === 64)
      n += t[n + 1] + 1;
    else if (i === 65)
      n += 2 * t[n + 1] + 1;
    else if (i >= 176 && i <= 183)
      n += i - 176 + 1;
    else if (i >= 184 && i <= 191)
      n += (i - 184 + 1) * 2;
    else if (r && a === 1 && i === 27)
      break;
  while (a > 0);
  e.ip = n;
}
function Mt(e, r) {
  exports.DEBUG && console.log(r.step, "SVTCA[" + e.axis + "]"), r.fv = r.pv = r.dpv = e;
}
function At(e, r) {
  exports.DEBUG && console.log(r.step, "SPVTCA[" + e.axis + "]"), r.pv = r.dpv = e;
}
function Pt(e, r) {
  exports.DEBUG && console.log(r.step, "SFVTCA[" + e.axis + "]"), r.fv = e;
}
function It(e, r) {
  var t = r.stack, n = t.pop(), a = t.pop(), i = r.z2[n], s = r.z1[a];
  exports.DEBUG && console.log("SPVTL[" + e + "]", n, a);
  var u, o;
  e ? (u = i.y - s.y, o = s.x - i.x) : (u = s.x - i.x, o = s.y - i.y), r.pv = r.dpv = tr(u, o);
}
function Bt(e, r) {
  var t = r.stack, n = t.pop(), a = t.pop(), i = r.z2[n], s = r.z1[a];
  exports.DEBUG && console.log("SFVTL[" + e + "]", n, a);
  var u, o;
  e ? (u = i.y - s.y, o = s.x - i.x) : (u = s.x - i.x, o = s.y - i.y), r.fv = tr(u, o);
}
function ms(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "SPVFS[]", t, n), e.pv = e.dpv = tr(n, t);
}
function ys(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "SPVFS[]", t, n), e.fv = tr(n, t);
}
function bs(e) {
  var r = e.stack, t = e.pv;
  exports.DEBUG && console.log(e.step, "GPV[]"), r.push(t.x * 16384), r.push(t.y * 16384);
}
function Ss(e) {
  var r = e.stack, t = e.fv;
  exports.DEBUG && console.log(e.step, "GFV[]"), r.push(t.x * 16384), r.push(t.y * 16384);
}
function Ts(e) {
  e.fv = e.pv, exports.DEBUG && console.log(e.step, "SFVTPV[]");
}
function ks(e) {
  var r = e.stack, t = r.pop(), n = r.pop(), a = r.pop(), i = r.pop(), s = r.pop(), u = e.z0, o = e.z1, l = u[t], f = u[n], p = o[a], h = o[i], c = e.z2[s];
  exports.DEBUG && console.log("ISECT[], ", t, n, a, i, s);
  var d = l.x, m = l.y, y = f.x, x = f.y, F = p.x, g = p.y, T = h.x, O = h.y, P = (d - y) * (g - O) - (m - x) * (F - T), L = d * x - m * y, U = F * O - g * T;
  c.x = (L * (F - T) - U * (d - y)) / P, c.y = (L * (g - O) - U * (m - x)) / P;
}
function Fs(e) {
  e.rp0 = e.stack.pop(), exports.DEBUG && console.log(e.step, "SRP0[]", e.rp0);
}
function ws(e) {
  e.rp1 = e.stack.pop(), exports.DEBUG && console.log(e.step, "SRP1[]", e.rp1);
}
function Us(e) {
  e.rp2 = e.stack.pop(), exports.DEBUG && console.log(e.step, "SRP2[]", e.rp2);
}
function Cs(e) {
  var r = e.stack.pop();
  switch (exports.DEBUG && console.log(e.step, "SZP0[]", r), e.zp0 = r, r) {
    case 0:
      e.tZone || Sr(e), e.z0 = e.tZone;
      break;
    case 1:
      e.z0 = e.gZone;
      break;
    default:
      throw new Error("Invalid zone pointer");
  }
}
function Os(e) {
  var r = e.stack.pop();
  switch (exports.DEBUG && console.log(e.step, "SZP1[]", r), e.zp1 = r, r) {
    case 0:
      e.tZone || Sr(e), e.z1 = e.tZone;
      break;
    case 1:
      e.z1 = e.gZone;
      break;
    default:
      throw new Error("Invalid zone pointer");
  }
}
function Es(e) {
  var r = e.stack.pop();
  switch (exports.DEBUG && console.log(e.step, "SZP2[]", r), e.zp2 = r, r) {
    case 0:
      e.tZone || Sr(e), e.z2 = e.tZone;
      break;
    case 1:
      e.z2 = e.gZone;
      break;
    default:
      throw new Error("Invalid zone pointer");
  }
}
function Rs(e) {
  var r = e.stack.pop();
  switch (exports.DEBUG && console.log(e.step, "SZPS[]", r), e.zp0 = e.zp1 = e.zp2 = r, r) {
    case 0:
      e.tZone || Sr(e), e.z0 = e.z1 = e.z2 = e.tZone;
      break;
    case 1:
      e.z0 = e.z1 = e.z2 = e.gZone;
      break;
    default:
      throw new Error("Invalid zone pointer");
  }
}
function Ls(e) {
  e.loop = e.stack.pop(), exports.DEBUG && console.log(e.step, "SLOOP[]", e.loop);
}
function Ds(e) {
  exports.DEBUG && console.log(e.step, "RTG[]"), e.round = Xn;
}
function Ms(e) {
  exports.DEBUG && console.log(e.step, "RTHG[]"), e.round = vs;
}
function As(e) {
  var r = e.stack.pop();
  exports.DEBUG && console.log(e.step, "SMD[]", r), e.minDis = r / 64;
}
function Ps(e) {
  exports.DEBUG && console.log(e.step, "ELSE[]"), Zn(e, !1);
}
function Is(e) {
  var r = e.stack.pop();
  exports.DEBUG && console.log(e.step, "JMPR[]", r), e.ip += r - 1;
}
function Bs(e) {
  var r = e.stack.pop();
  exports.DEBUG && console.log(e.step, "SCVTCI[]", r), e.cvCutIn = r / 64;
}
function Gs(e) {
  var r = e.stack;
  exports.DEBUG && console.log(e.step, "DUP[]"), r.push(r[r.length - 1]);
}
function Er(e) {
  exports.DEBUG && console.log(e.step, "POP[]"), e.stack.pop();
}
function Ns(e) {
  exports.DEBUG && console.log(e.step, "CLEAR[]"), e.stack.length = 0;
}
function _s(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "SWAP[]"), r.push(t), r.push(n);
}
function Hs(e) {
  var r = e.stack;
  exports.DEBUG && console.log(e.step, "DEPTH[]"), r.push(r.length);
}
function zs(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "LOOPCALL[]", t, n);
  var a = e.ip, i = e.prog;
  e.prog = e.funcs[t];
  for (var s = 0; s < n; s++)
    Ae(e), exports.DEBUG && console.log(
      ++e.step,
      s + 1 < n ? "next loopcall" : "done loopcall",
      s
    );
  e.ip = a, e.prog = i;
}
function Vs(e) {
  var r = e.stack.pop();
  exports.DEBUG && console.log(e.step, "CALL[]", r);
  var t = e.ip, n = e.prog;
  e.prog = e.funcs[r], Ae(e), e.ip = t, e.prog = n, exports.DEBUG && console.log(++e.step, "returning from", r);
}
function Ws(e) {
  var r = e.stack, t = r.pop();
  exports.DEBUG && console.log(e.step, "CINDEX[]", t), r.push(r[r.length - t]);
}
function Xs(e) {
  var r = e.stack, t = r.pop();
  exports.DEBUG && console.log(e.step, "MINDEX[]", t), r.push(r.splice(r.length - t, 1)[0]);
}
function qs(e) {
  if (e.env !== "fpgm")
    throw new Error("FDEF not allowed here");
  var r = e.stack, t = e.prog, n = e.ip, a = r.pop(), i = n;
  for (exports.DEBUG && console.log(e.step, "FDEF[]", a); t[++n] !== 45; )
    ;
  e.ip = n, e.funcs[a] = t.slice(i + 1, n);
}
function Gt(e, r) {
  var t = r.stack.pop(), n = r.z0[t], a = r.fv, i = r.pv;
  exports.DEBUG && console.log(r.step, "MDAP[" + e + "]", t);
  var s = i.distance(n, je);
  e && (s = r.round(s)), a.setRelative(n, je, s, i), a.touch(n), r.rp0 = r.rp1 = t;
}
function Nt(e, r) {
  var t = r.z2, n = t.length - 2, a, i, s;
  exports.DEBUG && console.log(r.step, "IUP[" + e.axis + "]");
  for (var u = 0; u < n; u++)
    a = t[u], !e.touched(a) && (i = a.prevTouched(e), i !== a && (s = a.nextTouched(e), i === s && e.setRelative(a, a, e.distance(i, i, !1, !0), e, !0), e.interpolate(a, i, s, e)));
}
function _t(e, r) {
  for (var t = r.stack, n = e ? r.rp1 : r.rp2, a = (e ? r.z0 : r.z1)[n], i = r.fv, s = r.pv, u = r.loop, o = r.z2; u--; ) {
    var l = t.pop(), f = o[l], p = s.distance(a, a, !1, !0);
    i.setRelative(f, f, p, s), i.touch(f), exports.DEBUG && console.log(
      r.step,
      (r.loop > 1 ? "loop " + (r.loop - u) + ": " : "") + "SHP[" + (e ? "rp1" : "rp2") + "]",
      l
    );
  }
  r.loop = 1;
}
function Ht(e, r) {
  var t = r.stack, n = e ? r.rp1 : r.rp2, a = (e ? r.z0 : r.z1)[n], i = r.fv, s = r.pv, u = t.pop(), o = r.z2[r.contours[u]], l = o;
  exports.DEBUG && console.log(r.step, "SHC[" + e + "]", u);
  var f = s.distance(a, a, !1, !0);
  do
    l !== a && i.setRelative(l, l, f, s), l = l.nextPointOnContour;
  while (l !== o);
}
function zt(e, r) {
  var t = r.stack, n = e ? r.rp1 : r.rp2, a = (e ? r.z0 : r.z1)[n], i = r.fv, s = r.pv, u = t.pop();
  exports.DEBUG && console.log(r.step, "SHZ[" + e + "]", u);
  var o;
  switch (u) {
    case 0:
      o = r.tZone;
      break;
    case 1:
      o = r.gZone;
      break;
    default:
      throw new Error("Invalid zone");
  }
  for (var l, f = s.distance(a, a, !1, !0), p = o.length - 2, h = 0; h < p; h++)
    l = o[h], i.setRelative(l, l, f, s);
}
function Zs(e) {
  for (var r = e.stack, t = e.loop, n = e.fv, a = r.pop() / 64, i = e.z2; t--; ) {
    var s = r.pop(), u = i[s];
    exports.DEBUG && console.log(
      e.step,
      (e.loop > 1 ? "loop " + (e.loop - t) + ": " : "") + "SHPIX[]",
      s,
      a
    ), n.setRelative(u, u, a), n.touch(u);
  }
  e.loop = 1;
}
function Ys(e) {
  for (var r = e.stack, t = e.rp1, n = e.rp2, a = e.loop, i = e.z0[t], s = e.z1[n], u = e.fv, o = e.dpv, l = e.z2; a--; ) {
    var f = r.pop(), p = l[f];
    exports.DEBUG && console.log(
      e.step,
      (e.loop > 1 ? "loop " + (e.loop - a) + ": " : "") + "IP[]",
      f,
      t,
      "<->",
      n
    ), u.interpolate(p, i, s, o), u.touch(p);
  }
  e.loop = 1;
}
function Vt(e, r) {
  var t = r.stack, n = t.pop() / 64, a = t.pop(), i = r.z1[a], s = r.z0[r.rp0], u = r.fv, o = r.pv;
  u.setRelative(i, s, n, o), u.touch(i), exports.DEBUG && console.log(r.step, "MSIRP[" + e + "]", n, a), r.rp1 = r.rp0, r.rp2 = a, e && (r.rp0 = a);
}
function Qs(e) {
  for (var r = e.stack, t = e.rp0, n = e.z0[t], a = e.loop, i = e.fv, s = e.pv, u = e.z1; a--; ) {
    var o = r.pop(), l = u[o];
    exports.DEBUG && console.log(
      e.step,
      (e.loop > 1 ? "loop " + (e.loop - a) + ": " : "") + "ALIGNRP[]",
      o
    ), i.setRelative(l, n, 0, s), i.touch(l);
  }
  e.loop = 1;
}
function Ks(e) {
  exports.DEBUG && console.log(e.step, "RTDG[]"), e.round = cs;
}
function Wt(e, r) {
  var t = r.stack, n = t.pop(), a = t.pop(), i = r.z0[a], s = r.fv, u = r.pv, o = r.cvt[n];
  exports.DEBUG && console.log(
    r.step,
    "MIAP[" + e + "]",
    n,
    "(",
    o,
    ")",
    a
  );
  var l = u.distance(i, je);
  e && (Math.abs(l - o) < r.cvCutIn && (l = o), l = r.round(l)), s.setRelative(i, je, l, u), r.zp0 === 0 && (i.xo = i.x, i.yo = i.y), s.touch(i), r.rp0 = r.rp1 = a;
}
function Js(e) {
  var r = e.prog, t = e.ip, n = e.stack, a = r[++t];
  exports.DEBUG && console.log(e.step, "NPUSHB[]", a);
  for (var i = 0; i < a; i++)
    n.push(r[++t]);
  e.ip = t;
}
function js(e) {
  var r = e.ip, t = e.prog, n = e.stack, a = t[++r];
  exports.DEBUG && console.log(e.step, "NPUSHW[]", a);
  for (var i = 0; i < a; i++) {
    var s = t[++r] << 8 | t[++r];
    s & 32768 && (s = -((s ^ 65535) + 1)), n.push(s);
  }
  e.ip = r;
}
function $s(e) {
  var r = e.stack, t = e.store;
  t || (t = e.store = []);
  var n = r.pop(), a = r.pop();
  exports.DEBUG && console.log(e.step, "WS", n, a), t[a] = n;
}
function eo(e) {
  var r = e.stack, t = e.store, n = r.pop();
  exports.DEBUG && console.log(e.step, "RS", n);
  var a = t && t[n] || 0;
  r.push(a);
}
function ro(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "WCVTP", t, n), e.cvt[n] = t / 64;
}
function to(e) {
  var r = e.stack, t = r.pop();
  exports.DEBUG && console.log(e.step, "RCVT", t), r.push(e.cvt[t] * 64);
}
function Xt(e, r) {
  var t = r.stack, n = t.pop(), a = r.z2[n];
  exports.DEBUG && console.log(r.step, "GC[" + e + "]", n), t.push(r.dpv.distance(a, je, e, !1) * 64);
}
function qt(e, r) {
  var t = r.stack, n = t.pop(), a = t.pop(), i = r.z1[n], s = r.z0[a], u = r.dpv.distance(s, i, e, e);
  exports.DEBUG && console.log(r.step, "MD[" + e + "]", n, a, "->", u), r.stack.push(Math.round(u * 64));
}
function no(e) {
  exports.DEBUG && console.log(e.step, "MPPEM[]"), e.stack.push(e.ppem);
}
function ao(e) {
  exports.DEBUG && console.log(e.step, "FLIPON[]"), e.autoFlip = !0;
}
function io(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "LT[]", t, n), r.push(n < t ? 1 : 0);
}
function so(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "LTEQ[]", t, n), r.push(n <= t ? 1 : 0);
}
function oo(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "GT[]", t, n), r.push(n > t ? 1 : 0);
}
function uo(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "GTEQ[]", t, n), r.push(n >= t ? 1 : 0);
}
function lo(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "EQ[]", t, n), r.push(t === n ? 1 : 0);
}
function fo(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "NEQ[]", t, n), r.push(t !== n ? 1 : 0);
}
function ho(e) {
  var r = e.stack, t = r.pop();
  exports.DEBUG && console.log(e.step, "ODD[]", t), r.push(Math.trunc(t) % 2 ? 1 : 0);
}
function po(e) {
  var r = e.stack, t = r.pop();
  exports.DEBUG && console.log(e.step, "EVEN[]", t), r.push(Math.trunc(t) % 2 ? 0 : 1);
}
function co(e) {
  var r = e.stack.pop();
  exports.DEBUG && console.log(e.step, "IF[]", r), r || (Zn(e, !0), exports.DEBUG && console.log(e.step, "EIF[]"));
}
function vo(e) {
  exports.DEBUG && console.log(e.step, "EIF[]");
}
function go(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "AND[]", t, n), r.push(t && n ? 1 : 0);
}
function xo(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "OR[]", t, n), r.push(t || n ? 1 : 0);
}
function mo(e) {
  var r = e.stack, t = r.pop();
  exports.DEBUG && console.log(e.step, "NOT[]", t), r.push(t ? 0 : 1);
}
function Rr(e, r) {
  var t = r.stack, n = t.pop(), a = r.fv, i = r.pv, s = r.ppem, u = r.deltaBase + (e - 1) * 16, o = r.deltaShift, l = r.z0;
  exports.DEBUG && console.log(r.step, "DELTAP[" + e + "]", n, t);
  for (var f = 0; f < n; f++) {
    var p = t.pop(), h = t.pop(), c = u + ((h & 240) >> 4);
    if (c === s) {
      var d = (h & 15) - 8;
      d >= 0 && d++, exports.DEBUG && console.log(r.step, "DELTAPFIX", p, "by", d * o);
      var m = l[p];
      a.setRelative(m, m, d * o, i);
    }
  }
}
function yo(e) {
  var r = e.stack, t = r.pop();
  exports.DEBUG && console.log(e.step, "SDB[]", t), e.deltaBase = t;
}
function bo(e) {
  var r = e.stack, t = r.pop();
  exports.DEBUG && console.log(e.step, "SDS[]", t), e.deltaShift = Math.pow(0.5, t);
}
function So(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "ADD[]", t, n), r.push(n + t);
}
function To(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "SUB[]", t, n), r.push(n - t);
}
function ko(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "DIV[]", t, n), r.push(n * 64 / t);
}
function Fo(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "MUL[]", t, n), r.push(n * t / 64);
}
function wo(e) {
  var r = e.stack, t = r.pop();
  exports.DEBUG && console.log(e.step, "ABS[]", t), r.push(Math.abs(t));
}
function Uo(e) {
  var r = e.stack, t = r.pop();
  exports.DEBUG && console.log(e.step, "NEG[]", t), r.push(-t);
}
function Co(e) {
  var r = e.stack, t = r.pop();
  exports.DEBUG && console.log(e.step, "FLOOR[]", t), r.push(Math.floor(t / 64) * 64);
}
function Oo(e) {
  var r = e.stack, t = r.pop();
  exports.DEBUG && console.log(e.step, "CEILING[]", t), r.push(Math.ceil(t / 64) * 64);
}
function fr(e, r) {
  var t = r.stack, n = t.pop();
  exports.DEBUG && console.log(r.step, "ROUND[]"), t.push(r.round(n / 64) * 64);
}
function Eo(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "WCVTF[]", t, n), e.cvt[n] = t * e.ppem / e.font.unitsPerEm;
}
function Lr(e, r) {
  var t = r.stack, n = t.pop(), a = r.ppem, i = r.deltaBase + (e - 1) * 16, s = r.deltaShift;
  exports.DEBUG && console.log(r.step, "DELTAC[" + e + "]", n, t);
  for (var u = 0; u < n; u++) {
    var o = t.pop(), l = t.pop(), f = i + ((l & 240) >> 4);
    if (f === a) {
      var p = (l & 15) - 8;
      p >= 0 && p++;
      var h = p * s;
      exports.DEBUG && console.log(r.step, "DELTACFIX", o, "by", h), r.cvt[o] += h;
    }
  }
}
function Ro(e) {
  var r = e.stack.pop();
  exports.DEBUG && console.log(e.step, "SROUND[]", r), e.round = qn;
  var t;
  switch (r & 192) {
    case 0:
      t = 0.5;
      break;
    case 64:
      t = 1;
      break;
    case 128:
      t = 2;
      break;
    default:
      throw new Error("invalid SROUND value");
  }
  switch (e.srPeriod = t, r & 48) {
    case 0:
      e.srPhase = 0;
      break;
    case 16:
      e.srPhase = 0.25 * t;
      break;
    case 32:
      e.srPhase = 0.5 * t;
      break;
    case 48:
      e.srPhase = 0.75 * t;
      break;
    default:
      throw new Error("invalid SROUND value");
  }
  r &= 15, r === 0 ? e.srThreshold = 0 : e.srThreshold = (r / 8 - 0.5) * t;
}
function Lo(e) {
  var r = e.stack.pop();
  exports.DEBUG && console.log(e.step, "S45ROUND[]", r), e.round = qn;
  var t;
  switch (r & 192) {
    case 0:
      t = Math.sqrt(2) / 2;
      break;
    case 64:
      t = Math.sqrt(2);
      break;
    case 128:
      t = 2 * Math.sqrt(2);
      break;
    default:
      throw new Error("invalid S45ROUND value");
  }
  switch (e.srPeriod = t, r & 48) {
    case 0:
      e.srPhase = 0;
      break;
    case 16:
      e.srPhase = 0.25 * t;
      break;
    case 32:
      e.srPhase = 0.5 * t;
      break;
    case 48:
      e.srPhase = 0.75 * t;
      break;
    default:
      throw new Error("invalid S45ROUND value");
  }
  r &= 15, r === 0 ? e.srThreshold = 0 : e.srThreshold = (r / 8 - 0.5) * t;
}
function Do(e) {
  exports.DEBUG && console.log(e.step, "ROFF[]"), e.round = ps;
}
function Mo(e) {
  exports.DEBUG && console.log(e.step, "RUTG[]"), e.round = ds;
}
function Ao(e) {
  exports.DEBUG && console.log(e.step, "RDTG[]"), e.round = gs;
}
function Po(e) {
  var r = e.stack.pop();
  exports.DEBUG && console.log(e.step, "SCANCTRL[]", r);
}
function Zt(e, r) {
  var t = r.stack, n = t.pop(), a = t.pop(), i = r.z2[n], s = r.z1[a];
  exports.DEBUG && console.log(r.step, "SDPVTL[" + e + "]", n, a);
  var u, o;
  e ? (u = i.y - s.y, o = s.x - i.x) : (u = s.x - i.x, o = s.y - i.y), r.dpv = tr(u, o);
}
function Io(e) {
  var r = e.stack, t = r.pop(), n = 0;
  exports.DEBUG && console.log(e.step, "GETINFO[]", t), t & 1 && (n = 35), t & 32 && (n |= 4096), r.push(n);
}
function Bo(e) {
  var r = e.stack, t = r.pop(), n = r.pop(), a = r.pop();
  exports.DEBUG && console.log(e.step, "ROLL[]"), r.push(n), r.push(t), r.push(a);
}
function Go(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "MAX[]", t, n), r.push(Math.max(n, t));
}
function No(e) {
  var r = e.stack, t = r.pop(), n = r.pop();
  exports.DEBUG && console.log(e.step, "MIN[]", t, n), r.push(Math.min(n, t));
}
function _o(e) {
  var r = e.stack.pop();
  exports.DEBUG && console.log(e.step, "SCANTYPE[]", r);
}
function Ho(e) {
  var r = e.stack.pop(), t = e.stack.pop();
  switch (exports.DEBUG && console.log(e.step, "INSTCTRL[]", r, t), r) {
    case 1:
      e.inhibitGridFit = !!t;
      return;
    case 2:
      e.ignoreCvt = !!t;
      return;
    default:
      throw new Error("invalid INSTCTRL[] selector");
  }
}
function Te(e, r) {
  var t = r.stack, n = r.prog, a = r.ip;
  exports.DEBUG && console.log(r.step, "PUSHB[" + e + "]");
  for (var i = 0; i < e; i++)
    t.push(n[++a]);
  r.ip = a;
}
function ke(e, r) {
  var t = r.ip, n = r.prog, a = r.stack;
  exports.DEBUG && console.log(r.ip, "PUSHW[" + e + "]");
  for (var i = 0; i < e; i++) {
    var s = n[++t] << 8 | n[++t];
    s & 32768 && (s = -((s ^ 65535) + 1)), a.push(s);
  }
  r.ip = t;
}
function C(e, r, t, n, a, i) {
  var s = i.stack, u = e && s.pop(), o = s.pop(), l = i.rp0, f = i.z0[l], p = i.z1[o], h = i.minDis, c = i.fv, d = i.dpv, m, y, x, F;
  y = m = d.distance(p, f, !0, !0), x = y >= 0 ? 1 : -1, y = Math.abs(y), e && (F = i.cvt[u], n && Math.abs(y - F) < i.cvCutIn && (y = F)), t && y < h && (y = h), n && (y = i.round(y)), c.setRelative(p, f, x * y, d), c.touch(p), exports.DEBUG && console.log(
    i.step,
    (e ? "MIRP[" : "MDRP[") + (r ? "M" : "m") + (t ? ">" : "_") + (n ? "R" : "_") + (a === 0 ? "Gr" : a === 1 ? "Bl" : a === 2 ? "Wh" : "") + "]",
    e ? u + "(" + i.cvt[u] + "," + F + ")" : "",
    o,
    "(d =",
    m,
    "->",
    x * y,
    ")"
  ), i.rp1 = i.rp0, i.rp2 = o, r && (i.rp0 = o);
}
zn = [
  /* 0x00 */
  Mt.bind(void 0, ye),
  /* 0x01 */
  Mt.bind(void 0, ge),
  /* 0x02 */
  At.bind(void 0, ye),
  /* 0x03 */
  At.bind(void 0, ge),
  /* 0x04 */
  Pt.bind(void 0, ye),
  /* 0x05 */
  Pt.bind(void 0, ge),
  /* 0x06 */
  It.bind(void 0, 0),
  /* 0x07 */
  It.bind(void 0, 1),
  /* 0x08 */
  Bt.bind(void 0, 0),
  /* 0x09 */
  Bt.bind(void 0, 1),
  /* 0x0A */
  ms,
  /* 0x0B */
  ys,
  /* 0x0C */
  bs,
  /* 0x0D */
  Ss,
  /* 0x0E */
  Ts,
  /* 0x0F */
  ks,
  /* 0x10 */
  Fs,
  /* 0x11 */
  ws,
  /* 0x12 */
  Us,
  /* 0x13 */
  Cs,
  /* 0x14 */
  Os,
  /* 0x15 */
  Es,
  /* 0x16 */
  Rs,
  /* 0x17 */
  Ls,
  /* 0x18 */
  Ds,
  /* 0x19 */
  Ms,
  /* 0x1A */
  As,
  /* 0x1B */
  Ps,
  /* 0x1C */
  Is,
  /* 0x1D */
  Bs,
  /* 0x1E */
  void 0,
  // TODO SSWCI
  /* 0x1F */
  void 0,
  // TODO SSW
  /* 0x20 */
  Gs,
  /* 0x21 */
  Er,
  /* 0x22 */
  Ns,
  /* 0x23 */
  _s,
  /* 0x24 */
  Hs,
  /* 0x25 */
  Ws,
  /* 0x26 */
  Xs,
  /* 0x27 */
  void 0,
  // TODO ALIGNPTS
  /* 0x28 */
  void 0,
  /* 0x29 */
  void 0,
  // TODO UTP
  /* 0x2A */
  zs,
  /* 0x2B */
  Vs,
  /* 0x2C */
  qs,
  /* 0x2D */
  void 0,
  // ENDF (eaten by FDEF)
  /* 0x2E */
  Gt.bind(void 0, 0),
  /* 0x2F */
  Gt.bind(void 0, 1),
  /* 0x30 */
  Nt.bind(void 0, ye),
  /* 0x31 */
  Nt.bind(void 0, ge),
  /* 0x32 */
  _t.bind(void 0, 0),
  /* 0x33 */
  _t.bind(void 0, 1),
  /* 0x34 */
  Ht.bind(void 0, 0),
  /* 0x35 */
  Ht.bind(void 0, 1),
  /* 0x36 */
  zt.bind(void 0, 0),
  /* 0x37 */
  zt.bind(void 0, 1),
  /* 0x38 */
  Zs,
  /* 0x39 */
  Ys,
  /* 0x3A */
  Vt.bind(void 0, 0),
  /* 0x3B */
  Vt.bind(void 0, 1),
  /* 0x3C */
  Qs,
  /* 0x3D */
  Ks,
  /* 0x3E */
  Wt.bind(void 0, 0),
  /* 0x3F */
  Wt.bind(void 0, 1),
  /* 0x40 */
  Js,
  /* 0x41 */
  js,
  /* 0x42 */
  $s,
  /* 0x43 */
  eo,
  /* 0x44 */
  ro,
  /* 0x45 */
  to,
  /* 0x46 */
  Xt.bind(void 0, 0),
  /* 0x47 */
  Xt.bind(void 0, 1),
  /* 0x48 */
  void 0,
  // TODO SCFS
  /* 0x49 */
  qt.bind(void 0, 0),
  /* 0x4A */
  qt.bind(void 0, 1),
  /* 0x4B */
  no,
  /* 0x4C */
  void 0,
  // TODO MPS
  /* 0x4D */
  ao,
  /* 0x4E */
  void 0,
  // TODO FLIPOFF
  /* 0x4F */
  void 0,
  // TODO DEBUG
  /* 0x50 */
  io,
  /* 0x51 */
  so,
  /* 0x52 */
  oo,
  /* 0x53 */
  uo,
  /* 0x54 */
  lo,
  /* 0x55 */
  fo,
  /* 0x56 */
  ho,
  /* 0x57 */
  po,
  /* 0x58 */
  co,
  /* 0x59 */
  vo,
  /* 0x5A */
  go,
  /* 0x5B */
  xo,
  /* 0x5C */
  mo,
  /* 0x5D */
  Rr.bind(void 0, 1),
  /* 0x5E */
  yo,
  /* 0x5F */
  bo,
  /* 0x60 */
  So,
  /* 0x61 */
  To,
  /* 0x62 */
  ko,
  /* 0x63 */
  Fo,
  /* 0x64 */
  wo,
  /* 0x65 */
  Uo,
  /* 0x66 */
  Co,
  /* 0x67 */
  Oo,
  /* 0x68 */
  fr.bind(void 0, 0),
  /* 0x69 */
  fr.bind(void 0, 1),
  /* 0x6A */
  fr.bind(void 0, 2),
  /* 0x6B */
  fr.bind(void 0, 3),
  /* 0x6C */
  void 0,
  // TODO NROUND[ab]
  /* 0x6D */
  void 0,
  // TODO NROUND[ab]
  /* 0x6E */
  void 0,
  // TODO NROUND[ab]
  /* 0x6F */
  void 0,
  // TODO NROUND[ab]
  /* 0x70 */
  Eo,
  /* 0x71 */
  Rr.bind(void 0, 2),
  /* 0x72 */
  Rr.bind(void 0, 3),
  /* 0x73 */
  Lr.bind(void 0, 1),
  /* 0x74 */
  Lr.bind(void 0, 2),
  /* 0x75 */
  Lr.bind(void 0, 3),
  /* 0x76 */
  Ro,
  /* 0x77 */
  Lo,
  /* 0x78 */
  void 0,
  // TODO JROT[]
  /* 0x79 */
  void 0,
  // TODO JROF[]
  /* 0x7A */
  Do,
  /* 0x7B */
  void 0,
  /* 0x7C */
  Mo,
  /* 0x7D */
  Ao,
  /* 0x7E */
  Er,
  // actually SANGW, supposed to do only a pop though
  /* 0x7F */
  Er,
  // actually AA, supposed to do only a pop though
  /* 0x80 */
  void 0,
  // TODO FLIPPT
  /* 0x81 */
  void 0,
  // TODO FLIPRGON
  /* 0x82 */
  void 0,
  // TODO FLIPRGOFF
  /* 0x83 */
  void 0,
  /* 0x84 */
  void 0,
  /* 0x85 */
  Po,
  /* 0x86 */
  Zt.bind(void 0, 0),
  /* 0x87 */
  Zt.bind(void 0, 1),
  /* 0x88 */
  Io,
  /* 0x89 */
  void 0,
  // TODO IDEF
  /* 0x8A */
  Bo,
  /* 0x8B */
  Go,
  /* 0x8C */
  No,
  /* 0x8D */
  _o,
  /* 0x8E */
  Ho,
  /* 0x8F */
  void 0,
  /* 0x90 */
  void 0,
  /* 0x91 */
  void 0,
  /* 0x92 */
  void 0,
  /* 0x93 */
  void 0,
  /* 0x94 */
  void 0,
  /* 0x95 */
  void 0,
  /* 0x96 */
  void 0,
  /* 0x97 */
  void 0,
  /* 0x98 */
  void 0,
  /* 0x99 */
  void 0,
  /* 0x9A */
  void 0,
  /* 0x9B */
  void 0,
  /* 0x9C */
  void 0,
  /* 0x9D */
  void 0,
  /* 0x9E */
  void 0,
  /* 0x9F */
  void 0,
  /* 0xA0 */
  void 0,
  /* 0xA1 */
  void 0,
  /* 0xA2 */
  void 0,
  /* 0xA3 */
  void 0,
  /* 0xA4 */
  void 0,
  /* 0xA5 */
  void 0,
  /* 0xA6 */
  void 0,
  /* 0xA7 */
  void 0,
  /* 0xA8 */
  void 0,
  /* 0xA9 */
  void 0,
  /* 0xAA */
  void 0,
  /* 0xAB */
  void 0,
  /* 0xAC */
  void 0,
  /* 0xAD */
  void 0,
  /* 0xAE */
  void 0,
  /* 0xAF */
  void 0,
  /* 0xB0 */
  Te.bind(void 0, 1),
  /* 0xB1 */
  Te.bind(void 0, 2),
  /* 0xB2 */
  Te.bind(void 0, 3),
  /* 0xB3 */
  Te.bind(void 0, 4),
  /* 0xB4 */
  Te.bind(void 0, 5),
  /* 0xB5 */
  Te.bind(void 0, 6),
  /* 0xB6 */
  Te.bind(void 0, 7),
  /* 0xB7 */
  Te.bind(void 0, 8),
  /* 0xB8 */
  ke.bind(void 0, 1),
  /* 0xB9 */
  ke.bind(void 0, 2),
  /* 0xBA */
  ke.bind(void 0, 3),
  /* 0xBB */
  ke.bind(void 0, 4),
  /* 0xBC */
  ke.bind(void 0, 5),
  /* 0xBD */
  ke.bind(void 0, 6),
  /* 0xBE */
  ke.bind(void 0, 7),
  /* 0xBF */
  ke.bind(void 0, 8),
  /* 0xC0 */
  C.bind(void 0, 0, 0, 0, 0, 0),
  /* 0xC1 */
  C.bind(void 0, 0, 0, 0, 0, 1),
  /* 0xC2 */
  C.bind(void 0, 0, 0, 0, 0, 2),
  /* 0xC3 */
  C.bind(void 0, 0, 0, 0, 0, 3),
  /* 0xC4 */
  C.bind(void 0, 0, 0, 0, 1, 0),
  /* 0xC5 */
  C.bind(void 0, 0, 0, 0, 1, 1),
  /* 0xC6 */
  C.bind(void 0, 0, 0, 0, 1, 2),
  /* 0xC7 */
  C.bind(void 0, 0, 0, 0, 1, 3),
  /* 0xC8 */
  C.bind(void 0, 0, 0, 1, 0, 0),
  /* 0xC9 */
  C.bind(void 0, 0, 0, 1, 0, 1),
  /* 0xCA */
  C.bind(void 0, 0, 0, 1, 0, 2),
  /* 0xCB */
  C.bind(void 0, 0, 0, 1, 0, 3),
  /* 0xCC */
  C.bind(void 0, 0, 0, 1, 1, 0),
  /* 0xCD */
  C.bind(void 0, 0, 0, 1, 1, 1),
  /* 0xCE */
  C.bind(void 0, 0, 0, 1, 1, 2),
  /* 0xCF */
  C.bind(void 0, 0, 0, 1, 1, 3),
  /* 0xD0 */
  C.bind(void 0, 0, 1, 0, 0, 0),
  /* 0xD1 */
  C.bind(void 0, 0, 1, 0, 0, 1),
  /* 0xD2 */
  C.bind(void 0, 0, 1, 0, 0, 2),
  /* 0xD3 */
  C.bind(void 0, 0, 1, 0, 0, 3),
  /* 0xD4 */
  C.bind(void 0, 0, 1, 0, 1, 0),
  /* 0xD5 */
  C.bind(void 0, 0, 1, 0, 1, 1),
  /* 0xD6 */
  C.bind(void 0, 0, 1, 0, 1, 2),
  /* 0xD7 */
  C.bind(void 0, 0, 1, 0, 1, 3),
  /* 0xD8 */
  C.bind(void 0, 0, 1, 1, 0, 0),
  /* 0xD9 */
  C.bind(void 0, 0, 1, 1, 0, 1),
  /* 0xDA */
  C.bind(void 0, 0, 1, 1, 0, 2),
  /* 0xDB */
  C.bind(void 0, 0, 1, 1, 0, 3),
  /* 0xDC */
  C.bind(void 0, 0, 1, 1, 1, 0),
  /* 0xDD */
  C.bind(void 0, 0, 1, 1, 1, 1),
  /* 0xDE */
  C.bind(void 0, 0, 1, 1, 1, 2),
  /* 0xDF */
  C.bind(void 0, 0, 1, 1, 1, 3),
  /* 0xE0 */
  C.bind(void 0, 1, 0, 0, 0, 0),
  /* 0xE1 */
  C.bind(void 0, 1, 0, 0, 0, 1),
  /* 0xE2 */
  C.bind(void 0, 1, 0, 0, 0, 2),
  /* 0xE3 */
  C.bind(void 0, 1, 0, 0, 0, 3),
  /* 0xE4 */
  C.bind(void 0, 1, 0, 0, 1, 0),
  /* 0xE5 */
  C.bind(void 0, 1, 0, 0, 1, 1),
  /* 0xE6 */
  C.bind(void 0, 1, 0, 0, 1, 2),
  /* 0xE7 */
  C.bind(void 0, 1, 0, 0, 1, 3),
  /* 0xE8 */
  C.bind(void 0, 1, 0, 1, 0, 0),
  /* 0xE9 */
  C.bind(void 0, 1, 0, 1, 0, 1),
  /* 0xEA */
  C.bind(void 0, 1, 0, 1, 0, 2),
  /* 0xEB */
  C.bind(void 0, 1, 0, 1, 0, 3),
  /* 0xEC */
  C.bind(void 0, 1, 0, 1, 1, 0),
  /* 0xED */
  C.bind(void 0, 1, 0, 1, 1, 1),
  /* 0xEE */
  C.bind(void 0, 1, 0, 1, 1, 2),
  /* 0xEF */
  C.bind(void 0, 1, 0, 1, 1, 3),
  /* 0xF0 */
  C.bind(void 0, 1, 1, 0, 0, 0),
  /* 0xF1 */
  C.bind(void 0, 1, 1, 0, 0, 1),
  /* 0xF2 */
  C.bind(void 0, 1, 1, 0, 0, 2),
  /* 0xF3 */
  C.bind(void 0, 1, 1, 0, 0, 3),
  /* 0xF4 */
  C.bind(void 0, 1, 1, 0, 1, 0),
  /* 0xF5 */
  C.bind(void 0, 1, 1, 0, 1, 1),
  /* 0xF6 */
  C.bind(void 0, 1, 1, 0, 1, 2),
  /* 0xF7 */
  C.bind(void 0, 1, 1, 0, 1, 3),
  /* 0xF8 */
  C.bind(void 0, 1, 1, 1, 0, 0),
  /* 0xF9 */
  C.bind(void 0, 1, 1, 1, 0, 1),
  /* 0xFA */
  C.bind(void 0, 1, 1, 1, 0, 2),
  /* 0xFB */
  C.bind(void 0, 1, 1, 1, 0, 3),
  /* 0xFC */
  C.bind(void 0, 1, 1, 1, 1, 0),
  /* 0xFD */
  C.bind(void 0, 1, 1, 1, 1, 1),
  /* 0xFE */
  C.bind(void 0, 1, 1, 1, 1, 2),
  /* 0xFF */
  C.bind(void 0, 1, 1, 1, 1, 3)
];
function ze(e) {
  this.char = e, this.state = {}, this.activeState = null;
}
function et(e, r, t) {
  this.contextName = t, this.startIndex = e, this.endOffset = r;
}
function zo(e, r, t) {
  this.contextName = e, this.openRange = null, this.ranges = [], this.checkStart = r, this.checkEnd = t;
}
function fe(e, r) {
  this.context = e, this.index = r, this.length = e.length, this.current = e[r], this.backtrack = e.slice(0, r), this.lookahead = e.slice(r + 1);
}
function Tr(e) {
  this.eventId = e, this.subscribers = [];
}
function Vo(e) {
  var r = this, t = [
    "start",
    "end",
    "next",
    "newToken",
    "contextStart",
    "contextEnd",
    "insertToken",
    "removeToken",
    "removeRange",
    "replaceToken",
    "replaceRange",
    "composeRUD",
    "updateContextsRanges"
  ];
  t.forEach(function(a) {
    Object.defineProperty(r.events, a, {
      value: new Tr(a)
    });
  }), e && t.forEach(function(a) {
    var i = e[a];
    typeof i == "function" && r.events[a].subscribe(i);
  });
  var n = [
    "insertToken",
    "removeToken",
    "removeRange",
    "replaceToken",
    "replaceRange",
    "composeRUD"
  ];
  n.forEach(function(a) {
    r.events[a].subscribe(
      r.updateContextsRanges
    );
  });
}
function J(e) {
  this.tokens = [], this.registeredContexts = {}, this.contextCheckers = [], this.events = {}, this.registeredModifiers = [], Vo.call(this, e);
}
ze.prototype.setState = function(e, r) {
  return this.state[e] = r, this.activeState = { key: e, value: this.state[e] }, this.activeState;
};
ze.prototype.getState = function(e) {
  return this.state[e] || null;
};
J.prototype.inboundIndex = function(e) {
  return e >= 0 && e < this.tokens.length;
};
J.prototype.composeRUD = function(e) {
  var r = this, t = !0, n = e.map(function(i) {
    return r[i[0]].apply(r, i.slice(1).concat(t));
  }), a = function(i) {
    return typeof i == "object" && i.hasOwnProperty("FAIL");
  };
  if (n.every(a))
    return {
      FAIL: "composeRUD: one or more operations hasn't completed successfully",
      report: n.filter(a)
    };
  this.dispatch("composeRUD", [n.filter(function(i) {
    return !a(i);
  })]);
};
J.prototype.replaceRange = function(e, r, t, n) {
  r = r !== null ? r : this.tokens.length;
  var a = t.every(function(s) {
    return s instanceof ze;
  });
  if (!isNaN(e) && this.inboundIndex(e) && a) {
    var i = this.tokens.splice.apply(
      this.tokens,
      [e, r].concat(t)
    );
    return n || this.dispatch("replaceToken", [e, r, t]), [i, t];
  } else
    return { FAIL: "replaceRange: invalid tokens or startIndex." };
};
J.prototype.replaceToken = function(e, r, t) {
  if (!isNaN(e) && this.inboundIndex(e) && r instanceof ze) {
    var n = this.tokens.splice(e, 1, r);
    return t || this.dispatch("replaceToken", [e, r]), [n[0], r];
  } else
    return { FAIL: "replaceToken: invalid token or index." };
};
J.prototype.removeRange = function(e, r, t) {
  r = isNaN(r) ? this.tokens.length : r;
  var n = this.tokens.splice(e, r);
  return t || this.dispatch("removeRange", [n, e, r]), n;
};
J.prototype.removeToken = function(e, r) {
  if (!isNaN(e) && this.inboundIndex(e)) {
    var t = this.tokens.splice(e, 1);
    return r || this.dispatch("removeToken", [t, e]), t;
  } else
    return { FAIL: "removeToken: invalid token index." };
};
J.prototype.insertToken = function(e, r, t) {
  var n = e.every(
    function(a) {
      return a instanceof ze;
    }
  );
  return n ? (this.tokens.splice.apply(
    this.tokens,
    [r, 0].concat(e)
  ), t || this.dispatch("insertToken", [e, r]), e) : { FAIL: "insertToken: invalid token(s)." };
};
J.prototype.registerModifier = function(e, r, t) {
  this.events.newToken.subscribe(function(n, a) {
    var i = [n, a], s = r === null || r.apply(this, i) === !0, u = [n, a];
    if (s) {
      var o = t.apply(this, u);
      n.setState(e, o);
    }
  }), this.registeredModifiers.push(e);
};
Tr.prototype.subscribe = function(e) {
  return typeof e == "function" ? this.subscribers.push(e) - 1 : { FAIL: "invalid '" + this.eventId + "' event handler" };
};
Tr.prototype.unsubscribe = function(e) {
  this.subscribers.splice(e, 1);
};
fe.prototype.setCurrentIndex = function(e) {
  this.index = e, this.current = this.context[e], this.backtrack = this.context.slice(0, e), this.lookahead = this.context.slice(e + 1);
};
fe.prototype.get = function(e) {
  switch (!0) {
    case e === 0:
      return this.current;
    case (e < 0 && Math.abs(e) <= this.backtrack.length):
      return this.backtrack.slice(e)[0];
    case (e > 0 && e <= this.lookahead.length):
      return this.lookahead[e - 1];
    default:
      return null;
  }
};
J.prototype.rangeToText = function(e) {
  if (e instanceof et)
    return this.getRangeTokens(e).map(function(r) {
      return r.char;
    }).join("");
};
J.prototype.getText = function() {
  return this.tokens.map(function(e) {
    return e.char;
  }).join("");
};
J.prototype.getContext = function(e) {
  var r = this.registeredContexts[e];
  return r || null;
};
J.prototype.on = function(e, r) {
  var t = this.events[e];
  return t ? t.subscribe(r) : null;
};
J.prototype.dispatch = function(e, r) {
  var t = this, n = this.events[e];
  n instanceof Tr && n.subscribers.forEach(function(a) {
    a.apply(t, r || []);
  });
};
J.prototype.registerContextChecker = function(e, r, t) {
  if (this.getContext(e))
    return {
      FAIL: "context name '" + e + "' is already registered."
    };
  if (typeof r != "function")
    return {
      FAIL: "missing context start check."
    };
  if (typeof t != "function")
    return {
      FAIL: "missing context end check."
    };
  var n = new zo(
    e,
    r,
    t
  );
  return this.registeredContexts[e] = n, this.contextCheckers.push(n), n;
};
J.prototype.getRangeTokens = function(e) {
  var r = e.startIndex + e.endOffset;
  return [].concat(
    this.tokens.slice(e.startIndex, r)
  );
};
J.prototype.getContextRanges = function(e) {
  var r = this.getContext(e);
  return r ? r.ranges : { FAIL: "context checker '" + e + "' is not registered." };
};
J.prototype.resetContextsRanges = function() {
  var e = this.registeredContexts;
  for (var r in e)
    if (e.hasOwnProperty(r)) {
      var t = e[r];
      t.ranges = [];
    }
};
J.prototype.updateContextsRanges = function() {
  this.resetContextsRanges();
  for (var e = this.tokens.map(function(n) {
    return n.char;
  }), r = 0; r < e.length; r++) {
    var t = new fe(e, r);
    this.runContextCheck(t);
  }
  this.dispatch("updateContextsRanges", [this.registeredContexts]);
};
J.prototype.setEndOffset = function(e, r) {
  var t = this.getContext(r).openRange.startIndex, n = new et(t, e, r), a = this.getContext(r).ranges;
  return n.rangeId = r + "." + a.length, a.push(n), this.getContext(r).openRange = null, n;
};
J.prototype.runContextCheck = function(e) {
  var r = this, t = e.index;
  this.contextCheckers.forEach(function(n) {
    var a = n.contextName, i = r.getContext(a).openRange;
    if (!i && n.checkStart(e) && (i = new et(t, null, a), r.getContext(a).openRange = i, r.dispatch("contextStart", [a, t])), i && n.checkEnd(e)) {
      var s = t - i.startIndex + 1, u = r.setEndOffset(s, a);
      r.dispatch("contextEnd", [a, u]);
    }
  });
};
J.prototype.tokenize = function(e) {
  this.tokens = [], this.resetContextsRanges();
  var r = Array.from(e);
  this.dispatch("start");
  for (var t = 0; t < r.length; t++) {
    var n = r[t], a = new fe(r, t);
    this.dispatch("next", [a]), this.runContextCheck(a);
    var i = new ze(n);
    this.tokens.push(i), this.dispatch("newToken", [i, a]);
  }
  return this.dispatch("end", [this.tokens]), this.tokens;
};
function Ue(e) {
  return /[\u0600-\u065F\u066A-\u06D2\u06FA-\u06FF]/.test(e);
}
function Yn(e) {
  return /[\u0630\u0690\u0621\u0631\u0661\u0671\u0622\u0632\u0672\u0692\u06C2\u0623\u0673\u0693\u06C3\u0624\u0694\u06C4\u0625\u0675\u0695\u06C5\u06E5\u0676\u0696\u06C6\u0627\u0677\u0697\u06C7\u0648\u0688\u0698\u06C8\u0689\u0699\u06C9\u068A\u06CA\u066B\u068B\u06CB\u068C\u068D\u06CD\u06FD\u068E\u06EE\u06FE\u062F\u068F\u06CF\u06EF]/.test(e);
}
function Ce(e) {
  return /[\u0600-\u0605\u060C-\u060E\u0610-\u061B\u061E\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/.test(e);
}
function cr(e) {
  return /[A-z]/.test(e);
}
function Wo(e) {
  return /\s/.test(e);
}
function se(e) {
  this.font = e, this.features = {};
}
function De(e) {
  this.id = e.id, this.tag = e.tag, this.substitution = e.substitution;
}
function nr(e, r) {
  if (!e)
    return -1;
  switch (r.format) {
    case 1:
      return r.glyphs.indexOf(e);
    case 2:
      for (var t = r.ranges, n = 0; n < t.length; n++) {
        var a = t[n];
        if (e >= a.start && e <= a.end) {
          var i = e - a.start;
          return a.index + i;
        }
      }
      break;
    default:
      return -1;
  }
  return -1;
}
function Xo(e, r) {
  var t = nr(e, r.coverage);
  return t === -1 ? null : e + r.deltaGlyphId;
}
function qo(e, r) {
  var t = nr(e, r.coverage);
  return t === -1 ? null : r.substitute[t];
}
function Dr(e, r) {
  for (var t = [], n = 0; n < e.length; n++) {
    var a = e[n], i = r.current;
    i = Array.isArray(i) ? i[0] : i;
    var s = nr(i, a);
    s !== -1 && t.push(s);
  }
  return t.length !== e.length ? -1 : t;
}
function Zo(e, r) {
  var t = r.inputCoverage.length + r.lookaheadCoverage.length + r.backtrackCoverage.length;
  if (e.context.length < t)
    return [];
  var n = Dr(
    r.inputCoverage,
    e
  );
  if (n === -1)
    return [];
  var a = r.inputCoverage.length - 1;
  if (e.lookahead.length < r.lookaheadCoverage.length)
    return [];
  for (var i = e.lookahead.slice(a); i.length && Ce(i[0].char); )
    i.shift();
  var s = new fe(i, 0), u = Dr(
    r.lookaheadCoverage,
    s
  ), o = [].concat(e.backtrack);
  for (o.reverse(); o.length && Ce(o[0].char); )
    o.shift();
  if (o.length < r.backtrackCoverage.length)
    return [];
  var l = new fe(o, 0), f = Dr(
    r.backtrackCoverage,
    l
  ), p = n.length === r.inputCoverage.length && u.length === r.lookaheadCoverage.length && f.length === r.backtrackCoverage.length, h = [];
  if (p)
    for (var c = 0; c < r.lookupRecords.length; c++)
      for (var d = r.lookupRecords[c], m = d.lookupListIndex, y = this.getLookupByIndex(m), x = 0; x < y.subtables.length; x++) {
        var F = y.subtables[x], g = this.getLookupMethod(y, F), T = this.getSubstitutionType(y, F);
        if (T === "12")
          for (var O = 0; O < n.length; O++) {
            var P = e.get(O), L = g(P);
            L && h.push(L);
          }
      }
  return h;
}
function Yo(e, r) {
  var t = e.current, n = nr(t, r.coverage);
  if (n === -1)
    return null;
  for (var a, i = r.ligatureSets[n], s = 0; s < i.length; s++) {
    a = i[s];
    for (var u = 0; u < a.components.length; u++) {
      var o = e.lookahead[u], l = a.components[u];
      if (o !== l)
        break;
      if (u === a.components.length - 1)
        return a;
    }
  }
  return null;
}
function Qo(e, r) {
  var t = nr(e, r.coverage);
  return t === -1 ? null : r.sequences[t];
}
se.prototype.getDefaultScriptFeaturesIndexes = function() {
  for (var e = this.font.tables.gsub.scripts, r = 0; r < e.length; r++) {
    var t = e[r];
    if (t.tag === "DFLT")
      return t.script.defaultLangSys.featureIndexes;
  }
  return [];
};
se.prototype.getScriptFeaturesIndexes = function(e) {
  var r = this.font.tables;
  if (!r.gsub)
    return [];
  if (!e)
    return this.getDefaultScriptFeaturesIndexes();
  for (var t = this.font.tables.gsub.scripts, n = 0; n < t.length; n++) {
    var a = t[n];
    if (a.tag === e && a.script.defaultLangSys)
      return a.script.defaultLangSys.featureIndexes;
    var i = a.langSysRecords;
    if (i)
      for (var s = 0; s < i.length; s++) {
        var u = i[s];
        if (u.tag === e) {
          var o = u.langSys;
          return o.featureIndexes;
        }
      }
  }
  return this.getDefaultScriptFeaturesIndexes();
};
se.prototype.mapTagsToFeatures = function(e, r) {
  for (var t = {}, n = 0; n < e.length; n++) {
    var a = e[n].tag, i = e[n].feature;
    t[a] = i;
  }
  this.features[r].tags = t;
};
se.prototype.getScriptFeatures = function(e) {
  var r = this.features[e];
  if (this.features.hasOwnProperty(e))
    return r;
  var t = this.getScriptFeaturesIndexes(e);
  if (!t)
    return null;
  var n = this.font.tables.gsub;
  return r = t.map(function(a) {
    return n.features[a];
  }), this.features[e] = r, this.mapTagsToFeatures(r, e), r;
};
se.prototype.getSubstitutionType = function(e, r) {
  var t = e.lookupType.toString(), n = r.substFormat.toString();
  return t + n;
};
se.prototype.getLookupMethod = function(e, r) {
  var t = this, n = this.getSubstitutionType(e, r);
  switch (n) {
    case "11":
      return function(a) {
        return Xo.apply(
          t,
          [a, r]
        );
      };
    case "12":
      return function(a) {
        return qo.apply(
          t,
          [a, r]
        );
      };
    case "63":
      return function(a) {
        return Zo.apply(
          t,
          [a, r]
        );
      };
    case "41":
      return function(a) {
        return Yo.apply(
          t,
          [a, r]
        );
      };
    case "21":
      return function(a) {
        return Qo.apply(
          t,
          [a, r]
        );
      };
    default:
      throw new Error(
        "lookupType: " + e.lookupType + " - substFormat: " + r.substFormat + " is not yet supported"
      );
  }
};
se.prototype.lookupFeature = function(e) {
  var r = e.contextParams, t = r.index, n = this.getFeature({
    tag: e.tag,
    script: e.script
  });
  if (!n)
    return new Error(
      "font '" + this.font.names.fullName.en + "' doesn't support feature '" + e.tag + "' for script '" + e.script + "'."
    );
  for (var a = this.getFeatureLookups(n), i = [].concat(r.context), s = 0; s < a.length; s++)
    for (var u = a[s], o = this.getLookupSubtables(u), l = 0; l < o.length; l++) {
      var f = o[l], p = this.getSubstitutionType(u, f), h = this.getLookupMethod(u, f), c = void 0;
      switch (p) {
        case "11":
          c = h(r.current), c && i.splice(t, 1, new De({
            id: 11,
            tag: e.tag,
            substitution: c
          }));
          break;
        case "12":
          c = h(r.current), c && i.splice(t, 1, new De({
            id: 12,
            tag: e.tag,
            substitution: c
          }));
          break;
        case "63":
          c = h(r), Array.isArray(c) && c.length && i.splice(t, 1, new De({
            id: 63,
            tag: e.tag,
            substitution: c
          }));
          break;
        case "41":
          c = h(r), c && i.splice(t, 1, new De({
            id: 41,
            tag: e.tag,
            substitution: c
          }));
          break;
        case "21":
          c = h(r.current), c && i.splice(t, 1, new De({
            id: 21,
            tag: e.tag,
            substitution: c
          }));
          break;
      }
      r = new fe(i, t), !(Array.isArray(c) && !c.length) && (c = null);
    }
  return i.length ? i : null;
};
se.prototype.supports = function(e) {
  if (!e.script)
    return !1;
  this.getScriptFeatures(e.script);
  var r = this.features.hasOwnProperty(e.script);
  if (!e.tag)
    return r;
  var t = this.features[e.script].some(function(n) {
    return n.tag === e.tag;
  });
  return r && t;
};
se.prototype.getLookupSubtables = function(e) {
  return e.subtables || null;
};
se.prototype.getLookupByIndex = function(e) {
  var r = this.font.tables.gsub.lookups;
  return r[e] || null;
};
se.prototype.getFeatureLookups = function(e) {
  return e.lookupListIndexes.map(this.getLookupByIndex.bind(this));
};
se.prototype.getFeature = function(r) {
  if (!this.font)
    return { FAIL: "No font was found" };
  this.features.hasOwnProperty(r.script) || this.getScriptFeatures(r.script);
  var t = this.features[r.script];
  return t ? t.tags[r.tag] ? this.features[r.script].tags[r.tag] : null : { FAIL: "No feature for script " + r.script };
};
function Ko(e) {
  var r = e.current, t = e.get(-1);
  return (
    // ? arabic first char
    t === null && Ue(r) || // ? arabic char preceded with a non arabic char
    !Ue(t) && Ue(r)
  );
}
function Jo(e) {
  var r = e.get(1);
  return (
    // ? last arabic char
    r === null || // ? next char is not arabic
    !Ue(r)
  );
}
var jo = {
  startCheck: Ko,
  endCheck: Jo
};
function $o(e) {
  var r = e.current, t = e.get(-1);
  return (
    // ? an arabic char preceded with a non arabic char
    (Ue(r) || Ce(r)) && !Ue(t)
  );
}
function eu(e) {
  var r = e.get(1);
  switch (!0) {
    case r === null:
      return !0;
    case (!Ue(r) && !Ce(r)):
      var t = Wo(r);
      if (!t)
        return !0;
      if (t) {
        var n = !1;
        if (n = e.lookahead.some(
          function(a) {
            return Ue(a) || Ce(a);
          }
        ), !n)
          return !0;
      }
      break;
    default:
      return !1;
  }
}
var ru = {
  startCheck: $o,
  endCheck: eu
};
function tu(e, r, t) {
  r[t].setState(e.tag, e.substitution);
}
function nu(e, r, t) {
  r[t].setState(e.tag, e.substitution);
}
function au(e, r, t) {
  e.substitution.forEach(function(n, a) {
    var i = r[t + a];
    i.setState(e.tag, n);
  });
}
function iu(e, r, t) {
  var n = r[t];
  n.setState(e.tag, e.substitution.ligGlyph);
  for (var a = e.substitution.components.length, i = 0; i < a; i++)
    n = r[t + i + 1], n.setState("deleted", !0);
}
var Yt = {
  11: tu,
  12: nu,
  63: au,
  41: iu
};
function rt(e, r, t) {
  e instanceof De && Yt[e.id] && Yt[e.id](e, r, t);
}
function su(e) {
  for (var r = [].concat(e.backtrack), t = r.length - 1; t >= 0; t--) {
    var n = r[t], a = Yn(n), i = Ce(n);
    if (!a && !i)
      return !0;
    if (a)
      return !1;
  }
  return !1;
}
function ou(e) {
  if (Yn(e.current))
    return !1;
  for (var r = 0; r < e.lookahead.length; r++) {
    var t = e.lookahead[r], n = Ce(t);
    if (!n)
      return !0;
  }
  return !1;
}
function uu(e) {
  var r = this, t = "arab", n = this.featuresTags[t], a = this.tokenizer.getRangeTokens(e);
  if (a.length !== 1) {
    var i = new fe(
      a.map(
        function(u) {
          return u.getState("glyphIndex");
        }
      ),
      0
    ), s = new fe(
      a.map(
        function(u) {
          return u.char;
        }
      ),
      0
    );
    a.forEach(function(u, o) {
      if (!Ce(u.char)) {
        i.setCurrentIndex(o), s.setCurrentIndex(o);
        var l = 0;
        su(s) && (l |= 1), ou(s) && (l |= 2);
        var f;
        switch (l) {
          case 1:
            f = "fina";
            break;
          case 2:
            f = "init";
            break;
          case 3:
            f = "medi";
            break;
        }
        if (n.indexOf(f) !== -1) {
          var p = r.query.lookupFeature({
            tag: f,
            script: t,
            contextParams: i
          });
          if (p instanceof Error)
            return console.info(p.message);
          p.forEach(function(h, c) {
            h instanceof De && (rt(h, a, c), i.context[c] = h.substitution);
          });
        }
      }
    });
  }
}
function Qt(e, r) {
  var t = e.map(function(n) {
    return n.activeState.value;
  });
  return new fe(t, 0);
}
function lu(e) {
  var r = this, t = "arab", n = this.tokenizer.getRangeTokens(e), a = Qt(n);
  a.context.forEach(function(i, s) {
    a.setCurrentIndex(s);
    var u = r.query.lookupFeature({
      tag: "rlig",
      script: t,
      contextParams: a
    });
    u.length && (u.forEach(
      function(o) {
        return rt(o, n, s);
      }
    ), a = Qt(n));
  });
}
function fu(e) {
  var r = e.current, t = e.get(-1);
  return (
    // ? latin first char
    t === null && cr(r) || // ? latin char preceded with a non latin char
    !cr(t) && cr(r)
  );
}
function hu(e) {
  var r = e.get(1);
  return (
    // ? last latin char
    r === null || // ? next char is not latin
    !cr(r)
  );
}
var pu = {
  startCheck: fu,
  endCheck: hu
};
function Kt(e, r) {
  var t = e.map(function(n) {
    return n.activeState.value;
  });
  return new fe(t, 0);
}
function cu(e) {
  var r = this, t = "latn", n = this.tokenizer.getRangeTokens(e), a = Kt(n);
  a.context.forEach(function(i, s) {
    a.setCurrentIndex(s);
    var u = r.query.lookupFeature({
      tag: "liga",
      script: t,
      contextParams: a
    });
    u.length && (u.forEach(
      function(o) {
        return rt(o, n, s);
      }
    ), a = Kt(n));
  });
}
function ce(e) {
  this.baseDir = e || "ltr", this.tokenizer = new J(), this.featuresTags = {};
}
ce.prototype.setText = function(e) {
  this.text = e;
};
ce.prototype.contextChecks = {
  latinWordCheck: pu,
  arabicWordCheck: jo,
  arabicSentenceCheck: ru
};
function Mr(e) {
  var r = this.contextChecks[e + "Check"];
  return this.tokenizer.registerContextChecker(
    e,
    r.startCheck,
    r.endCheck
  );
}
function vu() {
  return Mr.call(this, "latinWord"), Mr.call(this, "arabicWord"), Mr.call(this, "arabicSentence"), this.tokenizer.tokenize(this.text);
}
function du() {
  var e = this, r = this.tokenizer.getContextRanges("arabicSentence");
  r.forEach(function(t) {
    var n = e.tokenizer.getRangeTokens(t);
    e.tokenizer.replaceRange(
      t.startIndex,
      t.endOffset,
      n.reverse()
    );
  });
}
ce.prototype.registerFeatures = function(e, r) {
  var t = this, n = r.filter(
    function(a) {
      return t.query.supports({ script: e, tag: a });
    }
  );
  this.featuresTags.hasOwnProperty(e) ? this.featuresTags[e] = this.featuresTags[e].concat(n) : this.featuresTags[e] = n;
};
ce.prototype.applyFeatures = function(e, r) {
  if (!e)
    throw new Error(
      "No valid font was provided to apply features"
    );
  this.query || (this.query = new se(e));
  for (var t = 0; t < r.length; t++) {
    var n = r[t];
    this.query.supports({ script: n.script }) && this.registerFeatures(n.script, n.tags);
  }
};
ce.prototype.registerModifier = function(e, r, t) {
  this.tokenizer.registerModifier(e, r, t);
};
function tt() {
  if (this.tokenizer.registeredModifiers.indexOf("glyphIndex") === -1)
    throw new Error(
      "glyphIndex modifier is required to apply arabic presentation features."
    );
}
function gu() {
  var e = this, r = "arab";
  if (this.featuresTags.hasOwnProperty(r)) {
    tt.call(this);
    var t = this.tokenizer.getContextRanges("arabicWord");
    t.forEach(function(n) {
      uu.call(e, n);
    });
  }
}
function xu() {
  var e = this, r = "arab";
  if (this.featuresTags.hasOwnProperty(r)) {
    var t = this.featuresTags[r];
    if (t.indexOf("rlig") !== -1) {
      tt.call(this);
      var n = this.tokenizer.getContextRanges("arabicWord");
      n.forEach(function(a) {
        lu.call(e, a);
      });
    }
  }
}
function mu() {
  var e = this, r = "latn";
  if (this.featuresTags.hasOwnProperty(r)) {
    var t = this.featuresTags[r];
    if (t.indexOf("liga") !== -1) {
      tt.call(this);
      var n = this.tokenizer.getContextRanges("latinWord");
      n.forEach(function(a) {
        cu.call(e, a);
      });
    }
  }
}
ce.prototype.checkContextReady = function(e) {
  return !!this.tokenizer.getContext(e);
};
ce.prototype.applyFeaturesToContexts = function() {
  this.checkContextReady("arabicWord") && (gu.call(this), xu.call(this)), this.checkContextReady("latinWord") && mu.call(this), this.checkContextReady("arabicSentence") && du.call(this);
};
ce.prototype.processText = function(e) {
  (!this.text || this.text !== e) && (this.setText(e), vu.call(this), this.applyFeaturesToContexts());
};
ce.prototype.getBidiText = function(e) {
  return this.processText(e), this.tokenizer.getText();
};
ce.prototype.getTextGlyphs = function(e) {
  this.processText(e);
  for (var r = [], t = 0; t < this.tokenizer.tokens.length; t++) {
    var n = this.tokenizer.tokens[t];
    if (!n.state.deleted) {
      var a = n.activeState.value;
      r.push(Array.isArray(a) ? a[0] : a);
    }
  }
  return r;
};
function q(e) {
  e = e || {}, e.tables = e.tables || {}, e.empty || (We(e.familyName, "When creating a new Font object, familyName is required."), We(e.styleName, "When creating a new Font object, styleName is required."), We(e.unitsPerEm, "When creating a new Font object, unitsPerEm is required."), We(e.ascender, "When creating a new Font object, ascender is required."), We(e.descender <= 0, "When creating a new Font object, negative descender value is required."), this.names = {
    fontFamily: { en: e.familyName || " " },
    fontSubfamily: { en: e.styleName || " " },
    fullName: { en: e.fullName || e.familyName + " " + e.styleName },
    // postScriptName may not contain any whitespace
    postScriptName: { en: e.postScriptName || (e.familyName + e.styleName).replace(/\s/g, "") },
    designer: { en: e.designer || " " },
    designerURL: { en: e.designerURL || " " },
    manufacturer: { en: e.manufacturer || " " },
    manufacturerURL: { en: e.manufacturerURL || " " },
    license: { en: e.license || " " },
    licenseURL: { en: e.licenseURL || " " },
    version: { en: e.version || "Version 0.1" },
    description: { en: e.description || " " },
    copyright: { en: e.copyright || " " },
    trademark: { en: e.trademark || " " }
  }, this.unitsPerEm = e.unitsPerEm || 1e3, this.ascender = e.ascender, this.descender = e.descender, this.createdTimestamp = e.createdTimestamp, this.tables = Object.assign(e.tables, {
    os2: Object.assign({
      usWeightClass: e.weightClass || this.usWeightClasses.MEDIUM,
      usWidthClass: e.widthClass || this.usWidthClasses.MEDIUM,
      fsSelection: e.fsSelection || this.fsSelectionValues.REGULAR
    }, e.tables.os2)
  })), this.supported = !0, this.glyphs = new me.GlyphSet(this, e.glyphs || []), this.encoding = new cn(this), this.position = new er(this), this.substitution = new ie(this), this.tables = this.tables || {}, this._push = null, this._hmtxTableData = {}, Object.defineProperty(this, "hinting", {
    get: function() {
      if (this._hinting)
        return this._hinting;
      if (this.outlinesFormat === "truetype")
        return this._hinting = new Wn(this);
    }
  });
}
q.prototype.hasChar = function(e) {
  return this.encoding.charToGlyphIndex(e) !== null;
};
q.prototype.charToGlyphIndex = function(e) {
  return this.encoding.charToGlyphIndex(e);
};
q.prototype.charToGlyph = function(e) {
  var r = this.charToGlyphIndex(e), t = this.glyphs.get(r);
  return t || (t = this.glyphs.get(0)), t;
};
q.prototype.updateFeatures = function(e) {
  return this.defaultRenderOptions.features.map(function(r) {
    return r.script === "latn" ? {
      script: "latn",
      tags: r.tags.filter(function(t) {
        return e[t];
      })
    } : r;
  });
};
q.prototype.stringToGlyphs = function(e, r) {
  var t = this, n = new ce(), a = function(p) {
    return t.charToGlyphIndex(p.char);
  };
  n.registerModifier("glyphIndex", null, a);
  var i = r ? this.updateFeatures(r.features) : this.defaultRenderOptions.features;
  n.applyFeatures(this, i);
  for (var s = n.getTextGlyphs(e), u = s.length, o = new Array(u), l = this.glyphs.get(0), f = 0; f < u; f += 1)
    o[f] = this.glyphs.get(s[f]) || l;
  return o;
};
q.prototype.nameToGlyphIndex = function(e) {
  return this.glyphNames.nameToGlyphIndex(e);
};
q.prototype.nameToGlyph = function(e) {
  var r = this.nameToGlyphIndex(e), t = this.glyphs.get(r);
  return t || (t = this.glyphs.get(0)), t;
};
q.prototype.glyphIndexToName = function(e) {
  return this.glyphNames.glyphIndexToName ? this.glyphNames.glyphIndexToName(e) : "";
};
q.prototype.getKerningValue = function(e, r) {
  e = e.index || e, r = r.index || r;
  var t = this.position.defaultKerningTables;
  return t ? this.position.getKerningValue(t, e, r) : this.kerningPairs[e + "," + r] || 0;
};
q.prototype.defaultRenderOptions = {
  kerning: !0,
  features: [
    /**
     * these 4 features are required to render Arabic text properly
     * and shouldn't be turned off when rendering arabic text.
     */
    { script: "arab", tags: ["init", "medi", "fina", "rlig"] },
    { script: "latn", tags: ["liga", "rlig"] }
  ]
};
q.prototype.forEachGlyph = function(e, r, t, n, a, i) {
  r = r !== void 0 ? r : 0, t = t !== void 0 ? t : 0, n = n !== void 0 ? n : 72, a = Object.assign({}, this.defaultRenderOptions, a);
  var s = 1 / this.unitsPerEm * n, u = this.stringToGlyphs(e, a), o;
  if (a.kerning) {
    var l = a.script || this.position.getDefaultScriptName();
    o = this.position.getKerningTables(l, a.language);
  }
  for (var f = 0; f < u.length; f += 1) {
    var p = u[f];
    if (i.call(this, p, r, t, n, a), p.advanceWidth && (r += p.advanceWidth * s), a.kerning && f < u.length - 1) {
      var h = o ? this.position.getKerningValue(o, p.index, u[f + 1].index) : this.getKerningValue(p, u[f + 1]);
      r += h * s;
    }
    a.letterSpacing ? r += a.letterSpacing * n : a.tracking && (r += a.tracking / 1e3 * n);
  }
  return r;
};
q.prototype.getPath = function(e, r, t, n, a) {
  var i = new re();
  return this.forEachGlyph(e, r, t, n, a, function(s, u, o, l) {
    var f = s.getPath(u, o, l, a, this);
    i.extend(f);
  }), i;
};
q.prototype.getPaths = function(e, r, t, n, a) {
  var i = [];
  return this.forEachGlyph(e, r, t, n, a, function(s, u, o, l) {
    var f = s.getPath(u, o, l, a, this);
    i.push(f);
  }), i;
};
q.prototype.getAdvanceWidth = function(e, r, t) {
  return this.forEachGlyph(e, 0, 0, r, t, function() {
  });
};
q.prototype.draw = function(e, r, t, n, a, i) {
  this.getPath(r, t, n, a, i).draw(e);
};
q.prototype.drawPoints = function(e, r, t, n, a, i) {
  this.forEachGlyph(r, t, n, a, i, function(s, u, o, l) {
    s.drawPoints(e, u, o, l);
  });
};
q.prototype.drawMetrics = function(e, r, t, n, a, i) {
  this.forEachGlyph(r, t, n, a, i, function(s, u, o, l) {
    s.drawMetrics(e, u, o, l);
  });
};
q.prototype.getEnglishName = function(e) {
  var r = this.names[e];
  if (r)
    return r.en;
};
q.prototype.validate = function() {
  var e = this;
  function r(n, a) {
  }
  function t(n) {
    var a = e.getEnglishName(n);
    a && a.trim().length > 0;
  }
  t("fontFamily"), t("weightName"), t("manufacturer"), t("copyright"), t("version"), this.unitsPerEm > 0;
};
q.prototype.toTables = function() {
  return as.fontToTable(this);
};
q.prototype.toBuffer = function() {
  return console.warn("Font.toBuffer is deprecated. Use Font.toArrayBuffer instead."), this.toArrayBuffer();
};
q.prototype.toArrayBuffer = function() {
  for (var e = this.toTables(), r = e.encode(), t = new ArrayBuffer(r.length), n = new Uint8Array(t), a = 0; a < r.length; a++)
    n[a] = r[a];
  return t;
};
q.prototype.download = function(e) {
  var r = this.getEnglishName("fontFamily"), t = this.getEnglishName("fontSubfamily");
  e = e || r.replace(/\s/g, "") + "-" + t + ".otf";
  var n = this.toArrayBuffer();
  if (ss())
    if (window.URL = window.URL || window.webkitURL, window.URL) {
      var a = new DataView(n), i = new Blob([a], { type: "font/opentype" }), s = document.createElement("a");
      s.href = window.URL.createObjectURL(i), s.download = e;
      var u = document.createEvent("MouseEvents");
      u.initEvent("click", !0, !1), s.dispatchEvent(u);
    } else
      console.warn("Font file could not be downloaded. Try using a different browser.");
  else {
    var o = require("fs"), l = os(n);
    o.writeFileSync(e, l);
  }
};
q.prototype.fsSelectionValues = {
  ITALIC: 1,
  //1
  UNDERSCORE: 2,
  //2
  NEGATIVE: 4,
  //4
  OUTLINED: 8,
  //8
  STRIKEOUT: 16,
  //16
  BOLD: 32,
  //32
  REGULAR: 64,
  //64
  USER_TYPO_METRICS: 128,
  //128
  WWS: 256,
  //256
  OBLIQUE: 512
  //512
};
q.prototype.usWidthClasses = {
  ULTRA_CONDENSED: 1,
  EXTRA_CONDENSED: 2,
  CONDENSED: 3,
  SEMI_CONDENSED: 4,
  MEDIUM: 5,
  SEMI_EXPANDED: 6,
  EXPANDED: 7,
  EXTRA_EXPANDED: 8,
  ULTRA_EXPANDED: 9
};
q.prototype.usWeightClasses = {
  THIN: 100,
  EXTRA_LIGHT: 200,
  LIGHT: 300,
  NORMAL: 400,
  MEDIUM: 500,
  SEMI_BOLD: 600,
  BOLD: 700,
  EXTRA_BOLD: 800,
  BLACK: 900
};
function Qn(e, r) {
  var t = JSON.stringify(e), n = 256;
  for (var a in r) {
    var i = parseInt(a);
    if (!(!i || i < 256)) {
      if (JSON.stringify(r[a]) === t)
        return i;
      n <= i && (n = i + 1);
    }
  }
  return r[n] = e, n;
}
function yu(e, r, t) {
  var n = Qn(r.name, t);
  return [
    { name: "tag_" + e, type: "TAG", value: r.tag },
    { name: "minValue_" + e, type: "FIXED", value: r.minValue << 16 },
    { name: "defaultValue_" + e, type: "FIXED", value: r.defaultValue << 16 },
    { name: "maxValue_" + e, type: "FIXED", value: r.maxValue << 16 },
    { name: "flags_" + e, type: "USHORT", value: 0 },
    { name: "nameID_" + e, type: "USHORT", value: n }
  ];
}
function bu(e, r, t) {
  var n = {}, a = new E.Parser(e, r);
  return n.tag = a.parseTag(), n.minValue = a.parseFixed(), n.defaultValue = a.parseFixed(), n.maxValue = a.parseFixed(), a.skip("uShort", 1), n.name = t[a.parseUShort()] || {}, n;
}
function Su(e, r, t, n) {
  for (var a = Qn(r.name, n), i = [
    { name: "nameID_" + e, type: "USHORT", value: a },
    { name: "flags_" + e, type: "USHORT", value: 0 }
  ], s = 0; s < t.length; ++s) {
    var u = t[s].tag;
    i.push({
      name: "axis_" + e + " " + u,
      type: "FIXED",
      value: r.coordinates[u] << 16
    });
  }
  return i;
}
function Tu(e, r, t, n) {
  var a = {}, i = new E.Parser(e, r);
  a.name = n[i.parseUShort()] || {}, i.skip("uShort", 1), a.coordinates = {};
  for (var s = 0; s < t.length; ++s)
    a.coordinates[t[s].tag] = i.parseFixed();
  return a;
}
function ku(e, r) {
  var t = new w.Table("fvar", [
    { name: "version", type: "ULONG", value: 65536 },
    { name: "offsetToData", type: "USHORT", value: 0 },
    { name: "countSizePairs", type: "USHORT", value: 2 },
    { name: "axisCount", type: "USHORT", value: e.axes.length },
    { name: "axisSize", type: "USHORT", value: 20 },
    { name: "instanceCount", type: "USHORT", value: e.instances.length },
    { name: "instanceSize", type: "USHORT", value: 4 + e.axes.length * 4 }
  ]);
  t.offsetToData = t.sizeOf();
  for (var n = 0; n < e.axes.length; n++)
    t.fields = t.fields.concat(yu(n, e.axes[n], r));
  for (var a = 0; a < e.instances.length; a++)
    t.fields = t.fields.concat(Su(a, e.instances[a], e.axes, r));
  return t;
}
function Fu(e, r, t) {
  var n = new E.Parser(e, r), a = n.parseULong();
  D.argument(a === 65536, "Unsupported fvar table version.");
  var i = n.parseOffset16();
  n.skip("uShort", 1);
  for (var s = n.parseUShort(), u = n.parseUShort(), o = n.parseUShort(), l = n.parseUShort(), f = [], p = 0; p < s; p++)
    f.push(bu(e, r + i + p * u, t));
  for (var h = [], c = r + i + s * u, d = 0; d < o; d++)
    h.push(Tu(e, c + d * l, f, t));
  return { axes: f, instances: h };
}
var wu = { make: ku, parse: Fu }, Uu = function() {
  return {
    coverage: this.parsePointer(v.coverage),
    attachPoints: this.parseList(v.pointer(v.uShortList))
  };
}, Cu = function() {
  var e = this.parseUShort();
  if (D.argument(
    e === 1 || e === 2 || e === 3,
    "Unsupported CaretValue table version."
  ), e === 1)
    return { coordinate: this.parseShort() };
  if (e === 2)
    return { pointindex: this.parseShort() };
  if (e === 3)
    return { coordinate: this.parseShort() };
}, Ou = function() {
  return this.parseList(v.pointer(Cu));
}, Eu = function() {
  return {
    coverage: this.parsePointer(v.coverage),
    ligGlyphs: this.parseList(v.pointer(Ou))
  };
}, Ru = function() {
  return this.parseUShort(), this.parseList(v.pointer(v.coverage));
};
function Lu(e, r) {
  r = r || 0;
  var t = new v(e, r), n = t.parseVersion(1);
  D.argument(
    n === 1 || n === 1.2 || n === 1.3,
    "Unsupported GDEF table version."
  );
  var a = {
    version: n,
    classDef: t.parsePointer(v.classDef),
    attachList: t.parsePointer(Uu),
    ligCaretList: t.parsePointer(Eu),
    markAttachClassDef: t.parsePointer(v.classDef)
  };
  return n >= 1.2 && (a.markGlyphSets = t.parsePointer(Ru)), a;
}
var Du = { parse: Lu }, he = new Array(10);
he[1] = function() {
  var r = this.offset + this.relativeOffset, t = this.parseUShort();
  if (t === 1)
    return {
      posFormat: 1,
      coverage: this.parsePointer(v.coverage),
      value: this.parseValueRecord()
    };
  if (t === 2)
    return {
      posFormat: 2,
      coverage: this.parsePointer(v.coverage),
      values: this.parseValueRecordList()
    };
  D.assert(!1, "0x" + r.toString(16) + ": GPOS lookup type 1 format must be 1 or 2.");
};
he[2] = function() {
  var r = this.offset + this.relativeOffset, t = this.parseUShort();
  D.assert(t === 1 || t === 2, "0x" + r.toString(16) + ": GPOS lookup type 2 format must be 1 or 2.");
  var n = this.parsePointer(v.coverage), a = this.parseUShort(), i = this.parseUShort();
  if (t === 1)
    return {
      posFormat: t,
      coverage: n,
      valueFormat1: a,
      valueFormat2: i,
      pairSets: this.parseList(v.pointer(v.list(function() {
        return {
          // pairValueRecord
          secondGlyph: this.parseUShort(),
          value1: this.parseValueRecord(a),
          value2: this.parseValueRecord(i)
        };
      })))
    };
  if (t === 2) {
    var s = this.parsePointer(v.classDef), u = this.parsePointer(v.classDef), o = this.parseUShort(), l = this.parseUShort();
    return {
      // Class Pair Adjustment
      posFormat: t,
      coverage: n,
      valueFormat1: a,
      valueFormat2: i,
      classDef1: s,
      classDef2: u,
      class1Count: o,
      class2Count: l,
      classRecords: this.parseList(o, v.list(l, function() {
        return {
          value1: this.parseValueRecord(a),
          value2: this.parseValueRecord(i)
        };
      }))
    };
  }
};
he[3] = function() {
  return { error: "GPOS Lookup 3 not supported" };
};
he[4] = function() {
  return { error: "GPOS Lookup 4 not supported" };
};
he[5] = function() {
  return { error: "GPOS Lookup 5 not supported" };
};
he[6] = function() {
  return { error: "GPOS Lookup 6 not supported" };
};
he[7] = function() {
  return { error: "GPOS Lookup 7 not supported" };
};
he[8] = function() {
  return { error: "GPOS Lookup 8 not supported" };
};
he[9] = function() {
  return { error: "GPOS Lookup 9 not supported" };
};
function Mu(e, r) {
  r = r || 0;
  var t = new v(e, r), n = t.parseVersion(1);
  return D.argument(n === 1 || n === 1.1, "Unsupported GPOS table version " + n), n === 1 ? {
    version: n,
    scripts: t.parseScriptList(),
    features: t.parseFeatureList(),
    lookups: t.parseLookupList(he)
  } : {
    version: n,
    scripts: t.parseScriptList(),
    features: t.parseFeatureList(),
    lookups: t.parseLookupList(he),
    variations: t.parseFeatureVariationsList()
  };
}
var Au = new Array(10);
function Pu(e) {
  return new w.Table("GPOS", [
    { name: "version", type: "ULONG", value: 65536 },
    { name: "scripts", type: "TABLE", value: new w.ScriptList(e.scripts) },
    { name: "features", type: "TABLE", value: new w.FeatureList(e.features) },
    { name: "lookups", type: "TABLE", value: new w.LookupList(e.lookups, Au) }
  ]);
}
var Iu = { parse: Mu, make: Pu };
function Bu(e) {
  var r = {};
  e.skip("uShort");
  var t = e.parseUShort();
  D.argument(t === 0, "Unsupported kern sub-table version."), e.skip("uShort", 2);
  var n = e.parseUShort();
  e.skip("uShort", 3);
  for (var a = 0; a < n; a += 1) {
    var i = e.parseUShort(), s = e.parseUShort(), u = e.parseShort();
    r[i + "," + s] = u;
  }
  return r;
}
function Gu(e) {
  var r = {};
  e.skip("uShort");
  var t = e.parseULong();
  t > 1 && console.warn("Only the first kern subtable is supported."), e.skip("uLong");
  var n = e.parseUShort(), a = n & 255;
  if (e.skip("uShort"), a === 0) {
    var i = e.parseUShort();
    e.skip("uShort", 3);
    for (var s = 0; s < i; s += 1) {
      var u = e.parseUShort(), o = e.parseUShort(), l = e.parseShort();
      r[u + "," + o] = l;
    }
  }
  return r;
}
function Nu(e, r) {
  var t = new E.Parser(e, r), n = t.parseUShort();
  if (n === 0)
    return Bu(t);
  if (n === 1)
    return Gu(t);
  throw new Error("Unsupported kern table version (" + n + ").");
}
var _u = { parse: Nu };
function Hu(e, r, t, n) {
  for (var a = new E.Parser(e, r), i = n ? a.parseUShort : a.parseULong, s = [], u = 0; u < t + 1; u += 1) {
    var o = i.call(a);
    n && (o *= 2), s.push(o);
  }
  return s;
}
var zu = { parse: Hu };
function Jt(e, r) {
  for (var t = [], n = 12, a = 0; a < r; a += 1) {
    var i = E.getTag(e, n), s = E.getULong(e, n + 4), u = E.getULong(e, n + 8), o = E.getULong(e, n + 12);
    t.push({ tag: i, checksum: s, offset: u, length: o, compression: !1 }), n += 16;
  }
  return t;
}
function Vu(e, r) {
  for (var t = [], n = 44, a = 0; a < r; a += 1) {
    var i = E.getTag(e, n), s = E.getULong(e, n + 4), u = E.getULong(e, n + 8), o = E.getULong(e, n + 12), l = void 0;
    u < o ? l = "WOFF" : l = !1, t.push({
      tag: i,
      offset: s,
      compression: l,
      compressedLength: u,
      length: o
    }), n += 20;
  }
  return t;
}
function j(e, r) {
  if (r.compression === "WOFF") {
    var t = new Uint8Array(e.buffer, r.offset + 2, r.compressedLength - 2), n = new Uint8Array(r.length);
    if (Pa(t, n), n.byteLength !== r.length)
      throw new Error("Decompression error: " + r.tag + " decompressed length doesn't match recorded length");
    var a = new DataView(n.buffer, 0);
    return { data: a, offset: 0 };
  } else
    return { data: e, offset: r.offset };
}
function Wu(e, r) {
  r = r ?? {};
  var t, n, a = new q({ empty: !0 }), i = new DataView(e, 0), s, u = [], o = E.getTag(i, 0);
  if (o === "\0\0\0" || o === "true" || o === "typ1")
    a.outlinesFormat = "truetype", s = E.getUShort(i, 4), u = Jt(i, s);
  else if (o === "OTTO")
    a.outlinesFormat = "cff", s = E.getUShort(i, 4), u = Jt(i, s);
  else if (o === "wOFF") {
    var l = E.getTag(i, 4);
    if (l === "\0\0\0")
      a.outlinesFormat = "truetype";
    else if (l === "OTTO")
      a.outlinesFormat = "cff";
    else
      throw new Error("Unsupported OpenType flavor " + o);
    s = E.getUShort(i, 12), u = Vu(i, s);
  } else
    throw new Error("Unsupported OpenType signature " + o);
  for (var f, p, h, c, d, m, y, x, F, g, T, O, P = 0; P < s; P += 1) {
    var L = u[P], U = void 0;
    switch (L.tag) {
      case "cmap":
        U = j(i, L), a.tables.cmap = pn.parse(U.data, U.offset), a.encoding = new vn(a.tables.cmap);
        break;
      case "cvt ":
        U = j(i, L), O = new E.Parser(U.data, U.offset), a.tables.cvt = O.parseShortList(L.length / 2);
        break;
      case "fvar":
        p = L;
        break;
      case "fpgm":
        U = j(i, L), O = new E.Parser(U.data, U.offset), a.tables.fpgm = O.parseByteList(L.length);
        break;
      case "head":
        U = j(i, L), a.tables.head = Fn.parse(U.data, U.offset), a.unitsPerEm = a.tables.head.unitsPerEm, t = a.tables.head.indexToLocFormat;
        break;
      case "hhea":
        U = j(i, L), a.tables.hhea = wn.parse(U.data, U.offset), a.ascender = a.tables.hhea.ascender, a.descender = a.tables.hhea.descender, a.numberOfHMetrics = a.tables.hhea.numberOfHMetrics;
        break;
      case "hmtx":
        y = L;
        break;
      case "ltag":
        U = j(i, L), n = Cn.parse(U.data, U.offset);
        break;
      case "maxp":
        U = j(i, L), a.tables.maxp = On.parse(U.data, U.offset), a.numGlyphs = a.tables.maxp.numGlyphs;
        break;
      case "name":
        g = L;
        break;
      case "OS/2":
        U = j(i, L), a.tables.os2 = Vr.parse(U.data, U.offset);
        break;
      case "post":
        U = j(i, L), a.tables.post = An.parse(U.data, U.offset), a.glyphNames = new Kr(a.tables.post);
        break;
      case "prep":
        U = j(i, L), O = new E.Parser(U.data, U.offset), a.tables.prep = O.parseByteList(L.length);
        break;
      case "glyf":
        h = L;
        break;
      case "loca":
        F = L;
        break;
      case "CFF ":
        f = L;
        break;
      case "kern":
        x = L;
        break;
      case "GDEF":
        c = L;
        break;
      case "GPOS":
        d = L;
        break;
      case "GSUB":
        m = L;
        break;
      case "meta":
        T = L;
        break;
    }
  }
  var G = j(i, g);
  if (a.tables.name = Mn.parse(G.data, G.offset, n), a.names = a.tables.name, h && F) {
    var N = t === 0, V = j(i, F), $ = zu.parse(V.data, V.offset, a.numGlyphs, N), te = j(i, h);
    a.glyphs = Hn.parse(te.data, te.offset, $, a, r);
  } else if (f) {
    var Z = j(i, f);
    kn.parse(Z.data, Z.offset, a, r);
  } else
    throw new Error("Font doesn't contain TrueType or CFF outlines.");
  var _ = j(i, y);
  if (Un.parse(a, _.data, _.offset, a.numberOfHMetrics, a.numGlyphs, a.glyphs, r), ti(a, r), x) {
    var W = j(i, x);
    a.kerningPairs = _u.parse(W.data, W.offset);
  } else
    a.kerningPairs = {};
  if (c) {
    var X = j(i, c);
    a.tables.gdef = Du.parse(X.data, X.offset);
  }
  if (d) {
    var ee = j(i, d);
    a.tables.gpos = Iu.parse(ee.data, ee.offset), a.position.init();
  }
  if (m) {
    var I = j(i, m);
    a.tables.gsub = Pn.parse(I.data, I.offset);
  }
  if (p) {
    var Y = j(i, p);
    a.tables.fvar = wu.parse(Y.data, Y.offset, a.names);
  }
  if (T) {
    var b = j(i, T);
    a.tables.meta = In.parse(b.data, b.offset), a.metas = a.tables.meta;
  }
  return a;
}
class Ju extends ea {
  async parseBuffer(r) {
    const t = Wu(r);
    this.data = t;
  }
  verification() {
    if (this.data)
      return !0;
    throw new Error("Method not implemented.");
  }
}
class ju extends Ua {
  _text;
  constructor(r, t) {
    super([], t), this.options = t, this.text = r;
  }
  get font() {
    return this.options.font;
  }
  get text() {
    return this._text;
  }
  get fontSize() {
    return this.options.fontSize;
  }
  set fontSize(r) {
    this.options.fontSize = r;
  }
  set text(r) {
    this._text = r;
    let t = this.font.getPath(r, 0, 0, this.fontSize);
    this.buildShape(t), this.buildGeometry(this.options);
  }
  buildShape(r) {
    let t, n = new pt();
    const a = r.commands;
    for (let i = 0; i < a.length; i++) {
      const s = a[i];
      switch (n = n || new pt(), s.type) {
        case "M":
          n.moveTo(s.x, -s.y), t = s;
          break;
        case "L":
          n.lineTo(s.x, -s.y);
          break;
        case "C":
          n.bezierCurveTo(s.x1, -s.y1, s.x2, -s.y2, s.x, -s.y);
          break;
        case "Q":
          n.quadraticCurveTo(s.x1, -s.y1, s.x, -s.y);
          break;
        case "Z":
          if (n.lineTo(t.x, -t.y), Ge.isClockWise(n.getPoints(1)))
            this.shapes.push(n);
          else
            for (let u of this.shapes)
              u.isIntersect(n) && u.holes.push(n);
          n = null;
          break;
      }
    }
    n && this.shapes.push(n);
  }
}
class $u extends ra {
  _heightData;
  _greenList;
  constructor(r, t, n = 199, a = 199) {
    super(r, t, n, a, xe.Y_AXIS);
  }
  setHeight(r, t) {
    var n = new OffscreenCanvas(r.width, r.height);
    let a = n.getContext("2d");
    a.drawImage(r.sourceImageData, 0, 0);
    let i = this.getAttribute(ue.position), s = a.getImageData(0, 0, r.width, r.height);
    this._greenList = [];
    let u = this.segmentW + 1, o = this.segmentH + 1;
    for (let f = 0; f < this.segmentH - 1; f++)
      for (let p = 0; p < this.segmentW - 1; p++) {
        let h = Math.floor(p / u * r.width), c = Math.floor(f / o * r.height), d = Math.floor((p + 1) / u * r.width), m = Math.floor(f / o * r.height), y = Math.floor(p / u * r.width), x = Math.floor((f + 1) / o * r.height), F = Math.floor((p + 1) / u * r.width), g = Math.floor((f + 1) / o * r.height);
        var l = p / u - Math.floor(p / u);
        let T = l, O = l, P = l * 1.2121, L = c * r.width + h, U = m * r.width + d, G = x * r.width + y, N = g * r.width + F, V = s.data[L * 4], $ = s.data[U * 4], te = s.data[G * 4], Z = s.data[N * 4], _ = kr(V, $, T);
        _ = kr(_, te, O), _ = kr(_, Z, P), _ > 45 && _ < 150 && this._greenList.push(new xe(p, 0, f));
        let W = u * f + p, X = _ / 256 * t;
        i.data[W * 3 + 1] = X, this._heightData ||= [], this._heightData[f] ||= [], this._heightData[f][p] = X;
      }
    this.vertexBuffer.upload(ue.position, i), this.computeNormals();
  }
  get heightData() {
    return this._heightData;
  }
  get greenData() {
    return this._greenList;
  }
}
class Xu extends jt {
  width;
  height;
  segmentW;
  segmentH;
  nodes;
  constructor(r, t, n = 1, a = 1, i) {
    super(), this.width = r, this.height = t, this.segmentW = n, this.segmentH = a, this.nodes = [], this.buildGrass(i);
  }
  buildGrass(r) {
    var t = this.segmentW + 1, n = t * (this.segmentH + 1);
    let a = n * r, i = new Float32Array(a * 3), s = new Float32Array(a * 3), u = new Float32Array(a * 2), o = new Float32Array(a * 4), l = new Float32Array(a), f = this.segmentW * this.segmentH * 2 * 3, p = new Uint32Array(f * r);
    var h = 0, c = 0, d = 0, m = 0, y = 0;
    let x = 0, F = 0;
    for (let O = 0; O < r; O++) {
      let P = new ta();
      this.nodes.push(P);
      let L = new xe(1 * Math.random() - 0.5, 0, 1 * Math.random() - 0.5), U = 0.5 * Math.random();
      for (var g = 0; g <= this.segmentH; ++g)
        for (var T = 0; T <= this.segmentW; ++T) {
          let G = g / this.segmentH, N = this.width * (T / this.segmentW);
          this.height * G, i[h++] = (N - this.width * 0.5) * (1 - G), i[h++] = 0, i[h++] = 0, s[c++] = 0, s[c++] = 0, s[c++] = 1, u[d++] = T / this.segmentW, u[d++] = 1 - g / this.segmentH, o[m++] = L.x, o[m++] = L.y, o[m++] = L.z, o[m++] = U, l[y++] = P.worldMatrix.index;
        }
      for (let G = 0; G < this.segmentH; G++)
        for (let N = 0; N < this.segmentW; N++) {
          let V = N + G * t + F, $ = V + 1, te = V, Z = V + t, _ = V + 1, W = V + t, X = V + t + 1;
          p[x++] = $, p[x++] = te, p[x++] = Z, p[x++] = _, p[x++] = W, p[x++] = X;
        }
      F += n;
    }
    this.setIndices(p), this.setAttribute(ue.position, i), this.setAttribute(ue.normal, s), this.setAttribute(ue.uv, u), this.setAttribute(ue.TEXCOORD_1, u), this.setAttribute(ue.vIndex, l), this.setAttribute(ue.weights0, o), this.addSubGeometry({
      indexStart: 0,
      indexCount: p.length,
      vertexStart: 0,
      index: 0,
      vertexCount: 0,
      firstStart: 0,
      topology: 0
    }), this.bounds = new $t(xe.ZERO, new xe(9999, 9999, 9999));
  }
}
let qu = (
  /* wgsl */
  `
    #include "WorldMatrixUniform"
    #include "GrassVertexAttributeShader"
    #include "GlobalUniform"
    #include "Inline_vert"
    #include "BRDF_frag"

    #include "Common_frag"
    #include "UnLit_frag"
    #include "MatrixShader"
    #include "BrdfLut_frag"
    #include "LightingFunction_frag"
    #include "ReflectionCG"
    
    struct MaterialUniform {
        baseColor: vec4<f32>,
        grassBottomColor: vec4<f32>,
        grassTopColor: vec4<f32>,
        materialF0: vec4<f32>,
        windBound: vec4<f32>,
        windDirection: vec2<f32>,
        windPower: f32,
        windSpeed: f32,
        translucent: f32,
        grassHeight: f32,
        curvature: f32,
        roughness: f32,
        soft: f32,
        specular: f32,
    };
      
    @group(2) @binding(0)
    var<uniform> materialUniform: MaterialUniform;

    @group(1) @binding(auto)
    var baseMapSampler: sampler;
    @group(1) @binding(auto)
    var baseMap: texture_2d<f32>;

    @group(1) @binding(auto)
    var windMapSampler: sampler;
    @group(1) @binding(auto)
    var windMap: texture_2d<f32>;

    const DEGREES_TO_RADIANS : f32 = 3.1415926 / 180.0 ;
    const PI : f32 = 3.1415926 ;
    const LUMEN = 10.764;

    @vertex
    fn VertMain( vertex:VertexAttributes ) -> VertexOutput {
        var vertexData = vertex ;
        vertex_inline(vertexData);
        vert(vertexData);
        return ORI_VertexOut ;
    }

    fn transformVertex(position:vec3<f32>,normal:vec3<f32>,vertex:VertexAttributes) -> TransformVertex {
        var transformVertex:TransformVertex;
        let windDirection = normalize( vec3<f32>(materialUniform.windDirection.x,0.0,materialUniform.windDirection.y)) ;
        let windPower = materialUniform.windPower ;
        let localMatrix = models.matrix[i32(vertex.vIndex)]  ;
        let grassPivot = localMatrix[3].xyz ;
        let bound = materialUniform.windBound ;

        let time = TIME_time() * 0.001 ;
        let cycleTime = sin(time) ;

        //sampler wind noise texture by vertex shader 
        let size = textureDimensions(windMap);
        let cyclePos = ( abs(grassPivot.xz + windDirection.xz * time * 100.0 * materialUniform.windSpeed ) % vec2<f32>(size) ) ;
        var windNoise = textureLoad(windMap,vec2<i32>( cyclePos ),0);
    
        // weights0 x,y,z is grass blend dir , w is curvature random 
        let weights = vertex.weights0 ;
        var speed = windDirection.xz * ( windNoise.rg ) ; 
     
        var roat = localMatrix ;
        roat[3].x = 0.0 ;
        roat[3].y = 0.0 ;
        roat[3].z = 0.0 ;
        var finalMatrix:mat4x4<f32> = buildMatrix4x4() ;
        var uv = vertex.uv ;
        let weight = ( 1.0 - uv.y )  ;
        let limitAngle = 90.0 / 8.0 * DEGREES_TO_RADIANS + PI * 0.35 ;
        // if(uv.y < 1.0 ){
            for (var index:i32 = 1; index <= 5 ; index+=1) {
                let bios = f32(index) / 5.0 ;
                if(weight >= bios){
                    let rx = weights.x * weights.w + clamp(speed.y * windPower * pow(weight,materialUniform.curvature),-1.0,1.0)  ;
                    let rz = weights.z * weights.w + clamp(-speed.x * windPower * pow(weight,materialUniform.curvature),-1.0,1.0) ;

                    var rot = buildRotateXYZMat4(rx,0.0,rz,0.0,materialUniform.grassHeight*bios*0.1,0.0);
                    finalMatrix *= rot ;
                }
            }
        // }

        finalMatrix *= roat;
        //create grass pivot matrix 
        var translate = bulidTranslateMat4(grassPivot.x,grassPivot.y,grassPivot.z);
        transformVertex.position = ( translate * finalMatrix * vec4<f32>(position,1.0)).xyz;

        //generate vertex normal
        //build vertex normal matrix 
        let nMat = mat3x3<f32>(finalMatrix[0].xyz,finalMatrix[1].xyz,finalMatrix[2].xyz) ;
        ORI_NORMALMATRIX = transpose(inverse( nMat ));
        transformVertex.normal = ORI_NORMALMATRIX * normal;

        return transformVertex ;
    }

    fn vert(inputData:VertexAttributes) -> VertexOutput {
        let input = inputData ;
        ORI_Vert(input) ;
        return ORI_VertexOut ;
    }

    fn frag(){

        var normal = ORI_VertexVarying.vWorldNormal ;
        if(!ORI_VertexVarying.face){
            normal = -normal ;
        }
        normal = normalize(normal);

        useShadow();
         
        var uv = ORI_VertexVarying.fragUV0 ; 

        let color = textureSampleLevel(baseMap,baseMapSampler,uv,0.0) ;

        let discardValue = 0.25 ;

        if(color.w < 0.3){
            discard ;
        }

        //generate view directtion
        let viewDir = normalize(globalUniform.CameraPos.xyz - ORI_VertexVarying.vWorldPos.xyz) ;

        //get main light at first lightBuffer
        let sunLight = lightBuffer[0] ;
        let sunDir = sunLight.direction.xyz ;
        // let H = normalize(viewDir.xyz + sunDir); 
        let R = 2.0 * dot( viewDir , normal ) * normal - viewDir ; 
        // let NoH = max(dot(normal,H),0.0);
        let reflectDir = reflect(sunDir, normal);  
        let NoV = max(dot(normal,viewDir),0.0);

        var mainLightColor:vec3<f32> = sunLight.intensity / LUMEN * sunLight.lightColor.rgb ;
        let att = clamp(dot(-sunDir,normal) * 0.5 + 0.5 ,0.0,1.0) ;// + materialUniform.translucent ;

        let grassColor = mix(materialUniform.grassBottomColor,materialUniform.grassTopColor * att * vec4<f32>(mainLightColor,1.0) , 1.0 - uv.y );

        var roughness = materialUniform.roughness ;
        let MAX_REFLECTION_LOD  = f32(textureNumLevels(prefilterMap)) ;
        var irradiance = LinearToGammaSpace(globalUniform.skyExposure * textureSampleLevel(prefilterMap, prefilterMapSampler, fragData.N.xyz, 0.8 * (MAX_REFLECTION_LOD) ).rgb);
        let specular = vec3<f32>( pow(max(dot(viewDir, reflectDir), 0.0), (1.0 - roughness + 0.001) * 200.0 ) ) * mainLightColor * materialUniform.specular;

        var diffuse = color.rgb / PI * grassColor.rgb * directShadowVisibility[0] ;
        var finalColor = diffuse + specular + irradiance * grassColor.rgb * sunLight.quadratic;//+ backColor;

        ORI_ShadingInput.BaseColor = vec4<f32>(finalColor.rgb,1.0) ;
        UnLit();
    }

 
`
), Zu = (
  /*wgsl*/
  `
    #include "WorldMatrixUniform"
    struct VertexAttributes{
        @builtin(instance_index) index : u32,

        @location(auto) position: vec3<f32>,
        @location(auto) normal: vec3<f32>,
        @location(auto) uv: vec2<f32>,
        @location(auto) TEXCOORD_1: vec2<f32>,
        @location(auto) vIndex: f32,
        @location(auto) weights0: vec4<f32>, 
    }

    struct VertexOutput {
        @location(auto) index: f32,
        @location(auto) varying_UV0: vec2<f32>,
        @location(auto) varying_UV1: vec2<f32>,
        @location(auto) varying_ViewPos: vec4<f32>,
        @location(auto) varying_Clip: vec4<f32>,
        @location(auto) varying_WPos: vec4<f32>,
        @location(auto) varying_WNormal: vec3<f32>,
        @location(auto) varying_Color: vec4<f32>,
        #if USE_SHADOWMAPING
            @location(auto) varying_ShadowPos: vec4<f32>,
        #endif
        @builtin(position) member: vec4<f32>
    };

    struct TransformVertex{
        position:vec3<f32>,
        normal:vec3<f32>,
    }

    var<private> ORI_VertexOut: VertexOutput ;
    var<private> worldMatrix: mat4x4<f32> ;

    fn ORI_Vert(vertex:VertexAttributes){
        var vertexPosition = vertex.position;
        var vertexNormal = vec3<f32>(0.0,0.0,-1.0);

        #if USE_TANGENT
            ORI_VertexOut.varying_Tangent = vertex.TANGENT ;
        #endif

        worldMatrix = ORI_MATRIX_M ;

        let nMat = mat3x3<f32>(ORI_MATRIX_M[0].xyz,ORI_MATRIX_M[1].xyz,ORI_MATRIX_M[2].xyz) ;
        ORI_NORMALMATRIX = transpose(inverse( nMat ));

        var worldPos = (ORI_MATRIX_M * vec4<f32>(vertexPosition.xyz, 1.0));

        #if TRANSFORMVERTEX
            var transformVertex = transformVertex(worldPos.xyz,vertexNormal,vertex);
            worldPos = vec4<f32>(transformVertex.position ,worldPos.w);
            vertexNormal = transformVertex.normal ;
        #endif

        var viewPosition = ORI_MATRIX_V * worldPos;
        var clipPosition = ORI_MATRIX_P * viewPosition ;


        ORI_VertexOut.varying_UV0 = vertex.uv.xy ;
        ORI_VertexOut.varying_UV1 = vertex.TEXCOORD_1.xy;
        ORI_VertexOut.varying_ViewPos = viewPosition / viewPosition.w;
        ORI_VertexOut.varying_Clip = clipPosition;
        ORI_VertexOut.varying_WPos = worldPos;
        ORI_VertexOut.varying_WNormal = normalize( vertexNormal.xyz);
        ORI_VertexOut.member = clipPosition ;
    }
`
), Yu = (
  /* wgsl */
  `
    #include "WorldMatrixUniform"
    #include "GrassVertexAttributeShader"
    #include "FragmentVarying"
    #include "GlobalUniform"
    #include "Inline_vert"
    #include "MatrixShader"
    
    struct MaterialUniform {
        baseColor: vec4<f32>,
        grassBottomColor: vec4<f32>,
        grassTopColor: vec4<f32>,
        windBound: vec4<f32>,
        windDirection: vec2<f32>,
        windPower: f32,
        windSpeed: f32,
        translucent: f32,
        grassHeight: f32,
        curvature: f32,
        roughness: f32,
        soft: f32,
        specular: f32,
    };
      
    @group(2) @binding(0)
    var<uniform> materialUniform: MaterialUniform;

    @group(1) @binding(auto)
    var baseMapSampler: sampler;
    @group(1) @binding(auto)
    var baseMap: texture_2d<f32>;

    @group(1) @binding(auto)
    var windMapSampler: sampler;
    @group(1) @binding(auto)
    var windMap: texture_2d<f32>;

    const DEGREES_TO_RADIANS : f32 = 3.1415926 / 180.0 ;
    const PI : f32 = 3.1415926 ;

    @vertex
    fn VertMain( vertex:VertexAttributes ) -> VertexOutput {
        var vertexData = vertex ;
        vertex_inline(vertexData);
        vert(vertexData);
        return ORI_VertexOut ;
    }

    fn transformVertex(position:vec3<f32>,normal:vec3<f32>,vertex:VertexAttributes) -> TransformVertex {
        var transformVertex:TransformVertex;
        let windDirection = normalize( vec3<f32>(materialUniform.windDirection.x,0.0,materialUniform.windDirection.y)) ;
        let windPower = materialUniform.windPower ;
        let localMatrix = models.matrix[i32(vertex.vIndex)]  ;
        let grassPivot = localMatrix[3].xyz ;
        let bound = materialUniform.windBound ;

        let time = TIME_time() * 0.001 ;
        let cycleTime = sin(time) ;

        //sampler wind noise texture by vertex shader 
        let size = textureDimensions(windMap);
        let cyclePos = ( abs(grassPivot.xz + windDirection.xz * time * 100.0 * materialUniform.windSpeed ) % vec2<f32>(size) ) ;
        var windNoise = textureLoad(windMap,vec2<i32>( cyclePos ),0);
    
        // weights0 x,y,z is grass blend dir , w is curvature random 
        let weights = vertex.weights0 ;
        var speed = windDirection.xz * ( windNoise.rg ) ; 
     
        var roat = localMatrix ;
        roat[3].x = 0.0 ;
        roat[3].y = 0.0 ;
        roat[3].z = 0.0 ;
        var finalMatrix:mat4x4<f32> = buildMatrix4x4() ;
        var uv = vertex.uv ;
        let weight = ( 1.0 - uv.y )  ;
        let limitAngle = 90.0 / 8.0 * DEGREES_TO_RADIANS + PI * 0.35 ;
        // if(uv.y < 1.0 ){
            for (var index:i32 = 1; index <= 5 ; index+=1) {
                let bios = f32(index) / 5.0 ;
                if(weight >= bios){
                    let rx = weights.x * weights.w + clamp(speed.y * windPower * pow(weight,materialUniform.curvature),-1.0,1.0)  ;
                    let rz = weights.z * weights.w + clamp(-speed.x * windPower * pow(weight,materialUniform.curvature),-1.0,1.0) ;

                    var rot = buildRotateXYZMat4(rx,0.0,rz,0.0,materialUniform.grassHeight*bios*0.1,0.0);
                    finalMatrix *= rot ;
                }
            }
        // }

        finalMatrix *= roat;
        //create grass pivot matrix 
        var translate = bulidTranslateMat4(grassPivot.x,grassPivot.y,grassPivot.z);
        transformVertex.position = ( translate * finalMatrix * vec4<f32>(position,1.0)).xyz;

        //generate vertex normal
        //build vertex normal matrix 
        let nMat = mat3x3<f32>(finalMatrix[0].xyz,finalMatrix[1].xyz,finalMatrix[2].xyz) ;
        ORI_NORMALMATRIX = transpose(inverse( nMat ));
        transformVertex.normal = ORI_NORMALMATRIX * normal;

        return transformVertex ;
    }

    fn vert(inputData:VertexAttributes) -> VertexOutput {
        let input = inputData ;
        ORI_Vert(input) ;
        return ORI_VertexOut ;
    }
`
);
class Qu extends na {
  constructor() {
    super();
    let r = new aa();
    Fr.register("GrassVertexAttributeShader", Zu), Fr.register("GrassShader", qu);
    let t = new nt("GrassShader", "GrassShader");
    t.passType = at.COLOR, t.setShaderEntry("VertMain", "FragMain"), t.setDefine("TRANSFORMVERTEX", !0);
    let n = t.shaderState;
    n.acceptShadow = !0, n.receiveEnv = !0, n.acceptGI = !1, n.useLight = !0, n.castShadow = !1, n.blendMode = it.NONE, r.addRenderPass(t), Fr.register("GrassCastShadowShader", Yu);
    let a = new nt("GrassCastShadowShader", "GrassCastShadowShader");
    a.passType = at.SHADOW, a.setDefine("USE_ALPHACUT", !0), a.setDefine("TRANSFORMVERTEX", !0), a.setShaderEntry("VertMain"), a.shaderState.blendMode = it.NONE, a.shaderState.receiveEnv = !1, r.addRenderPass(a), t.setUniformColor("baseColor", new Se(0, 1, 0, 1)), t.setUniformColor("grassBottomColor", new Se(3 / 255, 16 / 255, 3 / 255)), t.setUniformColor("grassTopColor", new Se(45 / 255, 154 / 255, 74 / 255, 1)), t.setUniformColor("materialF0", new Se(0.04, 0.04, 0.04, 1 - 0.04)), t.setUniformVector4("windBound", new st(0, 0, 2e3, 2e3)), t.setUniformVector2("windDirection", new z(0.6, 0.8)), t.setUniformFloat("windPower", 0.8), t.setUniformFloat("windSpeed", 1.2), t.setUniformFloat("translucent", 0.35), t.setUniformFloat("roughness", 0.35), t.setUniformFloat("curvature", 0.4068), t.setUniformFloat("grassHeight", 1), t.setUniformFloat("soft", 5), t.setUniformFloat("specular", 0.15), a.setUniformColor("baseColor", new Se(0, 1, 0, 1)), a.setUniformColor("grassBottomColor", new Se(39 / 255, 87 / 255, 36 / 255)), a.setUniformColor("grassTopColor", new Se(74 / 255, 163 / 255, 93 / 255, 1)), a.setUniformColor("materialF0", new Se(0.04, 0.04, 0.04, 1 - 0.04)), a.setUniformVector4("windBound", new st(0, 0, 2e3, 2e3)), a.setUniformVector2("windDirection", new z(0.6, 0.8)), a.setUniformFloat("windPower", 0.8), a.setUniformFloat("windSpeed", 1), a.setUniformFloat("translucent", 0.35), a.setUniformFloat("roughness", 0.35), a.setUniformFloat("curvature", 0.4068), a.setUniformFloat("grassHeight", 1), a.setUniformFloat("soft", 5), a.setUniformFloat("specular", 0.15), t.doubleSide = !0, a.doubleSide = !0, this.shader = r;
  }
  set baseMap(r) {
    this.shader.setTexture("baseMap", r);
  }
  get baseMap() {
    return this.shader.getTexture("baseMap");
  }
  set windMap(r) {
    r.addressModeU = ot.repeat, r.addressModeV = ot.repeat, this.shader.setTexture("windMap", r);
  }
  set windBound(r) {
    this.shader.setUniformVector4("windBound", r);
  }
  get windBound() {
    return this.shader.getUniformVector4("windBound");
  }
  set grassBaseColor(r) {
    this.shader.setUniformColor("grassBottomColor", r);
  }
  get grassBaseColor() {
    return this.shader.getUniformColor("grassBottomColor");
  }
  set grassTopColor(r) {
    this.shader.setUniformColor("grassTopColor", r);
  }
  get grassTopColor() {
    return this.shader.getUniformColor("grassTopColor");
  }
  set windDirection(r) {
    this.shader.setUniformVector2("windDirection", r);
  }
  get windDirection() {
    return this.shader.getUniformVector2("windDirection");
  }
  set windPower(r) {
    this.shader.setUniformFloat("windPower", r);
  }
  get windPower() {
    return this.shader.getUniformFloat("windPower");
  }
  set windSpeed(r) {
    this.shader.setUniformFloat("windSpeed", r);
  }
  get windSpeed() {
    return this.shader.getUniformFloat("windSpeed");
  }
  set grassHeight(r) {
    this.shader.setUniformFloat("grassHeight", r);
  }
  get grassHeight() {
    return this.shader.getUniformFloat("grassHeight");
  }
  set curvature(r) {
    this.shader.setUniformFloat("curvature", r);
  }
  get curvature() {
    return this.shader.getUniformFloat("curvature");
  }
  set roughness(r) {
    this.shader.setUniformFloat("roughness", r);
  }
  get roughness() {
    return this.shader.getUniformFloat("roughness");
  }
  set translucent(r) {
    this.shader.setUniformFloat("translucent", r);
  }
  get translucent() {
    return this.shader.getUniformFloat("translucent");
  }
  set soft(r) {
    this.shader.setUniformFloat("soft", r);
  }
  get soft() {
    return this.shader.getUniformFloat("soft");
  }
  set specular(r) {
    this.shader.setUniformFloat("specular", r);
  }
  get specular() {
    return this.shader.getUniformFloat("specular");
  }
}
class el extends ia {
  grassMaterial;
  grassGeometry;
  constructor() {
    super(), this.grassMaterial = new Qu(), this.alwaysRender = !0;
  }
  init(r) {
    super.init();
  }
  setGrass(r, t, n, a, i = 1e3) {
    this.grassGeometry = this.geometry = new Xu(r, t, 1, n, i), this.material = this.grassMaterial, this.grassMaterial.grassHeight = t;
  }
  setWindNoiseTexture(r) {
    this.grassMaterial.windMap = r;
  }
  setMinMax(r, t) {
    this.grassGeometry.bounds = new $t(new xe(), new xe(1, 1, 1)), this.grassGeometry.bounds.setFromMinMax(r, t);
  }
  setGrassTexture(r) {
    this.grassMaterial.baseMap = r;
  }
  get nodes() {
    return this.grassGeometry.nodes;
  }
}
export {
  oa as CubicBezierCurve2D,
  Xr as Curve2D,
  Be as CurveType,
  Ua as ExtrudeGeometry,
  Ju as FontParser,
  el as GrassComponent,
  Xu as GrassGeometry,
  Qu as GrassMaterial,
  sa as LineCurve2D,
  Ca as Path2D,
  ua as QuadraticBezierCurve2D,
  pt as Shape2D,
  Ge as ShapeUtils,
  $u as TerrainGeometry,
  ju as TextGeometry
};
