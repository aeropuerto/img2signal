
let main = () => {
  imageData = readImage();
  stripped = stripAlphaChannel(imageData.data);
  red = getChannel(stripped, 0);
  green = getChannel(stripped, 1);
  blue = getChannel(stripped, 2);

  console.log(red, green, blue);
  normalizeChannels([red, green, blue]);
  console.log(red, green, blue);

  let plotData = [
    { name: 'red', data: red },
    { name: 'green', data: green },
    { name: 'blue', data: blue },
  ]
  plotChannels(plotData);
}

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
}


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
}


// Return a single channel signal from raw data 
// chidx indicates channel number e.g. 0 = red, 1 = green, 2 = blue
let getChannel = (raw, chidx) => {
  let chData = [];
  for (let i = 0; i < raw.length; i++) {
    chData.push(raw[i][chidx]);
  }
  return chData;
}

// Scale all RGB values of given channels to a range between [0, 1]
let normalizeChannels = (channels) => {
  for (let idx = 0; idx < channels.length; idx++) {
    let channel = channels[idx];
    for (let i = 0; i < channel.length; i++) {
      channel[i] = channel[i] / 255;
    }
  }
}

let plotChannels = (data) => {
  let plot = document.getElementById('plot');
  data.map((channel) => {
    let title = document.createTextNode(channel.name);
    plot.appendChild(title);
    let canvas = document.createElement('canvas');
    plot.appendChild(canvas);
    plotChannel(channel.data, canvas);
  });
}


// Plot a channels values onto a canvas
let plotChannel = (ch, canvas) => {
  //let canvas = document.getElementById('plot');
  let ctx = canvas.getContext('2d');
  let plotScale = 0.1;
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
}
