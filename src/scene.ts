import { vec3 } from 'gl-matrix';

export class Sphere {
    center: vec3;
    radius: number;
    color: vec3;
    specular: number;

    constructor(center: vec3, radius: number, color: vec3, specular: number) {
        this.center = center;
        this.radius = radius;
        this.color = color;
        this.specular = specular;
    }
}

class Light {
    intensity: number;

    constructor(intensity: number) {
        this.intensity = intensity;
    }
}

export class AmbientLight extends Light {
    constructor(intensity: number) {
        super(intensity);
    }
}

export class DirectionalLight extends Light {
    direction: vec3;

    constructor(intensity: number, direction: vec3) {
        super(intensity);
        this.direction = direction;
    }
}

export class PointLight extends Light {
    position: vec3;

    constructor(intensity: number, position: vec3) {
        super(intensity);
        this.position = position;
    }
}

export const scene = {
    spheres: [
        new Sphere(
            vec3.fromValues(0, -1, 3),
            1,
            vec3.fromValues(255, 0, 0), // Red
            500, // Shiny
        ),
        new Sphere(
            vec3.fromValues(2, 0, 4),
            1,
            vec3.fromValues(0, 0, 255), // Blue
            500, // Shiny
        ),
        new Sphere(
            vec3.fromValues(-2, 0, 4),
            1,
            vec3.fromValues(0, 255, 0), // Green
            10, // Less shiny
        ),
        new Sphere(
            vec3.fromValues(0, -5001, 0),
            5000,
            vec3.fromValues(255, 255, 0), // Yellow
            1000, // Very shiny
        ),
    ],
    lights: [
        new AmbientLight(0.2),
        new PointLight(0.6, vec3.fromValues(2, 1, 0)),
        new DirectionalLight(0.2, vec3.fromValues(1, 4, 4)),
    ],
    backgroundColor: vec3.fromValues(255, 255, 255),
};
