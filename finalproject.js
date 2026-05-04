const headers = document.querySelectorAll(".accordion-header");

headers.forEach(header => {
    header.addEventListener("click", () => {

        const content = header.nextElementSibling;

        const gradient = document.getElementById("mouseGradient");

document.addEventListener("mousemove", (e) => {
    gradient.style.left = e.clientX + "px";
    gradient.style.top = e.clientY + "px";
});

const reveals = document.querySelectorAll(".reveal");

window.addEventListener("scroll", () => {
    reveals.forEach(el => {
        const top = el.getBoundingClientRect().top;
        const trigger = window.innerHeight - 100;

        if (top < trigger) {
            el.classList.add("active");
        }
    });
});

const cursor = document.querySelector(".cursor");

document.addEventListener("mousemove", e => {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
});

const audio = document.getElementById("audio");
const ctx = new AudioContext();
const analyser = ctx.createAnalyser();

const source = ctx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(ctx.destination);

const canvas = document.getElementById("visualizer");
const c = canvas.getContext("2d");

function animate() {
    requestAnimationFrame(animate);

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    c.clearRect(0,0,canvas.width,canvas.height);

    data.forEach((value, i) => {
        c.fillRect(i * 3, canvas.height, 2, -value);
    });
}

animate();

        if (content.style.maxHeight) {
            content.style.maxHeight = null;
        } else {
            document.querySelectorAll(".accordion-content").forEach(c => {
                c.style.maxHeight = null;
            });

            content.style.maxHeight = content.scrollHeight + "px";
        }

    });
});