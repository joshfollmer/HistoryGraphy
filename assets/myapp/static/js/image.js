document.addEventListener("DOMContentLoaded", function () {
    let cropper;
    const input = document.getElementById('image-input');
    const popup = document.getElementById('image-popup');
    const canvas = document.getElementById('image-canvas');
    const submitBtn = document.getElementById('submit-image');
    const cancelBtn = document.getElementById('cancel-image');
    const rotateBtn = document.getElementById('rotate-button');
    const cropBtn = document.getElementById('crop-button');

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    



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
        const fileType = input.files[0]?.type || 'image/jpeg';
        let exportFormat = 'image/jpeg';
        let quality = 0.8;
    
        if (fileType === 'image/png' || fileType === 'image/webp') {
            exportFormat = fileType;
            quality = 1.0;
        }
    
        canvas.toBlob((blob) => {
            const formData = new FormData();
            formData.append('image', blob, `upload.${exportFormat.split('/')[1]}`);
    
            fetch('/detect-image/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log('OCR result:', data);
                document.getElementById('bib-textarea').value = data.text;
                input.value = '';
                popup.style.display = 'none';
            })
            .catch(error => {
                console.error('Error sending image:', error);
            });
        }, exportFormat, quality);
    });
    
    


    cancelBtn.addEventListener('click', () => {
        popup.style.display = 'none';
        input.value = '';
        if (cropper) cropper.destroy();
    });
});
