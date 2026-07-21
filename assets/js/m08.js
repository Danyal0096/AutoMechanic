(() => {
  const lab = document.querySelector("[data-cvt-lab]");
  if (!lab) return;

  const slider = lab.querySelector("[data-cvt-slider]");
  const inputCircle = lab.querySelector("[data-input-radius]");
  const outputCircle = lab.querySelector("[data-output-radius]");
  const inputLabel = lab.querySelector("[data-input-label]");
  const outputLabel = lab.querySelector("[data-output-label]");
  const ratioLabel = lab.querySelector("[data-ratio]");
  const speedLabel = lab.querySelector("[data-speed]");
  const stateLabel = lab.querySelector("[data-state]");

  function update() {
    const t = Number(slider.value) / 100;
    const inputRadius = 34 + 34 * t;
    const outputRadius = 78 - 36 * t;
    const reduction = outputRadius / inputRadius;
    const speedRatio = inputRadius / outputRadius;

    inputCircle.setAttribute("r", inputRadius.toFixed(1));
    outputCircle.setAttribute("r", outputRadius.toFixed(1));
    inputLabel.textContent = `${inputRadius.toFixed(0)} mm`;
    outputLabel.textContent = `${outputRadius.toFixed(0)} mm`;
    ratioLabel.textContent = reduction.toFixed(2);
    speedLabel.textContent = speedRatio.toFixed(2);

    const state = reduction > 1.35 ? "کاهش دور / افزایش گشتاور" : reduction < 0.82 ? "افزایش دور" : "نسبت میانی";
    stateLabel.textContent = state;
  }

  slider.addEventListener("input", update);
  update();
})();
