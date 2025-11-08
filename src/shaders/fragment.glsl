#version 300 es

precision highp float;

uniform vec2 u_resolution;
uniform vec3 u_cameraPosition;
uniform mat4 u_cameraRotation;

// 场景数据
#define MAX_SPHERES 10
#define MAX_LIGHTS 10
#define EPSILON 0.05

uniform int u_numSpheres;
uniform vec3 u_sphereCenters[MAX_SPHERES];
uniform float u_sphereRadii[MAX_SPHERES];
uniform vec3 u_sphereColors[MAX_SPHERES];
uniform float u_sphereSpeculars[MAX_SPHERES];
uniform float u_sphereReflectives[MAX_SPHERES];

// 光源类型: 0=环境光, 1=点光源, 2=平行光
uniform int u_numLights;
uniform int u_lightTypes[MAX_LIGHTS];
uniform float u_lightIntensities[MAX_LIGHTS];
uniform vec3 u_lightPositions[MAX_LIGHTS]; // 点光源使用
uniform vec3 u_lightDirections[MAX_LIGHTS]; // 平行光使用

uniform vec3 u_backgroundColor;

out vec4 fragColor;

// 将 canvas 坐标转换为 viewport 坐标
vec3 canvasToViewport(vec2 xy) {
    return vec3(
        xy.x / u_resolution.x,
        xy.y / u_resolution.y,
        1.0
    );
}

// 计算光线与球体的交点
vec2 intersectRaySphere(vec3 origin, vec3 direction, int sphereIndex) {
    vec3 CO = origin - u_sphereCenters[sphereIndex];

    float a = dot(direction, direction);
    float b = 2.0 * dot(CO, direction);
    float c = dot(CO, CO) - u_sphereRadii[sphereIndex] * u_sphereRadii[sphereIndex];

    float discriminant = b * b - 4.0 * a * c;
    if (discriminant < 0.0) {
        return vec2(1e20, 1e20);
    }

    float sqrtDiscriminant = sqrt(discriminant);
    float t1 = (-b + sqrtDiscriminant) / (2.0 * a);
    float t2 = (-b - sqrtDiscriminant) / (2.0 * a);

    return vec2(t1, t2);
}

// 获取最近的交点
void getClosestIntersection(vec3 origin, vec3 direction, float tMin, float tMax, out int closestSphere, out float closestT) {
    closestT = 1e20;
    closestSphere = -1;

    for (int i = 0; i < MAX_SPHERES; i++) {
        if (i >= u_numSpheres) break;

        vec2 ts = intersectRaySphere(origin, direction, i);
        if (ts.x < closestT && ts.x > tMin && ts.x < tMax) {
            closestT = ts.x;
            closestSphere = i;
        }
        if (ts.y < closestT && ts.y > tMin && ts.y < tMax) {
            closestT = ts.y;
            closestSphere = i;
        }
    }
}

// 计算反射光线
vec3 reflectRay(vec3 ray, vec3 normal) {
    return 2.0 * normal * dot(normal, ray) - ray;
}

// 计算光照
float computeLighting(vec3 point, vec3 normal, vec3 view, float specular) {
    float intensity = 0.0;

    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= u_numLights) break;

        if (u_lightTypes[i] == 0) {
            // 环境光
            intensity += u_lightIntensities[i];
        } else {
            vec3 l;
            float shadowMaxT;

            if (u_lightTypes[i] == 1) {
                // 点光源
                l = u_lightPositions[i] - point;
                shadowMaxT = 1.0;
            } else {
                // 平行光
                l = u_lightDirections[i];
                shadowMaxT = 1e20;
            }

            // 检查阴影
            int shadowSphere;
            float shadowT;
            getClosestIntersection(point, l, EPSILON, shadowMaxT, shadowSphere, shadowT);
            if (shadowSphere != -1) {
                continue;
            }

            // 漫反射
            float nDotL = dot(normal, l);
            if (nDotL > 0.0) {
                intensity += u_lightIntensities[i] * nDotL / (length(normal) * length(l));
            }

            // 镜面反射
            if (specular >= 0.0) {
                vec3 r = reflectRay(l, normal);
                float rDotV = dot(r, view);
                if (rDotV > 0.0) {
                    intensity += u_lightIntensities[i] * pow(
                        rDotV / (length(r) * length(view)),
                        specular
                    );
                }
            }
        }
    }

    return intensity;
}

// 光线追踪
vec3 traceRay(vec3 startPoint, vec3 direction, float minT, float maxT, int maxDepth) {
    vec3 color = vec3(0.0);  // 从黑色开始累加
    vec3 attenuation = vec3(1.0);

    for (int depth = 0; depth < 10; depth++) {
        if (depth >= maxDepth) break;

        int closestSphere;
        float closestT;
        getClosestIntersection(startPoint, direction, minT, maxT, closestSphere, closestT);

        if (closestSphere == -1) {
            // 未击中物体，累加背景色（考虑衰减）
            color += attenuation * u_backgroundColor;
            break;
        }

        // 计算交点
        vec3 intersectionPoint = startPoint + closestT * direction;

        // 计算法线
        vec3 normal = normalize(intersectionPoint - u_sphereCenters[closestSphere]);

        // 视线方向
        vec3 view = -direction;

        // 计算局部颜色
        float lighting = computeLighting(
            intersectionPoint,
            normal,
            view,
            u_sphereSpeculars[closestSphere]
        );
        vec3 localColor = u_sphereColors[closestSphere] * lighting / 255.0;

        // 累加颜色
        float reflective = u_sphereReflectives[closestSphere];
        color += attenuation * localColor * (1.0 - reflective);

        // 如果没有反射或达到最大深度，停止
        if (reflective <= 0.0 || depth >= maxDepth - 1) {
            break;
        }

        // 准备追踪反射光线
        attenuation *= reflective;
        direction = reflectRay(view, normal);
        startPoint = intersectionPoint;
        minT = EPSILON;
    }

    return color;
}

void main() {
    // 计算像素坐标（以屏幕中心为原点）
    vec2 xy = gl_FragCoord.xy - u_resolution / 2.0;

    // 转换为 viewport 坐标
    vec3 viewportPoint = canvasToViewport(xy);

    // 应用相机旋转
    vec3 direction = (u_cameraRotation * vec4(viewportPoint, 1.0)).xyz;

    // 光线追踪
    vec3 color = traceRay(u_cameraPosition, direction, 1.0, 1e20, 3);

    fragColor = vec4(color, 1.0);
}
