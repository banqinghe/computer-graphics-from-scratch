import type { mat4, vec3 } from 'gl-matrix';
import { AmbientLight, DirectionalLight, PointLight } from './scene';
import vertexShaderSource from './shaders/vertex.glsl?raw';
import fragmentShaderSource from './shaders/fragment.glsl?raw';

export class WebGLRenderer {
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private positionBuffer: WebGLBuffer;

    // Uniform 位置
    private uniforms: {
        resolution: WebGLUniformLocation | null;
        cameraPosition: WebGLUniformLocation | null;
        cameraRotation: WebGLUniformLocation | null;
        numSpheres: WebGLUniformLocation | null;
        sphereCenters: WebGLUniformLocation | null;
        sphereRadii: WebGLUniformLocation | null;
        sphereColors: WebGLUniformLocation | null;
        sphereSpeculars: WebGLUniformLocation | null;
        sphereReflectives: WebGLUniformLocation | null;
        numLights: WebGLUniformLocation | null;
        lightTypes: WebGLUniformLocation | null;
        lightIntensities: WebGLUniformLocation | null;
        lightPositions: WebGLUniformLocation | null;
        lightDirections: WebGLUniformLocation | null;
        backgroundColor: WebGLUniformLocation | null;
    };

    constructor(canvas: HTMLCanvasElement) {
        const gl = canvas.getContext('webgl2');
        if (!gl) {
            throw new Error('WebGL 2.0 not supported');
        }
        this.gl = gl;

        // 编译着色器
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        // 创建程序
        this.program = this.createProgram(vertexShader, fragmentShader);
        this.gl.useProgram(this.program);

        // 获取 uniform 位置
        this.uniforms = {
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            cameraPosition: this.gl.getUniformLocation(this.program, 'u_cameraPosition'),
            cameraRotation: this.gl.getUniformLocation(this.program, 'u_cameraRotation'),
            numSpheres: this.gl.getUniformLocation(this.program, 'u_numSpheres'),
            sphereCenters: this.gl.getUniformLocation(this.program, 'u_sphereCenters'),
            sphereRadii: this.gl.getUniformLocation(this.program, 'u_sphereRadii'),
            sphereColors: this.gl.getUniformLocation(this.program, 'u_sphereColors'),
            sphereSpeculars: this.gl.getUniformLocation(this.program, 'u_sphereSpeculars'),
            sphereReflectives: this.gl.getUniformLocation(this.program, 'u_sphereReflectives'),
            numLights: this.gl.getUniformLocation(this.program, 'u_numLights'),
            lightTypes: this.gl.getUniformLocation(this.program, 'u_lightTypes'),
            lightIntensities: this.gl.getUniformLocation(this.program, 'u_lightIntensities'),
            lightPositions: this.gl.getUniformLocation(this.program, 'u_lightPositions'),
            lightDirections: this.gl.getUniformLocation(this.program, 'u_lightDirections'),
            backgroundColor: this.gl.getUniformLocation(this.program, 'u_backgroundColor'),
        };

        // 创建全屏四边形
        this.positionBuffer = this.gl.createBuffer()!;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        const positions = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ]);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        // 设置顶点属性
        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        // 设置分辨率
        this.gl.uniform2f(this.uniforms.resolution, canvas.width, canvas.height);
    }

    private compileShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type)!;
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Shader compilation failed: ${info}`);
        }

        return shader;
    }

    private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
        const program = this.gl.createProgram()!;
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw new Error(`Program linking failed: ${info}`);
        }

        return program;
    }

    public setCamera(position: vec3, rotation: mat4) {
        this.gl.uniform3fv(this.uniforms.cameraPosition, position);
        this.gl.uniformMatrix4fv(this.uniforms.cameraRotation, false, rotation);
    }

    public setScene(spheres: Array<{
        center: vec3;
        radius: number;
        color: vec3;
        specular: number;
        reflective: number;
    }>, lights: Array<AmbientLight | DirectionalLight | PointLight>, backgroundColor: vec3) {
        // 设置球体数据
        this.gl.uniform1i(this.uniforms.numSpheres, spheres.length);

        const centers: number[] = [];
        const radii: number[] = [];
        const colors: number[] = [];
        const speculars: number[] = [];
        const reflectives: number[] = [];

        for (const sphere of spheres) {
            centers.push(sphere.center[0], sphere.center[1], sphere.center[2]);
            radii.push(sphere.radius);
            colors.push(sphere.color[0], sphere.color[1], sphere.color[2]);
            speculars.push(sphere.specular);
            reflectives.push(sphere.reflective);
        }

        this.gl.uniform3fv(this.uniforms.sphereCenters, centers);
        this.gl.uniform1fv(this.uniforms.sphereRadii, radii);
        this.gl.uniform3fv(this.uniforms.sphereColors, colors);
        this.gl.uniform1fv(this.uniforms.sphereSpeculars, speculars);
        this.gl.uniform1fv(this.uniforms.sphereReflectives, reflectives);

        // 设置光源数据
        this.gl.uniform1i(this.uniforms.numLights, lights.length);

        const types: number[] = [];
        const intensities: number[] = [];
        const positions: number[] = [];
        const directions: number[] = [];

        for (const light of lights) {
            if (light instanceof AmbientLight) {
                types.push(0);
                intensities.push(light.intensity);
                positions.push(0, 0, 0);
                directions.push(0, 0, 0);
            } else if (light instanceof PointLight) {
                types.push(1);
                intensities.push(light.intensity);
                positions.push(light.position[0], light.position[1], light.position[2]);
                directions.push(0, 0, 0);
            } else if (light instanceof DirectionalLight) {
                types.push(2);
                intensities.push(light.intensity);
                positions.push(0, 0, 0);
                directions.push(light.direction[0], light.direction[1], light.direction[2]);
            }
        }

        this.gl.uniform1iv(this.uniforms.lightTypes, types);
        this.gl.uniform1fv(this.uniforms.lightIntensities, intensities);
        this.gl.uniform3fv(this.uniforms.lightPositions, positions);
        this.gl.uniform3fv(this.uniforms.lightDirections, directions);

        // 设置背景色
        this.gl.uniform3fv(this.uniforms.backgroundColor, [
            backgroundColor[0] / 255,
            backgroundColor[1] / 255,
            backgroundColor[2] / 255,
        ]);
    }

    public render() {
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
}
