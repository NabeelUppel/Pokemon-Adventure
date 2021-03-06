import {
    Quaternion as t,
    Box as e,
    Vec3 as n,
    ConvexPolyhedron as i,
    Cylinder as r,
    Sphere as o,
    Trimesh as s
} from '../../resources/cannon-es/dist/cannon-es.js' ;
import {
    Vector3 as a,
    BufferGeometry as u,
    Line3 as h,
    Plane as c,
    Triangle as l,
    Quaternion as p,
    BufferAttribute as f,
    MathUtils as d,
    Box3 as m,
    Mesh as g
} from '../../resources/threejs/r128/build/three.module.js';

var x = function () {
    var t, e, n, i, r = new a;

    function o() {
        this.tolerance = -1, this.faces = [], this.newFaces = [], this.assigned = new d, this.unassigned = new d, this.vertices = []
    }

    function s() {
        this.normal = new a, this.midpoint = new a, this.area = 0, this.constant = 0, this.outside = null, this.mark = 0, this.edge = null
    }

    function p(t, e) {
        this.vertex = t, this.prev = null, this.next = null, this.twin = null, this.face = e
    }

    function f(t) {
        this.point = t, this.prev = null, this.next = null, this.face = null
    }

    function d() {
        this.head = null, this.tail = null
    }

    return Object.assign(o.prototype, {
        setFromPoints: function (t) {
            !0 !== Array.isArray(t) && console.error("THREE.ConvexHull: Points parameter is not an array."), t.length < 4 && console.error("THREE.ConvexHull: The algorithm needs at least four points."), this.makeEmpty();
            for (var e = 0, n = t.length; e < n; e++) this.vertices.push(new f(t[e]));
            return this.compute(), this
        }, setFromObject: function (t) {
            var e = [];
            return t.updateMatrixWorld(!0), t.traverse(function (t) {
                var n, i, r, o = t.geometry;
                if (void 0 !== o && (o.isGeometry && (o = o.toBufferGeometry ? o.toBufferGeometry() : (new u).fromGeometry(o)), o.isBufferGeometry)) {
                    var s = o.attributes.position;
                    if (void 0 !== s) for (n = 0, i = s.count; n < i; n++) (r = new a).fromBufferAttribute(s, n).applyMatrix4(t.matrixWorld), e.push(r)
                }
            }), this.setFromPoints(e)
        }, containsPoint: function (t) {
            for (var e = this.faces, n = 0, i = e.length; n < i; n++) if (e[n].distanceToPoint(t) > this.tolerance) return !1;
            return !0
        }, intersectRay: function (t, e) {
            for (var n = this.faces, i = -Infinity, r = Infinity, o = 0, s = n.length; o < s; o++) {
                var a = n[o], u = a.distanceToPoint(t.origin), h = a.normal.dot(t.direction);
                if (u > 0 && h >= 0) return null;
                var c = 0 !== h ? -u / h : 0;
                if (!(c <= 0) && (h > 0 ? r = Math.min(c, r) : i = Math.max(c, i), i > r)) return null
            }
            return t.at(-Infinity !== i ? i : r, e), e
        }, intersectsRay: function (t) {
            return null !== this.intersectRay(t, r)
        }, makeEmpty: function () {
            return this.faces = [], this.vertices = [], this
        }, addVertexToFace: function (t, e) {
            return t.face = e, null === e.outside ? this.assigned.append(t) : this.assigned.insertBefore(e.outside, t), e.outside = t, this
        }, removeVertexFromFace: function (t, e) {
            return t === e.outside && (e.outside = null !== t.next && t.next.face === e ? t.next : null), this.assigned.remove(t), this
        }, removeAllVerticesFromFace: function (t) {
            if (null !== t.outside) {
                for (var e = t.outside, n = t.outside; null !== n.next && n.next.face === t;) n = n.next;
                return this.assigned.removeSubList(e, n), e.prev = n.next = null, t.outside = null, e
            }
        }, deleteFaceVertices: function (t, e) {
            var n = this.removeAllVerticesFromFace(t);
            if (void 0 !== n) if (void 0 === e) this.unassigned.appendChain(n); else {
                var i = n;
                do {
                    var r = i.next;
                    e.distanceToPoint(i.point) > this.tolerance ? this.addVertexToFace(i, e) : this.unassigned.append(i), i = r
                } while (null !== i)
            }
            return this
        }, resolveUnassignedPoints: function (t) {
            if (!1 === this.unassigned.isEmpty()) {
                var e = this.unassigned.first();
                do {
                    for (var n = e.next, i = this.tolerance, r = null, o = 0; o < t.length; o++) {
                        var s = t[o];
                        if (0 === s.mark) {
                            var a = s.distanceToPoint(e.point);
                            if (a > i && (i = a, r = s), i > 1e3 * this.tolerance) break
                        }
                    }
                    null !== r && this.addVertexToFace(e, r), e = n
                } while (null !== e)
            }
            return this
        }, computeExtremes: function () {
            var t, e, n, i = new a, r = new a, o = [], s = [];
            for (t = 0; t < 3; t++) o[t] = s[t] = this.vertices[0];
            for (i.copy(this.vertices[0].point), r.copy(this.vertices[0].point), t = 0, e = this.vertices.length; t < e; t++) {
                var u = this.vertices[t], h = u.point;
                for (n = 0; n < 3; n++) h.getComponent(n) < i.getComponent(n) && (i.setComponent(n, h.getComponent(n)), o[n] = u);
                for (n = 0; n < 3; n++) h.getComponent(n) > r.getComponent(n) && (r.setComponent(n, h.getComponent(n)), s[n] = u)
            }
            return this.tolerance = 3 * Number.EPSILON * (Math.max(Math.abs(i.x), Math.abs(r.x)) + Math.max(Math.abs(i.y), Math.abs(r.y)) + Math.max(Math.abs(i.z), Math.abs(r.z))), {
                min: o,
                max: s
            }
        }, computeInitialHull: function () {
            void 0 === t && (t = new h, e = new c, n = new a);
            var i, r, o, u, l, p, f, d, m, g = this.vertices, x = this.computeExtremes(), v = x.min, w = x.max, y = 0,
                b = 0;
            for (p = 0; p < 3; p++) (m = w[p].point.getComponent(p) - v[p].point.getComponent(p)) > y && (y = m, b = p);
            for (y = 0, t.set((r = v[b]).point, (o = w[b]).point), p = 0, f = this.vertices.length; p < f; p++) (i = g[p]) !== r && i !== o && (t.closestPointToPoint(i.point, !0, n), (m = n.distanceToSquared(i.point)) > y && (y = m, u = i));
            for (y = -1, e.setFromCoplanarPoints(r.point, o.point, u.point), p = 0, f = this.vertices.length; p < f; p++) (i = g[p]) !== r && i !== o && i !== u && (m = Math.abs(e.distanceToPoint(i.point))) > y && (y = m, l = i);
            var T = [];
            if (e.distanceToPoint(l.point) < 0) for (T.push(s.create(r, o, u), s.create(l, o, r), s.create(l, u, o), s.create(l, r, u)), p = 0; p < 3; p++) d = (p + 1) % 3, T[p + 1].getEdge(2).setTwin(T[0].getEdge(d)), T[p + 1].getEdge(1).setTwin(T[d + 1].getEdge(0)); else for (T.push(s.create(r, u, o), s.create(l, r, o), s.create(l, o, u), s.create(l, u, r)), p = 0; p < 3; p++) d = (p + 1) % 3, T[p + 1].getEdge(2).setTwin(T[0].getEdge((3 - p) % 3)), T[p + 1].getEdge(0).setTwin(T[d + 1].getEdge(1));
            for (p = 0; p < 4; p++) this.faces.push(T[p]);
            for (p = 0, f = g.length; p < f; p++) if ((i = g[p]) !== r && i !== o && i !== u && i !== l) {
                y = this.tolerance;
                var F = null;
                for (d = 0; d < 4; d++) (m = this.faces[d].distanceToPoint(i.point)) > y && (y = m, F = this.faces[d]);
                null !== F && this.addVertexToFace(i, F)
            }
            return this
        }, reindexFaces: function () {
            for (var t = [], e = 0; e < this.faces.length; e++) {
                var n = this.faces[e];
                0 === n.mark && t.push(n)
            }
            return this.faces = t, this
        }, nextVertexToAdd: function () {
            if (!1 === this.assigned.isEmpty()) {
                var t, e = 0, n = this.assigned.first().face, i = n.outside;
                do {
                    var r = n.distanceToPoint(i.point);
                    r > e && (e = r, t = i), i = i.next
                } while (null !== i && i.face === n);
                return t
            }
        }, computeHorizon: function (t, e, n, i) {
            var r;
            this.deleteFaceVertices(n), n.mark = 1, r = null === e ? e = n.getEdge(0) : e.next;
            do {
                var o = r.twin, s = o.face;
                0 === s.mark && (s.distanceToPoint(t) > this.tolerance ? this.computeHorizon(t, o, s, i) : i.push(r)), r = r.next
            } while (r !== e);
            return this
        }, addAdjoiningFace: function (t, e) {
            var n = s.create(t, e.tail(), e.head());
            return this.faces.push(n), n.getEdge(-1).setTwin(e.twin), n.getEdge(0)
        }, addNewFaces: function (t, e) {
            this.newFaces = [];
            for (var n = null, i = null, r = 0; r < e.length; r++) {
                var o = this.addAdjoiningFace(t, e[r]);
                null === n ? n = o : o.next.setTwin(i), this.newFaces.push(o.face), i = o
            }
            return n.next.setTwin(i), this
        }, addVertexToHull: function (t) {
            var e = [];
            return this.unassigned.clear(), this.removeVertexFromFace(t, t.face), this.computeHorizon(t.point, null, t.face, e), this.addNewFaces(t, e), this.resolveUnassignedPoints(this.newFaces), this
        }, cleanup: function () {
            return this.assigned.clear(), this.unassigned.clear(), this.newFaces = [], this
        }, compute: function () {
            var t;
            for (this.computeInitialHull(); void 0 !== (t = this.nextVertexToAdd());) this.addVertexToHull(t);
            return this.reindexFaces(), this.cleanup(), this
        }
    }), Object.assign(s, {
        create: function (t, e, n) {
            var i = new s, r = new p(t, i), o = new p(e, i), a = new p(n, i);
            return r.next = a.prev = o, o.next = r.prev = a, a.next = o.prev = r, i.edge = r, i.compute()
        }
    }), Object.assign(s.prototype, {
        getEdge: function (t) {
            for (var e = this.edge; t > 0;) e = e.next, t--;
            for (; t < 0;) e = e.prev, t++;
            return e
        }, compute: function () {
            void 0 === i && (i = new l);
            var t = this.edge.tail(), e = this.edge.head(), n = this.edge.next.head();
            return i.set(t.point, e.point, n.point), i.getNormal(this.normal), i.getMidpoint(this.midpoint), this.area = i.getArea(), this.constant = this.normal.dot(this.midpoint), this
        }, distanceToPoint: function (t) {
            return this.normal.dot(t) - this.constant
        }
    }), Object.assign(p.prototype, {
        head: function () {
            return this.vertex
        }, tail: function () {
            return this.prev ? this.prev.vertex : null
        }, length: function () {
            var t = this.head(), e = this.tail();
            return null !== e ? e.point.distanceTo(t.point) : -1
        }, lengthSquared: function () {
            var t = this.head(), e = this.tail();
            return null !== e ? e.point.distanceToSquared(t.point) : -1
        }, setTwin: function (t) {
            return this.twin = t, t.twin = this, this
        }
    }), Object.assign(d.prototype, {
        first: function () {
            return this.head
        }, last: function () {
            return this.tail
        }, clear: function () {
            return this.head = this.tail = null, this
        }, insertBefore: function (t, e) {
            return e.prev = t.prev, e.next = t, null === e.prev ? this.head = e : e.prev.next = e, t.prev = e, this
        }, insertAfter: function (t, e) {
            return e.prev = t, e.next = t.next, null === e.next ? this.tail = e : e.next.prev = e, t.next = e, this
        }, append: function (t) {
            return null === this.head ? this.head = t : this.tail.next = t, t.prev = this.tail, t.next = null, this.tail = t, this
        }, appendChain: function (t) {
            for (null === this.head ? this.head = t : this.tail.next = t, t.prev = this.tail; null !== t.next;) t = t.next;
            return this.tail = t, this
        }, remove: function (t) {
            return null === t.prev ? this.head = t.next : t.prev.next = t.next, null === t.next ? this.tail = t.prev : t.next.prev = t.prev, this
        }, removeSubList: function (t, e) {
            return null === t.prev ? this.head = e.next : t.prev.next = e.next, null === e.next ? this.tail = t.prev : e.next.prev = t.prev, this
        }, isEmpty: function () {
            return null === this.head
        }
    }), o
}();
const v = new a, w = new a, y = new p;

function b(t) {
    const e = function (t) {
        const e = [];
        return t.traverse(function (t) {
            t.isMesh && e.push(t)
        }), e
    }(t);
    if (0 === e.length) return null;
    if (1 === e.length) return T(e[0]);
    let n;
    const i = [];
    for (; n = e.pop();) i.push(B(T(n)));
    return function (t) {
        let e = 0;
        for (let n = 0; n < t.length; n++) {
            const i = t[n].attributes.position;
            i && 3 === i.itemSize && (e += i.count)
        }
        const n = new Float32Array(3 * e);
        let i = 0;
        for (let e = 0; e < t.length; e++) {
            const r = t[e].attributes.position;
            if (r && 3 === r.itemSize) for (let t = 0; t < r.count; t++) n[i++] = r.getX(t), n[i++] = r.getY(t), n[i++] = r.getZ(t)
        }
        return (new u).setAttribute("position", new f(n, 3))
    }(i)
}

function T(t) {
    let e = t.geometry;
    return e = e.toBufferGeometry ? e.toBufferGeometry() : e.clone(), t.updateMatrixWorld(), t.matrixWorld.decompose(v, y, w), e.scale(w.x, w.y, w.z), e
}

function F(t) {
    const e = t.attributes.position, n = new Float32Array(3 * e.count);
    for (let t = 0; t < e.count; t += 3) n[t] = e.getX(t), n[t + 1] = e.getY(t), n[t + 2] = e.getZ(t);
    return n
}

function E(t, e) {
    switch (e) {
        case"x":
            return t.x;
        case"y":
            return t.y;
        case"z":
            return t.z
    }
    throw new Error(`Unexpected component ${e}`)
}

function B(t, e = 1e-4) {
    e = Math.max(e, Number.EPSILON);
    const n = {}, i = t.getIndex(), r = t.getAttribute("position"), o = i ? i.count : r.count;
    let s = 0;
    const a = [], h = [], c = Math.log10(1 / e), l = Math.pow(10, c);
    for (let t = 0; t < o; t++) {
        const e = i ? i.getX(t) : t;
        let o = "";
        o += ~~(r.getX(e) * l) + ",", o += ~~(r.getY(e) * l) + ",", o += ~~(r.getZ(e) * l) + ",", o in n ? a.push(n[o]) : (h.push(r.getX(e)), h.push(r.getY(e)), h.push(r.getZ(e)), n[o] = s, a.push(s), s++)
    }
    const p = new f(new Float32Array(h), r.itemSize, r.normalized), d = new u;
    return d.setAttribute("position", p), d.setIndex(a), d
}

const M = Math.PI / 2;
var P;
!function (t) {
    t.BOX = "Box", t.CYLINDER = "Cylinder", t.SPHERE = "Sphere", t.HULL = "ConvexPolyhedron", t.MESH = "Trimesh"
}(P || (P = {}));
const S = function (a, u = {}) {
    let h;
    if (u.type === P.BOX) return C(a);
    if (u.type === P.CYLINDER) return function (e, n) {
        const i = ["x", "y", "z"], o = n.cylinderAxis || "y", s = i.splice(i.indexOf(o), 1) && i,
            a = (new m).setFromObject(e);
        if (!isFinite(a.min.lengthSq())) return null;
        const u = a.max[o] - a.min[o],
            h = .5 * Math.max(E(a.max, s[0]) - E(a.min, s[0]), E(a.max, s[1]) - E(a.min, s[1])), c = new r(h, h, u, 12);
        c.radiusTop = h, c.radiusBottom = h, c.height = u, c.numSegments = 12;
        const l = "y" === o ? M : 0, p = "z" === o ? M : 0;
        return {shape: c, orientation: (new t).setFromEuler(l, p, 0, "XYZ").normalize()}
    }(a, u);
    if (u.type === P.SPHERE) return function (t, e) {
        if (e.sphereRadius) return {shape: new o(e.sphereRadius)};
        const n = b(t);
        return n ? (n.computeBoundingSphere(), {shape: new o(n.boundingSphere.radius)}) : null
    }(a, u);
    if (u.type === P.HULL) return function (t) {
        const e = b(t);
        if (!e) return null;
        const r = 1e-4;
        for (let t = 0; t < e.attributes.position.count; t++) e.attributes.position.setXYZ(t, e.attributes.position.getX(t) + (Math.random() - .5) * r, e.attributes.position.getY(t) + (Math.random() - .5) * r, e.attributes.position.getZ(t) + (Math.random() - .5) * r);
        const o = (new x).setFromObject(new g(e)).faces, s = [], a = [];
        for (let t = 0; t < o.length; t++) {
            const e = o[t], i = [];
            a.push(i);
            let r = e.edge;
            do {
                const t = r.head().point;
                s.push(new n(t.x, t.y, t.z)), i.push(s.length - 1), r = r.next
            } while (r !== e.edge)
        }
        return {shape: new i({vertices: s, faces: a})}
    }(a);
    if (u.type === P.MESH) return h = b(a), h ? function (t) {
        const e = F(t);
        if (!e.length) return null;
        const n = Object.keys(e).map(Number);
        return {shape: new s(e, n)}
    }(h) : null;
    if (u.type) throw new Error(`[CANNON.threeToCannon] Invalid type "${u.type}".`);
    if (h = b(a), !h) return null;
    switch (h.type) {
        case"BoxGeometry":
        case"BoxBufferGeometry":
            return z(h);
        case"CylinderGeometry":
        case"CylinderBufferGeometry":
            return function (e) {
                const n = e.parameters, i = new r(n.radiusTop, n.radiusBottom, n.height, n.radialSegments);
                return i.radiusTop = n.radiusTop, i.radiusBottom = n.radiusBottom, i.height = n.height, i.numSegments = n.radialSegments, {
                    shape: i,
                    orientation: (new t).setFromEuler(d.degToRad(-90), 0, 0, "XYZ").normalize()
                }
            }(h);
        case"PlaneGeometry":
        case"PlaneBufferGeometry":
            return function (t) {
                t.computeBoundingBox();
                const i = t.boundingBox;
                return {shape: new e(new n((i.max.x - i.min.x) / 2 || .1, (i.max.y - i.min.y) / 2 || .1, (i.max.z - i.min.z) / 2 || .1))}
            }(h);
        case"SphereGeometry":
        case"SphereBufferGeometry":
            return function (t) {
                return {shape: new o(t.parameters.radius)}
            }(h);
        case"TubeGeometry":
        case"BufferGeometry":
            return C(a);
        default:
            return console.warn('Unrecognized geometry: "%s". Using bounding box as shape.', h.type), z(h)
    }
};

function z(t) {
    if (!F(t).length) return null;
    t.computeBoundingBox();
    const i = t.boundingBox;
    return {shape: new e(new n((i.max.x - i.min.x) / 2, (i.max.y - i.min.y) / 2, (i.max.z - i.min.z) / 2))}
}

function C(t) {
    const i = t.clone();
    i.quaternion.set(0, 0, 0, 1), i.updateMatrixWorld();
    const r = (new m).setFromObject(i);
    if (!isFinite(r.min.lengthSq())) return null;
    const o = new e(new n((r.max.x - r.min.x) / 2, (r.max.y - r.min.y) / 2, (r.max.z - r.min.z) / 2)),
        s = r.translate(i.position.negate()).getCenter(new a);
    return {shape: o, offset: s.lengthSq() ? new n(s.x, s.y, s.z) : void 0}
}

export {P as ShapeType, S as threeToCannon};
//# sourceMappingURL=three-to-cannon.modern.js.map
