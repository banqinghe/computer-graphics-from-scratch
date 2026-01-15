import type { vec2, vec3 } from 'gl-matrix';
import { putPixel } from './canvas';
import { interpolate } from './utils';

/*

line between P0 and P1: $P = P_0 + t(P_1 - P_0)$

$$
\begin{aligned}
& x = x_0 + t(x_1 - x_0) \\
& y = y_0 + t(y_1 - y_0) \\

\\
& t = \frac{(x - x_0)}{(x_1 - x_0)} = \frac{(y - y_0)}{(y_1 - y_0)} \\
\\
& y = y_0 + t(y_1 - y_0) = y_0 + (x - x_0)\cdot\frac{y_1 - y_0}{x_1 - x_0} \\
\\
\end{aligned}
$$

$\frac{y_1 - y_0}{x_1 - x_0}$ 就是斜率，令它为 $a$, 注意分母不能为 0

$$
\begin{aligned}
& y = y_0 + a(x - x_0) \\
& y = ax + (y_0 - ax_0) \\
\end{aligned}
$$
$y_0 - ax_0$ 也是已知的，令它为 $b$

所以，直线方程可以表示为：

$$
y = ax + b
$$

 */
export function drawLine(p0: vec2, p1: vec2, color: vec3) {
    // const a = (p1[1] - p0[1]) / (p1[0] - p0[0]);
    // const b = p0[1] - a * p0[0];
    // for (let x = p0[0]; x <= p1[0]; x++) {
    //     const y = a * x + b;
    //     putPixel(x, y, color);
    // }

    // 其实 y(x + 1) = y(x) + a, 所以可以用增量法, 避免乘法运算, 效率更高
    // 确保 p0 在左边
    // if (p0[0] > p1[0]) {
    //     [p0, p1] = [p1, p0];
    // }
    // const a = (p1[1] - p0[1]) / (p1[0] - p0[0]);
    // let y = p0[1];
    // for (let x = p0[0]; x <= p1[0]; x++) {
    //     putPixel(x, y, color);
    //     y += a;
    // }

    // 由于之前使用的是 y = f(x) 的方式, 当斜率比较大的时候（大于1）会出现断点, 因为一个 x 只对应一个 y
    // 有一个解决方式是根据斜率的绝对值来决定以 x 为主还是以 y 为主
    // 这种方式也解决了之前的算法无法处理垂直线段的问题
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    if (Math.abs(dx) >= Math.abs(dy)) {
        // 以 x 为主: y = f(x)
        if (p0[0] > p1[0]) {
            [p0, p1] = [p1, p0];
        }
        let y = interpolate(p0[0], p0[1], p1[0], p1[1]);
        for (let x = p0[0]; x <= p1[0]; x++) {
            putPixel(x, Math.round(y[x - p0[0]]), color);
        }
    } else {
        // 以 y 为主: x = f(y)
        if (p0[1] > p1[1]) {
            [p0, p1] = [p1, p0];
        }
        let x = interpolate(p0[1], p0[0], p1[1], p1[0]);
        for (let y = p0[1]; y <= p1[1]; y++) {
            putPixel(Math.round(x[y - p0[1]]), y, color);
        }
    }
}
