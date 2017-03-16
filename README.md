# img2signal
The goal of this project is to create a library of tools for analysing images inside a browser using HTML5 (JS & Canvas). This project is mostly meant for academic purposes and to aid research in the field of image manipulation & convolutional neural networks.

![Image decomposition into signals](./img/demo.jpg?raw=true "Image decomposition into signals")

# Setup
Clone the repository, open index.html in your browser. It should be noted that only Firefox will work with the initial commit as Chrome will not allow to process imageData from a canvas with images loaded locally without overriding security settings (not recommended). An improvement is on the way that will allow more convenient running, development and playing around.

# Usage
Some example images are provided inside `./img`, which you can toggle on and off by commenting stuff in/out in `index.html`. The main -method loads an img -tag with **`id="source"`** and processes it according to the given setup in `main ()` inside img2signal.js. Feel free to play around with the setup in main depending on your needs.

## Usage examples
- Toggle between image types of a simple image like `./img/red.jpg` and `./img/red.png`, notice how their signals differ in regards to noise
- Play around with different impulse responses (1D and 2D) for convolution, craft your own filters and see how each impulse response manipulates the signal and the resulting re-composed image.

## Version history
0.2 Convolution
 - Add support for 1D and 2D convolutions
 - Add some example filters & impulse responses / kernels (e.g. gaussian blur, high pass)

0.1 Initial commit
 - Support for plotting RGB channels of a given image

# License
MIT
