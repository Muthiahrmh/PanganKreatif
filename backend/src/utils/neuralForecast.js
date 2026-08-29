/**
 * Jaringan saraf tiruan (multilayer perceptron) untuk AI Demand Forecasting.
 *
 * Ditulis manual — bukan lewat library — supaya tidak menambah dependensi
 * produksi dan bobotnya mudah ditelusuri: satu hidden layer, aktivasi
 * sigmoid, dilatih dengan backpropagation + gradient descent standar.
 * Dilatih ulang setiap kali ada permintaan prediksi (datanya kecil,
 * per-UMKM per-bahan baku, jadi pelatihan hanya makan milidetik).
 */

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

/** y di sini sudah berupa sigmoid(x), jadi turunannya y*(1-y) */
function sigmoidDerivative(y) {
  return y * (1 - y);
}

function bobotAcak() {
  return Math.random() * 2 - 1;
}

function createNetwork(nInput, nHidden) {
  return {
    nInput,
    nHidden,
    wIH: Array.from({ length: nInput }, () => Array.from({ length: nHidden }, bobotAcak)),
    bH: Array.from({ length: nHidden }, bobotAcak),
    wHO: Array.from({ length: nHidden }, bobotAcak),
    bO: bobotAcak(),
  };
}

function forward(net, input) {
  const hidden = net.bH.map((b, h) => {
    let sum = b;
    for (let i = 0; i < net.nInput; i++) sum += input[i] * net.wIH[i][h];
    return sigmoid(sum);
  });

  let outSum = net.bO;
  for (let h = 0; h < net.nHidden; h++) outSum += hidden[h] * net.wHO[h];

  return { hidden, output: sigmoid(outSum) };
}

/**
 * @param {{input: number[], target: number}[]} examples target harus 0..1
 */
function train(net, examples, { epochs = 500, learningRate = 0.4 } = {}) {
  for (let epoch = 0; epoch < epochs; epoch++) {
    for (const { input, target } of examples) {
      const { hidden, output } = forward(net, input);

      const outputDelta = (target - output) * sigmoidDerivative(output);
      const hiddenDeltas = hidden.map(
        (h, idx) => outputDelta * net.wHO[idx] * sigmoidDerivative(h)
      );

      for (let h = 0; h < net.nHidden; h++) {
        net.wHO[h] += learningRate * outputDelta * hidden[h];
      }
      net.bO += learningRate * outputDelta;

      for (let i = 0; i < net.nInput; i++) {
        for (let h = 0; h < net.nHidden; h++) {
          net.wIH[i][h] += learningRate * hiddenDeltas[h] * input[i];
        }
      }
      for (let h = 0; h < net.nHidden; h++) {
        net.bH[h] += learningRate * hiddenDeltas[h];
      }
    }
  }
  return net;
}

function predict(net, input) {
  return forward(net, input).output;
}

module.exports = { createNetwork, train, predict };
