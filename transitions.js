(function initPageTransitions() {
  const overlay = document.getElementById("pt-overlay");
  if (!overlay) return;

  const EASE_IN = "cubic-bezier(0.76, 0, 0.24, 1)"; 
  const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)"; 
  let exiting = false;

  
  function enter() {
    overlay.style.transition = "transform 0.95s " + EASE_OUT;
    overlay.classList.add("pt-away");
  }

  
  function doExit(href) {
    if (exiting) return;
    exiting = true;
    sessionStorage.setItem("bambi-pt", "1");
    overlay.style.transition = "transform 0.52s " + EASE_IN;
    overlay.classList.remove("pt-away");
    overlay.addEventListener(
      "transitionend",
      function () {
        window.location.href = href;
      },
      { once: true },
    );
  }

  
  document.addEventListener("click", function (e) {
    const a = e.target.closest("a[href]");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href) return;
    if (
      href.startsWith("http") ||
      href.startsWith("//") ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("javascript:") ||
      href.startsWith("tel:")
    )
      return;
    e.preventDefault();
    doExit(href);
  });

  
  requestAnimationFrame(function () {
    requestAnimationFrame(enter);
  });
})();
