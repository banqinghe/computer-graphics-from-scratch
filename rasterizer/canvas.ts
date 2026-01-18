import type { vec3 } from 'gl-matrix';

export const canvasWidth = 400;
export const canvasHeight = 400;
export const canvas = document.getElementById('canvas') as HTMLCanvasElement;
export const ctx = canvas.getContext('2d')!;
export const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

export function updateCanvas() {
    ctx.putImageData(imageData, 0, 0);
}

/** 绘制点, 以画布中心为原点, x 轴向右为正, y 轴向上为正 */
export function putPixel(x: number, y: number, color: vec3) {
    x = Math.round(x + canvasWidth / 2);
    y = Math.round(canvasHeight / 2 - y); // 画布的 y 轴是向下为正的
    // 边界检查，防止回卷 (wrapping) 现象
    if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) {
        return;
    }
    const index = (y * canvasWidth + x) * 4;
    imageData.data[index] = color[0];
    imageData.data[index + 1] = color[1];
    imageData.data[index + 2] = color[2];
    imageData.data[index + 3] = 255;
}

export function clearCanvas() {
    for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 255; // R
        imageData.data[i + 1] = 255; // G
        imageData.data[i + 2] = 255; // B
        imageData.data[i + 3] = 255; // A
    }
}
