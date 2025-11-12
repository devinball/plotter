import { plots } from './scene';
import { IntensityColor, getGridMaterial, getColorMaterial, flipCoords, Arrow3D, Line3D } from './utils'
import * as THREE from 'three';

export function VectorField3D(f, x0 = -5, x1 = 5, y0 = -5, y1 = 5, z0 = -5, z1 = 5) {
    const group = new THREE.Group();

    let open = [];
    let maxMag = 0

    for (let x = x0; x <= x1; x++) {
        for (let y = z0; y <= z1; y++) {
            for (let z = y0; z <= y1; z++) {
                const origin = new THREE.Vector3(x, y, z);
                const dir = new THREE.Vector3(...flipCoords(...f(x, z, y)));
                const magnitude = dir.length();

                if (magnitude > maxMag && magnitude != Infinity  && magnitude != NaN) {
                    maxMag = magnitude;
                }

                open.push({
                    origin: origin,
                    dir: dir,
                    magnitude, magnitude
                });
            }
        }
    }

    console.log(maxMag)

    open.forEach((e) => {
        if (e.magnitude !== 0) {
            group.add(Arrow3D(e.dir, e.origin, 0.75, IntensityColor(e.magnitude / maxMag, 0, 1), 0.01, 0.15, 0.075));
        }
    });

    


    plots.add(group);
}

export function ParametricLine3D(f, t0, t1) {
    const step = 0.05;
    const points = [];

    for (let t = t0; t <= t1; t += step) {
        points.push(new THREE.Vector3(...flipCoords(...f(t))));
    }

    const group = new THREE.Group();
    const line = Line3D(points, 0.05, 0xfc7b25, 8);
    group.add(line);
    plots.add(group);
}

export function Surface3D(f, x0 = -10, x1 = 10, y0 = -10, y1 = 10, resolution = 100) {
    const xStep = (x1 - x0) / resolution;
    const zStep = (y1 - y0) / resolution;

    const vertices = [];
    const uvs = [];

    for (let i = 0; i <= resolution; i++) {
        const x = x0 + i * xStep;
        const u = i / resolution;

        for (let j = 0; j <= resolution; j++) {
            const z = y0 + j * zStep;
            const v = j / resolution;
            vertices.push(x, f(x, z), z);
            uvs.push(u, v);
        }
    }

    const group = new THREE.Group();

    group.clear();

    const indices = [];
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            const a = i * (resolution + 1) + j;
            const b = a + resolution + 1;
            const c = a + 1;
            const d = b + 1;

            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, getGridMaterial((x1 - x0) / 2, (y1 - y0) / 2));
    group.add(mesh);

    plots.add(group);
}

export function ParametricSurface3D(f, u0 = 0, u1 = 10, v0 = 0, v1 = 10, resolution = 100) {
    const xStep = (u1 - u0) / resolution;
    const zStep = (v1 - v0) / resolution;

    const vertices = [];
    const uvs = [];

    for (let i = 0; i <= resolution; i++) {
        const x = u0 + i * xStep;
        const u = i / resolution;

        for (let j = 0; j <= resolution; j++) {
            const z = v0 + j * zStep;
            const v = j / resolution;

            vertices.push(...flipCoords(...f(x, z)));
            uvs.push(u, v);
        }
    }

    const group = new THREE.Group();

    group.clear();

    const indices = [];
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            const a = i * (resolution + 1) + j;
            const b = a + resolution + 1;
            const c = a + 1;
            const d = b + 1;

            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, getGridMaterial((u1 - u0) / 2, (v1 - v0) / 2));
    group.add(mesh);

    plots.add(group)
}

export function Point3D(f) {
    const newPos = flipCoords(...f());

    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(0.2, 32, 16);
    const sphere = new THREE.Mesh(geometry, getColorMaterial(0x007fff));
    sphere.position.set(...newPos);
    group.add(sphere);
    plots.add(group)
}

export function Vector3D(root, dir) {
    
}

// I need to be able to use () and not just []
// sometimes when resuing the same instance, things break

