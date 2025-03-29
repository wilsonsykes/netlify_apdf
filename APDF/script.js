window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const pdfUrl = urlParams.get("pdf");
  const pdfFrame = document.getElementById("pdf-frame");
  const errorMessage = document.getElementById("error-message");

  if (pdfUrl) {
    pdfFrame.src = decodeURIComponent(pdfUrl);
    pdfFrame.style.display = "block";
    errorMessage.style.display = "none";
  } else {
    errorMessage.style.display = "block";
  }

  const canvas = document.getElementById("signature-pad");
  const ctx = canvas.getContext("2d");
  let drawing = false;

  canvas.addEventListener("mousedown", () => (drawing = true));
  canvas.addEventListener("mouseup", () => (drawing = false));
  canvas.addEventListener("mouseleave", () => (drawing = false));
  canvas.addEventListener("mousemove", draw);

  function draw(e) {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  document.getElementById("clear").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
  });

  document.getElementById("download").addEventListener("click", () => {
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "signature.png";
    link.click();
  });

  document.getElementById("upload").addEventListener("click", () => {
    const dataURL = canvas.toDataURL("image/png");
    alert("🚀 Ready to upload to server via webhook!\n(Data is in base64 PNG format)");
    // 🔐 Replace with n8n webhook logic here
    console.log(dataURL);
  });
};
