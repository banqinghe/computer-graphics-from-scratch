import { vec3 } from 'gl-matrix';
import { canvasWidth, canvasHeight, putPixel, updateCanvas } from './canvas';
import { AmbientLight, PointLight, scene, Sphere } from './scene';

const cameraPosition = vec3.fromValues(0, 0, 0);

const EPSILON = 0.05;

/**
 * viewport: width = 1, height = 1, distance = 1
 */
function canvasToViewport(x: number, y: number) {
    return vec3.fromValues(
        x * (1 / canvasWidth),
        y * (1 / canvasHeight),
        1,
    );
}

/*
$$
\begin{aligned}
&ray: \vec{P} = \vec{O} + t\vec{D} \\
&sphere: |\vec{P} - \vec{C}|^2 = r^2
\end{aligned}
$$
将光线方程带入球体方程, 方程如果有解则说明二者有交点:

$$
\begin{aligned}
(\vec{O} + t\vec{D} - \vec{C})\cdot(\vec{O} + t\vec{D} - \vec{C}) &= r^2 \\
t^2(\vec{D}\cdot\vec{D}) + 2t(\vec{OC}\cdot\vec{D}) + (\vec{OC}\cdot\vec{OC} - r^2) &= 0 \\
\end{aligned}
$$

这是一个对于 t 的二元一次方程:

$$
\begin{aligned}
\vec{OC} &= \vec{O} - \vec{C} \\
a &= \vec{D}\cdot\vec{D} \\
b &= 2(\vec{OC}\cdot\vec{D}) \\
c &= \vec{OC}\cdot\vec{OC} - r^2 \\
\end{aligned}
$$
*/
function intersectRaySphere(origin: vec3, direction: vec3, sphere: Sphere) {
    const CO = vec3.create();
    vec3.subtract(CO, origin, sphere.center);

    const a = vec3.dot(direction, direction);
    const b = 2 * vec3.dot(CO, direction);
    const c = vec3.dot(CO, CO) - sphere.radius * sphere.radius;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
        return [Infinity, Infinity] as const;
    }

    const sqrtDiscriminant = Math.sqrt(discriminant);
    const t1 = (-b + sqrtDiscriminant) / (2 * a);
    const t2 = (-b - sqrtDiscriminant) / (2 * a);

    return [t1, t2] as const;
}

/** 给定一个光线的起点和方向, 返回与场景中最近的物体的交点 */
function getClosestIntersection(origin: vec3, direction: vec3, tMin: number, tMax: number) {
    let closestT = Infinity;
    let closestSphere: Sphere | null = null;
    for (const sphere of scene.spheres) {
        const [t1, t2] = intersectRaySphere(origin, direction, sphere);
        if (t1 < closestT && t1 > tMin && t1 < tMax) {
            closestT = t1;
            closestSphere = sphere;
        }
        if (t2 < closestT && t2 > tMin && t2 < tMax) {
            closestT = t2;
            closestSphere = sphere;
        }
    }
    return [closestSphere, closestT] as const;
}

/** 给定起点追踪光线击中的物体, 返回对应的颜色 */
function traceRay(startPoint: vec3, direction: vec3, minT: number, maxT: number, recursionDepth: number): vec3 {
    const [closestSphere, closestT] = getClosestIntersection(startPoint, direction, minT, maxT);
    if (closestSphere === null) {
        return scene.backgroundColor;
    }
    // 计算交点位置
    const intersectionPoint = vec3.create();
    // P = O + tD
    vec3.scaleAndAdd(intersectionPoint, startPoint, direction, closestT);
    // 计算表面法线
    const normal = vec3.create();
    vec3.subtract(normal, intersectionPoint, closestSphere.center);
    vec3.normalize(normal, normal);

    // computeLighting 第三个参数为指向视线的方向, direction 向量是出发点指向物体, 因此视线方向为 -direction
    const view = vec3.negate(vec3.create(), direction);

    // 计算高光和阴影
    const localColor = vec3.scale(vec3.create(), closestSphere.color, computeLighting(intersectionPoint, normal, view, closestSphere.specular));

    // 递归计算反射光, 达到递归次数上限或击中物体无反光时停止
    if (recursionDepth <= 0 || closestSphere.reflective <= 0) {
        return localColor;
    }

    const reflectedRay = reflectRay(view, normal);
    const reflectedColor = traceRay(intersectionPoint, reflectedRay, EPSILON, Infinity, recursionDepth - 1);

    // 最终颜色为局部颜色和反射颜色的加权和 $$C = (1 - k_r)C_{local} + k_r C_{reflected}$$
    return vec3.add(
        vec3.create(),
        vec3.scale(vec3.create(), localColor, 1 - closestSphere.reflective),
        vec3.scale(vec3.create(), reflectedColor, closestSphere.reflective),
    );
}

/** 计算理想反射光 $$\vec{R} = 2\vec{N}(\vec{N}\cdot\vec{L}) - \vec{L}$$ */
function reflectRay(ray: vec3, normal: vec3): vec3 {
    const r = vec3.create();
    vec3.scale(r, normal, 2 * vec3.dot(normal, ray));
    vec3.subtract(r, r, ray);
    return r;
}

/*
## 漫反射

任意一点的光线强度为环境光加方向和点光源强度之和. 对于非环境光, 光线强度与光线方向和表面法线方向的夹角有关.
如果入射光强度与法线夹角为 $$\theta$$, 则光线强度为与 $$cos\theta$$, 所以任意一点 $$P$$ 的光线强度为:

$$
I_P = I_A + \sum_{i=1}^{n} I_i \frac{
    \vec{N}\cdot\vec{L}_i
}{
    \left| \vec{N} \right| \left| \vec{L}_i \right|
}
$$

其中 $$I_A$$ 表示环境光强度, $$I_i$$ 表示第 $$i$$ 个点光源/平行光源的光强度, $$\vec{N}$$ 表示表面法线, $$\vec{L}_i$$ 表示从表面点指向第 $$i$$ 个光源的方向.

## 镜面反射

某点如果发生了镜面反射, 那么光会不带衰减地反射进摄像机中. 但现实中的物体并不会完全光滑, 这会导致镜面反射产生时反射角
会略微与入射角有一定程度的偏移, 我们设这个偏移的角度为 $$\alpha$$， 理想反射光为 $$\vec{R}$$, 视线方向为 $$\vec{V}$$, $$\alpha$$ 为 $$\vec{R}$$ 和 $$\vec{V}$$ 之间的夹角.

![](https://gabrielgambetta.com/computer-graphics-from-scratch/images/07-specular-diagram.png)

随着 $$\alpha$$ 变大, 镜面反射的强度会迅速减小. 我们使用 $$cos^k(\alpha)$$ 来表示这种衰减, 其中 $$k$$ 是一个大于 1 的常数, 它表示物体表面的
光滑程度. $$k$$ 越大, 物体表面越光滑, 镜面反射的范围越小, 物体上的高光部分也就越小. 反之, $$k$$ 越小, 物体表面越粗糙, 镜面反
射的范围越大, 物体上的高光部分也就越大.

当然, 这种基于 cos 的做法只是对于现实的一个近似, 真实的物理现象要复杂得多.

入射光 $$\vec{L}$$, 表面法线 $$\vec{N}$$, 是已知的, 我们可以计算出理想反射光 $$\vec{R}$$:

$$
\vec{R} = 2\vec{N}(\vec{N}\cdot\vec{L}) - \vec{L}
$$

根据之前 cos 衰减的理论, 照射到视线方向 $$\vec{V}$$ 的光强度为:

$$

\begin{aligned}
&\cos\alpha = \frac{\vec{R}\cdot\vec{V}}{\left| \vec{R} \right| \left| \vec{V} \right|} \\
&I_{specular} = I_i \left( \frac{\vec{R}\cdot\vec{V}}{\left| \vec{R} \right| \left| \vec{V} \right|} \right)^k
\end{aligned}
$$

这时我们就能计算出任意一点 $$P$$ 的光线强度了, 也就是把漫反射和镜面反射的光强度加起来:

$$
I_P = I_A + \sum_{i=1}^{n} \left[
    I_i \frac{
        \vec{N}\cdot\vec{L}_i
    }{
        \left| \vec{N} \right| \left| \vec{L}_i \right|
    } +
    I_i \left( \frac{\vec{R}_i\cdot\vec{V}}{\left| \vec{R}_i \right| \left| \vec{V} \right|} \right)^k
\right]
$$

*/
function computeLighting(point: vec3, normal: vec3, view: vec3, specular: number): number {
    let intensity = 0;
    for (const light of scene.lights) {
        if (light instanceof AmbientLight) {
            intensity += light.intensity;
        } else {
            // 由 P 指向光源方向, 即上面公式中的 $$\vec{L}_i$$
            let l = vec3.create();
            let shadowMaxT = 0;
            if (light instanceof PointLight) {
                vec3.subtract(l, light.position, point);
                shadowMaxT = 1;
            } else {
                l = light.direction;
                shadowMaxT = Infinity;
            }

            // 检查是否有阴影产生 (光线是否被别的物体遮挡), point 为光线和球体的交点, 以它作为起点, 朝向光源方向射出
            // 一条线, 如果这条线在到达光源之前会击中别的物体, 则说明该点在阴影中.
            // - 如果是点光源, 光线在 1 个单位长度后就无法产生阴影了, 因为 t = 1 的时候光线就到达光源了
            // - 如果是平行光源, 我们认为光线可以无限远地产生阴影, 因为我们认为光源在无限远的位置
            //
            //   Q1: 为什么 t = 1 的时候光线就到达光源?
            //   A: 因为我们在上面计算 l 的时候是 light.position - point,
            //      也就是说 l 的长度就是光线从 point 到光源的距离, 而光线方程是 P = O + tD, 当 t = 1 的时候,
            //      P = O + D, 也就是光线走完了从 point 到光源的距离, 因此到达了光源位置)
            //
            //   Q2: 为什么要把 tMin 设为 EPSILON ?
            //   A: 因为如果把 tMin 设为 0 的话, 光线起点 point 恰好在物体表面, 这时计算交点会检测到与自身的交点,
            //      导致错误地认为该点在阴影中. 因此我们把 tMin 设为一个很小的值, 避免这种情况发生.
            //      (注：在书作者的代码里 EPSILON 是 0.001，我使用的是 gl-matrix 做向量计算，底层是使用
            //      Float32Array, 精度低一些，所以我把 EPSILON 设的稍微大了一些)

            const [shadowSphere] = getClosestIntersection(point, l, EPSILON, shadowMaxT);
            if (shadowSphere !== null) {
                continue;
            }

            // 漫反射
            // 计算 $$\vec{N}\cdot\vec{L}_i$$
            const nDotL = vec3.dot(normal, l);
            // 夹脚小于 90 度, 光线才能照到表面
            if (nDotL > 0) {
                //
                // $$I_i \frac{ \vec{N}\cdot\vec{L}_i }{ \left| \vec{N} \right| \left| \vec{L}_i \right| }$$
                //
                intensity += (light.intensity * nDotL) / (vec3.length(normal) * vec3.length(l));
            }

            // 镜面反射
            if (specular < 0) {
                continue;
            }

            const r = reflectRay(l, normal);

            // 计算视线方向为 $$\vec{V}$$
            // 计算 $$\vec{R}\cdot\vec{V}$$, 如果夹脚小于 90 度, 则视线方向上有反射光
            const rDotV = vec3.dot(r, view);
            if (rDotV > 0) {
                //
                // $$I_i \left( \frac{\vec{R}\cdot\vec{V}}{\left| \vec{R} \right| \left| \vec{V} \right|} \right)^k$$
                //
                intensity += light.intensity * Math.pow(
                    rDotV / (vec3.length(r) * vec3.length(view)),
                    specular,
                );
            }
        }
    }
    return intensity;
}

function main() {
    for (let x = -canvasWidth / 2; x < canvasWidth / 2; x++) {
        for (let y = -canvasHeight / 2; y < canvasHeight / 2; y++) {
            const direction = canvasToViewport(x, y);
            // minT = 1, 我们只关注 viewport 之后的交点
            const color = traceRay(cameraPosition, direction, 1, Infinity, 3);
            // canvas 的绘制坐标系中, (0, 0) 在左上角, 所以这里需要做一次变换
            putPixel(x + canvasWidth / 2, -y + canvasHeight / 2, color);
        }
    }
    updateCanvas();
}

main();
