window.onload = function () {
  // === Step 1: Get PDF Path from URL ===
  const urlParams = new URLSearchParams(window.location.search);
  const pdfPath = urlParams.get('pdf');

  if (pdfPath) {
    // ✅ Build full URL to Netlify-hosted PDF and load it in PDF.js viewer
    const iframe = document.getElementById('pdf-frame');
    const fullPdfUrl = `${window.location.origin}${pdfPath}`;
    iframe.src = `pdfjs/web/viewer.html?file=${encodeURIComponent(fullPdfUrl)}`;
    iframe.style.display = 'block';
  } else {
    document.getElementById('error-message').textContent = 'Invalid PDF link.';
    return;
  }

  // === Step 2: Signature Pad Setup ===
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

  // === Step 3: Sign & Upload PDF ===
  document.getElementById('sign-upload-btn').addEventListener('click', async () => {
    const recipientId = pdfPath.split('/')[2]; // Extract ID from /APDF/{id}/{id}.pdf
    const fullPdfUrl = `${window.location.origin}${pdfPath}`;

    try {
      const PDFDocument = window.PDFLib.PDFDocument;
      const rgb = window.PDFLib.rgb;

      if (!PDFDocument) throw new Error("PDF-lib not loaded.");

      const pdfBytes = await fetch(fullPdfUrl).then(res => res.arrayBuffer());

      canvas.toBlob(async (signatureBlob) => {
        const signatureImageBytes = await signatureBlob.arrayBuffer();

        const pdfDoc = await PDFDocument.load(pdfBytes);
        const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
        const signatureDims = signatureImage.scale(0.5);

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        firstPage.drawImage(signatureImage, {
          x: 50,
          y: 50,
          width: signatureDims.width,
          height: signatureDims.height
        });

        const signedPdfBytes = await pdfDoc.save();

        const formData = new FormData();
        formData.append('recipient_id', recipientId);
        formData.append('signed_pdf', new Blob([signedPdfBytes], { type: 'application/pdf' }), `${recipientId}_signed.pdf`);

        const response = await fetch('https://n8n.apdi2025.site/webhook/signed-upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        alert("Signature submitted successfully!");
        console.log(result);

      }, 'image/png');

    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed.");
    }
  });
};
