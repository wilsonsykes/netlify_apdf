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

  // Signature pad setup with mouse and touch support
  const canvas = document.getElementById('signature-pad');
  const ctx = canvas.getContext('2d');
  let drawing = false;

  function getPos(e) {
    if (e.touches && e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.offsetX,
        y: e.offsetY
      };
    }
  }

  canvas.addEventListener('mousedown', function (e) {
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  });

  canvas.addEventListener('mousemove', function (e) {
    if (drawing) {
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  });

  canvas.addEventListener('mouseup', function () {
    drawing = false;
  });

  canvas.addEventListener('mouseleave', function () {
    drawing = false;
  });

  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  });

  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    if (drawing) {
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  });

  canvas.addEventListener('touchend', function () {
    drawing = false;
  });

  document.getElementById('clear-btn').addEventListener('click', function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  document.getElementById('sign-upload-btn').addEventListener('click', async function () {
    const recipientId = pdfPath.split('/')[1];

    canvas.toBlob(async function (blob) {
      const formData = new FormData();
      formData.append('recipient_id', recipientId);
      formData.append('signed_pdf', blob, `${recipientId}.png`);

      try {
        const response = await fetch('https://n8n.apdi2025.site/webhook-test/signed-upload', {
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
