import { drawLine } from './line';
import { updateCanvas } from './canvas';
import { drawFilledTriangle, drawShadedTriangle } from './triangle';

function main() {
    drawLine([200, 30], [300, 350], [255, 0, 0]);
    drawLine([20, 300], [300, 333], [0, 0, 33]);
    drawLine([100, 50], [100, 250], [0, 128, 0]);

    drawFilledTriangle([330, 200], [400, 380], [20, 150], [20, 150, 225]);

    drawShadedTriangle([0, 200, 0.3], [150, 400, 0.8], [400, 100, 1.0], [225, 150, 20]);

    updateCanvas();
}

main();
