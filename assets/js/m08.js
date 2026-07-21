(() => {
  const lab = document.querySelector("[data-cvt-lab]");
  if (!lab) return;

  const slider = lab.querySelector("[data-cvt-slider]");
  const inputRadiusLabel = lab.querySelector("[data-input-radius]");
  const outputRadiusLabel = lab.querySelector("[data-output-radius]");
  const ratioLabel = lab.querySelector("[data-ratio]");
  const speedLabel = lab.querySelector("[data-speed]");
  const stateLabel = lab.querySelector("[data-state]");

  function update() {
    const t = Number(slider.value) / 100;
    const inputRadius = 34 + 34 * t;
    const outputRadius = 78 - 36 * t;
    const reduction = outputRadius / inputRadius;
    const speedRatio = inputRadius / outputRadius;

    inputRadiusLabel.textContent = inputRadius.toFixed(0);
    outputRadiusLabel.textContent = outputRadius.toFixed(0);
    ratioLabel.textContent = reduction.toFixed(2);
    speedLabel.textContent = speedRatio.toFixed(2);

    const state = reduction > 1.35 ? "کاهش دور / افزایش گشتاور" : reduction < 0.82 ? "افزایش دور" : "نسبت میانی";
    stateLabel.textContent = state;
  }

  slider.addEventListener("input", update);
  update();
})();
