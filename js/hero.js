// Hero figure (spec section 11): the countdown on the sketched offer.
// It counts down from 09:59 and starts over at zero, which is the false urgency it shows.
// It pauses while the tab is hidden and stands still at 09:59 with reduced motion.
// Entrance and hover are CSS only.

const START = 9 * 60 + 59;

export function initHero() {
    const timer = document.querySelector(".offer-timer");
    if (!timer) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let seconds = START;
    let interval = null;

    const show = () => {
        const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
        const ss = String(seconds % 60).padStart(2, "0");
        timer.textContent = `Ends in ${mm}:${ss}`;
    };

    const tick = () => {
        seconds = seconds === 0 ? START : seconds - 1;
        show();
    };

    const update = () => {
        if (reduce.matches) {
            seconds = START;
            show();
        }
        const run = !reduce.matches && !document.hidden;
        if (run && !interval) interval = setInterval(tick, 1000);
        if (!run && interval) {
            clearInterval(interval);
            interval = null;
        }
    };

    document.addEventListener("visibilitychange", update);
    reduce.addEventListener("change", update);
    update();
}
