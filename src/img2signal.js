
let main = () => {
  imageData = readImage();
  stripped = stripAlphaChannel(imageData.data);
  red = getChannel(stripped, 0);
  green = getChannel(stripped, 1);
  blue = getChannel(stripped, 2);

  normalizeSignals([red, green, blue], 255);

  let superSignal = spSignals([red, green, blue]);
  normalizeSignals([superSignal], 3);

  let plotData = [
    { name: 'red', data: red },
    { name: 'green', data: green },
    { name: 'blue', data: blue },
    { name: 'interference', data: superSignal},
  ]
  plotChannels(plotData);

  let im = signals2img([superSignal, superSignal, superSignal], {width: imageData.width, height: imageData.height});
  showImage(im);
};

// Load image to canvas from img element and return pixel / dimension data
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


// strip alpha channel from raw pixel data
let stripAlphaChannel = (raw) => {
  let sChannels = 4;
  let dChannels = 3;
  let strippedImage = [];
  // Per-pixel iteration
  for (let i = 0; i < raw.length-sChannels; i += sChannels) {
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


// Return a single channel signal from raw data
// chidx indicates channel number e.g. 0 = red, 1 = green, 2 = blue
let getChannel = (raw, chidx) => {
  let chData = [];
  for (let i = 0; i < raw.length; i++) {
    chData.push(raw[i][chidx]);
  }
  return chData;
};

// Scale all values of given signal set to a range between [0, 1]
// A max-value is required for scaling
let normalizeSignals = (channels, maxValue) => {
  for (let idx = 0; idx < channels.length; idx++) {
    let channel = channels[idx];
    for (let i = 0; i < channel.length; i++) {
      channel[i] = channel[i] / maxValue;
    }
  }
};

let plotChannels = (data) => {
  let plot = document.getElementById('plot');
  data.map((channel) => {
    let title = document.createTextNode(channel.name);
    plot.appendChild(title);
    let canvas = document.createElement('canvas');
    plot.appendChild(canvas);
    plotChannel(channel.data, canvas);
  });
};


// Plot a channels values onto a canvas
let plotChannel = (ch, canvas) => {
  let ctx = canvas.getContext('2d');
  let plotScale = 0.5;
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

// Add multiple signals (e.g. color channels) together (signal superposition).
// Addition is done up to the amount of samples of the
// shortest given signal.
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

// Create an ImageData -object from given signals.
// NOTE: Samples from signals are interleaved in the order
// they appear in the given wrapping array and all samples
// within signals must be between [0, 1].
let signals2img = (signals, options) => {
  let result = [];
  let sChannels = signals.length;
  let dChannels = 4;
  if (sChannels !== 3) {
    throw new Error(`Image creation is currently supported for 3 channels (signals), ${sChannels} signals given.`);
  }
  let resLength = dChannels * signals[0].length;
  // Add +1 to the number of signals for the alpha channel.
  for (let i = 0; i < resLength+4; i += 4) {
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
  let imData = new ImageData(data, options.width ? options.width : 256, options.height ? options.height : undefined);
  console.log('new imdata:', imData);
  return imData;
};

// Display an ImageData -object
let showImage = (imData) => {
  let plot = document.getElementById('plot');
  let canvas = document.createElement('canvas');
  canvas.width = imData.width;
  canvas.height = imData.height;
  plot.appendChild(canvas);
  let ctx = canvas.getContext('2d');
  ctx.putImageData(imData, 0, 0);
}