const webcamElement = document.getElementById('webcam');
const genderLabel = document.getElementById('gender-label');
const enableButton = document.getElementById('enable-button');
const disableButton = document.getElementById('disable-button');
let stream = null;
let genderModel = null;
let blazefaceModel = null;
let cocoSsdModel = null;

// Counters for gender detection
let maleCount = 0;
let femaleCount = 0;

// Load models on page load
async function loadModels() {
    try {
        // Load BlazeFace model for face detection
        blazefaceModel = await blazeface.load();

        // Load MobileNet model for gender detection
        genderModel = await mobilenet.load();

        // Load COCO-SSD model for object detection
        cocoSsdModel = await cocoSsd.load();

        console.log('Models loaded');
    } catch (error) {
        console.error('Failed to load models:', error);
    }
}

// Enable webcam and start video feed
async function enableWebcam() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        webcamElement.srcObject = stream;
        detectGenderAndObjects();
    } catch (error) {
        console.error('Error accessing webcam:', error);
    }
}

// Disable webcam and stop video feed
function disableWebcam() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        webcamElement.srcObject = null;
    }
}

// Detect gender and objects using the video feed
async function detectGenderAndObjects() {
    const video = webcamElement;
    while (stream) {
        try {
            const faces = await blazefaceModel.estimateFaces(video, false);

            if (faces.length > 0) {
                const face = faces[0];
                const [x, y, width, height] = face.boundingBox;

                // Crop the detected face from the video feed for gender detection
                const faceTensor = tf.image.cropAndResize(
                    tf.browser.fromPixels(video),
                    [[y / video.videoHeight, x / video.videoWidth, (y + height) / video.videoHeight, (x + width) / video.videoWidth]],
                    [0],
                    [224, 224]
                );

                // Predict gender
                const genderPrediction = await genderModel.classify(faceTensor);
                const gender = genderPrediction[0].className === 'male' ? 'Male' : 'Female';

                // Object detection using COCO-SSD
                const objects = await cocoSsdModel.detect(video);

                // Display results
                genderLabel.innerText = `Gender: ${gender}`;
                updateGenderCounts(gender);
                displayObjects(objects);

                faceTensor.dispose(); // Clean up
            } else {
                genderLabel.innerText = 'No face detected';
            }

            await tf.nextFrame(); // Allow the browser to render and wait for the next frame
        } catch (error) {
            console.error('Error detecting gender and objects:', error);
        }
    }
}

// Update gender counts
function updateGenderCounts(gender) {
    if (gender === 'Male') {
        maleCount++;
    } else if (gender === 'Female') {
        femaleCount++;
    }

    // Display counts
    document.getElementById('male-count').innerText = `Males: ${maleCount}`;
    document.getElementById('female-count').innerText = `Females: ${femaleCount}`;
}

// Display detected objects on the canvas
function displayObjects(objects) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = webcamElement.videoWidth;
    canvas.height = webcamElement.videoHeight;
    ctx.drawImage(webcamElement, 0, 0, canvas.width, canvas.height);

    objects.forEach(obj => {
        ctx.beginPath();
        ctx.rect(obj.bbox[0], obj.bbox[1], obj.bbox[2], obj.bbox[3]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'red';
        ctx.fillStyle = 'red';
        ctx.stroke();
        ctx.fillText(`${obj.class} (${Math.round(obj.score * 100)}%)`, obj.bbox[0], obj.bbox[1] > 10 ? obj.bbox[1] - 5 : 10);
    });

    const videoContainer = document.querySelector('.video-container');
    videoContainer.appendChild(canvas);
}

// Event listeners for buttons
enableButton.addEventListener('click', enableWebcam);
disableButton.addEventListener('click', disableWebcam);

// Initialize with the webcam disabled
disableButton.disabled = true;

// Load models on page load
loadModels();