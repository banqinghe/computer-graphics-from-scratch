import { vec3 } from 'gl-matrix';
import { drawLine } from './line';
import { updateCanvas, canvasWidth, canvasHeight, clearCanvas } from './canvas';

// viewport: width = 1, height = 1, distance = 1
const viewportWidth = 1;
const viewportHeight = 1;
const viewportDistance = 1;

/** 将 viewport (1 * 1) 坐标转换为 canvas (400px * 400px) 坐标 */
function viewportToCanvas(x: number, y: number): [number, number] {
    return [
        Math.round(x * canvasWidth / viewportWidth),
        Math.round(y * canvasHeight / viewportHeight),
    ];
}

/** 将三维顶点投影到二维画布上 */
function projectVertex(vertex: vec3): [number, number] {
    /*
    $$
    \begin{aligned}
    P'_x = \frac{P_x \cdot d}{P_z} \\
    P'_y = \frac{P_y \cdot d}{P_z} \\
    \end{aligned}
    $$
    */
    const x = vertex[0] * (viewportDistance / vertex[2]);
    const y = vertex[1] * (viewportDistance / vertex[2]);
    return viewportToCanvas(x, y);
}

// 正方体的 8 个顶点
// front
const vAf = vec3.fromValues(-2, -0.5, 5);
const vBf = vec3.fromValues(-2, 0.5, 5);
const vCf = vec3.fromValues(-1, 0.5, 5);
const vDf = vec3.fromValues(-1, -0.5, 5);
// back
const vAb = vec3.fromValues(-2, -0.5, 6);
const vBb = vec3.fromValues(-2, 0.5, 6);
const vCb = vec3.fromValues(-1, 0.5, 6);
const vDb = vec3.fromValues(-1, -0.5, 6);

const vertices = [vAf, vBf, vCf, vDf, vAb, vBb, vCb, vDb];

function draw() {
    clearCanvas();

    const blue = vec3.fromValues(0, 0, 255);
    const red = vec3.fromValues(255, 0, 0);
    const green = vec3.fromValues(0, 255, 0);
    // front face
    drawLine(projectVertex(vAf), projectVertex(vBf), red);
    drawLine(projectVertex(vBf), projectVertex(vCf), red);
    drawLine(projectVertex(vCf), projectVertex(vDf), red);
    drawLine(projectVertex(vDf), projectVertex(vAf), red);
    // back face
    drawLine(projectVertex(vAb), projectVertex(vBb), green);
    drawLine(projectVertex(vBb), projectVertex(vCb), green);
    drawLine(projectVertex(vCb), projectVertex(vDb), green);
    drawLine(projectVertex(vDb), projectVertex(vAb), green);
    // sides
    drawLine(projectVertex(vAf), projectVertex(vAb), blue);
    drawLine(projectVertex(vBf), projectVertex(vBb), blue);
    drawLine(projectVertex(vCf), projectVertex(vCb), blue);
    drawLine(projectVertex(vDf), projectVertex(vDb), blue);
    updateCanvas();
}

function main() {
    draw();

    document.addEventListener('keydown', (event) => {
        const step = 0.2;
        if (event.key === 'ArrowRight') {
            vertices.forEach(v => v[0] += step);
            draw();
        } else if (event.key === 'ArrowLeft') {
            vertices.forEach(v => v[0] -= step);
            draw();
        }
    });
}

main();
