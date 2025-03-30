window.onload = async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const pdfPath = urlParams.get('pdf');

  if (!pdfPath) {
    document.getElementById('error-message').textContent = 'Invalid PDF link.';
    return;
  }

  const pdfUrl = `https://apdf2025.netlify.app${pdfPath}`;
  let originalPdfBytes;

  try {
    const res = await fetch(pdfUrl);
    originalPdfBytes = await res.arrayBuffer();
  } catch (err) {
    document.getElementById('error-message').textContent = 'Failed to load PDF.';
    return;
  }

  const canvas = document.getElementById('signature-pad');
  const ctx = canvas.getContext('2d');
  let drawing = false;

  // Drawing support for mouse and touch
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
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

  canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (drawing) {
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  });

  canvas.addEventListener('mouseup', () => drawing = false);
  canvas.addEventListener('mouseleave', () => drawing = false);

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (drawing) {
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  });

  canvas.addEventListener('touchend', () => drawing = false);

  document.getElementById('clear-btn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  document.getElementById('sign-upload-btn').addEventListener('click', async () => {
    const recipientId = pdfPath.split('/')[1];

    canvas.toBlob(async (blob) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const signatureBytes = new Uint8Array(reader.result);
        const { PDFDocument, rgb } = window.pdfLib;

        const pdfDoc = await PDFDocument.load(originalPdfBytes);
        const page = pdfDoc.getPages()[0];

        const signatureImage = await pdfDoc.embedPng(signatureBytes);
        const dims = signatureImage.scale(0.5);
        page.drawImage(signatureImage, {
          x: 50,
          y: 100,
          width: dims.width,
          height: dims.height
        });

        const signedPdfBytes = await pdfDoc.save();
        const signedBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });

        const formData = new FormData();
        formData.append('recipient_id', recipientId);
        formData.append('signed_pdf', signedBlob, `${recipientId}.pdf`);

        try {
          const res = await fetch('https://n8n.apdi2025.site/webhook/signed-upload', {
            method: 'POST',
            body: formData
          });
          const result = await res.json();
          alert('Signed PDF uploaded successfully!');
          console.log(result);
        } catch (err) {
          console.error('Upload failed:', err);
          alert('Failed to upload signed PDF.');
        }
      };

      reader.readAsArrayBuffer(blob);
    }, 'image/png');
  });
};
