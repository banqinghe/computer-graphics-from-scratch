import { mat4, vec3 } from 'gl-matrix';
import { canvas } from './canvas';
import { scene } from './scene';
import { WebGLRenderer } from './webgl-renderer';

const camera = {
    position: vec3.fromValues(0, 0, 0),
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
};

function getCameraRotationMatrix() {
    // 先绕 X，再绕 Y，再绕 Z
    const rotX = mat4.fromXRotation(mat4.create(), camera.rotationX);
    const rotY = mat4.fromYRotation(mat4.create(), camera.rotationY);
    const rotZ = mat4.fromZRotation(mat4.create(), camera.rotationZ);
    // 注意顺序：Z * Y * X
    return mat4.mul(mat4.create(), rotZ, mat4.mul(mat4.create(), rotY, rotX));
}

// 初始化 WebGL 渲染器
const renderer = new WebGLRenderer(canvas);
renderer.setScene(scene.spheres, scene.lights, scene.backgroundColor);

function render() {
    const startTime = performance.now();
    const rotation = getCameraRotationMatrix();
    renderer.setCamera(camera.position, rotation);
    renderer.render();
    document.getElementById('info')!.textContent = `Render time: ${(performance.now() - startTime).toFixed(2)}ms`;
}

// 旋转相机并重新渲染
function rotateCamera(axis: 'x' | 'y' | 'z', delta: number) {
    if (axis === 'x') {
        camera.rotationX += delta;
    } else if (axis === 'y') {
        camera.rotationY += delta;
    } else {
        camera.rotationZ += delta;
    }
    render();
}

function main() {
    render();

    // 旋转步长
    const ROT_STEP = Math.PI / 16;

    // 绑定按钮事件
    document.getElementById('up-btn')!.addEventListener('click', () => {
        rotateCamera('x', -ROT_STEP);
    });
    document.getElementById('down-btn')!.addEventListener('click', () => {
        rotateCamera('x', ROT_STEP);
    });
    document.getElementById('left-btn')!.addEventListener('click', () => {
        rotateCamera('y', -ROT_STEP);
    });
    document.getElementById('right-btn')!.addEventListener('click', () => {
        rotateCamera('y', ROT_STEP);
    });
    document.getElementById('rotate-right-btn')!.addEventListener('click', () => {
        rotateCamera('z', ROT_STEP);
    });
}

main();
