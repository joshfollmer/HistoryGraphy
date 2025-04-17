document.addEventListener("DOMContentLoaded", function () {
    let cropper;
    const input = document.getElementById('image-input');
    const popup = document.getElementById('image-popup');
    const canvas = document.getElementById('image-canvas');
    const submitBtn = document.getElementById('submit-image');
    const cancelBtn = document.getElementById('cancel-image');
    const rotateBtn = document.getElementById('rotate-button');
    const cropBtn = document.getElementById('crop-button');

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                popup.style.display = 'flex';
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                if (cropper) cropper.destroy();
                cropper = new Cropper(canvas, {
                    viewMode: 1,
                    autoCrop: false,
                });
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });

    rotateBtn.addEventListener('click', () => {
        if (cropper) cropper.rotate(90);
    });

    cropBtn.addEventListener('click', () => {
        if (cropper) {
            const croppedCanvas = cropper.getCroppedCanvas();
            const ctx = canvas.getContext('2d');
            canvas.width = croppedCanvas.width;
            canvas.height = croppedCanvas.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(croppedCanvas, 0, 0);
            cropper.destroy();
            cropper = new Cropper(canvas, { viewMode: 1 });
        }
    });

    submitBtn.addEventListener('click', () => {
        const imageData = canvas.toDataURL('image/png');
        console.log("Send this image to your backend for OCR:", imageData);
        popup.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => {
        popup.style.display = 'none';
        input.value = '';
        if (cropper) cropper.destroy();
    });
});
