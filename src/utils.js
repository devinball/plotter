import * as THREE from 'three';

export function Lerp(a, b, t) {
    return a + (b - a) * t;
}

export function Clamp(min, max, x) {
    return Math.max(Math.min(max, x), min);
}

export function IntensityColor(intensity, minIntensity = 0, maxIntensity = 100) {
    const t = (intensity - minIntensity) / (maxIntensity - minIntensity);
    const clamped = Math.max(0, Math.min(1, t));
    
    // Create color gradient: blue -> cyan -> green -> yellow -> red
    const color = new THREE.Color();
    
    if (clamped < 0.25) {
        // Blue to Cyan
        const local = clamped / 0.25;
        color.setRGB(0, local, 1);
    } else if (clamped < 0.5) {
        // Cyan to Green
        const local = (clamped - 0.25) / 0.25;
        color.setRGB(0, 1, 1 - local);
    } else if (clamped < 0.75) {
        // Green to Yellow
        const local = (clamped - 0.5) / 0.25;
        color.setRGB(local, 1, 0);
    } else {
        // Yellow to Red
        const local = (clamped - 0.75) / 0.25;
        color.setRGB(1, 1 - local, 0);
    }
    
    return color;
}

export function getGridMaterial(xSize, ySize) {
    const loader = new THREE.TextureLoader();
    const texture = loader.load('src/assets/checker.jpg');
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(xSize, ySize); // Adjust tiling
        
    return new THREE.MeshPhongMaterial({
        reflectivity: 1,
        map: texture,
        side: THREE.DoubleSide
    });
}

export function getColorMaterial(color) {
    return new THREE.MeshPhongMaterial({
        reflectivity: 0.5,
        color: color,
        side: THREE.DoubleSide
    });
}

export function flipCoords(x, y, z) {
    return [x, z, y]
}

export function Arrow3D(direction, origin, length, color, tailWidth = 0.05, headLength = 0.2, headWidth = 0.15) {
    const group = new THREE.Group();
    
    // Normalize direction
    const dir = direction.clone().normalize();
    
    // Create cylinder for tail
    const tailLength = length - headLength;
    const tailGeometry = new THREE.CylinderGeometry(tailWidth, tailWidth, tailLength, 8);
    const tailMaterial = new THREE.MeshBasicMaterial({ color: color });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    
    // Create cone for head
    const headGeometry = new THREE.ConeGeometry(headWidth, headLength, 8);
    const headMaterial = new THREE.MeshBasicMaterial({ color: color });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    
    // Position head at end of tail
    head.position.y = tailLength / 2 + headLength / 2;
    
    group.add(tail);
    group.add(head);
    
    // Position group at origin
    group.position.copy(origin);
    
    // Rotate to align with direction
    const axis = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(axis, dir);
    group.quaternion.copy(quaternion);
    
    return group;
}

export function Line3D(points, radius = 0.1, color = 0x00ff00, segments = 8) {
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, points.length * 2, radius, segments, false);
    const material = getColorMaterial(color);
    const tubeMesh = new THREE.Mesh(tubeGeometry, material);
    return tubeMesh;
}
