window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const pdfPath = urlParams.get('pdf');
  const fullPdfUrl = `https://apdf2025.netlify.app${pdfPath}`;
  const recipientId = pdfPath.split('/')[1];

  // Display PDF in iframe
  if (pdfPath) {
    const iframe = document.getElementById('pdf-frame');
    iframe.src = `https://docs.google.com/gview?url=${fullPdfUrl}&embedded=true`;
    iframe.style.display = 'block';
  } else {
    document.getElementById('error-message').textContent = 'Invalid PDF link.';
  }

  // --- Signature Pad ---
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

  function stopDrawing() {
    drawing = false;
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
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

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
  canvas.addEventListener('touchend', stopDrawing);

  // Clear button
  document.getElementById('clear-btn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // Sign & Upload button
  document.getElementById('sign-upload-btn').addEventListener('click', async () => {
    canvas.toBlob(async (signatureBlob) => {
      try {
        // Step 1: Load the original PDF
        const existingPdfBytes = await fetch(fullPdfUrl).then(res => res.arrayBuffer());

        // Step 2: Read the signature from the canvas
        const signatureDataURL = canvas.toDataURL('image/png');
        const signatureImageBytes = await fetch(signatureDataURL).then(res => res.arrayBuffer());

        // Step 3: Embed signature into PDF
        const pdfDoc = await window.pdfLib.PDFDocument.load(existingPdfBytes);
        const pngImage = await pdfDoc.embedPng(signatureImageBytes);
        const pngDims = pngImage.scale(0.5);
        const page = pdfDoc.getPage(0);

        // Position signature at bottom-right
        page.drawImage(pngImage, {
          x: page.getWidth() - pngDims.width - 50,
          y: 50,
          width: pngDims.width,
          height: pngDims.height,
        });

        const signedPdfBytes = await pdfDoc.save();

        // Step 4: Upload to n8n webhook
        const signedBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });
        const formData = new FormData();
        formData.append('recipient_id', recipientId);
        formData.append('signed_pdf', signedBlob, `${recipientId}.pdf`);

        const response = await fetch('https://n8n.apdi2025.site/webhook-test/signed-upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        alert('Signed PDF submitted successfully!');
        console.log(result);
      } catch (err) {
        console.error('Upload failed:', err);
        alert('Upload failed.');
      }
    }, 'image/png');
  });
};
