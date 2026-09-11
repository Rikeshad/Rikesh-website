/* =========================================================
   FUTURE PROJECT LOADING ANIMATION
   Controls percentage, progress bar and final reveal
   ========================================================= */


/* Get the loading screen */
const futureLoader =
  document.getElementById("futureLoader");


/* Get the final thank-you screen */
const thankYouScreen =
  document.getElementById("thankYouScreen");


/* Get percentage text */
const loaderPercentage =
  document.getElementById("loaderPercentage");


/* Get progress bar */
const progressBar =
  document.getElementById("progressBar");


/* Total loading animation time in milliseconds */
const loadingDuration = 2800;


/* Record when animation starts */
const startTime = performance.now();


/* Function that updates loader */
function updateLoader(currentTime) {

  /* Calculate how much time has passed */
  const elapsed =
    currentTime - startTime;


  /* Convert elapsed time into percentage */
  let progress =
    Math.min(
      elapsed / loadingDuration,
      1
    );


  /* Convert decimal into number from 0 to 100 */
  const percentage =
    Math.floor(progress * 100);


  /* Update percentage shown in circle */
  loaderPercentage.textContent =
    `${percentage}%`;


  /* Update progress bar width */
  progressBar.style.width =
    `${percentage}%`;


  /* Continue animation until 100% */
  if (progress < 1) {

    requestAnimationFrame(updateLoader);

  } else {

    /* Make sure final display says 100% */
    loaderPercentage.textContent =
      "100%";

    progressBar.style.width =
      "100%";


    /* Brief pause at 100% */
    setTimeout(showThankYou, 250);
  }
}


/* Function that removes loader and shows final screen */
function showThankYou() {

  /* Reveal final page */
  thankYouScreen.classList.add("show");


  /* Slide loading screen away */
  futureLoader.classList.add("exit");


  /* Allow page scrolling after animation */
  document.body.style.overflow = "auto";
}


/* Start loading animation */
requestAnimationFrame(updateLoader);