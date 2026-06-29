const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.documentElement.classList.add("reveal-ready");

const touchPointer = window.matchMedia("(pointer: coarse)").matches;
const woodDustConfig = {
  colors: ["#e2dcd3", "#d6b98c", "#b96842", "#c88b54", "#8f5a34"],
  maxParticlesPerMove: 2,
  minTimeBetweenBursts: 34,
  maxParticlesOnScreen: 80,
};

let lastDustTime = 0;
let activeDustParticles = 0;

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const createWoodParticle = (x, y) => {
  if (activeDustParticles >= woodDustConfig.maxParticlesOnScreen) return;

  const particle = document.createElement("span");
  const size = randomBetween(3, 8);
  const duration = randomBetween(620, 980);

  particle.className = "wood-particle";
  particle.style.setProperty("--particle-x", `${x + randomBetween(-8, 8)}px`);
  particle.style.setProperty("--particle-y", `${y + randomBetween(-8, 8)}px`);
  particle.style.setProperty("--particle-width", `${size * randomBetween(1.2, 2.2)}px`);
  particle.style.setProperty("--particle-height", `${Math.max(2, size * randomBetween(0.45, 0.8))}px`);
  particle.style.setProperty("--particle-drift-x", `${randomBetween(-22, 22)}px`);
  particle.style.setProperty("--particle-fall", `${randomBetween(26, 58)}px`);
  particle.style.setProperty("--particle-rotation", `${randomBetween(0, 180)}deg`);
  particle.style.setProperty("--particle-spin", `${randomBetween(-150, 150)}deg`);
  particle.style.setProperty("--particle-duration", `${duration}ms`);
  particle.style.setProperty("--particle-opacity", `${randomBetween(0.28, 0.58)}`);
  particle.style.setProperty(
    "--particle-color",
    woodDustConfig.colors[Math.floor(Math.random() * woodDustConfig.colors.length)]
  );

  activeDustParticles += 1;
  document.body.appendChild(particle);

  particle.addEventListener(
    "animationend",
    () => {
      particle.remove();
      activeDustParticles -= 1;
    },
    { once: true }
  );
};

const handleWoodDust = (event) => {
  const now = performance.now();

  if (now - lastDustTime < woodDustConfig.minTimeBetweenBursts) return;

  lastDustTime = now;

  for (let index = 0; index < woodDustConfig.maxParticlesPerMove; index += 1) {
    createWoodParticle(event.clientX, event.clientY);
  }
};

if (!reducedMotion && !touchPointer) {
  window.addEventListener("pointermove", handleWoodDust, { passive: true });
}

const setHeaderState = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 16);
};

const closeNav = () => {
  nav.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
};

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeNav);
});

window.addEventListener("scroll", setHeaderState, { passive: true });
setHeaderState();

const revealImages = document.querySelectorAll(".reveal-image");
const restorationSlider = document.querySelector("[data-restoration-slider]");
const restorationSteps = document.querySelectorAll("[data-restoration-step]");
const restorationViewport = restorationSlider?.querySelector(".restoration-viewport");
const restorationProgressItems = document.querySelectorAll("[data-restoration-progress] li");

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
let ticking = false;

const updateRestorationParallax = () => {
  if (!restorationSlider || !restorationSteps.length) return;

  const viewportHeight = window.innerHeight;
  const headerOffset = header.offsetHeight;
  const sliderRect = restorationSlider.getBoundingClientRect();
  const scrollDistance = Math.max(restorationSlider.offsetHeight - viewportHeight, 1);
  const sliderProgress = clamp((headerOffset - sliderRect.top) / scrollDistance);
  const slidePosition = sliderProgress * (restorationSteps.length - 1);
  const currentIndex = Math.round(slidePosition);

  restorationViewport.style.setProperty("--rail-y", `${slidePosition * 63}px`);
  restorationViewport.style.setProperty("--rail-x", `${slidePosition * 42}px`);

  restorationSteps.forEach((step, index) => {
    const entryProgress = index === 0 ? 1 : clamp(slidePosition - index + 1);
    const exitProgress = clamp(slidePosition - index);
    const clipTop = reducedMotion ? (index <= currentIndex ? 0 : 100) : (1 - entryProgress) * 100;

    step.style.clipPath = `inset(${clipTop}% 0 0 0)`;
    step.style.zIndex = String(index + 1);
    step.classList.toggle("is-current", index === currentIndex);
    step.setAttribute("aria-hidden", String(index !== currentIndex));
    step.querySelectorAll("a").forEach((link) => {
      link.tabIndex = index === currentIndex ? 0 : -1;
    });

    step.querySelectorAll("[data-depth]").forEach((layer) => {
      const depth = Number(layer.dataset.depth);
      const entryOffset = reducedMotion
        ? 0
        : (1 - entryProgress) * viewportHeight * (0.68 + depth);
      const exitOffset = reducedMotion
        ? 0
        : -exitProgress * viewportHeight * (0.07 + Math.abs(depth) * 0.3);

      layer.style.setProperty("--parallax-y", `${entryOffset + exitOffset}px`);
    });
  });

  restorationProgressItems.forEach((item, index) => {
    const isCurrent = index === currentIndex;
    item.classList.toggle("is-active", isCurrent);

    if (isCurrent) {
      item.setAttribute("aria-current", "step");
    } else {
      item.removeAttribute("aria-current");
    }
  });
};

const updateRevealImages = () => {
  const viewportHeight = window.innerHeight;

  revealImages.forEach((image, index) => {
    const rect = image.getBoundingClientRect();
    const start = viewportHeight * 1.08;
    const end = -rect.height * 0.2;
    const progress = clamp((start - rect.top) / (start - end));
    const startY = 240 + index * 34;
    const endY = -130 - index * 24;
    const currentY = startY + (endY - startY) * progress;

    image.style.setProperty("--scroll-y", `${currentY}px`);

    if (progress > 0.08) {
      image.classList.add("is-visible");
    }
  });

  updateRestorationParallax();
  ticking = false;
};

const requestRevealUpdate = () => {
  if (ticking) return;

  ticking = true;
  window.requestAnimationFrame(updateRevealImages);
};

window.addEventListener("scroll", requestRevealUpdate, { passive: true });
window.addEventListener("resize", requestRevealUpdate);
window.addEventListener("load", requestRevealUpdate);
requestRevealUpdate();

const beforeAfterBlocks = document.querySelectorAll("[data-before-after]");

beforeAfterBlocks.forEach((block) => {
  const range = block.querySelector("[data-before-after-range]");

  const updateSplit = () => {
    const value = Number(range.value);
    block.style.setProperty("--split", `${value}%`);
  };

  range.addEventListener("input", updateSplit);
  updateSplit();
});

const revealTextItems = document.querySelectorAll(".reveal-text");

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealTextItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealTextObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.12,
    }
  );

  revealTextItems.forEach((item) => revealTextObserver.observe(item));
}
