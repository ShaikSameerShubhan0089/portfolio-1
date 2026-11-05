(() => {
  const dialog = document.getElementById("galleryLightbox");
  const image = document.getElementById("galleryImage");
  const caption = document.getElementById("galleryCaption");
  const count = document.getElementById("galleryCount");
  const close = document.getElementById("galleryClose");
  const previous = document.getElementById("galleryPrev");
  const next = document.getElementById("galleryNext");
  const items = [...document.querySelectorAll("[data-gallery-image]")];
  if (!dialog || !image || !caption || !count || !close || !previous || !next || !items.length) return;

  let activeIndex = 0;
  const show = (index) => {
    activeIndex = (index + items.length) % items.length;
    const button = items[activeIndex];
    const source = button.querySelector("img");
    image.src = source.currentSrc || source.src;
    image.alt = source.alt;
    caption.textContent = button.querySelector("span")?.textContent || "Photo";
    count.textContent = `${activeIndex + 1} of ${items.length}`;
    if (!dialog.open) dialog.showModal();
  };

  items.forEach((button, index) => button.addEventListener("click", () => show(index)));
  previous.addEventListener("click", () => show(activeIndex - 1));
  next.addEventListener("click", () => show(activeIndex + 1));
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") { event.preventDefault(); show(activeIndex + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); show(activeIndex - 1); }
  });
  dialog.addEventListener("close", () => { image.removeAttribute("src"); });
})();
