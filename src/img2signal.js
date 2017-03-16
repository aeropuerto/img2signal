
let main = () => {
  imageData = readImage();
  stripped = stripAlphaChannel(imageData.data);
  red = getChannel(stripped, 0);
  green = getChannel(stripped, 1);
  blue = getChannel(stripped, 2);

  normalizeSignals([red, green, blue], 255);

  let superSignal = spSignals([red, green, blue]);
  normalizeSignals([superSignal], 3);

  let hfRed = highPassFilter(red);
  let hfGreen = highPassFilter(green);
  let hfBlue = highPassFilter(blue);

  let gRed = gaussianBlur(red);
  let gGreen = gaussianBlur(green);
  let gBlue = gaussianBlur(blue);

  let g2dRed = gaussianBlur2D(red, imageData.width);
  let g2dGreen = gaussianBlur2D(green, imageData.width);
  let g2dBlue = gaussianBlur2D(blue, imageData.width);

  let plotData = [
    { name: 'red', data: red },
    { name: 'green', data: green },
    { name: 'blue', data: blue },
    //{ name: 'interference', data: superSignal},
    //{ name: 'high pass filtered red', data: hfRed},
    { name: 'gaussian blurred red', data: gRed},
    { name: '2D gaussian blurred red', data: g2dRed},
    { name: '2D gaussian blurred green', data: g2dGreen},
    { name: '2D gaussian blurred blue', data: g2dBlue},
  ]
  plotChannels(plotData);

  // 2D gaussian blur example
  let im = signals2img([g2dRed, g2dGreen, g2dBlue], {width: imageData.width});

  // 1D gaussian blur example
  //let im = signals2img([gRed, gGreen, gBlue], {width: imageData.width});

  // high pass filtered image -> e.g. edge filtering
  //let im = signals2img([hfRed, hfGreen, hfBlue], {width: imageData.width});

  // Superpositioned signal (normalized) -> e.g. luma of a given set of color channels
  //let im = signals2img([superSignal, superSignal, superSignal], {width: imageData.width, height: imageData.height});

  showImage(im);
  //console.log('test', convolution2D([2, 3, 2, 3, 4, 5, 4, 5, 6, 7, 6, 7, 8, 9, 8, 9], [1, 2, 1, 2, 3, 2, 1, 2, 1], 4));
};

/**
 * Load image to canvas from img element and return pixel / dimension data
 */
let readImage = () => {
  let canvas = document.getElementById('canvas');
  let ctx = canvas.getContext('2d');
  let image = document.getElementById('source');
  canvas.width = image.width;
  canvas.height = image.height;
  console.log(image.width, image.height);
  ctx.drawImage(image, 0, 0, image.width, image.height);
  let imgData = ctx.getImageData(0, 0, image.width, image.height);
  console.log('Image data:', imgData);
  return imgData;
};


/**
 * strip alpha channel from raw pixel data
 */
let stripAlphaChannel = (raw) => {
  let sChannels = 4;
  let dChannels = 3;
  let strippedImage = [];
  // Per-pixel iteration
  for (let i = 0; i < raw.length-sChannels+1; i += sChannels) {
    // Per channel iteration
    let px = [];
    for (let j = 0; j < dChannels; ++j) {
      px.push(raw[i+j]);
    }
    // Add stripped pixel to holder array
    strippedImage.push(px);
  }
  return strippedImage;
};

/**
 * Return a single channel signal from raw data
 * chidx indicates channel number e.g. 0 = red, 1 = green, 2 = blue
 */
let getChannel = (raw, chidx) => {
  let chData = [];
  for (let i = 0; i < raw.length; i++) {
    chData.push(raw[i][chidx]);
  }
  return chData;
};

/**
 * Scale all values of given signal set to a range between [0, 1]
 * A max-value is required for scaling
 */
let normalizeSignals = (channels, maxValue) => {
  for (let idx = 0; idx < channels.length; idx++) {
    let channel = channels[idx];
    for (let i = 0; i < channel.length; i++) {
      channel[i] = channel[i] / maxValue;
    }
  }
};

/**
 * Main method for plotting a set of signals
 */
let plotChannels = (data, options) => {
  let plot = document.getElementById('plot');
  let scale = options ? (options.scale ? options.scale : undefined) : undefined;
  data.map((channel) => {
    let title = document.createTextNode(channel.name);
    plot.appendChild(title);
    let canvas = document.createElement('canvas');
    plot.appendChild(canvas);
    plotChannel(channel.data, canvas, scale);
  });
};

/**
 * Plot a channels values onto a canvas
 */
let plotChannel = (ch, canvas, scale) => {
  let ctx = canvas.getContext('2d');
  let plotScale = scale ? scale : (window.innerWidth-20) / ch.length; // if no scale is given, use one that fits the data on the screen
  let numValues = ch.length
  let maxValue = 100;
  let initValue = maxValue-ch[0]*maxValue;
  canvas.width = ch.length * plotScale;
  canvas.height = maxValue;
  ctx.beginPath();
  ctx.moveTo(0, initValue);
  for (let i = 0; i < numValues; i++){
    ctx.lineTo(i*plotScale, maxValue-ch[i]*maxValue);
  }
  ctx.stroke();
};

/**
 * Add multiple signals (e.g. color channels) together (signal superposition).
 * Addition is done up to the amount of samples of the
 * shortest given signal.
 */
let spSignals = (signals) => {
  let result = [];
  let numSignals = signals.length;
  // Check for shortest signal in given array
  let shortestLen = Number.MAX_SAFE_INTEGER;
  for (let sidx = 0; sidx < numSignals; sidx++) {
    currLen = signals[sidx].length;
    if (currLen < shortestLen) {
      shortestLen = currLen;
    }
  }
  // Add up all values from given signals at the same sample position
  for (let i = 0; i < shortestLen; i++) {
    result[i] = 0;
    for (let j = 0; j < numSignals; j++) {
      result[i] += signals[j][i];
    }
  }
  return result;
};

/**
 * Create an ImageData -object from given signals.
 * NOTE: Samples from signals are interleaved in the order
 * they appear in the given wrapping array and all samples
 * within signals must be between [0, 1].
 */
let signals2img = (signals, options) => {
  let result = [];
  let sChannels = signals.length;
  let dChannels = 4;
  if (sChannels !== 3) {
    throw new Error(`Image creation is currently supported for 3 channels (signals), ${sChannels} signals given.`);
  }
  let resLength = dChannels * signals[0].length;
  // Add +1 to the number of signals for the alpha channel.
  for (let i = 0; i < resLength; i += 4) {
    for (let j = 0; j < 4; j++) {
      // Add values for each channel, add 1 for the missing alpha channel
      if (j < 3) {
        result[i+j] = signals[j][i/4] * 255;
      } else {
        result[i+j] = 255;
      }
    }
  }
  let data = Uint8ClampedArray.from(result);
  console.log('imData:', data);
  let imData = new ImageData(data, options.width ? options.width : 256, options.height ? options.height : undefined);
  console.log('new imdata:', imData);
  return imData;
};

/**
 * Display an ImageData -object
 */
let showImage = (imData) => {
  let plot = document.getElementById('plot');
  let canvas = document.createElement('canvas');
  canvas.width = imData.width;
  canvas.height = imData.height;
  plot.appendChild(canvas);
  let ctx = canvas.getContext('2d');
  ctx.putImageData(imData, 0, 0);
};

/**
 * Simple high-pass filter
 */
let highPassFilter = (s) => {
  // Impulse response for a simple high pass filter
  let highPassIR = [0.9, -0.65, -0.1, -0.05, -0.01, -0.005, -0.001];
  let highPassIR2 = [1, -1, 0, 0, 0, 0, 0]; // first difference
  return convolution(s, highPassIR);
};

/**
 * A convolution of a given signal s and an impulse response ir.
 * Returns a convolution (signal) of length s.length + ir.length - 1
 * NOTE: Impulse responses with odd lengths should be used for appropriate
 * slicing
 */
let convolution = (s, ir) => {
  let conv = [];
  let resLength = s.length + ir.length - 1;
  let diff = ir.length - 1;
  // Fill with zeros
  for (let k = 0; k < resLength; k++) {
    conv[k] = 0;
  }
  // convolution
  for (let i = 0; i < s.length; i++) {
    for (let j = 0; j < ir.length; j++) {
      conv[i + j] += s[i] * ir[j];
    }
  }
  // Compensate for the length attribution from
  // convolution
  return conv.slice(diff/2, resLength-diff/2);
};

/**
 * Flips a signal
 */
let flipSignal = (s) => {
  let flipped = [];
  for (let i = s.length-1; i >= 0; i--) {
    flipped.push(s[i]);
  }
  return flipped;
};


/**
 * Softmax for filter kernel / IR generation
 * e.g. low-pass filters.
 * @param ir - impulse response signal
 * @return a normalized signal with all sample being
 * between (0, 1) and summing up to 1.
 */
let softmax = (ir) => {
  let expSum = 0;
  let nrmIr = [];
  for (let i = 0; i < ir.length; i++) {
    expSum += Math.exp(ir[i]);
  }
  for (let j = 0; j < ir.length; j++) {
    nrmIr[j] = Math.exp(ir[j]) / expSum;
  }
  return nrmIr;
};


/**
 * Blur the image using a gaussian filter e.g.
 * a convolution of each channel with a sampled gaussian
 * function as the impulse response.
 * NOTE: This effect only seems to have an
 * effect horizontally, which means that
 * spatial information during processing
 * is lost due to the type of array / data
 * handling in use atm.
 */
let gaussianBlur = (s) => {
  let gaussianIR = gaussian(0.1, 7);
  return convolution(s, gaussianIR);
};

/**
 * Create a gaussian impulse response.
 * Use a softmax to return an impulse with
 * sample values adding up to 1.
 */
let gaussian = (a, numSamples) => {
  let g = [];
  let leftIndex = (numSamples - 1) / 2;
  let rightIndex = numSamples - leftIndex;
  for (let i = -leftIndex; i < rightIndex; i++) {
    g.push(Math.sqrt(a / Math.PI) * Math.exp(-a * Math.pow(i, 2)));
  }
  return softmax(g);
  // The standard deviation version of the gaussian function
  // TODO: Finish implementation for comparison
  // let g = [];
  // for (let i = 0; i < numSamples; i++) {
  //   let multiplier = 1 / (Math.sqrt(2*Math.PI) * a);
  //   g.push( multiplier * Math.exp(- ( Math.pow(i, 2) / (2 * Math.pow(a, 2) ) ) ) );
  // }
  // return g;
};

/**
 * 2D gaussian blur, same as gaussian blur but
 * uses a 2D convolution instead. This solves the
 * directionality issue from a simple 1D convolution with
 * a gaussian impulse response (kernel).
 */
let gaussianBlur2D = (s, width) => {
  let gaussianIR = gaussian(0.1, 7);
  //console.log('1D gaussian:', gaussianIR);
  let gaussian2dIR = gaussian2D(gaussianIR);
  //console.log('2D gaussian:', gaussian2dIR);
  return convolution2D(s, gaussian2dIR, width);
};

/**
 * Generate a 2D gaussian impulse response
 * from a 1D impulse response by multiplying
 * the two vectors.
 */
let gaussian2D = (IR) => {
  let g2D = [];
  for (let i = 0; i < IR.length; i++) {
    for (let j = 0; j < IR.length; j++) {
      g2D.push( IR[i] * IR[j] );
    }
  }
  return g2D;
};

/**
 * Perform a 2D convolution of a given
 * signal and impulse response. The given
 * IR must be of an odd length. Also spatial
 * information is needed to operate in 2D
 * (e.g. the width of an image when operating
 * with image-channel-signals).
 */
let convolution2D = (s, ir, width) => {
  let conv = [];
  // Iterate every sample in the signal, but
  // take spatial information into account.
  let kernelSize = Math.sqrt(ir.length);
  let padding = (kernelSize-1) / 2;
  let spatialHeight = s.length / width;
  let paddedLength = (width + 2 * padding) * (spatialHeight + 2 * padding)

  // Pad the signal
  let padded = Array(paddedLength).fill(0);
  let px = 0;
  for (let r = padding; r < spatialHeight+padding; r++) {
    for (let c = padding; c < width+padding; c++) {
      let idx = r*(width + 2 * padding) + c;
      padded[idx] = s[px];
      px ++;
    }
  }
  // Calculate convolution over two loops.
  // The first loop goes through the number of samples
  // in the original signal and the inner one goes through
  // the samples held in the kernel being used.
  for (let sidx = 0; sidx < s.length; sidx++) {
    // Variable to store the sum of all ir[n]*sample
    let val = 0;
    // Go through the values in the kernel and multiply by
    // corresponding value from the padded signal.
    // The index (pidx, "padded index") is built by taking
    // the needed offset between
    // these arrays into account.
    for (let kidx = 0; kidx < ir.length; kidx++) {
      let krow =  Math.floor(kidx / kernelSize) * (width-1)
      let pidx = sidx + krow + kidx + Math.floor(sidx / width) * 2 * padding;
      val += ir[kidx] * padded[pidx];
    }
    conv.push(val);
  }
  return conv;
};
