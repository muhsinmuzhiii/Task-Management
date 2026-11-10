// ---------- rotating bars ----------
const circleContainer = document.getElementById("circle-Container");
const numBars = 50;
let activeBars = 0;

for (let i = 0; i < numBars; i++) {
  const bar = document.createElement("div");
  bar.className = "bar";
  bar.style.transform = `rotate(${(360 / numBars) * i}deg) translateY(-170px)`;
  circleContainer.appendChild(bar);
}

function animateBars() {
  const bars = document.querySelectorAll(".bar");
  setInterval(() => {
    bars[activeBars % numBars].classList.add("active");
    if (activeBars > 8) {
      bars[(activeBars - 8) % numBars].classList.remove("active");
    }
    activeBars++;
  }, 100);
}
animateBars();

// ---------- login / sign up with the API ----------
let mode = "login";
const $ = (id) => document.getElementById(id);

$("switchLink").addEventListener("click", (e) => {
  e.preventDefault();
  mode = mode === "login" ? "register" : "login";
  const reg = mode === "register";
  $("title").textContent = reg ? "sign up" : "login";
  $("submitBtn").textContent = reg ? "sign up" : "login";
  $("switchLink").textContent = reg ? "login" : "sign up";
  $("nameGroup").hidden = !reg;
  $("name").required = reg;
  $("msg").textContent = "";
});

$("login-Form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("msg");
  msg.className = "";
  msg.textContent = "";

  const body = { email: $("email").value, password: $("password").value };
  if (mode === "register") body.name = $("name").value;

  try {
    const res = await fetch("/api/auth/" + mode, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();

    if (!res.ok) {
      msg.textContent =
        json.error?.details?.[0]?.message || json.error?.message || "Something went wrong";
      return;
    }

    localStorage.setItem("token", json.data.token);
    msg.className = "ok";
    msg.textContent = "Success! Redirecting...";
    setTimeout(() => {
      window.location.href = "/index.html";
    }, 600);
  } catch (err) {
    msg.textContent = "Cannot reach the server";
  }
});