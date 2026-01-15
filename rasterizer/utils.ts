/**
 * 线性插值: d = f(i)
 * 返回从 i0 到 i1 的每个整数位置对应的插值数组
 */
export function interpolate(i0: number, d0: number, i1: number, d1: number): number[] {
    const values: number[] = [];
    const a = (d1 - d0) / (i1 - i0);
    let d = d0;
    for (let i = i0; i <= i1; i++) {
        values.push(d);
        d += a;
    }
    return values;
}
