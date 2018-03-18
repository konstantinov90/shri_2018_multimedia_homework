/* UTILS */

function getRandomNumber(from, to) {
    return Math.round(Math.random() * (to - from)) + from;
}

function getRandomElementFromList(list) {
    return list[Math.floor(Math.random()*list.length)];
}

async function wait(mSec) {
    return new Promise(resolve => setTimeout(resolve, mSec));
}
/* ======================================================================================= */

/* CANVAS IMAGE PROCESSING */

function saturateImageData(imageData) {
    const RED_CHANNEL_MULTIPLIER = 2.5;
    const ALPHA_CHANNEL_THRESHOLD = 50;
    
    for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = Math.min(imageData.data[i] * RED_CHANNEL_MULTIPLIER, 255);
        imageData.data[i + 1] = 0;
        imageData.data[i + 2] = 0;
        imageData.data[i + 3] = imageData.data[i] > ALPHA_CHANNEL_THRESHOLD? 255: 0;
    }
    return imageData;
}

function getImageScore(imageData) {
    const PIXEL_SCORE_THRESHOLD = 50;
    let imageScore = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i] / 3;
        const g = imageData.data[i + 1] / 3;
        const b = imageData.data[i + 2] / 3;
        const pixelScore = r + g + b;
        
        if (pixelScore > PIXEL_SCORE_THRESHOLD) {
            imageScore++;
        }
    }
    return imageScore;
}

function multiplyImageData(imageData, multiplier) {
    for (let i = 0; i < imageData.data.length; i++) {
        imageData.data[i] *= multiplier
    }
    return imageData;
}

function sumImageDatas(imageData1, imageData2) {
    if (imageData1.data.length !== imageData2.data.length) {
        throw new Error('imageDatas sizes uneven');
        alert('Ты что-то делаешь не так');
    }
    for (let i = 0; i < imageData1.data.length; i++) {
        imageData1.data[i] = Math.min(imageData1.data[i] + imageData2.data[i], 255);
    }
    return imageData1;
}

/* ======================================================================================= */

/* AUGMENT DOM */

function appendGlitchySpan(parent) {
    const child = document.createElement('span');
    child.classList.add(`glitch-${getRandomNumber(1,10)}`);
    parent.appendChild(child);
    return child;
}

function augmentInterfaceAux(interfaceAuxParagraph, child, letters) {
    interfaceAuxParagraph = interfaceAuxParagraph || document.querySelector('.interface__aux').querySelector('p');
    letters = letters || interfaceAuxParagraph.dataset.text.split('');
    child = child || appendGlitchySpan(interfaceAuxParagraph);

    const letter = letters.shift();
    if (!letter) return;
    if (letter === ' ') {
        child.dataset.text = child.innerHTML;
        child = appendGlitchySpan(interfaceAuxParagraph);
    }
    child.innerHTML += letter;
    requestAnimationFrame(() => augmentInterfaceAux(interfaceAuxParagraph, child, letters));
}

/* ======================================================================================= */

/* AUDIO PROCESSING */

function drawSoundWave(analyser, dataArray, canvas) {
    const {width, height} = canvas;
    const ctx = canvas.getContext('2d');
    analyser.getByteTimeDomainData(dataArray);
    
    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    const sliceWidth = width / analyser.fftSize;
    let x = 0;
    
    for(let i = 0; i < analyser.fftSize; i++) {
        const value = dataArray[i] / 128.0;
        const y = (value - 1) * 30 + height/2;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        x += sliceWidth;
    };
    ctx.lineTo(width, height/2);
    ctx.stroke();

    requestAnimationFrame(() => drawSoundWave(analyser, dataArray, canvas));
};

function processAudioStream(stream) {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();

    const audioInput = audioContext.createMediaStreamSource(stream);

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 2;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;

    audioInput.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioContext.destination);
    
    const dataArray = new Uint8Array(analyser.fftSize); // Uint8Array should be the same length as the fftSize 
    const soundWaveCanvas = document.querySelector('.sound-wave-canvas');
    const ctx = soundWaveCanvas.getContext('2d');
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'lightgreen';

    drawSoundWave(analyser, dataArray, soundWaveCanvas);
}

/* ======================================================================================= */

/* VIDEO PROCESSING */

function processVideoStream(stream) {
    video.srcObject = stream;
}

const video = document.querySelector('.video');

const helperCanvas = document.createElement('canvas');
helperCanvas.width = 800;
helperCanvas.height = 600;
const helperCtx = helperCanvas.getContext('2d');


const overlay = document.querySelector('.video__overlay');
overlay.width = helperCanvas.width;
overlay.height = helperCanvas.height;
const overlayCtx = overlay.getContext('2d');

processImage(video)


async function processImage(video) {
    const {width, height} = helperCanvas;
    await wait(20)
    helperCtx.globalCompositeOperation = 'source-over';
    helperCtx.drawImage(video, 0, 0, width, height);
    await wait(20)
    helperCtx.globalCompositeOperation = 'difference';
    helperCtx.drawImage(video, 0, 0, width, height);
    imgData = saturateImageData(helperCtx.getImageData(0, 0, width, height));
    oldImgData = overlayCtx.getImageData(0, 0, width, height);
    const newImageData = sumImageDatas(multiplyImageData(oldImgData, 0.94), imgData);
    overlayCtx.putImageData(newImageData, 0, 0);
    imgScore = getImageScore(imgData);
    if (imgScore > 5000 && !motionProcessing) {
        motionDetected();
    }
    requestAnimationFrame(() => processImage(video));
}


let motionProcessing = false;

async function motionDetected() {
    if (motionProcessing) return;
    motionProcessing = true;

    const motionDetectedPrompt = document.querySelector('.interface__motion-detected');
    const possibleAnswers = document.querySelectorAll('.interface__answer');

    motionDetectedPrompt.classList.remove('interface__motion-detected_active');
    await wait(20);
    motionDetectedPrompt.classList.add('interface__motion-detected_active');
    await wait(200);
    possibleAnswers.forEach(a => a.classList.remove('interface__answer_discarded'));
    possibleAnswers.forEach(a => a.classList.remove('interface__answer_selected'));
    await wait(5000);
    possibleAnswers.forEach(a => a.classList.add('interface__answer_discarded'));
    const answer = getRandomElementFromList(possibleAnswers);
    answer.classList.remove('interface__answer_discarded');
    answer.classList.add('interface__answer_selected');
    await wait(1000);
    answer.classList.add('interface__answer_discarded');
    await wait(500);
    motionProcessing = false;
}

/* ======================================================================================= */

(function() {
    function handleSuccess(stream) {
        processAudioStream(stream);
        processVideoStream(stream);
    }
    
    function handleError(error) {
      console.error('Reeeejected!', error);
    }
    
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.glitch').forEach(g => g.innerHTML = g.dataset.text);
        augmentInterfaceAux();
    
        navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            }).then(handleSuccess)
            .catch(handleError);
    })
})()