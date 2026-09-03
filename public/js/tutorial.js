/**
 * Lógica do Tutorial Animado
 */

let currentSlide = 0;
const totalSlides = 5;
let autoPlayInterval = null;
let isAutoPlaying = false;

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const slideCounter = document.getElementById("slideCounter");
const autoPlayBtn = document.getElementById("autoPlayBtn");
const autoPlayLabel = document.getElementById("autoPlayLabel");
const dots = document.querySelectorAll(".step-dot");

document.addEventListener("DOMContentLoaded", () => {
  prevBtn.addEventListener("click", () => {
    stopAutoPlay();
    prevSlide();
  });

  nextBtn.addEventListener("click", () => {
    stopAutoPlay();
    nextSlide();
  });

  autoPlayBtn.addEventListener("click", toggleAutoPlay);

  // Teclado (Setas para esquerda e direita)
  window.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") {
      stopAutoPlay();
      nextSlide();
    } else if (e.key === "ArrowLeft") {
      stopAutoPlay();
      prevSlide();
    }
  });

  updateSlideView();
});

function goToSlide(index) {
  if (index < 0 || index >= totalSlides) return;
  currentSlide = index;
  updateSlideView();
}

function nextSlide() {
  if (currentSlide < totalSlides - 1) {
    currentSlide++;
    updateSlideView();
  } else {
    // Se chegou no fim no modo auto, para
    if (isAutoPlaying) stopAutoPlay();
  }
}

function prevSlide() {
  if (currentSlide > 0) {
    currentSlide--;
    updateSlideView();
  }
}

function updateSlideView() {
  for (let i = 0; i < totalSlides; i++) {
    const slide = document.getElementById(`slide${i}`);
    if (slide) {
      if (i === currentSlide) {
        slide.classList.remove("hidden-slide");
        slide.classList.add("active-slide");
      } else {
        slide.classList.remove("active-slide");
        slide.classList.add("hidden-slide");
      }
    }

    if (dots[i]) {
      if (i === currentSlide) {
        dots[i].className = "step-dot w-6 h-3 rounded-full bg-amber-400 transition-all cursor-pointer";
      } else {
        dots[i].className = "step-dot w-3 h-3 rounded-full bg-slate-700 transition-all cursor-pointer";
      }
    }
  }

  slideCounter.innerText = `${currentSlide + 1} / ${totalSlides}`;

  prevBtn.disabled = currentSlide === 0;
  prevBtn.style.opacity = currentSlide === 0 ? "0.4" : "1";

  if (currentSlide === totalSlides - 1) {
    nextBtn.innerHTML = '<i class="fa-solid fa-flag-checkered"></i> Concluir';
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
  } else {
    nextBtn.innerHTML = 'Próximo <i class="fa-solid fa-arrow-right"></i>';
  }
}

function toggleAutoPlay() {
  if (isAutoPlaying) {
    stopAutoPlay();
  } else {
    startAutoPlay();
  }
}

function startAutoPlay() {
  isAutoPlaying = true;
  autoPlayLabel.innerText = "Pausar Auto";
  autoPlayBtn.classList.add("bg-amber-500/20", "text-amber-300", "border", "border-amber-500/40");
  autoPlayBtn.querySelector("i").className = "fa-solid fa-pause";

  autoPlayInterval = setInterval(() => {
    if (currentSlide < totalSlides - 1) {
      nextSlide();
    } else {
      goToSlide(0); // Volta ao começo
    }
  }, 4500);
}

function stopAutoPlay() {
  isAutoPlaying = false;
  autoPlayLabel.innerText = "Reproduzir Auto";
  autoPlayBtn.classList.remove("bg-amber-500/20", "text-amber-300", "border", "border-amber-500/40");
  autoPlayBtn.querySelector("i").className = "fa-solid fa-play";

  if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
  }
}
