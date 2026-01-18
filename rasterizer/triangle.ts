import { type vec2, vec3 } from 'gl-matrix';
import { interpolate } from './utils';
import { putPixel } from './canvas';

/*

              * P2 (最高点)
            *
          *  *
        *   *
      *    *
    *     *
P1 *     *
    **  *
      **
      P0 (最低点)

1. 先根据 y 坐标将三个点排序，确保 P0 在最底下，P2 在最上面
2. 然后根据 P0 和 P2 的连线方程，计算出每一行的起始 x 坐标 startX 和结束 x 坐标 endX
3. 对于每一行，从 startX 到 endX 之间的像素点进行填充
*/

export function drawFilledTriangle(p0: vec2, p1: vec2, p2: vec2, color: vec3) {
    // 根据 y 坐标排序
    if (p0[1] > p1[1]) [p0, p1] = [p1, p0];
    if (p0[1] > p2[1]) [p0, p2] = [p2, p0];
    if (p1[1] > p2[1]) [p1, p2] = [p2, p1];

    // 计算每条边的 x 插值 (x = f(y))
    const x01 = interpolate(p0[1], p0[0], p1[1], p1[0]);
    const x12 = interpolate(p1[1], p1[0], p2[1], p2[0]);
    const x02 = interpolate(p0[1], p0[0], p2[1], p2[0]);

    // 01 和 12 两段连起来, 注意拼接时要去掉重复的 p1 点
    const x012 = [...x01.slice(0, x01.length - 1), ...x12];

    // 任取一点(这里选取中点) 判断 02 在左边还是右边
    const midY = Math.floor(x012.length / 2);
    let leftX: number[] = [];
    let rightX: number[] = [];
    if (x02[midY] < x012[midY]) {
        leftX = x02;
        rightX = x012;
    } else {
        leftX = x012;
        rightX = x02;
    }

    // 填充三角形
    for (let y = p0[1]; y <= p2[1]; y++) {
        // 从 leftX 到 rightX 之间填充, leftX 和 rightX 的索引是相对于 p0[1] 的, 因为插值是从 p0[1] 开始的
        // 所以需要减去 p0[1]
        for (let x = leftX[y - p0[1]]; x <= rightX[y - p0[1]]; x++) {
            putPixel(x, y, color);
        }
    }
}

export function drawShadedTriangle(p0: vec3, p1: vec3, p2: vec3, color: vec3) {
    // 根据 y 坐标排序
    if (p0[1] > p1[1]) [p0, p1] = [p1, p0];
    if (p0[1] > p2[1]) [p0, p2] = [p2, p0];
    if (p1[1] > p2[1]) [p1, p2] = [p2, p1];

    // - 计算每条边的 x 插值 (x = f(y))
    // - 计算每条边的色彩强度 (intensity) 插值 (h = f(y))
    const x01 = interpolate(p0[1], p0[0], p1[1], p1[0]);
    const h01 = interpolate(p0[1], p0[2], p1[1], p1[2]);

    const x12 = interpolate(p1[1], p1[0], p2[1], p2[0]);
    const h12 = interpolate(p1[1], p1[2], p2[1], p2[2]);

    const x02 = interpolate(p0[1], p0[0], p2[1], p2[0]);
    const h02 = interpolate(p0[1], p0[2], p2[1], p2[2]);

    // 01 和 12 两段连起来, 注意拼接时要去掉重复的 p1 点
    const x012 = [...x01.slice(0, x01.length - 1), ...x12];
    const h012 = [...h01.slice(0, h01.length - 1), ...h12];

    // 任取一点(这里选取中点) 判断 02 在左边还是右边
    const midY = Math.floor(x012.length / 2);
    let leftX: number[] = [];
    let rightX: number[] = [];
    let leftH: number[] = [];
    let rightH: number[] = [];
    if (x02[midY] < x012[midY]) {
        leftX = x02;
        rightX = x012;
        leftH = h02;
        rightH = h012;
    } else {
        leftX = x012;
        rightX = x02;
        leftH = h012;
        rightH = h02;
    }

    // 水平方向划线填充三角形
    for (let y = p0[1]; y <= p2[1]; y++) {
        const startX = leftX[y - p0[1]];
        const endX = rightX[y - p0[1]];
        const startH = leftH[y - p0[1]];
        const endH = rightH[y - p0[1]];

        const hSegment = interpolate(startX, startH, endX, endH);

        for (let x = startX; x <= endX; x++) {
            const intensity = hSegment[x - startX];
            const shadedColor = vec3.scale(vec3.create(), color, intensity);
            putPixel(x, y, shadedColor);
        }
    }
}
