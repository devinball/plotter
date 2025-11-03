import { plots } from './scene';
import { IntensityColor, getGridMaterial, getColorMaterial, flipCoords, Arrow3D, Line3D } from './utils'
import * as THREE from 'three';

export function VectorField3D(f, group, scope, parameters, cachedGeometry) {
    if (!cachedGeometry) {
        cachedGeometry = {};
    }
    if (!cachedGeometry.vectorField) {
        cachedGeometry.vectorField = { arrows: [], boundsKey: null };
    }
    
    const cache = cachedGeometry.vectorField;
    const boundsKey = `${parameters.xMin},${parameters.xMax},${parameters.yMin},${parameters.yMax},${parameters.zMin},${parameters.zMax}`;
    
    // Rebuild arrows if bounds changed
    if (cache.boundsKey !== boundsKey) {
        group.clear();
        cache.arrows = [];
        
        for (let x = parameters.xMin; x <= parameters.xMax; x++) {
            for (let y = parameters.zMin; y <= parameters.zMax; y++) {
                for (let z = parameters.yMin; z <= parameters.yMax; z++) {
                    const origin = new THREE.Vector3(x, y, z);
                    const arrow = Arrow3D(
                        new THREE.Vector3(0, 1, 0),
                        origin, 
                        0.75, 
                        new THREE.Color(1, 0, 0),
                        0.01, 
                        0.15, 
                        0.075
                    );
                    
                    group.add(arrow);
                    cache.arrows.push({ arrow, x, y, z });
                }
            }
        }
        
        cache.boundsKey = boundsKey;
    }
    
    // Update directions and colors for all arrows
    const axis = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion();
    
    cache.arrows.forEach(({ arrow, x, y, z }) => {
        const dir = new THREE.Vector3(...f({x: x, y: y, z: z, ...scope}));
        const magnitude = dir.length();
        
        if (magnitude === 0) {
            arrow.visible = false;
        } else {
            arrow.visible = true;
            
            dir.normalize();
            quaternion.setFromUnitVectors(axis, dir);
            arrow.quaternion.copy(quaternion);
            
            const color = IntensityColor(magnitude / 0.0625, 0, 100);
            arrow.children.forEach(child => {
                if (child.material) {
                    child.material.color.set(color);
                }
            });
        }
    });
    
    return cachedGeometry;
}

export function ParametricLine3D(f, t0, t1) {
    const step = 0.01;
    const points = [];
    
    for (let t = t0; t <= t1; t += step) {
        points.push(new THREE.Vector3(...flipCoords(...f(t).valueOf())));
    }

    const group = new THREE.Group();
    group.clear();
    const line = Line3D(points, 0.025, new THREE.Color(255, 0, 0), 8);
    group.add(line);
    plots.add(group);
}

export function Surface3D(f, x0, x1, y0, y1, resolution = 40) {
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

    const mesh = new THREE.Mesh(geometry, getGridMaterial());
    group.add(mesh);

    plots.add(group);
}

export function ParametricSurface3D(f, group, scope, parameters, cachedGeometry) {
    if (!cachedGeometry) {
        cachedGeometry = {};
    }
    
    const resolution = 40;
    const xStep = (parameters.uMax - parameters.uMin) / resolution;
    const zStep = (parameters.vMax - parameters.vMin) / resolution;
    
    const vertices = [];
    const uvs = [];
    
    for (let i = 0; i <= resolution; i++) {
        const x = parameters.uMin + i * xStep;
        const u = i / resolution;
        
        for (let j = 0; j <= resolution; j++) {
            const z = parameters.vMin + j * zStep;
            const v = j / resolution;
            
            vertices.push(...flipCoords(...f({u: x, v: z, ...scope})));
            uvs.push(u, v);
        }
    }
    
    // Reuse geometry if it exists
    if (cachedGeometry.mesh) {
        const positionAttr = cachedGeometry.mesh.geometry.attributes.position;
        for (let i = 0; i < vertices.length; i++) {
            positionAttr.array[i] = vertices[i];
        }
        positionAttr.needsUpdate = true;
        cachedGeometry.mesh.geometry.computeVertexNormals();
    } else {
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

        const mesh = new THREE.Mesh(geometry, getGridMaterial());
        group.add(mesh);
        cachedGeometry.mesh = mesh;
    }
    
    return cachedGeometry;
}

export function Point3D(f, group, scope, parameters, cachedGeometry) {
    if (!cachedGeometry) {
        cachedGeometry = {};
    }
    
    const newPos = flipCoords(...f({...scope}));
    
    // Reuse sphere if it exists
    if (cachedGeometry.sphere) {
        cachedGeometry.sphere.position.set(...newPos);
    } else {
        group.clear();
        const geometry = new THREE.SphereGeometry(0.2, 32, 16); 
        const sphere = new THREE.Mesh(geometry, getColorMaterial(0x007fff));
        sphere.position.set(...newPos);
        group.add(sphere);
        cachedGeometry.sphere = sphere;
    }
    
    return cachedGeometry;
}

// I need to be able to use () and not just []
// sometimes when resuing the same instance, things break

