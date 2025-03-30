window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const pdfPath = urlParams.get('pdf');

  if (pdfPath) {
    const iframe = document.getElementById('pdf-frame');
    iframe.src = `https://docs.google.com/gview?url=https://apdf2025.netlify.app${pdfPath}&embedded=true`;
    iframe.style.display = 'block';
  } else {
    document.getElementById('error-message').textContent = 'Invalid PDF link.';
  }

  // Signature pad setup
  const canvas = document.getElementById('signature-pad');
  const ctx = canvas.getContext('2d');
  let drawing = false;

  canvas.addEventListener('mousedown', function (e) {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  });

  canvas.addEventListener('mousemove', function (e) {
    if (drawing) {
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    }
  });

  canvas.addEventListener('mouseup', function () {
    drawing = false;
  });

  canvas.addEventListener('mouseleave', function () {
    drawing = false;
  });

  document.getElementById('clear-btn').addEventListener('click', function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  document.getElementById('sign-upload-btn').addEventListener('click', async function () {
    const recipientId = pdfPath.split('/')[1]; // folder name as ID

    canvas.toBlob(async function (blob) {
      const formData = new FormData();
      formData.append('recipient_id', recipientId);
      formData.append('signed_pdf', blob, `${recipientId}.png`);

      try {
        const response = await fetch('https://n8n.apdi.site/webhook-test/signed-upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        alert('Signature submitted successfully!');
        console.log(result);
      } catch (err) {
        console.error('Error uploading signed image:', err);
        alert('Upload failed.');
      }
    }, 'image/png');
  });
};
