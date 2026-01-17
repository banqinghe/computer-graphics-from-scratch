import { drawLine } from './line';
import { updateCanvas } from './canvas';
import { drawFilledTriangle } from './triangle';

function main() {
    drawLine([200, 30], [300, 350], [255, 0, 0]);
    drawLine([20, 300], [300, 333], [0, 0, 33]);
    drawLine([100, 50], [100, 250], [0, 128, 0]);

    drawFilledTriangle([300, 200], [400, 400], [500, 150], [0, 0, 255]);

    updateCanvas();
}

main();
