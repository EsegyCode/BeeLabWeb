(function () {
  function toggle(button) {
    var target = document.querySelector(button.getAttribute("data-password-toggle"));
    if (!target) return;
    var isHidden = target.getAttribute("type") === "password";
    target.setAttribute("type", isHidden ? "text" : "password");
    button.textContent = isHidden ? "Приховати" : "Показати";
    button.setAttribute("aria-pressed", String(isHidden));
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-password-toggle]").forEach(function (button) {
      button.addEventListener("click", function () {
        toggle(button);
      });
    });
  });
})();
