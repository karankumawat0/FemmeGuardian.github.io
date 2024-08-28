const webcamElement = document.getElementById('webcam');
const genderLabel = document.getElementById('gender-label');
const enableButton = document.getElementById('enable-button');
const disableButton = document.getElementById('disable-button');
let stream = null;
let model = null;
let blazefaceModel = null;

// Load the BlazeFace model for face detection
async function loadModels() {
    blazefaceModel = await blazeface.load();
    model = await mobilenet.load();
    console.log('Models loaded');
}

// Enable webcam and start video feed
async function enableWebcam() {
    if (navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        webcamElement.srcObject = stream;
        detectGender();
    }
}

// Disable webcam and stop video feed
function disableWebcam() {
    if (stream) {
        let tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        webcamElement.srcObject = null;
    }
}

// Detect gender using the video feed
async function detectGender() {
    const video = webcamElement;
    while (stream) {
        const faces = await blazefaceModel.estimateFaces(video, false);

        if (faces.length > 0) {
            const face = faces[0];
            const [x, y, width, height] = face.boundingBox;

            // Crop the detected face from the video feed
            const input = tf.image.cropAndResize(
                tf.browser.fromPixels(video),
                [[y / video.videoHeight, x / video.videoWidth, (y + height) / video.videoHeight, (x + width) / video.videoWidth]],
                [0],
                [224, 224]
            );

            // Predict gender (assuming you have a model that outputs gender)
            const prediction = await model.classify(input);

            // Assuming a binary classification for gender: 'male' or 'female'
            genderLabel.innerText = prediction[0].className === 'male' ? 'Gender: Male' : 'Gender: Female';

            input.dispose(); // Clean up
        } else {
            genderLabel.innerText = 'No face detected';
        }

        await tf.nextFrame(); // Allows the browser to render and wait for the next frame
    }
}

// Event listeners for buttons
enableButton.addEventListener('click', () => {
    enableWebcam();
    enableButton.disabled = true;
    disableButton.disabled = false;
});

disableButton.addEventListener('click', () => {
    disableWebcam();
    enableButton.disabled = false;
    disableButton.disabled = true;
});

// Initialize with the webcam disabled
disableButton.disabled = true;

// Load models on page load
loadModels();